const EMAIL_REGEX = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;

const cleanText = (value) => value.replace(/\s+/g, ' ').trim();

const containsLocalPreference = (text) =>
  /(installed in my pc|installed on my pc|desktop app|local app|in my pc|on my pc|on computer)/i.test(
    text,
  );

const containsChromePreference = (text) =>
  /\b(on chrome|in chrome|using chrome|chrome browser)\b/i.test(text);

const extractSearchQuery = (original) => {
  const fromSearch = original.match(/\bsearch\s+(.+)$/i)?.[1];
  if (!fromSearch) {
    return '';
  }

  return cleanText(
    fromSearch
      .replace(/\bon youtube\b.*$/i, '')
      .replace(/\bon chrome\b.*$/i, '')
      .replace(/\bin chrome\b.*$/i, ''),
  );
};

const extractPlayQuery = (original) => {
  const fromPlay = original.match(/\bplay\s+(.+)$/i)?.[1];
  if (!fromPlay) {
    return '';
  }

  return cleanText(
    fromPlay
      .replace(/\bon youtube\b.*$/i, '')
      .replace(/\bon chrome\b.*$/i, '')
      .replace(/\bin chrome\b.*$/i, '')
      .replace(/\bsong\b/gi, '')
      .replace(/\bmusic\b/gi, ''),
  );
};

const parseOpenAppIntent = (text) => {
  const openMatch = text.match(/\bopen\s+(.+)$/i);
  if (!openMatch?.[1]) {
    return null;
  }

  const appName = cleanText(
    openMatch[1]
      .replace(/\bin\b.*$/i, '')
      .replace(/\bon\b.*$/i, '')
      .replace(/\bmy pc\b/gi, '')
      .replace(/\bcomputer\b/gi, '')
      .replace(/\bsoftware\b/gi, ''),
  );

  return appName || null;
};

const parseEmailCommand = (original) => {
  const email = original.match(EMAIL_REGEX)?.[1];
  if (!email) {
    return null;
  }

  const explicitBody = original.match(
    /send\s+(?:mail|email)\s+to\s+[^\s]+\s+(?:saying|say|message|body)\s+(.+)$/i,
  )?.[1];
  if (explicitBody) {
    return { to: email, body: cleanText(explicitBody), subject: 'Message from AI Assistant' };
  }

  const bodyBeforeTo = original.match(/send\s+(?:mail|email)\s+(.+?)\s+to\s+[^\s]+/i)?.[1];
  if (bodyBeforeTo) {
    return { to: email, body: cleanText(bodyBeforeTo), subject: 'Message from AI Assistant' };
  }

  return { to: email, body: 'Hello', subject: 'Message from AI Assistant' };
};

const parseWhatsAppMessagePayload = (original) => {
  const normalized = cleanText(
    original
      .replace(/^open\s+whatsapp\s+and\s+/i, '')
      .replace(/\s+(?:on|in)\s+chrome\b/gi, ''),
  );

  const match = normalized.match(/send\s+(?:a\s+)?(?:whatsapp\s+)?(?:message\s+)?to\s+(.+)$/i);
  if (!match?.[1]) {
    return null;
  }

  const rest = cleanText(match[1]);
  const explicit = rest.match(/(.+?)\s+(?:saying|say|message|that|:)\s+(.+)$/i);
  if (explicit?.[1] && explicit?.[2]) {
    return {
      contact: cleanText(explicit[1]),
      message: cleanText(explicit[2]),
    };
  }

  const tokens = rest.split(' ').filter(Boolean);
  if (tokens.length >= 4) {
    return {
      contact: tokens.slice(0, 2).join(' '),
      message: tokens.slice(2).join(' '),
    };
  }

  if (tokens.length === 3) {
    return {
      contact: tokens[0],
      message: tokens.slice(1).join(' '),
    };
  }

  return {
    contact: rest,
    message: '',
  };
};

const isWhatsAppMessageCommand = (text) =>
  /send\s+(?:a\s+)?(?:whatsapp\s+)?(?:message\s+)?to/i.test(text) ||
  /open\s+whatsapp.*send\s+message\s+to/i.test(text);

