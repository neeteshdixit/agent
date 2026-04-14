import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';

function ResetPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Reset Link Expired"
        subtitle="Password reset now works through OTP verification."
        footer={
          <p>
            Back to{' '}
            <Link className="text-brand-500 hover:text-brand-600" to="/login">
              Login
            </Link>
          </p>
        }
      >
        <p className="rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-300">
          Please use the{' '}
          <Link className="text-brand-500 hover:text-brand-600" to="/forgot-password">
            Forgot Password
          </Link>{' '}
          page to receive an OTP and reset your password.
        </p>
      </AuthCard>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
