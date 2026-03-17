import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import OtpInput from '../components/auth/OtpInput';
import { useAuth } from '../context/AuthContext';

const OTP_LENGTH = 6;
const RESEND_SECONDS_FALLBACK = 30;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function OtpLoginPage() {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [developmentMode, setDevelopmentMode] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const lastRequestedEmailRef = useRef('');
  const lastVerifiedOtpRef = useRef('');
  const autoRequestTimeoutRef = useRef(null);

  const cleanEmail = email.trim().toLowerCase();

  const sendOtp = async ({ resend = false } = {}) => {
    if (!isValidEmail(cleanEmail) || requesting || verifying || resending) {
      return;
    }

    try {
      setError('');
      setInfo('');
      if (resend) {
        setResending(true);
      } else {
        setRequesting(true);
      }

      const response = await requestOtp(cleanEmail);
      setOtpSent(true);
      setOtp('');
      setResendSeconds(Math.max(response?.resendInSeconds ?? RESEND_SECONDS_FALLBACK, 0));
      setDevelopmentMode(Boolean(response?.developmentMode));
      setDevelopmentOtp(response?.developmentOtp ?? '');
      lastRequestedEmailRef.current = cleanEmail;
      lastVerifiedOtpRef.current = '';
      setInfo(response?.message ?? 'OTP sent. 6 digits enter karte hi auto verify ho jayega.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRequesting(false);
      setResending(false);
    }
  };

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((previous) => (previous <= 1 ? 0 : previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (cleanEmail !== lastRequestedEmailRef.current) {
      setOtpSent(false);
      setOtp('');
      setResendSeconds(0);
      setDevelopmentMode(false);
      setDevelopmentOtp('');
      lastVerifiedOtpRef.current = '';
    }

    if (!isValidEmail(cleanEmail) || otpSent || requesting || verifying || resending) {
      return undefined;
    }

    autoRequestTimeoutRef.current = window.setTimeout(() => {
      void sendOtp();
    }, 450);

    return () => {
      if (autoRequestTimeoutRef.current) {
        window.clearTimeout(autoRequestTimeoutRef.current);
        autoRequestTimeoutRef.current = null;
      }
    };
  }, [cleanEmail, otpSent, requesting, verifying, resending]);

  useEffect(() => {
    if (!otpSent || otp.length !== OTP_LENGTH || verifying || requesting || resending) {
      return;
    }

    if (lastVerifiedOtpRef.current === otp) {
      return;
    }

    const verify = async () => {
      try {
        setError('');
        setInfo('');
        setVerifying(true);
        lastVerifiedOtpRef.current = otp;
        await verifyOtp({ email: cleanEmail, otp });
        navigate('/dashboard', { replace: true });
      } catch (verifyError) {
        setError(verifyError.message);
      } finally {
        setVerifying(false);
      }
    };

    void verify();
  }, [cleanEmail, navigate, otp, otpSent, requesting, resending, verifyOtp, verifying]);

  const onResend = async () => {
    if (resendSeconds > 0 || !otpSent) {
      return;
    }

    await sendOtp({ resend: true });
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Login with OTP"
        subtitle="Email enter karte hi OTP auto-send hoga."
        footer={
          <p>
            Prefer password login?{' '}
            <Link className="text-brand-500 hover:text-brand-600" to="/login">
              Back to login
            </Link>
          </p>
        }
      >
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
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

          <div className="overflow-hidden transition-all duration-300 max-h-44 opacity-100">
            <div className="rounded-lg border border-brand-700/50 bg-brand-900/10 p-3">
              <p className="text-sm text-zinc-300">OTP</p>
              <p className="mt-1 text-xs text-zinc-400">
                {otpSent
                  ? '6 digit code dalte hi verification start ho jayega.'
                  : 'Valid email enter karte hi OTP auto-send hoga. Tab tak boxes disabled rahenge.'}
              </p>
              <div className="mt-3">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={!otpSent || requesting || resending || verifying}
                  autoFocus={otpSent}
                />
              </div>
              {developmentMode && developmentOtp ? (
                <p className="mt-3 rounded-md border border-amber-700/60 bg-amber-900/20 px-2 py-1 text-xs text-amber-300">
                  Your OTP is: <span className="font-semibold">{developmentOtp}</span>
                </p>
              ) : null}
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {info ? <p className="text-sm text-emerald-400">{info}</p> : null}

          {otpSent ? (
            <button
              type="button"
              onClick={onResend}
              disabled={resendSeconds > 0 || requesting || resending || verifying}
              className="text-sm text-brand-400 transition hover:text-brand-300 disabled:cursor-not-allowed disabled:text-zinc-500"
            >
              {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : resending ? 'Resending OTP...' : 'Resend OTP'}
            </button>
          ) : (
            <button
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={!isValidEmail(cleanEmail) || requesting}
              onClick={() => {
                void sendOtp();
              }}
            >
              {requesting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          )}
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default OtpLoginPage;
