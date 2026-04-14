const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const toApiError = async (response) => {
  let payload = null;
  let textPayload = '';

  try {
    payload = await response.clone().json();
  } catch {
    payload = null;
  }

  if (!payload) {
    try {
      textPayload = (await response.text()).trim();
    } catch {
      textPayload = '';
    }
  }

  const message =
    (payload?.error ?? payload?.message ?? textPayload) ||
    (response.status === 500
      ? 'Backend is unavailable or crashed. Check backend terminal logs.'
      : `Request failed with status ${response.status}`);

  const error = new Error(message);
  error.status = response.status;
  error.details = payload?.details ?? null;
  throw error;
};

export const apiRequest = async (path, { method = 'GET', body, headers } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    await toApiError(response);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const endpoints = {
  signup: (payload) => apiRequest('/auth/signup', { method: 'POST', body: payload }),
  verifySignupPhoneOtp: (payload) => apiRequest('/auth/signup/verify-phone', { method: 'POST', body: payload }),
  verifySignupEmailOtp: (payload) => apiRequest('/auth/signup/verify-email', { method: 'POST', body: payload }),
  resendSignupOtp: (payload) => apiRequest('/auth/signup/resend-otp', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  verifyLoginOtp: (payload) => apiRequest('/auth/login/verify-otp', { method: 'POST', body: payload }),
  resendLoginOtp: (payload) => apiRequest('/auth/login/resend-otp', { method: 'POST', body: payload }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  loginWithGoogle: (payload) => apiRequest('/auth/google', { method: 'POST', body: payload }),
  forgotPassword: (payload) => apiRequest('/auth/forgot-password', { method: 'POST', body: payload }),
  resetPassword: (payload) => apiRequest('/auth/reset-password', { method: 'POST', body: payload }),
  me: () => apiRequest('/auth/me'),
  publicConfig: () => apiRequest('/config/public'),

  listSessions: () => apiRequest('/chat/sessions'),
  getSession: (sessionId) => apiRequest(`/chat/sessions/${sessionId}`),
  createSession: () => apiRequest('/chat/sessions', { method: 'POST' }),
  deleteSession: (sessionId) => apiRequest(`/chat/sessions/${sessionId}`, { method: 'DELETE' }),
  sendMessage: (payload) => apiRequest('/chat/message', { method: 'POST', body: payload }),

  runTask: (payload) => apiRequest('/tasks/run', { method: 'POST', body: payload }),
  taskHistory: () => apiRequest('/tasks/history'),
};
