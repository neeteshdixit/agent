import { Router } from 'express';
import {
  forgotPassword,
  login,
  loginWithGoogle,
  me,
  requestOtp,
  resendSignupOtp,
  resetPassword,
  signup,
  verifySignupEmailOtp,
  verifySignupPhoneOtp,
  verifyOtp,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import {
  enforceActionWhitelist,
  otpDispatchRateLimiter,
  otpVerifyRateLimiter,
  preventOtpSpam,
} from '../middleware/security.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  resetPasswordSchema,
  signupEmailOtpVerifySchema,
  signupOtpResendSchema,
  signupPhoneOtpVerifySchema,
  signupSchema,
} from '../utils/validators.js';

const router = Router();

router.post('/signup', otpDispatchRateLimiter, preventOtpSpam, validateBody(signupSchema), asyncHandler(signup));
router.post(
  '/signup/verify-phone',
  otpVerifyRateLimiter,
  validateBody(signupPhoneOtpVerifySchema),
  asyncHandler(verifySignupPhoneOtp),
);
router.post(
  '/signup/verify-email',
  otpVerifyRateLimiter,
  validateBody(signupEmailOtpVerifySchema),
  asyncHandler(verifySignupEmailOtp),
);
router.post(
  '/signup/resend-otp',
  otpDispatchRateLimiter,
  preventOtpSpam,
  validateBody(signupOtpResendSchema),
  enforceActionWhitelist(['resend']),
  asyncHandler(resendSignupOtp),
);
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/google', validateBody(googleAuthSchema), asyncHandler(loginWithGoogle));
router.post('/otp/request', otpDispatchRateLimiter, preventOtpSpam, validateBody(otpRequestSchema), asyncHandler(requestOtp));
router.post('/otp/verify', otpVerifyRateLimiter, validateBody(otpVerifySchema), asyncHandler(verifyOtp));
router.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(resetPassword));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
