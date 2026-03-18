import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import { useAuth } from '../context/AuthContext';

function ResetPasswordPage() {
  const { token } = useParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setError('Missing reset token');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      const response = await resetPassword({ token, password });
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
        title="Reset Password"
        subtitle="Set a new secure password for your account."
        footer={
          <p>
            Back to{' '}
            <Link className="text-brand-500 hover:text-brand-600" to="/login">
              Login
            </Link>
          </p>
        }
      >
        <form className="space-y-4" onSubmit={onSubmit}>
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
            disabled={loading}
          >
            {loading ? 'Resetting password...' : 'Reset Password'}
          </button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
