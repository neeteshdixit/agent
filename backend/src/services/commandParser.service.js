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

const getEmailBody = (command) => {
  const match = command.match(/(?:saying|say|message|body)\s+(.+)$/i);
  if (match?.[1]) {
    return cleanText(match[1]);
  }

  const parts = command.split(':');
  if (parts.length > 1) {
    return cleanText(parts.slice(1).join(':'));
  }

  return 'Hello';
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

  if (!appName) {
    return null;
  }

  return appName;
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

    if (text.includes('send email')) {
      const emailMatch = original.match(EMAIL_REGEX);
      return {
        action: 'send_email',
        args: {
          to: emailMatch?.[1],
          body: getEmailBody(original),
          subject: 'Message from AI Assistant',
        },
        source: 'parser',
      };
    }

    if (text.includes('write mail') || text.includes('compose mail')) {
      const emailMatch = original.match(EMAIL_REGEX);
      return {
        action: 'compose_email',
        args: {
          to: emailMatch?.[1],
          body: getEmailBody(original),
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
