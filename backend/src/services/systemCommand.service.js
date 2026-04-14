import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import open from 'open';

const execFile = promisify(execFileCallback);
const isWindows = process.platform === 'win32';

const sanitize = (value) => String(value ?? '').trim();

export const systemCommandService = {
  runShellCommand: async (command, options = {}) => {
    const value = sanitize(command);
    if (!value) {
      throw new Error('Command is required.');
    }

    if (isWindows) {
      return execFile('cmd.exe', ['/c', value], {
        windowsHide: true,
        timeout: options.timeout ?? 45000,
        maxBuffer: options.maxBuffer ?? 1024 * 1024,
      });
    }

    return execFile('/bin/sh', ['-lc', value], {
      timeout: options.timeout ?? 45000,
      maxBuffer: options.maxBuffer ?? 1024 * 1024,
    });
  },

  openTarget: async (target) => {
    const value = sanitize(target);
    if (!value) {
      throw new Error('Target path or URL is required.');
    }

    if (isWindows) {
      return execFile('cmd.exe', ['/c', 'start', '', value], {
        windowsHide: true,
        timeout: 15000,
        maxBuffer: 1024 * 1024,
      });
    }

    return open(value);
  },
};
