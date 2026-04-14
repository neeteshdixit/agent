import crypto from 'node:crypto';
import { query } from '../config/db.js';

const createId = () => crypto.randomUUID();

const mapOtp = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    signupSessionId: row.signup_session_id,
    type: row.type,
    destination: row.destination,
    codeHash: row.code_hash,
    expiresAt: row.expires_at,
    resendAvailableAt: row.resend_available_at,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    sendCount: row.send_count,
    lastSentAt: row.last_sent_at,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const otpRepository = {
  upsertForSession: async ({
    signupSessionId,
    type,
    destination,
    codeHash,
    expiresAt,
    resendAvailableAt,
    maxAttempts,
  }) => {
    const result = await query(
      `INSERT INTO otp_codes (
        id,
        signup_session_id,
        type,
        destination,
        code_hash,
        expires_at,
        resend_available_at,
        attempts,
        max_attempts,
        send_count,
        last_sent_at,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 0, $8, 1, NOW(), NOW(), NOW()
      )
      ON CONFLICT (signup_session_id, type)
      DO UPDATE SET
        destination = EXCLUDED.destination,
        code_hash = EXCLUDED.code_hash,
        expires_at = EXCLUDED.expires_at,
        resend_available_at = EXCLUDED.resend_available_at,
        attempts = 0,
        max_attempts = EXCLUDED.max_attempts,
        send_count = otp_codes.send_count + 1,
        last_sent_at = NOW(),
        verified_at = NULL,
        updated_at = NOW()
      RETURNING *`,
      [
        createId(),
        signupSessionId,
        type,
        destination,
        codeHash,
        expiresAt,
        resendAvailableAt,
        maxAttempts,
      ],
    );

    return mapOtp(result.rows[0]);
  },

  findBySessionAndType: async ({ signupSessionId, type }) => {
    const result = await query(
      `SELECT *
       FROM otp_codes
       WHERE signup_session_id = $1
         AND type = $2
       LIMIT 1`,
      [signupSessionId, type],
    );

    return mapOtp(result.rows[0]);
  },

  incrementAttempts: async ({ signupSessionId, type }) => {
    const result = await query(
      `UPDATE otp_codes
       SET attempts = attempts + 1,
           updated_at = NOW()
       WHERE signup_session_id = $1
         AND type = $2
       RETURNING *`,
      [signupSessionId, type],
    );

    return mapOtp(result.rows[0]);
  },

  markVerified: async ({ signupSessionId, type }) => {
    const result = await query(
      `UPDATE otp_codes
       SET verified_at = NOW(),
           updated_at = NOW()
       WHERE signup_session_id = $1
         AND type = $2
       RETURNING *`,
      [signupSessionId, type],
    );

    return mapOtp(result.rows[0]);
  },

  deleteBySessionId: async (signupSessionId) => {
    await query(`DELETE FROM otp_codes WHERE signup_session_id = $1`, [signupSessionId]);
  },

  deleteExpired: async () => {
    const result = await query(
      `DELETE FROM otp_codes
       WHERE expires_at < (NOW() - INTERVAL '1 day')`,
    );

    return result.rowCount ?? 0;
  },
};
