import fs from 'node:fs/promises';
import path from 'node:path';
import open from 'open';
import { env } from '../config/env.js';
import { emailService } from './email.service.js';
import { localAutomationService } from './localAutomation.service.js';
import { browserAutomationService } from './browserAutomation.service.js';

const sanitizeFilename = (value) => value.replace(/[^a-z0-9-_]/gi, '-').slice(0, 50);

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
        if (!args.to) {
          return {
            ...withStep('blocked', { message: 'Missing recipient email. Include "to" in the command.' }),
          };
        }

        progress.push('Sending email through configured SMTP provider');
        await emailService.sendEmail({
          to: args.to,
          subject: args.subject ?? 'Message from AI Assistant',
          body: args.body ?? 'Sent via task runner.',
        });

        return {
          ...withStep('completed', { message: `Email sent to ${args.to}.` }),
        };
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
