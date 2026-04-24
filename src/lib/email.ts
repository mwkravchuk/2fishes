import { Resend } from "resend";

export const EMAIL_FROM = process.env.EMAIL_FROM;
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO;
export const INTERNAL_ORDER_EMAIL = process.env.INTERNAL_ORDER_EMAIL;

export function hasEmailConfig() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}
