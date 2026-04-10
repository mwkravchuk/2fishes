import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = "2fishes Coffee <onboarding@resend.dev>";
export const EMAIL_REPLY_TO = "mwkravchuk@gmail.com";
export const INTERNAL_ORDER_EMAIL = "mwkravchuk@gmail.com";