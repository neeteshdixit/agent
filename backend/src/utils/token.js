import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAuthToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiry });
};
