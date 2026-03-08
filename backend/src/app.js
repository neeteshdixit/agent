import fs from 'node:fs/promises';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import taskRoutes from './routes/task.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: false,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(hpp());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use('/api/auth', authLimiter);

app.get('/', (req, res) => {
  return res.json({
    service: 'AI Assistant Backend',
    status: 'ok',
    health: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/config/public', (req, res) => {
  return res.json({
    googleEnabled: Boolean(env.googleClientId),
    openAiEnabled: Boolean(env.openaiApiKey),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export const prepareRuntimeDirectories = async () => {
  await fs.mkdir(env.agentArtifactsDir, { recursive: true });
};

export default app;
