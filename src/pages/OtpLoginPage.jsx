import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import { useAuth } from '../context/AuthContext';

function OtpLoginPage() {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      await requestOtp(email);
      setOtpSent(true);
      setInfo('OTP sent. Check your email inbox.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      await verifyOtp({ email, otp });
      navigate('/dashboard', { replace: true });
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Login with OTP"
        subtitle="Request a one-time passcode and verify to sign in."
        footer={
          <p>
            Prefer password login?{' '}
            <Link className="text-brand-500 hover:text-brand-600" to="/login">
              Back to login
            </Link>
          </p>
        }
      >
        <form className="space-y-4" onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
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

          {otpSent ? (
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-300">OTP</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                inputMode="numeric"
                pattern="\d{6}"
                required
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {info ? <p className="text-sm text-emerald-400">{info}</p> : null}

          <button
            className="w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP'}
          </button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default OtpLoginPage;
