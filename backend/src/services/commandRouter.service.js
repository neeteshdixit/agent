import { commandParserService } from './commandParser.service.js';

const getRouteType = (action) => {
  if (action.startsWith('browser_') || action === 'send_whatsapp_web_message') {
    return 'browser';
  }

  if (action === 'chat_only') {
    return 'chat';
  }

  return 'local';
};

export const commandRouterService = {
  route: (command) => {
    const parsed = commandParserService.parse(command);
    return {
      ...parsed,
      route: getRouteType(parsed.action),
    };
  },
};
