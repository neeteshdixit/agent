import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const resolveArtifactsDir = () => {
  const configured = process.env.AGENT_ARTIFACTS_DIR;
  if (configured) {
    return path.resolve(configured);
  }

  return path.resolve(process.cwd(), 'artifacts');
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/ai-agent',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET ?? 'change-this-secret-in-production',
  jwtExpiry: process.env.JWT_EXPIRY ?? '7d',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  mailFrom: process.env.MAIL_FROM ?? 'no-reply@ai-agent.local',
  agentArtifactsDir: resolveArtifactsDir(),
};
