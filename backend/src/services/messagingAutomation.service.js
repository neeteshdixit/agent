import path from 'node:path';
import { spawn } from 'node:child_process';
import { env } from '../config/env.js';

const parseJsonSafely = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const runPythonAutomation = (scriptName, payload) =>
  new Promise((resolve, reject) => {
    const scriptPath = path.resolve(env.backendRoot, 'automation', scriptName);
    const child = spawn(env.pythonExecutable, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Python automation timed out'));
    }, env.pythonAutomationTimeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start python process: ${error.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      const parsed = parseJsonSafely(stdout.trim());

      if (code === 0 && parsed?.success) {
        resolve(parsed);
        return;
      }

      const errorMessage =
        parsed?.error ||
        stderr.trim() ||
        stdout.trim() ||
        `Python automation failed with exit code ${code}`;
      reject(new Error(errorMessage));
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });

export const messagingAutomationService = {
  sendMail: async ({ to, subject, body }) => {
    if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
      return {
        status: 'blocked',
        result: {
          message:
            'SMTP configuration is missing. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env.',
        },
      };
    }

    const output = await runPythonAutomation('email_sender.py', {
      smtp: {
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        user: env.smtpUser,
        pass: env.smtpPass,
        from: env.mailFrom,
      },
      to,
      subject,
      body,
    });

    return {
      status: 'completed',
      result: {
        message: output.message ?? `Email sent successfully to ${to}`,
      },
    };
  },

  sendWhatsAppDesktopMessage: async ({ contact, message }) => {
    const output = await runPythonAutomation('whatsapp_desktop_sender.py', {
      contact,
      message,
      startupDelaySeconds: 4,
      stepDelaySeconds: 0.6,
    });

    return {
      status: 'completed',
      result: {
        message: output.message ?? `Message sent successfully to "${contact}"`,
      },
    };
  },
};
