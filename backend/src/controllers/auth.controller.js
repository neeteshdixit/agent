import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { signAuthToken } from '../utils/token.js';
import { emailService } from '../services/email.service.js';
import { AppError } from '../utils/AppError.js';
import { userRepository } from '../repositories/user.repository.js';

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const issueAuth = (user) => ({
  token: signAuthToken({ userId: user.id, email: user.email }),
  user: toPublicUser(user),
});

export const signup = async (req, res) => {
  const { name, email, password } = req.validatedBody;

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userRepository.create({
    name,
    email,
    passwordHash,
  });

  return res.status(201).json(issueAuth(user));
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
    });
  }

  const otp = makeOtp();
  user = await userRepository.setOtp({
    userId: user.id,
    otpCodeHash: hashValue(otp),
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await emailService.sendOtp({ email: user.email, otp });

  return res.json({ message: 'OTP sent to your email' });
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
