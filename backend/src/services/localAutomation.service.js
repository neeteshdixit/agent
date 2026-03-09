import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import open from 'open';
import osu from 'node-os-utils';

const exec = promisify(execCallback);

const WINDOWS_APPS = {
  whatsapp: {
    label: 'WhatsApp',
    targets: [
      { type: 'openApp', value: 'WhatsApp' },
      { type: 'exec', value: 'cmd /c start "" "whatsapp:"' },
    ],
  },
  word: {
    label: 'Microsoft Word',
    targets: [
      { type: 'openApp', value: 'winword' },
      { type: 'exec', value: 'cmd /c start "" "winword"' },
    ],
  },
  chrome: {
    label: 'Google Chrome',
    targets: [
      { type: 'openApp', value: 'chrome' },
      { type: 'exec', value: 'cmd /c start "" "chrome"' },
    ],
  },
  edge: {
    label: 'Microsoft Edge',
    targets: [{ type: 'openApp', value: 'msedge' }],
  },
  notepad: {
    label: 'Notepad',
    targets: [{ type: 'exec', value: 'cmd /c start "" "notepad"' }],
  },
  calculator: {
    label: 'Calculator',
    targets: [{ type: 'exec', value: 'cmd /c start "" "calc"' }],
  },
  vlc: {
    label: 'VLC Media Player',
    targets: [{ type: 'openApp', value: 'vlc' }],
  },
  spotify: {
    label: 'Spotify',
    targets: [{ type: 'openApp', value: 'spotify' }],
  },
  excel: {
    label: 'Microsoft Excel',
    targets: [{ type: 'openApp', value: 'excel' }],
  },
  powerpoint: {
    label: 'Microsoft PowerPoint',
    targets: [{ type: 'openApp', value: 'powerpnt' }],
  },
};

const FOLDER_PATH_RESOLVERS = {
  downloads: () => path.join(os.homedir(), 'Downloads'),
  documents: () => path.join(os.homedir(), 'Documents'),
  desktop: () => path.join(os.homedir(), 'Desktop'),
  pictures: () => path.join(os.homedir(), 'Pictures'),
  music: () => path.join(os.homedir(), 'Music'),
  videos: () => path.join(os.homedir(), 'Videos'),
};

const normalizeAppName = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('whatsapp')) return 'whatsapp';
  if (lower.includes('word')) return 'word';
  if (lower.includes('chrome')) return 'chrome';
  if (lower.includes('edge')) return 'edge';
  if (lower.includes('notepad')) return 'notepad';
  if (lower.includes('calculator') || lower.includes('calc')) return 'calculator';
  if (lower.includes('vlc')) return 'vlc';
  if (lower.includes('spotify')) return 'spotify';
  if (lower.includes('excel')) return 'excel';
  if (lower.includes('powerpoint')) return 'powerpoint';
  return null;
};

const normalizeFolderName = (name) => {
  const lower = String(name).toLowerCase();
  if (/\b(downloads?|download folder)\b/i.test(lower)) return 'downloads';
  if (/\b(documents?|docs?)\b/i.test(lower)) return 'documents';
  if (/\b(desktop)\b/i.test(lower)) return 'desktop';
  if (/\b(pictures?|photos?|images?)\b/i.test(lower)) return 'pictures';
  if (/\b(music|songs?)\b/i.test(lower)) return 'music';
  if (/\b(videos?|movies?)\b/i.test(lower)) return 'videos';
  return null;
};

const runTarget = async (target) => {
  if (target.type === 'openApp') {
    await open.openApp(target.value);
    return;
  }

  if (target.type === 'openUrl') {
    await open(target.value);
    return;
  }

  if (target.type === 'openPath') {
    await open(target.value);
    return;
  }

  if (target.type === 'exec') {
    await exec(target.value);
  }
};

const tryTargets = async (targets) => {
  let lastError = null;

  for (const target of targets) {
    try {
      await runTarget(target);
      return { ok: true };
    } catch (error) {
      lastError = error;
    }
  }

  return { ok: false, error: lastError };
};

const systemInfo = async () => {
  const memory = await osu.mem.info();
  return {
    platform: osu.os.platform(),
    freeMemMb: Number(memory.freeMemMb),
    totalMemMb: Number(memory.totalMemMb),
  };
};

export const localAutomationService = {
  openKnownApp: async ({ appName }) => {
    const appKey = normalizeAppName(appName);
    if (!appKey) {
      return {
        status: 'blocked',
        result: {
          message: `App "${appName}" is not in the safe allow-list.`,
        },
      };
    }

    const appConfig = WINDOWS_APPS[appKey];
    const execution = await tryTargets(appConfig.targets);

    if (!execution.ok) {
      return {
        status: 'failed',
        result: {
          message: `${appConfig.label} is not installed on this computer.`,
        },
      };
    }

    return {
      status: 'completed',
      result: {
        message: `${appConfig.label} opened successfully.`,
        system: await systemInfo(),
      },
    };
  },

  openDownloadsFolder: async () => {
    const downloadsPath = path.join(os.homedir(), 'Downloads');
    await fs.access(downloadsPath);
    await open(downloadsPath);

    return {
      status: 'completed',
      result: {
        message: 'Downloads folder opened successfully.',
        path: downloadsPath,
      },
    };
  },

  openKnownFolder: async ({ folder }) => {
    const folderKey = normalizeFolderName(folder);
    if (!folderKey) {
      return {
        status: 'blocked',
        result: {
          message: `Folder "${folder}" is not in the safe allow-list.`,
        },
      };
    }

    const folderPath = FOLDER_PATH_RESOLVERS[folderKey]();

    try {
      await fs.access(folderPath);
      await open(folderPath);
      return {
        status: 'completed',
        result: {
          message: `${folderKey[0].toUpperCase()}${folderKey.slice(1)} folder opened successfully.`,
          path: folderPath,
        },
      };
    } catch {
      return {
        status: 'failed',
        result: {
          message: `Could not open ${folderKey} folder on this computer.`,
        },
      };
    }
  },

  playMusic: async ({ songPath }) => {
    if (songPath) {
      await fs.access(songPath);
      await open(songPath);
      return {
        status: 'completed',
        result: {
          message: `Playing: ${songPath}`,
        },
      };
    }

    const execution = await tryTargets([
      { type: 'exec', value: 'cmd /c start "" "mswindowsmusic:"' },
      { type: 'openApp', value: 'wmplayer' },
      { type: 'openApp', value: 'spotify' },
    ]);

    if (!execution.ok) {
      return {
        status: 'failed',
        result: {
          message:
            'No compatible music player was found. Install a music player or pass a valid song path.',
        },
      };
    }

    return {
      status: 'completed',
      result: {
        message: 'Music player opened.',
      },
    };
  },
};
