import { Resend } from "resend";

export type EmailConfig = {
  resendApiKey: string;
  from: string;
  replyTo?: string;
  internalOrderEmail: string;
};

export function getMissingEmailConfigKeys() {
  return ["RESEND_API_KEY", "EMAIL_FROM", "INTERNAL_ORDER_EMAIL"].filter(
    (key) => !process.env[key]
  );
}

export function getEmailConfig(): EmailConfig | null {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const internalOrderEmail = process.env.INTERNAL_ORDER_EMAIL;

  if (!resendApiKey || !from || !internalOrderEmail) {
    return null;
  }

  return {
    resendApiKey,
    from,
    replyTo: process.env.EMAIL_REPLY_TO,
    internalOrderEmail,
  };
}

export function getInternalOrderEmail() {
  return process.env.INTERNAL_ORDER_EMAIL ?? null;
}

export function hasEmailConfig() {
  return getEmailConfig() !== null;
}

export function getResendClient(apiKey = process.env.RESEND_API_KEY) {
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}
