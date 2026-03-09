import OpenAI from 'openai';
import { env } from '../config/env.js';
import { commandRouterService } from './commandRouter.service.js';

const client = (() => {
  if (!env.openaiApiKey) {
    return null;
  }

  const options = {
    apiKey: env.openaiApiKey,
  };

  if (env.openaiBaseUrl) {
    options.baseURL = env.openaiBaseUrl;
  }

  return new OpenAI(options);
})();

const isGeminiEndpoint = env.openaiBaseUrl.includes('generativelanguage.googleapis.com');

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parseJsonFromModel = (value) => {
  if (!value) {
    return null;
  }

  const direct = safeJsonParse(value);
  if (direct) {
    return direct;
  }

  const fencedMatch = value.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const fenced = safeJsonParse(fencedMatch[1]);
    if (fenced) {
      return fenced;
    }
  }

  const firstBrace = value.indexOf('{');
  const lastBrace = value.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return safeJsonParse(value.slice(firstBrace, lastBrace + 1));
  }

  return null;
};

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

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return '';
};

const normalizeInterpretedAction = ({ payload, parsedByRule }) => {
  const rawAction = firstNonEmpty(payload?.action);
  const fallbackAction = parsedByRule?.action;
  const fallbackArgs = parsedByRule?.args ?? {};

  const direct = (key) => payload?.[key];
  const nested = (key) => payload?.args?.[key];

  const pick = (...values) => firstNonEmpty(...values);

  switch (rawAction) {
    case 'open_local_app':
      return {
        action: 'open_local_app',
        args: {
          app: pick(direct('app'), nested('app'), nested('appName'), fallbackArgs.app, fallbackArgs.appName),
        },
      };

    case 'open_browser_app':
      return {
        action: 'open_browser_app',
        args: {
          app: pick(direct('app'), nested('app'), fallbackArgs.app),
          browser: pick(direct('browser'), nested('browser'), fallbackArgs.browser, 'chrome'),
        },
      };

    case 'youtube_play':
      return {
        action: 'youtube_play',
        args: {
          query: pick(direct('query'), nested('query'), fallbackArgs.query),
          browser: pick(direct('browser'), nested('browser'), fallbackArgs.browser, 'chrome'),
        },
      };

    case 'send_email':
      return {
        action: 'send_email',
        args: {
          to: pick(direct('to'), nested('to'), fallbackArgs.to),
          message: pick(
            direct('message'),
            nested('message'),
            direct('body'),
            nested('body'),
            fallbackArgs.message,
            fallbackArgs.body,
          ),
        },
      };

    case 'send_whatsapp_message':
      return {
        action: 'send_whatsapp_message',
        args: {
          contact: pick(direct('contact'), nested('contact'), fallbackArgs.contact),
          message: pick(direct('message'), nested('message'), fallbackArgs.message),
          browser: pick(direct('browser'), nested('browser'), fallbackArgs.browser),
        },
      };

    case 'search_web':
      return {
        action: 'search_web',
        args: {
          query: pick(direct('query'), nested('query'), fallbackArgs.query),
        },
      };

    case 'open_folder':
      return {
        action: 'open_folder',
        args: {
          folder: pick(direct('folder'), nested('folder'), fallbackArgs.folder),
        },
      };

    case 'play_music':
      return {
        action: 'play_music',
        args: {
          songPath: pick(direct('songPath'), nested('songPath'), fallbackArgs.songPath),
        },
      };

    case 'chat_only':
      return { action: 'chat_only', args: {} };

    default:
      break;
  }

  switch (rawAction) {
    case 'open_whatsapp':
      return { action: 'open_local_app', args: { app: 'whatsapp' } };
    case 'open_word':
      return { action: 'open_local_app', args: { app: 'word' } };
    case 'open_chrome':
      return { action: 'open_local_app', args: { app: 'chrome' } };
    case 'open_app':
      return {
        action: 'open_local_app',
        args: { app: pick(direct('app'), nested('app'), nested('appName'), fallbackArgs.app, fallbackArgs.appName) },
      };
    case 'browser_open_whatsapp_web':
      return { action: 'open_browser_app', args: { app: 'whatsapp_web', browser: 'chrome' } };
    case 'browser_open_youtube':
      return { action: 'open_browser_app', args: { app: 'youtube', browser: 'chrome' } };
    case 'browser_open_gmail':
      return { action: 'open_browser_app', args: { app: 'gmail', browser: 'chrome' } };
    case 'browser_google_search':
      return {
        action: 'search_web',
        args: { query: pick(direct('query'), nested('query'), fallbackArgs.query) },
      };
    case 'browser_search_youtube':
      return {
        action: 'search_web',
        args: { query: pick(direct('query'), nested('query'), fallbackArgs.query, 'youtube') },
      };
    case 'browser_play_youtube':
      return {
        action: 'youtube_play',
        args: {
          query: pick(direct('query'), nested('query'), fallbackArgs.query),
          browser: 'chrome',
        },
      };
    case 'send_whatsapp_web_message':
      return {
        action: 'send_whatsapp_message',
        args: {
          contact: pick(direct('contact'), nested('contact'), fallbackArgs.contact),
          message: pick(direct('message'), nested('message'), fallbackArgs.message),
          browser: 'chrome',
        },
      };
    case 'send_mail':
      return {
        action: 'send_email',
        args: {
          to: pick(direct('to'), nested('to'), fallbackArgs.to),
          message: pick(direct('message'), nested('message'), direct('body'), nested('body'), fallbackArgs.message, fallbackArgs.body),
        },
      };
    case 'open_folder_downloads':
      return { action: 'open_folder', args: { folder: 'downloads' } };
    default:
      return fallbackAction === 'chat_only' ? { action: 'chat_only', args: {} } : null;
  }
};

