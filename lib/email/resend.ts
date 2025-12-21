import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
	console.warn("RESEND_API_KEY is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = "Hack0 <noreply@updates.hack0.dev>";
