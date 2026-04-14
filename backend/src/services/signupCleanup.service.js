import { env } from '../config/env.js';
import { otpRepository } from '../repositories/otp.repository.js';
import { signupSessionRepository } from '../repositories/signupSession.repository.js';

const CLEANUP_INTERVAL_MS = Math.max(env.signupCleanupIntervalMs, 60 * 1000);

const runCleanup = async () => {
  const [removedSessions, removedOtps] = await Promise.all([
    signupSessionRepository.deleteExpired(),
    otpRepository.deleteExpired(),
  ]);

  if (removedSessions > 0 || removedOtps > 0) {
    console.log(`[Signup Cleanup] Removed sessions=${removedSessions}, otps=${removedOtps}`);
  }
};

export const startSignupCleanupJob = () => {
  void runCleanup().catch((error) => {
    console.error('[Signup Cleanup] Initial cleanup failed:', error);
  });

  const timer = setInterval(() => {
    void runCleanup().catch((error) => {
      console.error('[Signup Cleanup] Scheduled cleanup failed:', error);
    });
  }, CLEANUP_INTERVAL_MS);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }
};

export const signupCleanupService = {
  runCleanup,
};
