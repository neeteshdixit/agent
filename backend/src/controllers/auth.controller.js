import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { signAuthToken } from '../utils/token.js';
import { emailService } from '../services/email.service.js';
import { otpService } from '../services/otp.service.js';
import { signupCleanupService } from '../services/signupCleanup.service.js';
import { AppError } from '../utils/AppError.js';
import { signupSessionRepository } from '../repositories/signupSession.repository.js';
import { userRepository } from '../repositories/user.repository.js';

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const SIGNUP_STAGES = Object.freeze({
  PHONE_PENDING: 'phone_pending',
  EMAIL_PENDING: 'email_pending',
  VERIFIED: 'verified',
  EXPIRED: 'expired',
});

const OTP_TYPES = otpService.OTP_TYPES;

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  phoneVerifiedAt: user.phoneVerifiedAt ?? null,
  emailVerifiedAt: user.emailVerifiedAt ?? null,
  createdAt: user.createdAt,
});

const maskPhone = (phone) => {
  if (!phone) {
    return '';
  }

  const visible = phone.slice(-4);
  const hidden = '*'.repeat(Math.max(phone.length - 4, 0));
  return `${hidden}${visible}`;
};

const maskEmail = (email) => {
  const [username = '', domain = ''] = email.split('@');
  if (!username || !domain) {
    return email;
  }

  const head = username.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(username.length - 2, 0))}@${domain}`;
};

const toPublicSignupSession = (session) => ({
  id: session.id,
  stage: session.stage,
  emailMasked: maskEmail(session.email),
  phoneMasked: maskPhone(session.phone),
  expiresAt: session.expiresAt,
});

const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalizePhone = (value) => value.replace(/[^\d+]/g, '');
const getOtpDispatchedMessage = (channelLabel) =>
  env.devOtpMode
    ? `${channelLabel} OTP sent automatically (development mode)`
    : `${channelLabel} OTP sent successfully`;

const createSessionExpiry = () =>
  new Date(Date.now() + Math.max(env.signupSessionTtlMinutes, 5) * 60 * 1000);

const issueAuth = (user) => ({
  token: signAuthToken({ userId: user.id, email: user.email }),
  user: toPublicUser(user),
});

const ensureNoExistingUser = async ({ email, phone }) => {
  const [existingByEmail, existingByPhone] = await Promise.all([
    userRepository.findByEmail(email),
    userRepository.findByPhone(phone),
  ]);

  if (existingByEmail) {
    throw new AppError('An account with this email already exists', 409);
  }

  if (existingByPhone) {
    throw new AppError('An account with this phone number already exists', 409);
  }
};

const loadSignupSessionOrThrow = async (signupSessionId) => {
  const session = await signupSessionRepository.findById(signupSessionId);
  if (!session) {
    throw new AppError('Signup session not found. Please restart signup.', 404);
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await signupSessionRepository.updateStage({
      sessionId: session.id,
      stage: SIGNUP_STAGES.EXPIRED,
    });
    throw new AppError('Signup session expired. Please restart signup.', 400);
  }

  if (session.stage === SIGNUP_STAGES.EXPIRED) {
    throw new AppError('Signup session expired. Please restart signup.', 400);
  }

  if (session.stage === SIGNUP_STAGES.VERIFIED) {
    throw new AppError('Signup session already completed.', 400);
  }

  return session;
};

const assertStage = (session, expectedStage) => {
  if (session.stage !== expectedStage) {
    if (expectedStage === SIGNUP_STAGES.EMAIL_PENDING) {
      throw new AppError('Phone OTP must be verified first', 400);
    }

    throw new AppError('Email OTP is already active for this signup session', 400);
  }
};

export const signup = async (req, res) => {
  const { name, email, password } = req.validatedBody;
  const phone = normalizePhone(req.validatedBody.phone);

  await signupCleanupService.runCleanup();
  await ensureNoExistingUser({ email, phone });
  await signupSessionRepository.deleteByEmailOrPhone({ email, phone });

  const passwordHash = await bcrypt.hash(password, 12);
  const session = await signupSessionRepository.create({
    name,
    email,
    phone,
    passwordHash,
    stage: SIGNUP_STAGES.PHONE_PENDING,
    expiresAt: createSessionExpiry(),
  });

  const { otpRecord: phoneOtp, developmentOtp } = await otpService.issueOtp({
    signupSessionId: session.id,
    type: OTP_TYPES.PHONE,
    destination: session.phone,
  });

  return res.status(202).json({
    message: getOtpDispatchedMessage('Phone'),
    signupSession: toPublicSignupSession(session),
    otp: otpService.formatOtpState(phoneOtp),
    developmentMode: env.devOtpMode,
    developmentOtp: developmentOtp ?? undefined,
  });
};

export const verifySignupPhoneOtp = async (req, res) => {
  const { signupSessionId, otp } = req.validatedBody;
  const session = await loadSignupSessionOrThrow(signupSessionId);

  assertStage(session, SIGNUP_STAGES.PHONE_PENDING);

  await otpService.verifyOtp({
    signupSessionId: session.id,
    type: OTP_TYPES.PHONE,
    otp,
  });

  const updatedSession = await signupSessionRepository.updateStage({
    sessionId: session.id,
    stage: SIGNUP_STAGES.EMAIL_PENDING,
    phoneVerifiedAt: new Date(),
    expiresAt: createSessionExpiry(),
  });

  const { otpRecord: emailOtp, developmentOtp } = await otpService.issueOtp({
    signupSessionId: session.id,
    type: OTP_TYPES.EMAIL,
    destination: session.email,
  });

  return res.json({
    message: env.devOtpMode
      ? 'Phone verified. Email OTP sent automatically (development mode)'
      : 'Phone verified. Email OTP sent successfully',
    signupSession: toPublicSignupSession(updatedSession),
    otp: otpService.formatOtpState(emailOtp),
    developmentMode: env.devOtpMode,
    developmentOtp: developmentOtp ?? undefined,
  });
};

export const verifySignupEmailOtp = async (req, res) => {
  const { signupSessionId, otp } = req.validatedBody;
  const session = await loadSignupSessionOrThrow(signupSessionId);

  assertStage(session, SIGNUP_STAGES.EMAIL_PENDING);

  await otpService.verifyOtp({
    signupSessionId: session.id,
    type: OTP_TYPES.EMAIL,
    otp,
  });

  await ensureNoExistingUser({ email: session.email, phone: session.phone });

  const now = new Date();
  const user = await userRepository.create({
    name: session.name,
    email: session.email,
    phone: session.phone,
    passwordHash: session.passwordHash,
    phoneVerifiedAt: session.phoneVerifiedAt ?? now,
    emailVerifiedAt: now,
  });

  await signupSessionRepository.updateStage({
    sessionId: session.id,
    stage: SIGNUP_STAGES.VERIFIED,
    emailVerifiedAt: now,
  });
  await otpService.clearSessionOtps(session.id);
  await signupSessionRepository.deleteById(session.id);

  return res.json(issueAuth(user));
};

export const resendSignupOtp = async (req, res) => {
  const { signupSessionId, type } = req.validatedBody;
  const session = await loadSignupSessionOrThrow(signupSessionId);

  if (session.stage === SIGNUP_STAGES.PHONE_PENDING && type !== OTP_TYPES.PHONE) {
    throw new AppError('Phone OTP must be verified first', 400);
  }

  if (session.stage === SIGNUP_STAGES.EMAIL_PENDING && type !== OTP_TYPES.EMAIL) {
    throw new AppError('Only email OTP can be resent at this stage', 400);
  }

  const destination = type === OTP_TYPES.PHONE ? session.phone : session.email;
  const { otpRecord, developmentOtp } = await otpService.resendOtp({
    signupSessionId: session.id,
    type,
    destination,
  });

  return res.json({
    message: env.devOtpMode
      ? `${type === OTP_TYPES.PHONE ? 'Phone' : 'Email'} OTP sent automatically (development mode)`
      : `${type === OTP_TYPES.PHONE ? 'Phone' : 'Email'} OTP resent successfully`,
    signupSession: toPublicSignupSession(session),
    otp: otpService.formatOtpState(otpRecord),
    developmentMode: env.devOtpMode,
    developmentOtp: developmentOtp ?? undefined,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.validatedBody;
  const user = await userRepository.findByEmail(email);

  if (!user?.passwordHash) {
    throw new AppError('Invalid credentials', 401);
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new AppError('Invalid credentials', 401);
  }

  return res.json(issueAuth(user));
};

export const loginWithGoogle = async (req, res) => {
  const { credential } = req.validatedBody;

  if (!googleClient) {
    throw new AppError('Google OAuth is not configured on the server', 500);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new AppError('Google token did not include an email address', 400);
  }

  let user = await userRepository.findByEmail(payload.email);
  if (!user) {
    user = await userRepository.create({
      name: payload.name ?? payload.email.split('@')[0],
      email: payload.email,
      googleId: payload.sub,
      emailVerifiedAt: new Date(),
    });
  } else if (!user.googleId) {
    user = await userRepository.setGoogleId({ userId: user.id, googleId: payload.sub });
  }

  return res.json(issueAuth(user));
};

export const requestOtp = async (req, res) => {
  const { email } = req.validatedBody;

  let user = await userRepository.findByEmail(email);
  if (!user) {
    user = await userRepository.create({
      name: email.split('@')[0],
      email,
      emailVerifiedAt: new Date(),
    });
  }

  const otp = makeOtp();
  user = await userRepository.setOtp({
    userId: user.id,
    otpCodeHash: hashValue(otp),
    otpExpiresAt: new Date(Date.now() + Math.max(env.otpExpiryMinutes, 1) * 60 * 1000),
  });

  await emailService.sendOtp({
    email: user.email,
    otp,
    expiresInMinutes: Math.max(env.otpExpiryMinutes, 1),
  });

  return res.json({
    message: env.devOtpMode ? 'OTP sent automatically (development mode)' : 'OTP sent to your email',
    developmentMode: env.devOtpMode,
    developmentOtp: env.devOtpExposeInApi ? otp : undefined,
    expiresInSeconds: Math.max(env.otpExpiryMinutes, 1) * 60,
    resendInSeconds: Math.max(env.otpResendCooldownSeconds, 1),
  });
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.validatedBody;
  let user = await userRepository.findByEmail(email);

  if (!user?.otpCodeHash || !user.otpExpiresAt) {
    throw new AppError('OTP was not requested for this account', 400);
  }

  if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
    throw new AppError('OTP has expired', 400);
  }

  if (user.otpCodeHash !== hashValue(otp)) {
    throw new AppError('Invalid OTP', 400);
  }

  user = await userRepository.clearOtp(user.id);
  return res.json(issueAuth(user));
};

export const forgotPassword = async (req, res) => {
  const { email } = req.validatedBody;
  const user = await userRepository.findByEmail(email);

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    await userRepository.setResetToken({
      userId: user.id,
      resetTokenHash: hashValue(rawToken),
      resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
    await emailService.sendPasswordReset({ email, resetUrl });
  }

  return res.json({
    message: 'If an account with that email exists, a reset link has been sent.',
  });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.validatedBody;
  const tokenHash = hashValue(token);

  const user = await userRepository.findByResetTokenHash(tokenHash);
  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const updatedUser = await userRepository.resetPassword({
    userId: user.id,
    passwordHash,
  });

  return res.json(issueAuth(updatedUser));
};

export const me = async (req, res) => {
  return res.json({ user: toPublicUser(req.user) });
};
