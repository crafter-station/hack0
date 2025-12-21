"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { db } from "@/lib/db";
import {
	eventHosts,
	events,
	hostClaims,
	lumaHostMappings,
} from "@/lib/db/schema";
import { getGlobalLumaClient } from "@/lib/luma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

async function findHostEmailFromGuests(
	lumaHostApiId: string,
): Promise<string | null> {
	try {
		const client = getGlobalLumaClient();
		const hostEvents = await db.query.eventHosts.findMany({
			where: eq(eventHosts.lumaHostApiId, lumaHostApiId),
			columns: { eventId: true },
		});

		for (const { eventId } of hostEvents.slice(0, 3)) {
			const event = await db.query.events.findFirst({
				where: eq(events.id, eventId),
				columns: { sourceLumaEventId: true },
			});

			if (!event?.sourceLumaEventId) continue;

			try {
				const guests = await client.getEventGuests(event.sourceLumaEventId);
				const matchingGuest = guests.guests.find(
					(g) => g.api_id === lumaHostApiId,
				);
				if (matchingGuest?.email) {
					return matchingGuest.email;
				}
			} catch {
				continue;
			}
		}
	} catch {
		return null;
	}
	return null;
}

export async function getClaimableHosts(eventId: string) {
	const { userId } = await auth();
	if (!userId) return [];

	const hosts = await db.query.eventHosts.findMany({
		where: eq(eventHosts.eventId, eventId),
	});

	const claimableHosts = [];

	for (const host of hosts) {
		const mapping = await db.query.lumaHostMappings.findFirst({
			where: eq(lumaHostMappings.lumaHostApiId, host.lumaHostApiId),
		});

		if (!mapping?.clerkUserId) {
			claimableHosts.push({
				...host,
				alreadyClaimed: !!mapping?.isVerified,
			});
		}
	}

	return claimableHosts;
}

