import { commandParserService } from './commandParser.service.js';

const getRouteType = (action) => {
  if (action.startsWith('browser_')) {
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
