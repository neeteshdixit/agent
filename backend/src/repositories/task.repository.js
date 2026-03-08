import crypto from 'node:crypto';
import { query } from '../config/db.js';

const mapTask = (row) => ({
  id: row.id,
  userId: row.user_id,
  command: row.command,
  action: row.action,
  status: row.status,
  progress: Array.isArray(row.progress) ? row.progress : [],
  result: row.result,
  createdAt: row.created_at,
});

export const taskRepository = {
  create: async ({ userId, command, action, status, progress, result }) => {
    const id = crypto.randomUUID();
    const response = await query(
      `INSERT INTO task_logs (
        id, user_id, command, action, status, progress, result, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, NOW())
      RETURNING *`,
      [
        id,
        userId,
        command,
        action,
        status,
        JSON.stringify(progress ?? []),
        JSON.stringify(result ?? null),
      ],
    );

    return mapTask(response.rows[0]);
  },

  listByUser: async ({ userId, limit = 30 }) => {
    const response = await query(
      `SELECT *
       FROM task_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    );

    return response.rows.map(mapTask);
  },
};
