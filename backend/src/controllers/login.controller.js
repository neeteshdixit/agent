import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { emailService } from '../services/email.service.js';
import { AppError } from '../utils/AppError.js';
import { toPublicUser, sendAuthResponse } from '../utils/authSession.js';
import { clearAuthCookie } from '../utils/token.js';

const MAX_FAILED_LOGIN_ATTEMPTS = Math.max(env.maxFailedLoginAttempts, 1);
const LOGIN_OTP_EXPIRY_MINUTES = Math.max(env.otpExpiryMinutes, 1);

const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const assertAccountUnlocked = (user) => {
  if (Number(user.failedAttempts ?? 0) >= MAX_FAILED_LOGIN_ATTEMPTS) {
    throw new AppError(
      `Account locked after ${MAX_FAILED_LOGIN_ATTEMPTS} failed attempts. Reset your password to unlock.`,
      423,
    );
  }
};

const dispatchLoginOtp = async (user) => {
  const otp = makeOtp();
  await userRepository.setOtp({
    userId: user.id,
    otpCodeHash: hashValue(otp),
    otpExpiresAt: new Date(Date.now() + LOGIN_OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  await emailService.sendOtp({
    email: user.email,
    otp,
    expiresInMinutes: LOGIN_OTP_EXPIRY_MINUTES,
  });

  return otp;
};

export const login = async (req, res) => {
  const { email, password } = req.validatedBody;
  const user = await userRepository.findByEmail(email);

  if (!user?.passwordHash) {
    throw new AppError('Invalid credentials', 401);
  }

  assertAccountUnlocked(user);

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    const updatedUser = await userRepository.incrementFailedAttempts(user.id);

    if (Number(updatedUser?.failedAttempts ?? 0) >= MAX_FAILED_LOGIN_ATTEMPTS) {
      throw new AppError(
        `Account locked after ${MAX_FAILED_LOGIN_ATTEMPTS} failed attempts. Reset your password to unlock.`,
        423,
      );
    }

    throw new AppError('Invalid credentials', 401);
  }

  await userRepository.resetFailedAttempts(user.id);
  const otp = await dispatchLoginOtp(user);

  return res.status(202).json({
    requiresOtp: true,
    message: env.devOtpMode ? 'OTP sent automatically (development mode)' : 'OTP sent to your email',
    developmentMode: env.devOtpMode,
    developmentOtp: env.devOtpExposeInApi ? otp : undefined,
    expiresInSeconds: LOGIN_OTP_EXPIRY_MINUTES * 60,
  });
};

export const verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.validatedBody;
  let user = await userRepository.findByEmail(email);

  if (!user?.otpCodeHash || !user.otpExpiresAt) {
    throw new AppError('OTP was not requested for this account', 400);
  }

  if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
    await userRepository.clearOtp(user.id);
    throw new AppError('OTP has expired. Please login again.', 400);
  }

  if (user.otpCodeHash !== hashValue(otp)) {
    throw new AppError('Invalid OTP', 400);
  }

  user = await userRepository.clearOtp(user.id);
  const signedInUser = await userRepository.markLoginSuccess(user.id);
  return sendAuthResponse(res, signedInUser ?? user);
};

export const resendLoginOtp = async (req, res) => {
  const { email } = req.validatedBody;
  const user = await userRepository.findByEmail(email);

  if (!user?.otpCodeHash || !user.otpExpiresAt) {
    throw new AppError('Login OTP request expired. Please login again.', 400);
  }

  const otp = await dispatchLoginOtp(user);
  return res.json({
    message: env.devOtpMode ? 'OTP resent automatically (development mode)' : 'OTP resent to your email',
    developmentMode: env.devOtpMode,
    developmentOtp: env.devOtpExposeInApi ? otp : undefined,
    expiresInSeconds: LOGIN_OTP_EXPIRY_MINUTES * 60,
  });
};

export const logout = async (req, res) => {
  clearAuthCookie(res);
  return res.status(204).send();
};

export const me = async (req, res) => {
  return res.json({ user: toPublicUser(req.user) });
};
