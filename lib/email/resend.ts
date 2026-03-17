import { Resend } from "resend";

export const EMAIL_FROM = "Hack0 <noreply@updates.hack0.dev>";

let _resend: Resend | undefined;
function getResend(): Resend {
	if (!_resend) {
		if (!process.env.RESEND_API_KEY) console.warn("RESEND_API_KEY is not set");
		_resend = new Resend(process.env.RESEND_API_KEY);
	}
	return _resend;
}

export const resend: Resend = new Proxy({} as Resend, {
	get(_, prop: string | symbol) {
		return getResend()[prop as keyof Resend];
	},
});
