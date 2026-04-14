import { Router } from 'express';
import {
  forgotPassword,
  loginWithGoogle,
  resendSignupOtp,
  resetPassword,
  signup,
  verifySignupEmailOtp,
  verifySignupPhoneOtp,
} from '../controllers/auth.controller.js';
import { login, logout, me, resendLoginOtp, verifyLoginOtp } from '../controllers/login.controller.js';
import { requireAuth } from '../middleware/auth.js';
import {
  enforceActionWhitelist,
  loginRateLimiter,
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
  loginOtpResendSchema,
  loginOtpVerifySchema,
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
router.post('/login', loginRateLimiter, validateBody(loginSchema), asyncHandler(login));
router.post('/login/verify-otp', otpVerifyRateLimiter, validateBody(loginOtpVerifySchema), asyncHandler(verifyLoginOtp));
router.post(
  '/login/resend-otp',
  otpDispatchRateLimiter,
  preventOtpSpam,
  validateBody(loginOtpResendSchema),
  asyncHandler(resendLoginOtp),
);
router.post('/logout', asyncHandler(logout));
router.post('/google', validateBody(googleAuthSchema), asyncHandler(loginWithGoogle));
router.post(
  '/forgot-password',
  otpDispatchRateLimiter,
  preventOtpSpam,
  validateBody(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);
router.post('/reset-password', otpVerifyRateLimiter, validateBody(resetPasswordSchema), asyncHandler(resetPassword));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
