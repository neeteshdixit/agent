import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..', '..');
const outputPath = path.resolve(backendRoot, 'data', 'commands.catalog.json');

const DEFAULT_TARGET = 500000;
const maxTarget = 2000000;
const parsedTarget = Number.parseInt(process.argv[2] ?? process.env.COMMAND_CATALOG_SIZE ?? '', 10);
const target =
  Number.isFinite(parsedTarget) && parsedTarget > 0
    ? Math.min(parsedTarget, maxTarget)
    : DEFAULT_TARGET;

const normalizeText = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

const entries = [];
const seen = new Set();

const addEntry = (phrase, action, args = {}) => {
  const normalized = normalizeText(phrase);
  if (!normalized || !action || seen.has(normalized)) {
    return false;
  }

  entries.push({
    phrase: normalized,
    action,
    args,
  });
  seen.add(normalized);
  return true;
};

const localApps = [
  'chrome',
  'word',
  'excel',
  'powerpoint',
  'notepad',
  'calculator',
  'paint',
  'whatsapp',
  'telegram',
  'spotify',
  'vscode',
  'zoom',
  'teams',
  'slack',
  'outlook',
  'photoshop',
  'obs',
  'discord',
  'firefox',
  'edge',
  'vlc',
  'file explorer',
  'task manager',
  'cmd',
  'powershell',
  'git bash',
  'android studio',
  'intellij',
  'pycharm',
  'postman',
  'docker desktop',
  'onedrive',
  'steam',
  'epic games',
  'blender',
  'canva',
  'audacity',
  '7zip',
  'notion',
  'figma',
];

const folders = ['downloads', 'documents', 'desktop', 'pictures', 'music', 'videos'];
const browserApps = [
  { app: 'whatsapp_web', label: 'whatsapp' },
  { app: 'youtube', label: 'youtube' },
  { app: 'gmail', label: 'gmail' },
];
const shortMessages = [
  'hello',
  'quick update',
  'meeting started',
  'please call me',
  'status shared',
  'report sent',
  'done',
  'approved',
  'thank you',
  'urgent check',
];

const seedCommands = [
  { phrase: 'open whatsapp installed in my pc', action: 'open_local_app', args: { app: 'whatsapp' } },
  { phrase: 'open whatsapp on chrome', action: 'open_browser_app', args: { app: 'whatsapp_web', browser: 'chrome' } },
  { phrase: 'open youtube on chrome', action: 'open_browser_app', args: { app: 'youtube', browser: 'chrome' } },
  { phrase: 'open gmail on chrome', action: 'open_browser_app', args: { app: 'gmail', browser: 'chrome' } },
  {
    phrase: 'play shape of you on youtube on chrome',
    action: 'youtube_play',
    args: { query: 'shape of you', browser: 'chrome' },
  },
  { phrase: 'search best ai tools', action: 'search_web', args: { query: 'best ai tools' } },
  { phrase: 'open downloads folder', action: 'open_folder', args: { folder: 'downloads' } },
  { phrase: 'play music', action: 'play_music', args: {} },
  {
    phrase: 'send whatsapp message to hr maam saying hello',
    action: 'send_whatsapp_message',
    args: { contact: 'hr maam', message: 'hello' },
  },
  {
    phrase: 'send email to someone@example.com saying hello',
    action: 'send_email',
    args: { to: 'someone@example.com', message: 'hello' },
  },
];

for (const command of seedCommands) {
  if (entries.length >= target) {
    break;
  }
  addEntry(command.phrase, command.action, command.args);
}

let i = 1;
while (entries.length < target) {
  const topic = `topic ${i}`;
  addEntry(`search ${topic}`, 'search_web', { query: topic });
  if (entries.length >= target) break;
  addEntry(`google ${topic}`, 'search_web', { query: topic });
  if (entries.length >= target) break;
  addEntry(`find ${topic} online`, 'search_web', { query: topic });
  if (entries.length >= target) break;

  const song = `song ${i}`;
  addEntry(`play ${song} on youtube on chrome`, 'youtube_play', { query: song, browser: 'chrome' });
  if (entries.length >= target) break;
  addEntry(`open playlist for artist ${i} on youtube`, 'youtube_play', {
    query: `artist ${i} playlist`,
    browser: 'chrome',
  });
  if (entries.length >= target) break;

  const app = localApps[(i - 1) % localApps.length];
  addEntry(`open ${app} installed in my pc profile ${i}`, 'open_local_app', { app: `${app} ${i}` });
  if (entries.length >= target) break;
  addEntry(`launch ${app} tool ${i}`, 'open_local_app', { app: `${app} tool ${i}` });
  if (entries.length >= target) break;
  addEntry(`start local app ${i}`, 'open_local_app', { app: `local app ${i}` });
  if (entries.length >= target) break;

  const folder = folders[(i - 1) % folders.length];
  addEntry(`open ${folder} folder ${i}`, 'open_folder', { folder });
  if (entries.length >= target) break;
  addEntry(`show ${folder} on my pc ${i}`, 'open_folder', { folder });
  if (entries.length >= target) break;

  const browserApp = browserApps[(i - 1) % browserApps.length];
  addEntry(`open ${browserApp.label} on chrome profile ${i}`, 'open_browser_app', {
    app: browserApp.app,
    browser: 'chrome',
  });
  if (entries.length >= target) break;
  addEntry(`launch ${browserApp.label} in chrome ${i}`, 'open_browser_app', {
    app: browserApp.app,
    browser: 'chrome',
  });
  if (entries.length >= target) break;

  addEntry(`play music mix ${i}`, 'play_music', {});
  if (entries.length >= target) break;
  addEntry(`start music now ${i}`, 'play_music', {});
  if (entries.length >= target) break;

  const contact = `contact ${i}`;
  const message = `${shortMessages[(i - 1) % shortMessages.length]} ${i}`;
  addEntry(`send whatsapp message to ${contact} saying ${message}`, 'send_whatsapp_message', {
    contact,
    message,
  });
  if (entries.length >= target) break;
  addEntry(`send message to ${contact} saying ${message}`, 'send_whatsapp_message', {
    contact,
    message,
  });
  if (entries.length >= target) break;

  const email = `user${i}@example.com`;
  addEntry(`send email to ${email} saying ${message}`, 'send_email', {
    to: email,
    message,
  });
  if (entries.length >= target) break;
  addEntry(`send mail to ${email} message ${message}`, 'send_email', {
    to: email,
    message,
  });

  i += 1;
}

const actionCounts = entries.reduce((acc, entry) => {
  acc[entry.action] = (acc[entry.action] ?? 0) + 1;
  return acc;
}, {});

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  total: entries.length,
  actionCounts,
  entries,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(payload), 'utf8');

console.log(`Created command catalog with ${entries.length} commands at ${outputPath}`);
