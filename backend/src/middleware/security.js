import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

const otpSpamState = new Map();
const OTP_SPAM_COOLDOWN_MS = 3 * 1000;

const spamGuardKey = (req) => {
  const { signupSessionId = '', type = '', email = '', phone = '' } = req.body ?? {};
  return [req.ip, signupSessionId, type, email, phone, req.path].join('|');
};

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of otpSpamState.entries()) {
    if (now - ts > 10 * 60 * 1000) {
      otpSpamState.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

export const otpDispatchRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Please try again later.' },
});

export const otpVerifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP verification attempts. Please try again later.' },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

export const preventOtpSpam = (req, res, next) => {
  const key = spamGuardKey(req);
  const now = Date.now();
  const lastRequestAt = otpSpamState.get(key);

  if (lastRequestAt && now - lastRequestAt < OTP_SPAM_COOLDOWN_MS) {
    return next(new AppError('OTP request throttled. Please wait a moment before retrying.', 429));
  }

  otpSpamState.set(key, now);
  return next();
};

export const enforceActionWhitelist = (allowedActions) => (req, res, next) => {
  const action = req.body?.action;
  if (!allowedActions.includes(action)) {
    return next(new AppError('Requested action is not allowed', 403));
  }

  return next();
};
