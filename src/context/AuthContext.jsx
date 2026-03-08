import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints } from '../lib/api';

const STORAGE_KEY = 'agent_auth_token';
const AuthContext = createContext(null);

const persistToken = (token) => {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrateUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await endpoints.me(token);
        if (mounted) {
          setUser(response.user);
        }
      } catch {
        persistToken('');
        if (mounted) {
          setToken('');
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
  }, [token]);

  const handleAuthResponse = (response) => {
    setToken(response.token);
    setUser(response.user);
    persistToken(response.token);
    return response;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      signup: async (payload) => {
        const response = await endpoints.signup(payload);
        return handleAuthResponse(response);
      },
      login: async (payload) => {
        const response = await endpoints.login(payload);
        return handleAuthResponse(response);
      },
      loginWithGoogle: async (credential) => {
        const response = await endpoints.loginWithGoogle({ credential });
        return handleAuthResponse(response);
      },
      requestOtp: async (email) => endpoints.requestOtp({ email }),
      verifyOtp: async ({ email, otp }) => {
        const response = await endpoints.verifyOtp({ email, otp });
        return handleAuthResponse(response);
      },
      forgotPassword: async (email) => endpoints.forgotPassword({ email }),
      resetPassword: async ({ token: resetToken, password }) =>
        endpoints.resetPassword({ token: resetToken, password }),
      logout: () => {
        persistToken('');
        setToken('');
        setUser(null);
      },
    }),
    [token, user, loading],
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
