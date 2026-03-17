import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.resolve(backendRoot, '.env') });

const resolveArtifactsDir = () => {
  const configured = process.env.AGENT_ARTIFACTS_DIR;
  if (configured) {
    return path.resolve(configured);
  }

  return path.resolve(process.cwd(), 'artifacts');
};

const resolveCommandCatalogPath = () => {
  const configured = process.env.COMMAND_CATALOG_PATH;
  if (configured) {
    return path.resolve(configured);
  }

  return path.resolve(backendRoot, 'data', 'commands.catalog.json');
};

const parseJsonObjectEnv = (rawValue, fallback = {}) => {
  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const parseIntegerEnv = (rawValue, fallback) => {
  const parsed = Number.parseInt(rawValue ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBooleanEnv = (rawValue, fallback) => {
  if (typeof rawValue !== 'string') {
    return fallback;
  }

  return rawValue.toLowerCase() === 'true';
};

const resolvedNodeEnv = process.env.NODE_ENV ?? 'development';
const defaultDevOtpMode = resolvedNodeEnv !== 'production';

export const env = {
  backendRoot,
  nodeEnv: resolvedNodeEnv,
  devOtpMode: parseBooleanEnv(process.env.DEV_OTP_MODE, defaultDevOtpMode),
  devOtpExposeInApi: parseBooleanEnv(process.env.DEV_OTP_EXPOSE_IN_API, defaultDevOtpMode),
  port: Number(process.env.PORT ?? 5000),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@127.0.0.1:5432/ai_agent',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET ?? 'change-this-secret-in-production',
  jwtExpiry: process.env.JWT_EXPIRY ?? '7d',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  mailFrom: process.env.MAIL_FROM ?? 'no-reply@ai-agent.local',
  fast2SmsApiKey: process.env.FAST2SMS_API_KEY ?? '',
  fast2SmsSenderId: process.env.FAST2SMS_SENDER_ID ?? '',
  fast2SmsRoute: process.env.FAST2SMS_ROUTE ?? 'q',
  otpExpiryMinutes: parseIntegerEnv(process.env.OTP_EXPIRY_MINUTES, 5),
  otpResendCooldownSeconds: parseIntegerEnv(
    process.env.OTP_RESEND_COOLDOWN_SECONDS,
    defaultDevOtpMode ? 30 : 60,
  ),
  otpMaxAttempts: parseIntegerEnv(process.env.OTP_MAX_ATTEMPTS, 3),
  signupSessionTtlMinutes: parseIntegerEnv(process.env.SIGNUP_SESSION_TTL_MINUTES, 30),
  signupCleanupIntervalMs: parseIntegerEnv(process.env.SIGNUP_CLEANUP_INTERVAL_MS, 10 * 60 * 1000),
  whatsappContacts: parseJsonObjectEnv(process.env.WHATSAPP_CONTACTS_JSON, {}),
  agentArtifactsDir: resolveArtifactsDir(),
  commandCatalogPath: resolveCommandCatalogPath(),
};
