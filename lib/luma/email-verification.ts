import crypto from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db";
import { emailVerifications, users } from "../db/schema";
import { EMAIL_FROM, resend } from "../email/resend";

const VERIFICATION_EXPIRY_HOURS = 24;

function generateToken(): string {
	return crypto.randomBytes(32).toString("hex");
}

export async function initiateEmailVerification(
	userId: string,
	lumaEmail: string,
): Promise<{ success: boolean; error?: string }> {
	const existingPending = await db.query.emailVerifications.findFirst({
		where: and(
			eq(emailVerifications.userId, userId),
			eq(emailVerifications.purpose, "luma_connect"),
			gt(emailVerifications.expiresAt, new Date()),
		),
	});

	if (existingPending && !existingPending.verifiedAt) {
		await db
			.delete(emailVerifications)
			.where(eq(emailVerifications.id, existingPending.id));
	}

	const token = generateToken();
	const expiresAt = new Date(
		Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
	);

	await db.insert(emailVerifications).values({
		userId,
		email: lumaEmail,
		purpose: "luma_connect",
		token,
		expiresAt,
	});

	const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://hack0.dev"}/api/users/verify-luma?token=${token}`;

	try {
		await resend.emails.send({
			from: EMAIL_FROM,
			to: lumaEmail,
			subject: "Verifica tu cuenta de Luma en Hack0",
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 16px; color: #111;">Conecta tu cuenta de Luma</h1>

    <p style="color: #444; line-height: 1.6;">
      Alguien ha solicitado conectar esta dirección de correo con una cuenta de Hack0.
      Si fuiste tú, haz clic en el botón de abajo para verificar:
    </p>

    <a href="${verificationUrl}"
       style="display: inline-block; background: #111; color: white; padding: 12px 24px;
              border-radius: 8px; text-decoration: none; font-weight: 500; margin: 24px 0;">
      Verificar email de Luma
    </a>

    <p style="color: #666; font-size: 14px;">
      Este enlace expira en ${VERIFICATION_EXPIRY_HOURS} horas.
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

    <p style="color: #888; font-size: 12px; margin: 0;">
      Si no solicitaste esto, puedes ignorar este email.
    </p>
  </div>
</body>
</html>
      `,
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to send Luma verification email:", error);
		return {
			success: false,
			error: "No se pudo enviar el email de verificación",
		};
	}
}

export async function verifyLumaEmail(
	token: string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
	const verification = await db.query.emailVerifications.findFirst({
		where: and(
			eq(emailVerifications.token, token),
			eq(emailVerifications.purpose, "luma_connect"),
		),
	});

	if (!verification) {
		return { success: false, error: "Token inválido o expirado" };
	}

	if (verification.verifiedAt) {
		return { success: false, error: "Este token ya fue usado" };
	}

	if (verification.expiresAt < new Date()) {
		return { success: false, error: "El token ha expirado" };
	}

	const user = await db.query.users.findFirst({
		where: eq(users.clerkId, verification.userId),
	});

	if (!user) {
		return { success: false, error: "Usuario no encontrado" };
	}

	await db
		.update(users)
		.set({
			lumaEmail: verification.email,
			lumaEmailVerified: true,
			lumaEmailVerifiedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(users.id, user.id));

	await db
		.update(emailVerifications)
		.set({ verifiedAt: new Date() })
		.where(eq(emailVerifications.id, verification.id));

	return { success: true, userId: verification.userId };
}

export async function getUserLumaStatus(clerkUserId: string): Promise<{
	hasLumaEmail: boolean;
	lumaEmail: string | null;
	isVerified: boolean;
	verifiedAt: Date | null;
}> {
	const user = await db.query.users.findFirst({
		where: eq(users.clerkId, clerkUserId),
	});

	if (!user) {
		return {
			hasLumaEmail: false,
			lumaEmail: null,
			isVerified: false,
			verifiedAt: null,
		};
	}

	return {
		hasLumaEmail: !!user.lumaEmail,
		lumaEmail: user.lumaEmail,
		isVerified: user.lumaEmailVerified ?? false,
		verifiedAt: user.lumaEmailVerifiedAt,
	};
}

export async function disconnectLumaEmail(
	clerkUserId: string,
): Promise<{ success: boolean }> {
	const user = await db.query.users.findFirst({
		where: eq(users.clerkId, clerkUserId),
	});

	if (!user) {
		return { success: false };
	}

	await db
		.update(users)
		.set({
			lumaEmail: null,
			lumaEmailVerified: false,
			lumaEmailVerifiedAt: null,
			updatedAt: new Date(),
		})
		.where(eq(users.id, user.id));

	return { success: true };
}
