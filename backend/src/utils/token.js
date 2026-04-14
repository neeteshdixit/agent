import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAuthToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiry });
};

const parseCookieHeader = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((accumulator, entry) => {
    const [rawKey, ...rawValue] = entry.trim().split('=');
    if (!rawKey) {
      return accumulator;
    }

    accumulator[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join('='));
    return accumulator;
  }, {});

export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: env.authCookieMaxAgeMs,
});

export const setAuthCookie = (res, token) => {
  res.cookie(env.authCookieName, token, getAuthCookieOptions());
};

export const clearAuthCookie = (res) => {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

export const extractTokenFromRequest = (req) => {
  const cookies = parseCookieHeader(req.headers.cookie ?? '');
  const cookieToken = cookies[env.authCookieName];

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
};
