import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
  const redirectTo = useMemo(() => location.state?.from ?? '/dashboard', [location.state]);

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

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await login(form);
      navigate(redirectTo, { replace: true });
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
        <form className="space-y-4" onSubmit={onSubmit}>
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
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            className="w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="my-4 text-center text-xs uppercase text-zinc-500">or</div>
        <div id="google-signin-btn" className="flex justify-center" />
        {!googleClientId ? (
          <p className="mt-2 text-center text-xs text-zinc-500">Set VITE_GOOGLE_CLIENT_ID to enable Google login.</p>
        ) : null}
        {googleClientId && !googleReady ? <p className="mt-2 text-center text-xs text-zinc-500">Loading Google Sign-In...</p> : null}

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link className="text-brand-500 hover:text-brand-600" to="/otp-login">
            Login with OTP
          </Link>
          <Link className="text-zinc-400 hover:text-zinc-200" to="/forgot-password">
            Forgot Password?
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default LoginPage;
