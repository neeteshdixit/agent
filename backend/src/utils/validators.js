import { z } from 'zod';

const email = z.string().trim().email();
const phone = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Phone must be 10 to 15 digits and may include leading +');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password cannot exceed 64 characters');

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email,
  phone,
  password,
});

export const loginSchema = z.object({
  email,
  password,
});

export const googleAuthSchema = z.object({
  credential: z.string().min(10, 'Google credential is required'),
});

export const otpRequestSchema = z.object({
  email,
});

export const otpVerifySchema = z.object({
  email,
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const signupPhoneOtpVerifySchema = z.object({
  signupSessionId: z.string().trim().uuid('Invalid signup session id'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const signupEmailOtpVerifySchema = z.object({
  signupSessionId: z.string().trim().uuid('Invalid signup session id'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const signupOtpResendSchema = z.object({
  signupSessionId: z.string().trim().uuid('Invalid signup session id'),
  type: z.enum(['phone', 'email']),
  action: z.enum(['resend']),
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20, 'Invalid reset token'),
  password,
});

export const chatMessageSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().trim().min(1).max(4000),
  agentMode: z.boolean().optional().default(false),
});

export const taskRunSchema = z.object({
  command: z.string().trim().min(1).max(2000),
});
