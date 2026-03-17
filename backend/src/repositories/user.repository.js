import crypto from 'node:crypto';
import { query } from '../config/db.js';

const mapUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    googleId: row.google_id,
    otpCodeHash: row.otp_code_hash,
    otpExpiresAt: row.otp_expires_at,
    resetTokenHash: row.reset_token_hash,
    resetTokenExpiresAt: row.reset_token_expires_at,
    phoneVerifiedAt: row.phone_verified_at,
    emailVerifiedAt: row.email_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const createId = () => crypto.randomUUID();

export const userRepository = {
  findByEmail: async (email) => {
    const result = await query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email.toLowerCase()]);
    return mapUser(result.rows[0]);
  },

  findByPhone: async (phone) => {
    const result = await query(`SELECT * FROM users WHERE phone = $1 LIMIT 1`, [phone]);
    return mapUser(result.rows[0]);
  },

  findById: async (id) => {
    const result = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
    return mapUser(result.rows[0]);
  },

  findByResetTokenHash: async (tokenHash) => {
    const result = await query(
      `SELECT *
       FROM users
       WHERE reset_token_hash = $1
         AND reset_token_expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );
    return mapUser(result.rows[0]);
  },

  create: async ({
    name,
    email,
    phone = null,
    passwordHash = null,
    googleId = null,
    phoneVerifiedAt = null,
    emailVerifiedAt = null,
  }) => {
    const id = createId();
    const result = await query(
      `INSERT INTO users (
        id,
        name,
        email,
        phone,
        password_hash,
        google_id,
        phone_verified_at,
        email_verified_at,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [id, name, email.toLowerCase(), phone, passwordHash, googleId, phoneVerifiedAt, emailVerifiedAt],
    );
    return mapUser(result.rows[0]);
  },

  setGoogleId: async ({ userId, googleId }) => {
    const result = await query(
      `UPDATE users
       SET google_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [googleId, userId],
    );
    return mapUser(result.rows[0]);
  },

  setOtp: async ({ userId, otpCodeHash, otpExpiresAt }) => {
    const result = await query(
      `UPDATE users
       SET otp_code_hash = $1,
           otp_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [otpCodeHash, otpExpiresAt, userId],
    );
    return mapUser(result.rows[0]);
  },

  clearOtp: async (userId) => {
    const result = await query(
      `UPDATE users
       SET otp_code_hash = NULL,
           otp_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId],
    );
    return mapUser(result.rows[0]);
  },

  setResetToken: async ({ userId, resetTokenHash, resetTokenExpiresAt }) => {
    const result = await query(
      `UPDATE users
       SET reset_token_hash = $1,
           reset_token_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [resetTokenHash, resetTokenExpiresAt, userId],
    );
    return mapUser(result.rows[0]);
  },

  resetPassword: async ({ userId, passwordHash }) => {
    const result = await query(
      `UPDATE users
       SET password_hash = $1,
           reset_token_hash = NULL,
           reset_token_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [passwordHash, userId],
    );
    return mapUser(result.rows[0]);
  },
};
