import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { EMAIL_FROM, resend } from "@/lib/email/resend";
import { WelcomeEmail } from "@/lib/email/templates/welcome";

const getAppUrl = () => {
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL;
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}
	return "https://hack0.dev";
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email } = body;

		if (!email || typeof email !== "string") {
			return NextResponse.json(
				{ error: "Email es requerido" },
				{ status: 400 },
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: "Email inválido" }, { status: 400 });
		}

		// Check if already subscribed
		const existing = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.email, email.toLowerCase()))
			.limit(1);

		if (existing.length > 0) {
			const sub = existing[0];

			if (sub.isVerified && sub.isActive) {
				return NextResponse.json({
					message: "Ya estás suscrito",
					alreadySubscribed: true,
				});
			}

			// If not verified, resend verification email
			if (!sub.isVerified) {
				const verificationToken = nanoid(32);

				await db
					.update(subscriptions)
					.set({ verificationToken })
					.where(eq(subscriptions.id, sub.id));

				const confirmUrl = `${getAppUrl()}/api/verify?token=${verificationToken}`;

				await resend.emails.send({
					from: EMAIL_FROM,
					to: email.toLowerCase(),
					subject: "Confirma tu suscripción a hack0.dev",
					react: WelcomeEmail({ confirmUrl }),
				});

				return NextResponse.json({
					message: "Te enviamos un nuevo email de confirmación",
				});
			}

			// Reactivate if was unsubscribed
			if (!sub.isActive) {
				const verificationToken = nanoid(32);

				await db
					.update(subscriptions)
					.set({
						verificationToken,
						isVerified: false,
					})
					.where(eq(subscriptions.id, sub.id));

				const confirmUrl = `${getAppUrl()}/api/verify?token=${verificationToken}`;

				await resend.emails.send({
					from: EMAIL_FROM,
					to: email.toLowerCase(),
					subject: "Confirma tu suscripción a hack0.dev",
					react: WelcomeEmail({ confirmUrl }),
				});

				return NextResponse.json({
					message: "Revisa tu email para confirmar la suscripción",
				});
			}
		}

		// Create new subscription
		const verificationToken = nanoid(32);
		const unsubscribeToken = nanoid(32);

		await db.insert(subscriptions).values({
			email: email.toLowerCase(),
			verificationToken,
			unsubscribeToken,
			isVerified: false,
			isActive: true,
		});

		const confirmUrl = `${getAppUrl()}/api/verify?token=${verificationToken}`;

		await resend.emails.send({
			from: EMAIL_FROM,
			to: email.toLowerCase(),
			subject: "Confirma tu suscripción a hack0.dev",
			react: WelcomeEmail({ confirmUrl }),
		});

		return NextResponse.json({
			message: "Revisa tu email para confirmar la suscripción",
		});
	} catch (error) {
		console.error("Subscribe error:", error);
		return NextResponse.json(
			{ error: "Error al procesar la suscripción" },
			{ status: 500 },
		);
	}
}
