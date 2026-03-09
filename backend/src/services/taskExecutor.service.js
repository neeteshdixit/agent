import fs from 'node:fs/promises';
import path from 'node:path';
import open from 'open';
import { env } from '../config/env.js';
import { localAutomationService } from './localAutomation.service.js';
import { browserAutomationService } from './browserAutomation.service.js';
import { messagingAutomationService } from './messagingAutomation.service.js';

const sanitizeFilename = (value) => value.replace(/[^a-z0-9-_]/gi, '-').slice(0, 50);
const normalizeBrowser = (value) => String(value ?? '').toLowerCase().trim();

const normalizeBrowserApp = (value) => {
  const lower = String(value ?? '').toLowerCase();
  if (lower.includes('whatsapp')) return 'whatsapp_web';
  if (lower.includes('youtube')) return 'youtube';
  if (lower.includes('gmail') || lower === 'mail') return 'gmail';
  return '';
};

export const taskExecutorService = {
  execute: async ({ action, args = {}, command }) => {
    const progress = ['Parsing instruction', `Detected action: ${action}`, 'Executing task'];
    const safeExecute = async (runner, fallbackMessage) => {
      try {
        return await runner();
      } catch (error) {
        return {
          status: 'failed',
          result: {
            message: error?.message || fallbackMessage,
          },
        };
      }
    };

    const withStep = (status, result) => {
      if (status === 'completed') {
        progress.push('Task completed');
      } else if (status === 'failed') {
        progress.push('Task failed');
      } else {
        progress.push('Task blocked');
      }

      return { status, progress, result };
    };

    switch (action) {
      case 'open_local_app': {
        const app = String(args.app ?? '').trim();
        if (!app) {
          return withStep('blocked', {
            message: 'App name is required. Example: open whatsapp installed in my pc',
          });
        }

        progress.push(`Trying to open installed app: ${app}`);
        const execution = await safeExecute(
          () => localAutomationService.openKnownApp({ appName: app }),
          'Unable to open the requested local application.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'open_browser_app': {
        const app = String(args.app ?? '').trim();
        const browser = String(args.browser ?? '').trim();

        if (!app || !browser) {
          return withStep('blocked', {
            message:
              'Both app and browser are required. Example: {"action":"open_browser_app","app":"whatsapp_web","browser":"chrome"}',
          });
        }

        if (normalizeBrowser(browser) !== 'chrome') {
          return withStep('blocked', {
            message: `Browser "${browser}" is not supported. Use "chrome".`,
          });
        }

        const webApp = normalizeBrowserApp(app);
        if (!webApp) {
          return withStep('blocked', {
            message: `Browser app "${app}" is not supported. Try whatsapp_web, youtube, or gmail.`,
          });
        }

        progress.push('Launching Chrome');

        if (webApp === 'whatsapp_web') {
          progress.push('Navigating to web.whatsapp.com');
          const execution = await safeExecute(
            () => browserAutomationService.openWhatsAppWeb(),
            'Failed to open WhatsApp Web in Chrome.',
          );
          return withStep(execution.status, execution.result);
        }

        if (webApp === 'youtube') {
          progress.push('Navigating to youtube.com');
          const execution = await safeExecute(
            () => browserAutomationService.openYouTube(),
            'Failed to open YouTube in Chrome.',
          );
          return withStep(execution.status, execution.result);
        }

        progress.push('Navigating to mail.google.com');
        const execution = await safeExecute(
          () => browserAutomationService.openGmail(),
          'Failed to open Gmail in Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'youtube_play': {
        const query = String(args.query ?? '').trim();
        const browser = String(args.browser ?? '').trim();

        if (!query || !browser) {
          return withStep('blocked', {
            message:
              'Both query and browser are required. Example: {"action":"youtube_play","query":"shape of you","browser":"chrome"}',
          });
        }

        if (normalizeBrowser(browser) !== 'chrome') {
          return withStep('blocked', {
            message: `Browser "${browser}" is not supported. Use "chrome".`,
          });
        }

        const isPlaylistOrChannelRequest =
          /\bplaylist\b/i.test(query) || /\byoutuber\b/i.test(query) || /\bchannel\b/i.test(query);

        progress.push('Launching Chrome');
        progress.push('Opening YouTube');
        progress.push(`Searching "${query}"`);

        if (isPlaylistOrChannelRequest) {
          progress.push('Showing playlist results');
          const execution = await safeExecute(
            () =>
              browserAutomationService.youtubeSearch({
                query,
              }),
            'Failed to open YouTube playlist results in Chrome.',
          );
          return withStep(execution.status, execution.result);
        }

        progress.push('Playing first result');
        const execution = await safeExecute(
          () =>
            browserAutomationService.playYouTubeFirstResult({
              query,
            }),
          'Failed to play YouTube video in Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'search_web': {
        const query = String(args.query ?? '').trim();
        if (!query) {
          return withStep('blocked', {
            message: 'Query is required. Example: {"action":"search_web","query":"latest ai news"}',
          });
        }

        progress.push('Launching Chrome');
        progress.push(`Searching Google for "${query}"`);
        const execution = await safeExecute(
          () =>
            browserAutomationService.googleSearch({
              query,
            }),
          'Failed to perform Google search in Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'open_folder': {
        const folder = String(args.folder ?? '').trim();
        if (!folder) {
          return withStep('blocked', {
            message: 'Folder name is required. Example: {"action":"open_folder","folder":"downloads"}',
          });
        }

        progress.push(`Opening ${folder} folder`);
        const execution = await safeExecute(
          () => localAutomationService.openKnownFolder({ folder }),
          `Unable to open ${folder} folder.`,
        );
        return withStep(execution.status, execution.result);
      }

      case 'open_whatsapp': {
        progress.push('Trying to open installed WhatsApp');
        const execution = await safeExecute(
          () => localAutomationService.openKnownApp({ appName: 'whatsapp' }),
          'Unable to open WhatsApp.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'open_word': {
        progress.push('Trying to open Microsoft Word');
        const execution = await safeExecute(
          () => localAutomationService.openKnownApp({ appName: 'word' }),
          'Unable to open Microsoft Word.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'open_chrome': {
        progress.push('Trying to open Google Chrome');
        const execution = await safeExecute(
          () => localAutomationService.openKnownApp({ appName: 'chrome' }),
          'Unable to open Google Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'browser_open_whatsapp_web': {
        progress.push('Launching Chrome');
        progress.push('Navigating to web.whatsapp.com');
        const execution = await safeExecute(
          () => browserAutomationService.openWhatsAppWeb(),
          'Failed to open WhatsApp Web in Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'browser_open_youtube': {
        progress.push('Launching Chrome');
        progress.push('Navigating to youtube.com');
        const execution = await safeExecute(
          () => browserAutomationService.openYouTube(),
          'Failed to open YouTube in Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'browser_open_gmail': {
        progress.push('Launching Chrome');
        progress.push('Navigating to mail.google.com');
        const execution = await safeExecute(
          () => browserAutomationService.openGmail(),
          'Failed to open Gmail in Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'browser_google_search': {
        progress.push('Launching Chrome');
        progress.push(`Searching Google for "${args.query ?? command}"`);
        const execution = await safeExecute(
          () =>
            browserAutomationService.googleSearch({
              query: args.query ?? command,
            }),
          'Failed to perform Google search in Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'browser_search_youtube': {
        progress.push('Launching Chrome');
        progress.push(`Searching YouTube for "${args.query ?? command}"`);
        const execution = await safeExecute(
          () =>
            browserAutomationService.youtubeSearch({
              query: args.query ?? command,
            }),
          'Failed to search YouTube in Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'browser_play_youtube': {
        progress.push('Launching Chrome');
        progress.push('Opening YouTube');
        progress.push(`Searching "${args.query ?? command}"`);
        progress.push('Playing first result');
        const execution = await safeExecute(
          () =>
            browserAutomationService.playYouTubeFirstResult({
              query: args.query ?? command,
            }),
          'Failed to play YouTube video in Chrome.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'send_whatsapp_web_message': {
        if (!args.contact) {
          return withStep('blocked', {
            message: 'Contact name is required. Use: send whatsapp message to <contact> ...',
          });
        }
        if (!args.message) {
          return withStep('blocked', {
            message:
              'Message text is required for WhatsApp automation. Example: send whatsapp message to HR maam saying hello',
          });
        }

        progress.push('Launching Chrome');
        progress.push('Opening WhatsApp Web');
        progress.push(`Searching contact: ${args.contact}`);
        progress.push('Sending message');

        const execution = await safeExecute(
          () =>
            browserAutomationService.sendWhatsAppWebMessage({
              contact: args.contact,
              message: args.message,
            }),
          'Failed to send WhatsApp Web message.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'open_folder_downloads': {
        progress.push('Opening Downloads folder');
        const execution = await safeExecute(
          () => localAutomationService.openDownloadsFolder(),
          'Unable to open Downloads folder.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'play_music': {
        progress.push('Trying to open local music player');
        const execution = await safeExecute(
          () => localAutomationService.playMusic({ songPath: args.songPath }),
          'Unable to open a music player.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'open_app': {
        progress.push(`Trying to open installed app: ${args.appName}`);
        const execution = await safeExecute(
          () => localAutomationService.openKnownApp({ appName: args.appName ?? '' }),
          'Unable to open the requested local application.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'send_whatsapp_message': {
        if (!args.contact) {
          return withStep('blocked', {
            message: 'Contact name is required. Use: send whatsapp message to <contact> ...',
          });
        }
        if (!args.message) {
          return withStep('blocked', {
            message:
              'Message text is required for WhatsApp automation. Example: send whatsapp message to HR maam saying hello',
          });
        }

        const browser = normalizeBrowser(args.browser);
        if (browser && browser !== 'chrome') {
          return withStep('blocked', {
            message: `Browser "${args.browser}" is not supported for WhatsApp messaging. Use "chrome".`,
          });
        }

        if (browser === 'chrome') {
          progress.push('Launching Chrome');
          progress.push('Opening WhatsApp Web');
          progress.push(`Searching contact: ${args.contact}`);
          progress.push('Sending message');
          const execution = await safeExecute(
            () =>
              browserAutomationService.sendWhatsAppWebMessage({
                contact: args.contact,
                message: args.message,
              }),
            'Failed to send WhatsApp Web message.',
          );
          return withStep(execution.status, execution.result);
        }

        progress.push('Opening WhatsApp Desktop');
        progress.push(`Searching contact: ${args.contact}`);
        progress.push('Sending message');
        const execution = await safeExecute(
          () =>
            messagingAutomationService.sendWhatsAppDesktopMessage({
              contact: args.contact,
              message: args.message,
            }),
          'Failed to send WhatsApp Desktop message.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'compose_email': {
        const body = args.body ?? command;
        const subject = args.subject ?? 'Draft from AI Assistant';
        const mailToUrl = `mailto:${encodeURIComponent(args.to ?? '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        progress.push('Opening default mail client with draft content');
        await open(mailToUrl);

        return {
          ...withStep('completed', { message: 'Mail draft opened in your default mail client.' }),
        };
      }

      case 'create_document': {
        const title = sanitizeFilename(args.title ?? 'document');
        const documentPath = path.join(env.agentArtifactsDir, `${title}-${Date.now()}.txt`);
        progress.push('Creating local document artifact');
        await fs.mkdir(env.agentArtifactsDir, { recursive: true });
        await fs.writeFile(
          documentPath,
          `Generated by AI Assistant\n\nCommand: ${command}\n\nCreated at: ${new Date().toISOString()}`,
          'utf8',
        );

        return {
          ...withStep('completed', { message: 'Document created successfully.', path: documentPath }),
        };
      }

      case 'send_email': {
        const to = String(args.to ?? '').trim();
        const message = String(args.message ?? '').trim();
        if (!to) {
          return withStep('blocked', {
            message: 'Recipient email is required. Include "to" in the command.',
          });
        }
        if (!message) {
          return withStep('blocked', {
            message: 'Email message is required. Include "message" in the command.',
          });
        }

        progress.push('Preparing email payload');
        progress.push('Sending email with SMTP automation');
        const execution = await safeExecute(
          () =>
            messagingAutomationService.sendMail({
              to,
              subject: args.subject ?? 'Message from AI Assistant',
              body: message,
            }),
          'Failed to send email using SMTP automation.',
        );

        return withStep(execution.status, execution.result);
      }

      case 'send_mail': {
        if (!args.to) {
          return withStep('blocked', {
            message: 'Recipient email is required. Use: send mail <message> to <email>',
          });
        }
        if (!args.body) {
          return withStep('blocked', {
            message: 'Email message is required.',
          });
        }

        progress.push('Preparing email payload');
        progress.push('Sending email with SMTP automation');
        const execution = await safeExecute(
          () =>
            messagingAutomationService.sendMail({
              to: args.to,
              subject: args.subject ?? 'Message from AI Assistant',
              body: args.body,
            }),
          'Failed to send email using SMTP automation.',
        );
        return withStep(execution.status, execution.result);
      }

      case 'chat_only':
      default:
        return {
          ...withStep('blocked', {
            message:
              'This instruction does not map to an executable local task. It was handled as a normal chat instruction.',
          }),
        };
    }
  },
};
