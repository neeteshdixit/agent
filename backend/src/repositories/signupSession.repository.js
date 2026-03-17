import crypto from 'node:crypto';
import { query } from '../config/db.js';

const createId = () => crypto.randomUUID();

const mapSession = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    stage: row.stage,
    phoneVerifiedAt: row.phone_verified_at,
    emailVerifiedAt: row.email_verified_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const signupSessionRepository = {
  create: async ({ name, email, phone, passwordHash, stage, expiresAt }) => {
    const id = createId();
    const result = await query(
      `INSERT INTO signup_sessions (
        id, name, email, phone, password_hash, stage, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *`,
      [id, name, email.toLowerCase(), phone, passwordHash, stage, expiresAt],
    );

    return mapSession(result.rows[0]);
  },

  findById: async (sessionId) => {
    const result = await query(`SELECT * FROM signup_sessions WHERE id = $1 LIMIT 1`, [sessionId]);
    return mapSession(result.rows[0]);
  },

  deleteByEmailOrPhone: async ({ email, phone }) => {
    await query(
      `DELETE FROM signup_sessions
       WHERE email = $1
          OR phone = $2`,
      [email.toLowerCase(), phone],
    );
  },

  updateStage: async ({ sessionId, stage, phoneVerifiedAt = null, emailVerifiedAt = null, expiresAt = null }) => {
    const result = await query(
      `UPDATE signup_sessions
       SET stage = $1,
           phone_verified_at = COALESCE($2, phone_verified_at),
           email_verified_at = COALESCE($3, email_verified_at),
           expires_at = COALESCE($4, expires_at),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [stage, phoneVerifiedAt, emailVerifiedAt, expiresAt, sessionId],
    );

    return mapSession(result.rows[0]);
  },

  deleteById: async (sessionId) => {
    await query(`DELETE FROM signup_sessions WHERE id = $1`, [sessionId]);
  },

  deleteExpired: async () => {
    const result = await query(
      `DELETE FROM signup_sessions
       WHERE expires_at < NOW()
          OR stage = 'expired'`,
    );

    return result.rowCount ?? 0;
  },
};
