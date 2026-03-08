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

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.post('/google', validateBody(googleAuthSchema), loginWithGoogle);
router.post('/otp/request', validateBody(otpRequestSchema), requestOtp);
router.post('/otp/verify', validateBody(otpVerifySchema), verifyOtp);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);
router.get('/me', requireAuth, me);

export default router;
