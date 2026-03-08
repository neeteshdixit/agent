const EMAIL_REGEX = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;

const cleanText = (value) => value.replace(/\s+/g, ' ').trim();

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

    if (!text) {
      return { action: 'chat_only', args: {}, source: 'parser' };
    }

    if (text.includes('open') && text.includes('whatsapp')) {
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
        return { action: 'open_app', args: { appName }, source: 'parser' };
      }
    }

    return { action: 'chat_only', args: {}, source: 'parser' };
  },
};
