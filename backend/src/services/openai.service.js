import OpenAI from 'openai';
import { env } from '../config/env.js';
import { commandRouterService } from './commandRouter.service.js';

const client = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const inferRoute = (action) => {
  if (action.startsWith('browser_') || action === 'send_whatsapp_web_message') {
    return 'browser';
  }

  if (action === 'chat_only') {
    return 'chat';
  }

  return 'local';
};

const mergeArgsWithFallback = (primary = {}, fallback = {}) => ({
  ...fallback,
  ...primary,
});

export const openaiService = {
  generateChatReply: async ({ messages }) => {
    if (!client) {
      return 'OpenAI API key is not configured. I can still help with local task execution and command parsing.';
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

    if (!client && parsedByRule.action !== 'chat_only') {
      return parsedByRule;
    }

    if (!client) {
      return parsedByRule;
    }

    try {
      const completion = await client.chat.completions.create({
        model: env.openaiModel,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a safe command parser for local automation.
Allowed actions:
- open_whatsapp
- open_word
- open_chrome
- open_folder_downloads
- play_music
- open_app
- browser_open_whatsapp_web
- browser_open_youtube
- browser_open_gmail
- browser_google_search
- browser_search_youtube
- browser_play_youtube
- send_mail
- send_whatsapp_message
- send_whatsapp_web_message
- compose_email
- send_email
- create_document
- chat_only

Return JSON in this exact format:
{
  "action": "one_of_the_actions_above",
  "args": {
            "appName"?: string,
            "to"?: string,
            "subject"?: string,
            "body"?: string,
            "contact"?: string,
            "message"?: string,
            "query"?: string,
            "songPath"?: string,
            "title"?: string
          }
}
Never output commands outside the allowed actions.`,
          },
          {
            role: 'user',
            content: command,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '';
      const parsed = safeJsonParse(raw);

      if (!parsed?.action) {
        return parsedByRule;
      }

      if (parsed.action === 'chat_only' && parsedByRule.action !== 'chat_only') {
        return parsedByRule;
      }

      const mergedArgs = mergeArgsWithFallback(parsed.args, parsedByRule.args);

      return {
        action: parsed.action,
        args: mergedArgs,
        source: 'openai',
        route: inferRoute(parsed.action),
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
