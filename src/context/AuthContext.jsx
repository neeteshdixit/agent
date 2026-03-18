import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrateUser = async () => {
      try {
        const response = await endpoints.me();
        if (mounted) {
          setUser(response.user);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    hydrateUser();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthResponse = (response) => {
    setUser(response.user);
    return response;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      signup: async (payload) => {
        return endpoints.signup(payload);
      },
      verifySignupPhoneOtp: async (payload) => {
        return endpoints.verifySignupPhoneOtp(payload);
      },
      verifySignupEmailOtp: async (payload) => {
        const response = await endpoints.verifySignupEmailOtp(payload);
        return handleAuthResponse(response);
      },
      resendSignupOtp: async (payload) => {
        return endpoints.resendSignupOtp(payload);
      },
      login: async (payload) => {
        const response = await endpoints.login(payload);
        if (response?.requiresOtp) {
          return response;
        }

        return handleAuthResponse(response);
      },
      verifyLoginOtp: async ({ email, otp }) => {
        const response = await endpoints.verifyLoginOtp({ email, otp });
        return handleAuthResponse(response);
      },
      resendLoginOtp: async (email) => endpoints.resendLoginOtp({ email }),
      loginWithGoogle: async (credential) => {
        const response = await endpoints.loginWithGoogle({ credential });
        return handleAuthResponse(response);
      },
      forgotPassword: async (email) => endpoints.forgotPassword({ email }),
      resetPassword: async ({ email, otp, password }) =>
        endpoints.resetPassword({ email, otp, password }),
      logout: async () => {
        try {
          await endpoints.logout();
        } catch {
          // Swallow logout network errors and clear local session state.
        }
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
