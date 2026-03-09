const EMAIL_REGEX = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;

const cleanText = (value) => value.replace(/\s+/g, ' ').trim();

const normalizeEmailMarkup = (value) =>
  value.replace(/\[([^\]]+@[^\]]+)\]\(mailto:[^)]+\)/gi, '$1');

const containsLocalPreference = (text) =>
  /(installed in my pc|installed on my pc|desktop app|local app|in my pc|on my pc|on computer|installed)/i.test(
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
      .replace(/\bfolder\b.*$/i, '')
      .replace(/\bmy pc\b/gi, '')
      .replace(/\bcomputer\b/gi, '')
      .replace(/\bsoftware\b/gi, '')
      .replace(/\binstalled\b/gi, '')
      .replace(/\bapp\b/gi, ''),
  );

  return appName || null;
};

const parseEmailCommand = (rawOriginal) => {
  const original = normalizeEmailMarkup(rawOriginal);
  const email = original.match(EMAIL_REGEX)?.[1];
  if (!email) {
    return null;
  }

  const explicitBody = original.match(
    /send\s+(?:mail|email)\s+to\s+[^\s]+\s+(?:saying|say|message|body)\s+(.+)$/i,
  )?.[1];
  if (explicitBody) {
    return { to: email, message: cleanText(explicitBody) };
  }

  const bodyBeforeTo = original.match(/send\s+(?:mail|email)\s+(.+?)\s+to\s+[^\s]+/i)?.[1];
  if (bodyBeforeTo) {
    return { to: email, message: cleanText(bodyBeforeTo) };
  }

  return { to: email, message: 'Hello' };
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

const isMailCommand = (text) => /send\s+mail/i.test(text) || /send\s+email/i.test(text);

const parseFolderIntent = (text) => {
  if (!/(open|show)/i.test(text)) {
    return null;
  }

  if (/\b(downloads?|download folder)\b/i.test(text)) return 'downloads';
  if (/\b(documents?|docs?)\b/i.test(text)) return 'documents';
  if (/\b(desktop)\b/i.test(text)) return 'desktop';
  if (/\b(pictures?|photos?|images?)\b/i.test(text)) return 'pictures';
  if (/\b(music|songs?)\b/i.test(text)) return 'music';
  if (/\b(videos?|movies?)\b/i.test(text)) return 'videos';

  return null;
};

const inferBrowserApp = (text) => {
  if (text.includes('whatsapp')) return 'whatsapp_web';
  if (text.includes('youtube')) return 'youtube';
  if (text.includes('gmail') || text.includes('mail')) return 'gmail';
  return '';
};

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
      return {
        action: 'send_whatsapp_message',
        args: {
          contact: payload.contact ?? '',
          message: payload.message ?? '',
          ...(chromePreference ? { browser: 'chrome' } : {}),
        },
        source: 'parser',
      };
    }

    if (isMailCommand(text)) {
      const payload = parseEmailCommand(original) ?? { to: '', message: '' };
      return {
        action: 'send_email',
        args: {
          to: payload.to ?? '',
          message: payload.message ?? '',
        },
        source: 'parser',
      };
    }

    const folder = parseFolderIntent(text);
    if (folder) {
      return {
        action: 'open_folder',
        args: { folder },
        source: 'parser',
      };
    }

    if (searchIntent) {
      return {
        action: 'search_web',
        args: {
          query: extractSearchQuery(original) || original,
        },
        source: 'parser',
      };
    }

    if (playIntent && (youtubeIntent || chromePreference)) {
      return {
        action: 'youtube_play',
        args: {
          query: extractPlayQuery(original) || 'top songs',
          browser: 'chrome',
        },
        source: 'parser',
      };
    }

    if (playIntent && /\b(play music|play a song|play song)\b/i.test(text)) {
      return { action: 'play_music', args: {}, source: 'parser' };
    }

    if (text.includes('open')) {
      const browserApp = inferBrowserApp(text);
      if (
        browserApp &&
        ((browserApp === 'whatsapp_web' && chromePreference && !localPreference) ||
          browserApp !== 'whatsapp_web')
      ) {
        return {
          action: 'open_browser_app',
          args: {
            app: browserApp,
            browser: 'chrome',
          },
          source: 'parser',
        };
      }

      const app = parseOpenAppIntent(original);
      if (app) {
        return {
          action: 'open_local_app',
          args: { app },
          source: 'parser',
        };
      }
    }

    if (playIntent) {
      return { action: 'play_music', args: {}, source: 'parser' };
    }

    return { action: 'chat_only', args: {}, source: 'parser' };
  },
};