export async function initiateHostClaim(
	lumaHostApiId: string,
	hostEmail?: string,
) {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const clerk = await clerkClient();
	const user = await clerk.users.getUser(userId);
	const userEmail = user.emailAddresses[0]?.emailAddress;

	if (!userEmail) {
		return { success: false, error: "No tienes email verificado en tu cuenta" };
	}

	const existingMapping = await db.query.lumaHostMappings.findFirst({
		where: eq(lumaHostMappings.lumaHostApiId, lumaHostApiId),
	});

	if (existingMapping?.clerkUserId) {
		return { success: false, error: "Este perfil ya fue reclamado" };
	}

	const existingClaim = await db.query.hostClaims.findFirst({
		where: and(
			eq(hostClaims.lumaHostApiId, lumaHostApiId),
			eq(hostClaims.claimedByUserId, userId),
			eq(hostClaims.status, "pending"),
		),
	});

	if (existingClaim) {
		return { success: false, error: "Ya tienes una solicitud pendiente" };
	}

	let targetEmail = existingMapping?.lumaHostEmail || hostEmail;

	if (!targetEmail) {
		targetEmail = await findHostEmailFromGuests(lumaHostApiId);
	}

	const token = nanoid(32);
	const requiresManualReview = !targetEmail;

	if (requiresManualReview) {
		await db.insert(hostClaims).values({
			lumaHostApiId,
			organizationId: existingMapping?.organizationId || null!,
			claimedByUserId: userId,
			verificationMethod: "manual",
			verificationToken: token,
			verificationEmail: userEmail,
			status: "pending",
		});

		return {
			success: true,
			requiresReview: true,
			message:
				"Solicitud enviada. Un administrador revisará tu solicitud manualmente.",
		};
	}

	const emailsMatch =
		targetEmail.toLowerCase() === userEmail.toLowerCase();

	if (!emailsMatch) {
		await db.insert(hostClaims).values({
			lumaHostApiId,
			organizationId: existingMapping?.organizationId || null!,
			claimedByUserId: userId,
			verificationMethod: "email",
			verificationToken: token,
			verificationEmail: targetEmail,
			status: "pending",
		});

		const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-host?token=${token}`;

		await resend.emails.send({
			from: "Hack0 <noreply@hack0.dev>",
			to: targetEmail,
			subject: "Alguien quiere reclamar tu perfil de host en Hack0",
			html: `
				<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
					<h1 style="font-size: 24px; color: #111;">Verificación de perfil de host</h1>
					<p>El usuario <strong>${userEmail}</strong> está intentando vincular tu perfil de host de Luma a su cuenta de Hack0.</p>
					<p>Si eres tú, haz clic en el botón:</p>
					<a href="${verifyUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
						Sí, soy yo - Verificar
					</a>
					<p style="color: #666; font-size: 14px;">
						Si no reconoces esta solicitud, ignora este email.
					</p>
				</div>
			`,
		});

		return {
			success: true,
			message: `Email de verificación enviado a ${targetEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")}`,
		};
	}

	await db.insert(hostClaims).values({
		lumaHostApiId,
		organizationId: existingMapping?.organizationId || null!,
		claimedByUserId: userId,
		verificationMethod: "email",
		verificationToken: token,
		verificationEmail: userEmail,
		status: "pending",
	});

	const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-host?token=${token}`;

	await resend.emails.send({
		from: "Hack0 <noreply@hack0.dev>",
		to: userEmail,
		subject: "Verifica tu perfil de host en Hack0",
		html: `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="font-size: 24px; color: #111;">Verifica tu perfil de host</h1>
				<p>Haz clic en el botón para confirmar que eres el host de eventos en Luma:</p>
				<a href="${verifyUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
					Verificar perfil
				</a>
				<p style="color: #666; font-size: 14px;">
					Si no solicitaste esto, puedes ignorar este email.
				</p>
			</div>
		`,
	});

	return { success: true, message: "Email de verificación enviado" };
}

export async function verifyHostClaim(token: string) {
	const claim = await db.query.hostClaims.findFirst({
		where: and(
			eq(hostClaims.verificationToken, token),
			eq(hostClaims.status, "pending"),
		),
	});

	if (!claim) {
		return { success: false, error: "Token inválido o expirado" };
	}

	await db
		.update(hostClaims)
		.set({
			status: "verified",
			verifiedAt: new Date(),
		})
		.where(eq(hostClaims.id, claim.id));

	const existingMapping = await db.query.lumaHostMappings.findFirst({
		where: eq(lumaHostMappings.lumaHostApiId, claim.lumaHostApiId),
	});

	if (existingMapping) {
		await db
			.update(lumaHostMappings)
			.set({
				clerkUserId: claim.claimedByUserId,
				matchSource: "claim",
				confidence: 100,
				isVerified: true,
				updatedAt: new Date(),
			})
			.where(eq(lumaHostMappings.id, existingMapping.id));
	} else {
		await db.insert(lumaHostMappings).values({
			lumaHostApiId: claim.lumaHostApiId,
			clerkUserId: claim.claimedByUserId,
			matchSource: "claim",
			confidence: 100,
			isVerified: true,
		});
	}

	const clerk = await clerkClient();
	await clerk.users.updateUserMetadata(claim.claimedByUserId, {
		publicMetadata: {
			lumaHostId: claim.lumaHostApiId,
			isLumaHost: true,
		},
	});

	revalidatePath("/");

	return { success: true, message: "Perfil verificado exitosamente" };
}

export async function checkUserIsHost(lumaHostApiId: string) {
	const { userId } = await auth();
	if (!userId) return false;

	const mapping = await db.query.lumaHostMappings.findFirst({
		where: and(
			eq(lumaHostMappings.lumaHostApiId, lumaHostApiId),
			eq(lumaHostMappings.clerkUserId, userId),
		),
	});

	return !!mapping?.isVerified;
}
