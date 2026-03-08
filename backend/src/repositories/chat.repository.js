import crypto from 'node:crypto';
import { query } from '../config/db.js';

const createId = () => crypto.randomUUID();

const mapSession = (row) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  lastAgentMode: row.last_agent_mode,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  messageCount: Number(row.message_count ?? 0),
});

const mapMessage = (row) => ({
  _id: row.id,
  sessionId: row.session_id,
  role: row.role,
  content: row.content,
  task: row.task,
  createdAt: row.created_at,
});

export const chatRepository = {
  listSessionsByUser: async (userId) => {
    const result = await query(
      `SELECT s.*,
              COUNT(m.id) AS message_count
       FROM chat_sessions s
       LEFT JOIN chat_messages m ON m.session_id = s.id
       WHERE s.user_id = $1
       GROUP BY s.id
       ORDER BY s.updated_at DESC
       LIMIT 50`,
      [userId],
    );

    return result.rows.map(mapSession);
  },

  findSessionById: async ({ sessionId, userId }) => {
    const result = await query(
      `SELECT s.*,
              COUNT(m.id) AS message_count
       FROM chat_sessions s
       LEFT JOIN chat_messages m ON m.session_id = s.id
       WHERE s.id = $1
         AND s.user_id = $2
       GROUP BY s.id
       LIMIT 1`,
      [sessionId, userId],
    );

    return result.rows[0] ? mapSession(result.rows[0]) : null;
  },

  createSession: async ({ userId, title }) => {
    const id = createId();
    const result = await query(
      `INSERT INTO chat_sessions (
        id, user_id, title, last_agent_mode, created_at, updated_at
      ) VALUES ($1, $2, $3, FALSE, NOW(), NOW())
      RETURNING *, 0::bigint AS message_count`,
      [id, userId, title],
    );

    return mapSession(result.rows[0]);
  },

  deleteSession: async ({ sessionId, userId }) => {
    const result = await query(`DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2`, [sessionId, userId]);
    return result.rowCount;
  },

  listMessages: async (sessionId) => {
    const result = await query(
      `SELECT *
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId],
    );

    return result.rows.map(mapMessage);
  },

  listRecentMessagesForModel: async ({ sessionId, limit }) => {
    const result = await query(
      `SELECT role, content
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [sessionId, limit],
    );

    return [...result.rows].reverse();
  },

  appendMessage: async ({ sessionId, role, content, task = null }) => {
    const id = createId();
    const result = await query(
      `INSERT INTO chat_messages (
        id, session_id, role, content, task, created_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
      RETURNING *`,
      [id, sessionId, role, content, task ? JSON.stringify(task) : null],
    );

    return mapMessage(result.rows[0]);
  },

  updateSession: async ({ sessionId, title, lastAgentMode }) => {
    const result = await query(
      `UPDATE chat_sessions
       SET title = COALESCE($1, title),
           last_agent_mode = COALESCE($2, last_agent_mode),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *, 0::bigint AS message_count`,
      [title ?? null, typeof lastAgentMode === 'boolean' ? lastAgentMode : null, sessionId],
    );

    return result.rows[0] ? mapSession(result.rows[0]) : null;
  },
};
