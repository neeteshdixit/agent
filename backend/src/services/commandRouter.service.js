import { commandParserService } from './commandParser.service.js';
import { commandCatalogService } from './commandCatalog.service.js';

const getRouteType = (action, args = {}) => {
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

export const commandRouterService = {
  route: (command) => {
    const catalogMatch = commandCatalogService.match(command);
    if (catalogMatch) {
      return {
        ...catalogMatch,
        source: 'catalog',
        route: getRouteType(catalogMatch.action, catalogMatch.args),
      };
    }

    const parsed = commandParserService.parse(command);
    return {
      ...parsed,
      route: getRouteType(parsed.action, parsed.args),
    };
  },
};
