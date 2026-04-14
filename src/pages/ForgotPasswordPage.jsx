import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import { useAuth } from '../context/AuthContext';

const STEPS = Object.freeze({
  REQUEST: 'request',
  VERIFY: 'verify',
});

function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.REQUEST);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [developmentMode, setDevelopmentMode] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const onRequestOtp = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const response = await forgotPassword(normalizedEmail);
      setStep(STEPS.VERIFY);
      setOtp('');
      setMessage(response.message);
      setDevelopmentMode(Boolean(response.developmentMode));
      setDevelopmentOtp(response.developmentOtp ?? '');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      const response = await resetPassword({
        email: normalizedEmail,
        otp: otp.trim(),
        password,
      });
      setMessage(response?.message ?? 'Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Forgot Password"
        subtitle={
          step === STEPS.REQUEST
            ? "Enter your email and we'll send a reset OTP."
            : 'Enter OTP and set your new password.'
        }
        footer={
          <p>
            Return to{' '}
            <Link className="text-brand-500 hover:text-brand-600" to="/login">
              Login
            </Link>
          </p>
        }
      >
        {step === STEPS.REQUEST ? (
          <form className="space-y-4" onSubmit={onRequestOtp}>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">Email</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
            <button
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send Reset OTP'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={onResetPassword}>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">Email</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-300 outline-none"
                type="email"
                value={normalizedEmail}
                readOnly
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">OTP</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 tracking-[0.3em] outline-none ring-brand-500 transition focus:ring-2"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/[^\d]/g, ''))}
                placeholder="123456"
                required
              />
            </label>

            {developmentMode && developmentOtp ? (
              <p className="rounded-md border border-amber-700/60 bg-amber-900/20 px-2 py-1 text-xs text-amber-300">
                Your OTP is: <span className="font-semibold">{developmentOtp}</span>
              </p>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">New password</span>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 pr-20 outline-none ring-brand-500 transition focus:ring-2"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">Confirm password</span>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 pr-20 outline-none ring-brand-500 transition focus:ring-2"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

            <button
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Resetting password...' : 'Verify OTP & Reset Password'}
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onRequestOtp}
              disabled={loading}
            >
              Resend OTP
            </button>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
