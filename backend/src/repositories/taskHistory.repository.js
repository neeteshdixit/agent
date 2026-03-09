import crypto from 'node:crypto';
import { query } from '../config/db.js';

const mapTaskHistory = (row) => ({
  id: row.id,
  userId: row.user_id,
  command: row.command,
  normalizedCommand: row.normalized_command,
  action: row.action,
  parameters: row.parameters ?? {},
  status: row.status,
  errorMessage: row.error_message,
  failureReason: row.failure_reason,
  retryAfter: row.retry_after,
  attempts: Number(row.attempts ?? 1),
  suggestion: row.suggestion,
  createdAt: row.created_at,
});

export const taskHistoryRepository = {
  create: async ({
    userId,
    command,
    normalizedCommand,
    action,
    parameters,
    status,
    errorMessage = null,
    failureReason = null,
    retryAfter = null,
    attempts = 1,
    suggestion = null,
  }) => {
    const id = crypto.randomUUID();
    const response = await query(
      `INSERT INTO task_history (
         id, user_id, command, normalized_command, action, parameters,
         status, error_message, failure_reason, retry_after, attempts, suggestion, created_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6::jsonb,
         $7, $8, $9, $10, $11, $12::jsonb, NOW()
       )
       RETURNING *`,
      [
        id,
        userId,
        command,
        normalizedCommand,
        action ?? '',
        JSON.stringify(parameters ?? {}),
        status,
        errorMessage,
        failureReason,
        retryAfter,
        attempts,
        suggestion ? JSON.stringify(suggestion) : null,
      ],
    );

    return mapTaskHistory(response.rows[0]);
  },

  findLatestByCommand: async ({ userId, normalizedCommand }) => {
    const response = await query(
      `SELECT *
       FROM task_history
       WHERE user_id = $1
         AND normalized_command = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, normalizedCommand],
    );

    return response.rows[0] ? mapTaskHistory(response.rows[0]) : null;
  },

  listRecentFailuresByCommand: async ({ userId, normalizedCommand, limit = 5 }) => {
    const response = await query(
      `SELECT *
       FROM task_history
       WHERE user_id = $1
         AND normalized_command = $2
         AND status = 'failed'
       ORDER BY created_at DESC
       LIMIT $3`,
      [userId, normalizedCommand, limit],
    );

    return response.rows.map(mapTaskHistory);
  },

  findLatestFailedCandidate: async ({ userId, excludeNormalizedCommand, withinHours = 24 }) => {
    const response = await query(
      `SELECT *
       FROM task_history
       WHERE user_id = $1
         AND status = 'failed'
         AND normalized_command <> $2
         AND created_at >= NOW() - make_interval(hours => $3::int)
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, excludeNormalizedCommand, withinHours],
    );

    return response.rows[0] ? mapTaskHistory(response.rows[0]) : null;
  },
};
