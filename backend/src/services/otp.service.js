import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { otpRepository } from '../repositories/otp.repository.js';
import { emailService } from './email.service.js';
import { smsService } from './sms.service.js';
import { AppError } from '../utils/AppError.js';

const OTP_TYPES = Object.freeze({
  PHONE: 'phone',
  EMAIL: 'email',
});

const OTP_EXPIRY_MS = Math.max(env.otpExpiryMinutes, 1) * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = Math.max(env.otpResendCooldownSeconds, 5) * 1000;
const OTP_MAX_ATTEMPTS = Math.max(env.otpMaxAttempts, 1);

const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const toSecondsRemaining = (dateValue) => {
  const deltaMs = new Date(dateValue).getTime() - Date.now();
  return Math.max(Math.ceil(deltaMs / 1000), 0);
};

const formatOtpState = (otpRecord) => ({
  type: otpRecord.type,
  expiresInSeconds: toSecondsRemaining(otpRecord.expiresAt),
  resendInSeconds: toSecondsRemaining(otpRecord.resendAvailableAt),
  attemptsRemaining: Math.max(otpRecord.maxAttempts - otpRecord.attempts, 0),
});

const sendOtpByType = async ({ type, destination, otp }) => {
  if (type === OTP_TYPES.PHONE) {
    await smsService.sendOtp({
      phone: destination,
      otp,
      expiresInMinutes: Math.max(env.otpExpiryMinutes, 1),
    });
    return;
  }

  if (type === OTP_TYPES.EMAIL) {
    await emailService.sendOtp({
      email: destination,
      otp,
      expiresInMinutes: Math.max(env.otpExpiryMinutes, 1),
    });
    return;
  }

  throw new AppError('Unsupported OTP type requested', 400);
};

const getOrThrowOtp = async ({ signupSessionId, type }) => {
  const otpRecord = await otpRepository.findBySessionAndType({ signupSessionId, type });
  if (!otpRecord) {
    throw new AppError(`No ${type} OTP exists for this signup session`, 400);
  }

  return otpRecord;
};

export const otpService = {
  OTP_TYPES,
  formatOtpState,

  issueOtp: async ({ signupSessionId, type, destination }) => {
    const otp = makeOtp();
    const now = Date.now();
    const otpRecord = await otpRepository.upsertForSession({
      signupSessionId,
      type,
      destination,
      codeHash: hashValue(otp),
      expiresAt: new Date(now + OTP_EXPIRY_MS),
      resendAvailableAt: new Date(now + OTP_RESEND_COOLDOWN_MS),
      maxAttempts: OTP_MAX_ATTEMPTS,
    });

    await sendOtpByType({ type, destination, otp });
    return {
      otpRecord,
      developmentOtp: env.devOtpExposeInApi ? otp : null,
    };
  },

  resendOtp: async ({ signupSessionId, type, destination }) => {
    const currentOtp = await getOrThrowOtp({ signupSessionId, type });

    if (currentOtp.verifiedAt) {
      throw new AppError(`${type} OTP is already verified`, 400);
    }

    const now = Date.now();
    const resendAvailableAt = new Date(currentOtp.resendAvailableAt).getTime();
    if (resendAvailableAt > now) {
      const waitSeconds = Math.max(Math.ceil((resendAvailableAt - now) / 1000), 1);
      throw new AppError(`Please wait ${waitSeconds}s before resending ${type} OTP`, 429);
    }

    return this.issueOtp({ signupSessionId, type, destination });
  },

  verifyOtp: async ({ signupSessionId, type, otp }) => {
    const otpRecord = await getOrThrowOtp({ signupSessionId, type });

    if (otpRecord.verifiedAt) {
      throw new AppError(`${type} OTP has already been verified`, 400);
    }

    if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
      throw new AppError(`${type} OTP has expired`, 400);
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new AppError(`${type} OTP attempt limit reached. Please resend OTP`, 429);
    }

    if (otpRecord.codeHash !== hashValue(otp)) {
      const updatedRecord = await otpRepository.incrementAttempts({ signupSessionId, type });
      const attemptsRemaining = Math.max(updatedRecord.maxAttempts - updatedRecord.attempts, 0);

      if (attemptsRemaining <= 0) {
        throw new AppError(`${type} OTP attempt limit reached. Please resend OTP`, 429);
      }

      throw new AppError(`Invalid ${type} OTP. ${attemptsRemaining} attempt(s) remaining`, 400);
    }

    const verifiedRecord = await otpRepository.markVerified({ signupSessionId, type });
    return verifiedRecord;
  },

  clearSessionOtps: async (signupSessionId) => {
    await otpRepository.deleteBySessionId(signupSessionId);
  },
};