export const openaiService = {
  generateChatReply: async ({ messages }) => {
    if (!client) {
      return 'LLM API key is not configured. I can still help with local task execution and command parsing.';
    }

    try {
      const completion = await client.chat.completions.create({
        model: env.openaiModel,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a reliable AI assistant in a productivity dashboard. Provide concise, actionable responses.',
          },
          ...messages,
        ],
      });

      return completion.choices[0]?.message?.content?.trim() ?? 'I could not generate a response.';
    } catch (error) {
      if (error?.code === 'insufficient_quota') {
        return 'OpenAI quota exceeded. Task automation is still available, but chat generation is temporarily unavailable.';
      }

      if (error?.status === 429) {
        return 'Model provider quota or rate limit exceeded. Please retry shortly or use a key with available quota.';
      }

      if (error?.code === 'invalid_api_key') {
        return 'Configured API key is invalid for the selected model provider.';
      }

      if (error?.status === 401) {
        return 'Configured API key is invalid for the selected model provider.';
      }

      if (error?.code === 'model_not_found') {
        return `Configured model "${env.openaiModel}" is unavailable for the selected model provider.`;
      }

      if (error?.status === 404) {
        return `Configured model "${env.openaiModel}" is unavailable for the selected model provider.`;
      }

      console.error('OpenAI chat generation failed:', {
        message: error?.message,
        code: error?.code,
        type: error?.type,
        requestId: error?.request_id,
      });
      return 'Chat model is temporarily unavailable. Please try again.';
    }
  },

  interpretTaskCommand: async ({ command }) => {
    const parsedByRule = commandRouterService.route(command);

    if (parsedByRule.source === 'catalog') {
      return parsedByRule;
    }

    if (!client && parsedByRule.action !== 'chat_only') {
      return parsedByRule;
    }

    if (!client) {
      return parsedByRule;
    }

    try {
      const requestPayload = {
        model: env.openaiModel,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `You are a strict automation command parser.

Rules:
1. Analyze the user's instruction carefully.
2. Identify the correct automation action.
3. Convert the instruction into structured JSON.
4. Do NOT produce explanations or conversational responses.
5. Only output valid JSON.
6. Always include required parameters for the detected action.

Supported actions and required parameters:
- open_local_app: app
- open_browser_app: app, browser
- youtube_play: query, browser
- send_email: to, message
- send_whatsapp_message: contact, message
- search_web: query
- open_folder: folder
- play_music: no parameters

For playlist/channel requests (example: "open playlist of Arijit Singh on youtube"):
- use action: youtube_play
- set browser: "chrome"
- set query to include playlist intent (example: "Arijit Singh playlist")
- do not replace user query with generic text like "top songs"

If the instruction does not match an executable action, return:
{"action":"chat_only"}

Output format examples:
{"action":"open_local_app","app":"whatsapp"}
{"action":"open_browser_app","app":"whatsapp_web","browser":"chrome"}
{"action":"youtube_play","query":"shape of you","browser":"chrome"}
{"action":"send_email","to":"user@example.com","message":"hello"}
{"action":"send_whatsapp_message","contact":"HR ma'am","message":"hello baby how are you"}
{"action":"search_web","query":"best ai tools"}
{"action":"open_folder","folder":"downloads"}
{"action":"play_music"}`,
          },
          {
            role: 'user',
            content: command,
          },
        ],
      };

      if (!isGeminiEndpoint) {
        requestPayload.response_format = { type: 'json_object' };
      }

      const completion = await client.chat.completions.create(requestPayload);

      const raw = completion.choices[0]?.message?.content ?? '';
      const parsed = parseJsonFromModel(raw);

      if (!parsed?.action) {
        return parsedByRule;
      }

      const normalized = normalizeInterpretedAction({ payload: parsed, parsedByRule });
      if (!normalized) {
        return parsedByRule;
      }

      if (normalized.action === 'chat_only' && parsedByRule.action !== 'chat_only') {
        return parsedByRule;
      }

      return {
        action: normalized.action,
        args: normalized.args,
        source: 'openai',
        route: inferRoute(normalized.action, normalized.args),
      };
    } catch (error) {
      console.error('OpenAI command interpretation failed. Falling back to rule parser:', {
        message: error?.message,
        code: error?.code,
        type: error?.type,
        requestId: error?.request_id,
      });
      return {
        ...parsedByRule,
        source: 'parser_fallback',
      };
    }
  },
};
