import { Resend } from "resend";
import { accessMail, keyMail, type Mail } from "./mail-template";

const FROM = process.env.HACK0_MAIL_FROM ?? "hack0 <workshops@updates.hack0.dev>";

async function send(apiKey: string, to: string, mail: Mail): Promise<boolean> {
  const { error } = await new Resend(apiKey).emails.send({ from: FROM, to, ...mail });
  return !error;
}

export async function sendKey(email: string, key: string, workshop: string | null): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Local development has no Resend key; print the key so the flow can be tested.
    if (process.env.NODE_ENV !== "production") console.info(`[hack0] key for ${email}: ${key}`);
    return false;
  }
  return send(apiKey, email, keyMail({ email, key, workshop }));
}

export async function sendAccessAdded(email: string, workshop: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  return send(apiKey, email, accessMail(workshop));
}