const isMailCommand = (text) =>
  /send\s+mail/i.test(text) || /send\s+email/i.test(text);

export const commandParserService = {
  parse: (command) => {
    const original = cleanText(command);
    const text = original.toLowerCase();
    const localPreference = containsLocalPreference(text);
    const chromePreference = containsChromePreference(text);
    const youtubeIntent = text.includes('youtube');
    const searchIntent = text.includes('search');
    const playIntent = text.includes('play');

    if (!text) {
      return { action: 'chat_only', args: {}, source: 'parser' };
    }

    if (isWhatsAppMessageCommand(text)) {
      const payload = parseWhatsAppMessagePayload(original) ?? { contact: '', message: '' };
      if (chromePreference && !localPreference) {
        return {
          action: 'send_whatsapp_web_message',
          args: payload,
          source: 'parser',
        };
      }

      return {
        action: 'send_whatsapp_message',
        args: payload,
        source: 'parser',
      };
    }

    if (isMailCommand(text)) {
      const payload = parseEmailCommand(original) ?? { to: undefined, body: 'Hello', subject: 'Message from AI Assistant' };
      return {
        action: 'send_mail',
        args: payload,
        source: 'parser',
      };
    }

    if (searchIntent && youtubeIntent) {
      return {
        action: 'browser_search_youtube',
        args: {
          query: extractSearchQuery(original) || 'latest tutorials',
        },
        source: 'parser',
      };
    }

    if (playIntent && (youtubeIntent || chromePreference)) {
      return {
        action: 'browser_play_youtube',
        args: {
          query: extractPlayQuery(original) || 'top songs',
        },
        source: 'parser',
      };
    }

    if (searchIntent) {
      return {
        action: 'browser_google_search',
        args: {
          query: extractSearchQuery(original) || original,
        },
        source: 'parser',
      };
    }

    if (text.includes('open') && text.includes('youtube')) {
      return { action: 'browser_open_youtube', args: {}, source: 'parser' };
    }

    if (text.includes('open') && text.includes('gmail')) {
      return { action: 'browser_open_gmail', args: {}, source: 'parser' };
    }

    if (text.includes('open') && text.includes('whatsapp')) {
      if (chromePreference && !localPreference) {
        return { action: 'browser_open_whatsapp_web', args: {}, source: 'parser' };
      }
      return { action: 'open_whatsapp', args: {}, source: 'parser' };
    }

    if (text.includes('open') && (text.includes('word') || text.includes('microsoft word'))) {
      return { action: 'open_word', args: {}, source: 'parser' };
    }

    if (text.includes('open') && text.includes('chrome')) {
      return { action: 'open_chrome', args: {}, source: 'parser' };
    }

    if (
      (text.includes('open') || text.includes('show')) &&
      (text.includes('downloads') || text.includes('download folder'))
    ) {
      return { action: 'open_folder_downloads', args: {}, source: 'parser' };
    }

    if (text.includes('play') && (text.includes('song') || text.includes('music'))) {
      if (chromePreference) {
        return {
          action: 'browser_play_youtube',
          args: {
            query: extractPlayQuery(original) || 'top songs',
          },
          source: 'parser',
        };
      }
      return { action: 'play_music', args: {}, source: 'parser' };
    }

    if (text.includes('create') && text.includes('document')) {
      return { action: 'create_document', args: { title: 'new-document' }, source: 'parser' };
    }

    if (text.includes('write mail') || text.includes('compose mail')) {
      const email = original.match(EMAIL_REGEX)?.[1];
      const body = original.match(/(?:saying|say|message|body)\s+(.+)$/i)?.[1] || 'Hello';
      return {
        action: 'compose_email',
        args: {
          to: email,
          body: cleanText(body),
          subject: 'Draft from AI Assistant',
        },
        source: 'parser',
      };
    }

    if (text.startsWith('open ')) {
      const appName = parseOpenAppIntent(original);
      if (appName) {
        if (chromePreference && !localPreference) {
          return { action: 'browser_google_search', args: { query: appName }, source: 'parser' };
        }
        return { action: 'open_app', args: { appName }, source: 'parser' };
      }
    }

    return { action: 'chat_only', args: {}, source: 'parser' };
  },
};
