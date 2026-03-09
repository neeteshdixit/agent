import fs from 'node:fs';
import { env } from '../config/env.js';

const normalizeText = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

let cache = null;

const buildCache = () => {
  if (cache) {
    return cache;
  }

  const commandMap = new Map();
  const filePath = env.commandCatalogPath;
  let total = 0;

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
    total = entries.length;

    for (const entry of entries) {
      const phrase = normalizeText(entry?.phrase);
      const action = String(entry?.action ?? '').trim();
      const args = entry?.args && typeof entry.args === 'object' && !Array.isArray(entry.args) ? entry.args : {};

      if (!phrase || !action) {
        continue;
      }

      commandMap.set(phrase, {
        action,
        args,
      });
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.error('Failed to load command catalog:', {
        filePath,
        message: error?.message,
      });
    }
  }

  cache = {
    filePath,
    total,
    commandMap,
  };
  return cache;
};

export const commandCatalogService = {
  match: (command) => {
    const normalized = normalizeText(command);
    if (!normalized) {
      return null;
    }

    const loaded = buildCache();
    const matched = loaded.commandMap.get(normalized);
    if (!matched) {
      return null;
    }

    return {
      action: matched.action,
      args: { ...matched.args },
    };
  },
  stats: () => {
    const loaded = buildCache();
    return {
      filePath: loaded.filePath,
      total: loaded.total,
      loadedEntries: loaded.commandMap.size,
    };
  },
  reset: () => {
    cache = null;
  },
};
