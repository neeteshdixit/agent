import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { signAuthToken } from '../utils/token.js';
import { emailService } from '../services/email.service.js';
import { AppError } from '../utils/AppError.js';

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const issueAuth = (user) => ({
  token: signAuthToken({ userId: user._id.toString(), email: user.email }),
  user: toPublicUser(user),
});

export const signup = async (req, res) => {
  const { name, email, password } = req.validatedBody;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  return res.status(201).json(issueAuth(user));
};

export const login = async (req, res) => {
  const { email, password } = req.validatedBody;
  const user = await User.findOne({ email });

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

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      name: payload.name ?? payload.email.split('@')[0],
      email: payload.email,
      googleId: payload.sub,
    });
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    await user.save();
  }

  return res.json(issueAuth(user));
};

export const requestOtp = async (req, res) => {
  const { email } = req.validatedBody;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: email.split('@')[0],
      email,
    });
  }

  const otp = makeOtp();
  user.otpCodeHash = hashValue(otp);
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await emailService.sendOtp({ email, otp });

  return res.json({ message: 'OTP sent to your email' });
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.validatedBody;
  const user = await User.findOne({ email });

  if (!user?.otpCodeHash || !user.otpExpiresAt) {
    throw new AppError('OTP was not requested for this account', 400);
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError('OTP has expired', 400);
  }

  if (user.otpCodeHash !== hashValue(otp)) {
    throw new AppError('Invalid OTP', 400);
  }

  user.otpCodeHash = null;
  user.otpExpiresAt = null;
  await user.save();

  return res.json(issueAuth(user));
};

export const forgotPassword = async (req, res) => {
  const { email } = req.validatedBody;
  const user = await User.findOne({ email });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = hashValue(rawToken);
    user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

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

  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  await user.save();

  return res.json(issueAuth(user));
};

export const me = async (req, res) => {
  return res.json({ user: toPublicUser(req.user) });
};
