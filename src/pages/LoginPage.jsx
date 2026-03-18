import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SCRIPT_ID = 'google-identity-services';
const LOGIN_STEPS = Object.freeze({
  CREDENTIALS: 'credentials',
  OTP: 'otp',
});

function LoginPage() {
  const { login, loginWithGoogle, verifyLoginOtp, resendLoginOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(LOGIN_STEPS.CREDENTIALS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [developmentMode, setDevelopmentMode] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
  const redirectTo = useMemo(() => location.state?.from ?? '/dashboard', [location.state]);
  const normalizedEmail = form.email.trim().toLowerCase();

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    const onGoogleCredential = async (response) => {
      if (!response.credential) {
        return;
      }

      try {
        setError('');
        await loginWithGoogle(response.credential);
        navigate(redirectTo, { replace: true });
      } catch (authError) {
        setError(authError.message);
      }
    };

    const setupGoogleButton = () => {
      if (!window.google?.accounts?.id) {
        return;
      }

      const target = document.getElementById('google-signin-btn');
      if (!target) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: onGoogleCredential,
      });

      target.innerHTML = '';
      window.google.accounts.id.renderButton(target, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 320,
      });
      setGoogleReady(true);
    };

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      setupGoogleButton();
      return undefined;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = setupGoogleButton;
    script.onerror = () => setGoogleReady(false);
    document.body.appendChild(script);

    return () => {};
  }, [googleClientId, loginWithGoogle, navigate, redirectTo]);

  const onSubmitCredentials = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setInfo('');

      const response = await login({
        email: normalizedEmail,
        password: form.password,
      });

      if (response?.requiresOtp) {
        setStep(LOGIN_STEPS.OTP);
        setOtp('');
        setInfo(response.message ?? 'OTP sent to your email');
        setDevelopmentMode(Boolean(response.developmentMode));
        setDevelopmentOtp(response.developmentOtp ?? '');
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitOtp = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setInfo('');
      await verifyLoginOtp({ email: normalizedEmail, otp: otp.trim() });
      navigate(redirectTo, { replace: true });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    try {
      setSubmitting(true);
      setError('');
      const response = await resendLoginOtp(normalizedEmail);
      setInfo(response.message ?? 'OTP resent to your email');
      setDevelopmentMode(Boolean(response.developmentMode));
      setDevelopmentOtp(response.developmentOtp ?? '');
    } catch (authError) {
      setError(authError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Welcome back"
        subtitle="Log in to continue using your AI assistant dashboard."
        footer={
          <p>
            New here?{' '}
            <Link className="text-brand-500 hover:text-brand-600" to="/signup">
              Create an account
            </Link>
          </p>
        }
      >
        {step === LOGIN_STEPS.CREDENTIALS ? (
          <form className="space-y-4" onSubmit={onSubmitCredentials}>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">Email</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">Password</span>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 pr-20 outline-none ring-brand-500 transition focus:ring-2"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Sending OTP...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={onSubmitOtp}>
            <p className="rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-300">
              OTP sent to <span className="font-medium text-zinc-100">{normalizedEmail}</span>
            </p>

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

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-400">{info}</p> : null}

            <button
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? 'Verifying OTP...' : 'Verify OTP & Login'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-brand-500 transition hover:text-brand-400 disabled:cursor-not-allowed disabled:text-zinc-500"
                onClick={onResendOtp}
                disabled={submitting}
              >
                Resend OTP
              </button>
              <button
                type="button"
                className="text-zinc-400 transition hover:text-zinc-200"
                onClick={() => {
                  setStep(LOGIN_STEPS.CREDENTIALS);
                  setOtp('');
                  setError('');
                  setInfo('');
                }}
              >
                Change credentials
              </button>
            </div>
          </form>
        )}

        {step === LOGIN_STEPS.CREDENTIALS ? (
          <>
            <div className="my-4 text-center text-xs uppercase text-zinc-500">or</div>
            <div id="google-signin-btn" className="flex justify-center" />
            {!googleClientId ? (
              <p className="mt-2 text-center text-xs text-zinc-500">Set VITE_GOOGLE_CLIENT_ID to enable Google login.</p>
            ) : null}
            {googleClientId && !googleReady ? (
              <p className="mt-2 text-center text-xs text-zinc-500">Loading Google Sign-In...</p>
            ) : null}

            <div className="mt-5 flex items-center justify-end text-sm">
              <Link className="text-zinc-400 hover:text-zinc-200" to="/forgot-password">
                Forgot Password?
              </Link>
            </div>
          </>
        ) : null}
      </AuthCard>
    </AuthLayout>
  );
}

export default LoginPage;
