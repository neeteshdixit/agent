import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const canSendSms = Boolean(env.fast2SmsApiKey);
const forceMockSms = env.devOtpMode;

const normalizePhone = (phone) => phone.replace(/[^\d+]/g, '');

const sendSmsOrLog = async ({ to, message }) => {
  if (forceMockSms || !canSendSms) {
    console.log(`[SMS Mock] To: ${to}`);
    console.log(`[SMS Mock] Message: ${message}`);
    return;
  }

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      Authorization: env.fast2SmsApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: env.fast2SmsRoute,
      sender_id: env.fast2SmsSenderId || undefined,
      message,
      language: 'english',
      flash: 0,
      numbers: normalizePhone(to),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AppError(`SMS delivery failed (${response.status}): ${errorText}`, 502);
  }
};

export const smsService = {
  sendOtp: async ({ phone, otp, expiresInMinutes }) => {
    await sendSmsOrLog({
      to: phone,
      message: `Your verification OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    });
  },
};
