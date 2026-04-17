import { Resend } from "resend";

export const EMAIL_FROM = "2fishes Coffee <onboarding@resend.dev>";
export const EMAIL_REPLY_TO = "mwkravchuk@gmail.com";
export const INTERNAL_ORDER_EMAIL = "mwkravchuk@gmail.com";

export function hasEmailConfig() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}
