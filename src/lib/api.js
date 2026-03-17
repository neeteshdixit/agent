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

export const apiRequest = async (path, { method = 'GET', body, token, headers } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  loginWithGoogle: (payload) => apiRequest('/auth/google', { method: 'POST', body: payload }),
  requestOtp: (payload) => apiRequest('/auth/otp/request', { method: 'POST', body: payload }),
  verifyOtp: (payload) => apiRequest('/auth/otp/verify', { method: 'POST', body: payload }),
  forgotPassword: (payload) => apiRequest('/auth/forgot-password', { method: 'POST', body: payload }),
  resetPassword: (payload) => apiRequest('/auth/reset-password', { method: 'POST', body: payload }),
  me: (token) => apiRequest('/auth/me', { token }),
  publicConfig: () => apiRequest('/config/public'),

  listSessions: (token) => apiRequest('/chat/sessions', { token }),
  getSession: (sessionId, token) => apiRequest(`/chat/sessions/${sessionId}`, { token }),
  createSession: (token) => apiRequest('/chat/sessions', { method: 'POST', token }),
  deleteSession: (sessionId, token) => apiRequest(`/chat/sessions/${sessionId}`, { method: 'DELETE', token }),
  sendMessage: (payload, token) => apiRequest('/chat/message', { method: 'POST', body: payload, token }),

  runTask: (payload, token) => apiRequest('/tasks/run', { method: 'POST', body: payload, token }),
  taskHistory: (token) => apiRequest('/tasks/history', { token }),
};
