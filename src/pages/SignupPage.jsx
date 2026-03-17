import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import OtpInput from '../components/auth/OtpInput';
import { useAuth } from '../context/AuthContext';

const STAGES = Object.freeze({
  FORM: 'form',
  PHONE: 'phone',
  EMAIL: 'email',
});

const OTP_LENGTH = 4;

function SignupPage() {
  const { signup, verifySignupPhoneOtp, verifySignupEmailOtp, resendSignupOtp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [stage, setStage] = useState(STAGES.FORM);
  const [signupSession, setSignupSession] = useState(null);
  const [otpMeta, setOtpMeta] = useState(null);
  const [developmentMode, setDevelopmentMode] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const lastAttemptRef = useRef({ phone: '', email: '' });

  const stageLabel = stage === STAGES.PHONE ? 'Phone Verification' : 'Email Verification';
  const stageDescription =
    stage === STAGES.PHONE
      ? 'Enter the 4-digit OTP sent to your mobile number.'
      : 'Phone verified. Enter the 4-digit OTP sent to your email.';

  const attemptsRemaining = otpMeta?.attemptsRemaining ?? 0;

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((previous) => (previous <= 1 ? 0 : previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const updateOtpState = (nextOtpMeta) => {
    setOtpMeta(nextOtpMeta);
    setResendSeconds(Math.max(nextOtpMeta?.resendInSeconds ?? 0, 0));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      setInfo('');
      setSubmitting(true);

      const response = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      setSignupSession(response.signupSession);
      updateOtpState(response.otp);
      setDevelopmentMode(Boolean(response.developmentMode));
      setDevelopmentOtp(response.developmentOtp ?? '');
      setPhoneOtp('');
      setEmailOtp('');
      lastAttemptRef.current = { phone: '', email: '' };
      setStage(STAGES.PHONE);
      setInfo(response.message ?? 'Phone OTP sent automatically. Enter all 4 digits to verify.');
    } catch (authError) {
      setError(authError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyPhone = async (otp) => {
    if (!signupSession?.id) {
      return;
    }

    try {
      setError('');
      setInfo('');
      setVerifying(true);
      const response = await verifySignupPhoneOtp({
        signupSessionId: signupSession.id,
        otp,
      });

      setStage(STAGES.EMAIL);
      setSignupSession(response.signupSession);
      updateOtpState(response.otp);
      setDevelopmentMode(Boolean(response.developmentMode));
      setDevelopmentOtp(response.developmentOtp ?? '');
      setPhoneOtp('');
      setEmailOtp('');
      lastAttemptRef.current.phone = otp;
      lastAttemptRef.current.email = '';
      setInfo(response.message ?? 'Phone verified successfully. Email OTP sent automatically.');
    } catch (verifyError) {
      setError(verifyError.message);
      lastAttemptRef.current.phone = otp;
    } finally {
      setVerifying(false);
    }
  };

  const verifyEmail = async (otp) => {
    if (!signupSession?.id) {
      return;
    }

    try {
      setError('');
      setInfo('');
      setVerifying(true);
      await verifySignupEmailOtp({
        signupSessionId: signupSession.id,
        otp,
      });
      setDevelopmentOtp('');
      navigate('/dashboard', { replace: true });
    } catch (verifyError) {
      setError(verifyError.message);
      lastAttemptRef.current.email = otp;
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (stage !== STAGES.PHONE || phoneOtp.length !== OTP_LENGTH || verifying) {
      return;
    }

    if (lastAttemptRef.current.phone === phoneOtp) {
      return;
    }

    void verifyPhone(phoneOtp);
  }, [phoneOtp, stage, verifying]);

  useEffect(() => {
    if (stage !== STAGES.EMAIL || emailOtp.length !== OTP_LENGTH || verifying) {
      return;
    }

    if (lastAttemptRef.current.email === emailOtp) {
      return;
    }

    void verifyEmail(emailOtp);
  }, [emailOtp, stage, verifying]);

  const handleResendOtp = async () => {
    if (!signupSession?.id || resending || resendSeconds > 0) {
      return;
    }

    const type = stage === STAGES.PHONE ? 'phone' : 'email';

    try {
      setError('');
      setInfo('');
      setResending(true);

      const response = await resendSignupOtp({
        signupSessionId: signupSession.id,
        type,
        action: 'resend',
      });

      updateOtpState(response.otp);
      setDevelopmentMode(Boolean(response.developmentMode));
      setDevelopmentOtp(response.developmentOtp ?? '');
      if (stage === STAGES.PHONE) {
        setPhoneOtp('');
        lastAttemptRef.current.phone = '';
      } else {
        setEmailOtp('');
        lastAttemptRef.current.email = '';
      }
      setInfo(response.message ?? `${type === 'phone' ? 'Phone' : 'Email'} OTP resent successfully.`);
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setResending(false);
    }
  };

  const disableForm = useMemo(
    () => stage !== STAGES.FORM || submitting || verifying || resending,
    [resending, stage, submitting, verifying],
  );

  return (
    <AuthLayout>
      <AuthCard
        title="Create your account"
        subtitle="Secure onboarding with sequential phone and email OTP verification."
        footer={
          <p>
            Already have an account?{' '}
            <Link className="text-brand-500 hover:text-brand-600" to="/login">
              Log in
            </Link>
          </p>
        }
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-300">Full name</span>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={disableForm}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-300">Mobile number</span>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
              type="tel"
              placeholder="+919876543210"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={disableForm}
              required
            />
          </label>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              stage === STAGES.PHONE ? 'max-h-44 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {stage === STAGES.PHONE ? (
              <div className="rounded-lg border border-brand-700/50 bg-brand-900/10 p-3">
                <p className="text-sm font-medium text-brand-300">{stageLabel}</p>
                <p className="mt-1 text-xs text-zinc-400">{stageDescription}</p>
                <div className="mt-3">
                  <OtpInput value={phoneOtp} onChange={setPhoneOtp} disabled={verifying || resending} autoFocus />
                </div>
                {developmentMode && developmentOtp ? (
                  <p className="mt-3 rounded-md border border-amber-700/60 bg-amber-900/20 px-2 py-1 text-xs text-amber-300">
                    Your OTP is: <span className="font-semibold">{developmentOtp}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-300">Email</span>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={disableForm}
              required
            />
          </label>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              stage === STAGES.EMAIL ? 'max-h-44 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {stage === STAGES.EMAIL ? (
              <div className="rounded-lg border border-emerald-700/50 bg-emerald-900/10 p-3">
                <p className="text-sm font-medium text-emerald-300">{stageLabel}</p>
                <p className="mt-1 text-xs text-zinc-400">{stageDescription}</p>
                <div className="mt-3">
                  <OtpInput value={emailOtp} onChange={setEmailOtp} disabled={verifying || resending} autoFocus />
                </div>
                {developmentMode && developmentOtp ? (
                  <p className="mt-3 rounded-md border border-amber-700/60 bg-amber-900/20 px-2 py-1 text-xs text-amber-300">
                    Your OTP is: <span className="font-semibold">{developmentOtp}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-300">Password</span>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              disabled={disableForm}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-300">Confirm Password</span>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-brand-500 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              disabled={disableForm}
              required
            />
          </label>

          {stage !== STAGES.FORM ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
              <p>
                OTP attempts remaining: <span className="font-semibold text-zinc-100">{attemptsRemaining}</span>
              </p>
              <button
                type="button"
                onClick={handleResendOtp}
                className="mt-1 text-brand-400 transition hover:text-brand-300 disabled:cursor-not-allowed disabled:text-zinc-500"
                disabled={resendSeconds > 0 || resending || verifying}
              >
                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : resending ? 'Resending OTP...' : 'Resend OTP'}
              </button>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {info ? <p className="text-sm text-emerald-400">{info}</p> : null}

          {stage === STAGES.FORM ? (
            <button
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Starting verification...' : 'Sign Up'}
            </button>
          ) : (
            <p className="text-center text-xs text-zinc-500">
              OTP verification happens automatically once all 6 digits are entered.
            </p>
          )}
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default SignupPage;
