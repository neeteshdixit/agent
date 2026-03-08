import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const canSendEmail = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const transporter = canSendEmail
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    })
  : null;

const sendMailOrLog = async ({ to, subject, html }) => {
  if (!canSendEmail || !transporter) {
    console.log(`[Email Mock] To: ${to}`);
    console.log(`[Email Mock] Subject: ${subject}`);
    console.log(`[Email Mock] Body: ${html}`);
    return;
  }

  await transporter.sendMail({
    from: env.mailFrom,
    to,
    subject,
    html,
  });
};

export const emailService = {
  sendOtp: async ({ email, otp }) => {
    await sendMailOrLog({
      to: email,
      subject: 'Your AI Assistant OTP Code',
      html: `<p>Your OTP code is <b>${otp}</b>.</p><p>This code expires in 10 minutes.</p>`,
    });
  },

  sendPasswordReset: async ({ email, resetUrl }) => {
    await sendMailOrLog({
      to: email,
      subject: 'Reset your AI Assistant password',
      html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    });
  },

  sendEmail: async ({ to, subject, body }) => {
    await sendMailOrLog({
      to,
      subject,
      html: `<p>${body}</p>`,
    });
  },
};
