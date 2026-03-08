import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import puppeteer from 'puppeteer-core';

const DEFAULT_TIMEOUT = 25000;

const resolveChromePath = async () => {
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  return null;
};

const launchChrome = async () => {
  const executablePath = await resolveChromePath();
  if (!executablePath) {
    throw new Error('Google Chrome is not installed on this computer.');
  }

  const browser = await puppeteer.launch({
    headless: false,
    executablePath,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  return browser;
};

const runBrowserTask = async (stepsRunner) => {
  const browser = await launchChrome();
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT);
    const outcome = await stepsRunner(page);
    return {
      status: 'completed',
      result: outcome,
    };
  } finally {
    // Keep browser open for user interaction after automation.
    await browser.disconnect();
  }
};

export const browserAutomationService = {
  openWhatsAppWeb: async () =>
    runBrowserTask(async (page) => {
      await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded' });
      return { message: 'Opened WhatsApp Web in Chrome.' };
    }),

  openYouTube: async () =>
    runBrowserTask(async (page) => {
      await page.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded' });
      return { message: 'Opened YouTube in Chrome.' };
    }),

  openGmail: async () =>
    runBrowserTask(async (page) => {
      await page.goto('https://mail.google.com', { waitUntil: 'domcontentloaded' });
      return { message: 'Opened Gmail in Chrome.' };
    }),

  googleSearch: async ({ query }) =>
    runBrowserTask(async (page) => {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
      return { message: `Opened Google search for "${query}".`, query };
    }),

  youtubeSearch: async ({ query }) =>
    runBrowserTask(async (page) => {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
      return { message: `Opened YouTube results for "${query}".`, query };
    }),

  playYouTubeFirstResult: async ({ query }) =>
    runBrowserTask(async (page) => {
      await page.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[name="search_query"]', { timeout: DEFAULT_TIMEOUT });
      await page.type('input[name="search_query"]', query, { delay: 30 });
      await page.keyboard.press('Enter');
      await page.waitForSelector('ytd-video-renderer a#thumbnail', { timeout: DEFAULT_TIMEOUT });
      await page.click('ytd-video-renderer a#thumbnail');
      return { message: `Playing first YouTube result for "${query}".`, query };
    }),
};
