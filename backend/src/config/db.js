import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
});

export const query = (text, params = []) => pool.query(text, params);

const schemaQueries = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    google_id TEXT,
    otp_code_hash TEXT,
    otp_expires_at TIMESTAMPTZ,
    reset_token_hash TEXT,
    reset_token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`,
  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    last_agent_mode BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS chat_sessions_user_idx ON chat_sessions(user_id, updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    task JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id, created_at ASC)`,
  `CREATE TABLE IF NOT EXISTS task_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    action TEXT NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('completed', 'failed', 'blocked')),
    progress JSONB NOT NULL DEFAULT '[]'::jsonb,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS task_logs_user_idx ON task_logs(user_id, created_at DESC)`,
  `ALTER TABLE task_logs DROP CONSTRAINT IF EXISTS task_logs_status_check`,
  `ALTER TABLE task_logs
   ADD CONSTRAINT task_logs_status_check
   CHECK (status IN ('completed', 'failed', 'blocked', 'waiting'))`,
  `CREATE TABLE IF NOT EXISTS task_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    normalized_command TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT '',
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(16) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    failure_reason VARCHAR(80),
    retry_after TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 1,
    suggestion JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS task_history_user_command_idx
   ON task_history(user_id, normalized_command, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS task_history_retry_after_idx
   ON task_history(user_id, retry_after DESC)`,
  `CREATE TABLE IF NOT EXISTS command_learning_examples (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instruction TEXT NOT NULL,
    normalized_instruction TEXT NOT NULL,
    action TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    source VARCHAR(24) NOT NULL CHECK (source IN ('success', 'correction', 'manual')),
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, normalized_instruction)
  )`,
  `CREATE INDEX IF NOT EXISTS command_learning_user_idx
   ON command_learning_examples(user_id, updated_at DESC)`,
];

export const connectDb = async () => {
  await query('SELECT 1');

  for (const sql of schemaQueries) {
    await query(sql);
  }
};
