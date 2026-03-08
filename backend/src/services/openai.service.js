import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const fallbackInterpretation = (command) => {
  const text = command.toLowerCase();

  if (text.includes('open whatsapp')) {
    return { action: 'open_whatsapp', args: {} };
  }

  if (text.includes('open microsoft word') || text.includes('open word')) {
    return { action: 'open_word', args: {} };
  }

  if (text.includes('write mail') || text.includes('compose mail')) {
    const body = command.split(':').slice(1).join(':').trim() || 'Hello,';
    return { action: 'compose_email', args: { body } };
  }

  if (text.includes('create a document') || text.includes('create document')) {
    return { action: 'create_document', args: { title: 'new-document' } };
  }

  if (text.includes('send email')) {
    return { action: 'send_email', args: {} };
  }

  return { action: 'chat_only', args: {} };
};

export const openaiService = {
  generateChatReply: async ({ messages }) => {
    if (!client) {
      return 'OpenAI API key is not configured. I can still help with local task execution and command parsing.';
    }

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
  },

  interpretTaskCommand: async ({ command }) => {
    if (!client) {
      return fallbackInterpretation(command);
    }

    const completion = await client.chat.completions.create({
      model: env.openaiModel,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a command parser. Convert user commands to JSON with this schema:
{
  "action": "open_whatsapp|open_word|compose_email|create_document|send_email|chat_only",
  "args": { "title"?: string, "body"?: string, "to"?: string, "subject"?: string }
}
Only return JSON.`,
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
      return fallbackInterpretation(command);
    }

    return {
      action: parsed.action,
      args: parsed.args ?? {},
    };
  },
};
