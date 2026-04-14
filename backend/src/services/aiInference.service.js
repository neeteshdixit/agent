import { commandRouterService } from './commandRouter.service.js';
import { env } from '../config/env.js';

const normalizeBaseUrl = (value) => String(value ?? '').replace(/\/+$/, '');

const inferRoute = (action, args = {}) => {
  if (['open_browser_app', 'youtube_play', 'search_web'].includes(action)) {
    return 'browser';
  }

  if (action === 'send_whatsapp_message' && String(args.browser ?? '').toLowerCase() === 'chrome') {
    return 'browser';
  }

  if (action === 'chat_only') {
    return 'chat';
  }

  return 'local';
};

const firstString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const normalizeArgs = (action, args = {}, fallbackArgs = {}) => {
  const pick = (...values) => firstString(...values);

  switch (action) {
    case 'open_local_app':
      return {
        app: pick(args.app, args.appName, fallbackArgs.app, fallbackArgs.appName),
      };

    case 'open_browser_app':
      return {
        app: pick(args.app, fallbackArgs.app),
        browser: pick(args.browser, fallbackArgs.browser, 'chrome'),
      };

    case 'youtube_play':
      return {
        query: pick(args.query, fallbackArgs.query),
        browser: pick(args.browser, fallbackArgs.browser, 'chrome'),
      };

    case 'send_email':
      return {
        to: pick(args.to, fallbackArgs.to),
        message: pick(args.message, args.body, fallbackArgs.message, fallbackArgs.body),
        subject: pick(args.subject, fallbackArgs.subject),
      };

    case 'send_whatsapp_message':
      return {
        contact: pick(args.contact, fallbackArgs.contact),
        message: pick(args.message, fallbackArgs.message),
        browser: pick(args.browser, fallbackArgs.browser),
      };

    case 'search_web':
      return {
        query: pick(args.query, fallbackArgs.query),
      };

    case 'open_folder':
      return {
        folder: pick(args.folder, fallbackArgs.folder),
      };

    case 'play_music':
      return {
        songPath: pick(args.songPath, fallbackArgs.songPath),
      };

    default:
      return {};
  }
};

const normalizePrediction = (payload, fallback) => {
  const action = firstString(payload?.action, payload?.intent, fallback?.action) || 'chat_only';
  const args = normalizeArgs(action, payload?.args ?? payload ?? {}, fallback?.args ?? {});
  const intent = firstString(payload?.intent, action, fallback?.intent) || action;
  const source = firstString(payload?.source, 'python_ml');
  const correctedCommand = firstString(
    payload?.corrected_command,
    payload?.correctedCommand,
    fallback?.correctedCommand,
  );
  const route = firstString(payload?.route, fallback?.route, inferRoute(action, args));
  const confidence =
    typeof payload?.confidence === 'number'
      ? payload.confidence
      : typeof payload?.confidence === 'string'
        ? Number(payload.confidence)
        : 0;

  return {
    intent,
    action,
    args,
    source,
    route,
    confidence: Number.isFinite(confidence) ? confidence : 0,
    correctedCommand,
    modelVersion: firstString(payload?.model_version, payload?.modelVersion),
    datasetSize:
      typeof payload?.dataset_size === 'number'
        ? payload.dataset_size
        : typeof payload?.datasetSize === 'number'
          ? payload.datasetSize
          : null,
    memoryHit: Boolean(payload?.memory_hit ?? payload?.memoryHit),
  };
};

const callAiService = async (path, payload) => {
  const baseUrl = normalizeBaseUrl(env.aiServiceUrl);
  if (!baseUrl) {
    throw new Error('AI service URL is not configured.');
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(1000, Number(env.aiServiceTimeoutMs ?? 8000));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `AI service returned ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

export const aiInferenceService = {
  interpretTaskCommand: async ({ command, userId }) => {
    const fallback = commandRouterService.route(command);

    try {
      const payload = await callAiService('/predict', {
        command,
        user_id: userId,
      });

      const normalized = normalizePrediction(payload, fallback);
      return normalized.action
        ? normalized
        : {
            ...fallback,
            intent: fallback.action,
            confidence: 0,
            correctedCommand: command,
            source: 'rule_fallback',
            route: inferRoute(fallback.action, fallback.args),
          };
    } catch (error) {
      console.warn('AI prediction service unavailable, using rule fallback:', {
        message: error?.message,
      });

      return {
        ...fallback,
        intent: fallback.action,
        confidence: 0,
        correctedCommand: command,
        source: 'rule_fallback',
        route: inferRoute(fallback.action, fallback.args),
      };
    }
  },

  recordFeedback: async (payload) => {
    try {
      return await callAiService('/feedback', payload);
    } catch (error) {
      console.warn('AI feedback service unavailable:', {
        message: error?.message,
      });
      return null;
    }
  },

  retrainModel: async () => {
    try {
      return await callAiService('/train', {});
    } catch (error) {
      console.warn('AI training service unavailable:', {
        message: error?.message,
      });
      return null;
    }
  },
};
