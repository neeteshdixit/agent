import nodemailer from 'nodemailer';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { env } from '../config/env.js';

const hasSmtpConfig = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
const execFile = promisify(execFileCallback);

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }

  return transporter;
};

const quotePowerShellString = (value) => `'${String(value).replace(/'/g, "''")}'`;

const runPowerShellScript = async (script) => {
  return execFile(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    {
      windowsHide: true,
      timeout: 45000,
      maxBuffer: 1024 * 1024,
    },
  );
};

export const messagingAutomationService = {
  sendMail: async ({ to, subject, body }) => {
    if (!hasSmtpConfig) {
      return {
        status: 'blocked',
        result: {
          message:
            'SMTP configuration is missing. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env.',
        },
      };
    }

    const mailer = getTransporter();
    await mailer.sendMail({
      from: env.mailFrom,
      to,
      subject: subject || 'Message from AI Assistant',
      text: body || 'Hello',
    });

    return {
      status: 'completed',
      result: {
        message: `Email sent successfully to ${to}`,
      },
    };
  },

  sendWhatsAppDesktopMessage: async ({ contact, message }) => {
    const normalizeContactKey = (value) =>
      String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, ' ')
        .trim();
    const canonicalContactKey = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/gi, '');

    const toDigits = (value) => String(value).replace(/\D/g, '');

    const extractPhoneNumber = (value) => {
      const digits = toDigits(value);
      return digits.length >= 10 ? digits : '';
    };

    const resolvePhoneNumber = (contactName) => {
      const direct = extractPhoneNumber(contactName);
      if (direct) {
        return direct;
      }

      const key = normalizeContactKey(contactName);
      const canonicalKey = canonicalContactKey(contactName);

      const mappedRaw =
        env.whatsappContacts?.[key] ??
        env.whatsappContacts?.[contactName] ??
        env.whatsappContacts?.[contactName.toLowerCase()] ??
        env.whatsappContacts?.[canonicalKey];

      if (mappedRaw) {
        return extractPhoneNumber(mappedRaw);
      }

      const entries = Object.entries(env.whatsappContacts ?? {});
      const fuzzyMatch = entries.find(
        ([savedKey]) => canonicalContactKey(savedKey) === canonicalKey,
      )?.[1];

      if (fuzzyMatch) {
        return extractPhoneNumber(fuzzyMatch);
      }

      return '';
    };

    const phoneNumber = resolvePhoneNumber(contact);
    if (!phoneNumber) {
      return {
        status: 'blocked',
        result: {
          message:
            'Reliable WhatsApp Desktop send requires a phone number. Use: send whatsapp message to +9198... saying hello OR set WHATSAPP_CONTACTS_JSON in backend/.env.',
        },
      };
    }

    const whatsappUri = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    const script = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$wshell = New-Object -ComObject WScript.Shell

function Activate-WhatsAppWindow([int]$timeoutSeconds = 12) {
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $timeoutSeconds) {
    $ok = $wshell.AppActivate('WhatsApp')
    if (-not $ok) {
      $ok = $wshell.AppActivate('WhatsApp Beta')
    }
    if ($ok) {
      Start-Sleep -Milliseconds 350
      return $true
    }
    Start-Sleep -Milliseconds 450
  }
  return $false
}

Start-Process ${quotePowerShellString(whatsappUri)}

Start-Sleep -Seconds 4
$activated = Activate-WhatsAppWindow
if (-not $activated) {
  throw 'WhatsApp window not found. Open WhatsApp Desktop and keep it visible, then retry.'
}

[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Start-Sleep -Milliseconds 300
Write-Output 'OK:phone_deeplink'
`;

    try {
      const output = await runPowerShellScript(script);
      const method = output?.stdout?.toString()?.trim().replace(/^OK:/, '') || 'unknown';
      return {
        status: 'completed',
        result: {
          message: `WhatsApp message sent successfully to "${contact}" (${phoneNumber}).`,
          method,
        },
      };
    } catch (error) {
      const reason = error?.stderr?.toString()?.trim() || error?.message || 'Desktop automation failed.';
      return {
        status: 'failed',
        result: {
          message: `WhatsApp Desktop automation failed: ${reason}`,
        },
      };
    }
  },
};
