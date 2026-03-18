import { signAuthToken, setAuthCookie } from './token.js';

export const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  phoneVerifiedAt: user.phoneVerifiedAt ?? null,
  emailVerifiedAt: user.emailVerifiedAt ?? null,
  failedAttempts: Number(user.failedAttempts ?? 0),
  lastLogin: user.lastLogin ?? null,
  createdAt: user.createdAt,
});

export const sendAuthResponse = (res, user) => {
  const token = signAuthToken({ userId: user.id, email: user.email });
  setAuthCookie(res, token);
  return res.json({ user: toPublicUser(user) });
};
