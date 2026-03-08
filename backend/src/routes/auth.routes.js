import { Router } from 'express';
import {
  forgotPassword,
  login,
  loginWithGoogle,
  me,
  requestOtp,
  resetPassword,
  signup,
  verifyOtp,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  resetPasswordSchema,
  signupSchema,
} from '../utils/validators.js';

const router = Router();

router.post('/signup', validateBody(signupSchema), asyncHandler(signup));
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/google', validateBody(googleAuthSchema), asyncHandler(loginWithGoogle));
router.post('/otp/request', validateBody(otpRequestSchema), asyncHandler(requestOtp));
router.post('/otp/verify', validateBody(otpVerifySchema), asyncHandler(verifyOtp));
router.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(resetPassword));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
