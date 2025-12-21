"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { db } from "@/lib/db";
import {
	eventHosts,
	events,
	lumaHostMappings,
	organizations,
} from "@/lib/db/schema";
import { createUniqueSlug } from "@/lib/slug-utils";

const resend = new Resend(process.env.RESEND_API_KEY);

export type ClaimType = "personal" | "community";

export async function initiateHostClaim(
	lumaHostApiId: string,
	claimType: ClaimType,
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

	if (claimType === "personal") {
		const hasPersonalOrg = !!(user.publicMetadata as { lumaHostId?: string })?.lumaHostId;
		if (hasPersonalOrg) {
			return {
				success: false,
				error: "Ya tienes un perfil personal. Usa 'comunidad' para reclamar este host.",
			};
		}
	}

	const existingMapping = await db.query.lumaHostMappings.findFirst({
		where: eq(lumaHostMappings.lumaHostApiId, lumaHostApiId),
	});

	if (existingMapping?.clerkUserId) {
		return { success: false, error: "Este perfil ya fue reclamado" };
	}

	if (existingMapping?.verificationToken) {
		return { success: false, error: "Ya hay una verificación en proceso" };
	}

	const token = nanoid(32);
	const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-host?token=${token}`;

	if (existingMapping) {
		await db
			.update(lumaHostMappings)
			.set({
				verificationToken: token,
				verificationEmail: userEmail,
				pendingClaimType: claimType,
				updatedAt: new Date(),
			})
			.where(eq(lumaHostMappings.id, existingMapping.id));
	} else {
		const hostInfo = await db.query.eventHosts.findFirst({
			where: eq(eventHosts.lumaHostApiId, lumaHostApiId),
		});

		await db.insert(lumaHostMappings).values({
			lumaHostApiId,
			lumaHostName: hostInfo?.name,
			lumaHostEmail: hostInfo?.email,
			lumaHostAvatarUrl: hostInfo?.avatarUrl,
			verificationToken: token,
			verificationEmail: userEmail,
			pendingClaimType: claimType,
			isVerified: false,
		});
	}

	const claimTypeLabel = claimType === "personal" ? "personal" : "de comunidad";

	await resend.emails.send({
		from: "Hack0 <noreply@hack0.dev>",
		to: userEmail,
		subject: "Verifica tu perfil de host en Hack0",
		html: `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="font-size: 24px; color: #111;">Verifica tu perfil de host</h1>
				<p>Haz clic en el botón para confirmar tu perfil ${claimTypeLabel} en Hack0:</p>
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
	const mapping = await db.query.lumaHostMappings.findFirst({
		where: eq(lumaHostMappings.verificationToken, token),
	});

	if (!mapping || !mapping.verificationEmail) {
		return { success: false, error: "Token inválido o expirado" };
	}

	const clerk = await clerkClient();
	const users = await clerk.users.getUserList({
		emailAddress: [mapping.verificationEmail],
	});

	if (users.data.length === 0) {
		return { success: false, error: "Usuario no encontrado" };
	}

	const user = users.data[0];
	const userId = user.id;

	const hostInfo = await db.query.eventHosts.findFirst({
		where: eq(eventHosts.lumaHostApiId, mapping.lumaHostApiId),
	});

	const hostName = hostInfo?.name || mapping.lumaHostName || "Host";
	const hostAvatar = hostInfo?.avatarUrl || mapping.lumaHostAvatarUrl;

	const isPersonalClaim = mapping.pendingClaimType === "personal";

	let org: typeof organizations.$inferSelect | null = null;

	if (isPersonalClaim) {
		org = await db.query.organizations.findFirst({
			where: and(
				eq(organizations.ownerUserId, userId),
				eq(organizations.isPersonalOrg, true),
			),
		});

		if (!org) {
			const slug = await createUniqueSlug(hostName);
			const [newOrg] = await db
				.insert(organizations)
				.values({
					name: hostName,
					displayName: hostName,
					slug,
					logoUrl: hostAvatar,
					ownerUserId: userId,
					isPersonalOrg: true,
					isVerified: true,
				})
				.returning();
			org = newOrg;
		} else if (hostAvatar && !org.logoUrl) {
			await db
				.update(organizations)
				.set({ logoUrl: hostAvatar })
				.where(eq(organizations.id, org.id));
		}
	} else {
		const slug = await createUniqueSlug(hostName);
		const [newOrg] = await db
			.insert(organizations)
			.values({
				name: hostName,
				displayName: hostName,
				slug,
				logoUrl: hostAvatar,
				ownerUserId: userId,
				isPersonalOrg: false,
				isVerified: true,
			})
			.returning();
		org = newOrg;
	}

	const hostEventIds = await db.query.eventHosts.findMany({
		where: eq(eventHosts.lumaHostApiId, mapping.lumaHostApiId),
		columns: { eventId: true },
	});

	if (hostEventIds.length > 0) {
		await db
			.update(events)
			.set({ organizationId: org.id })
			.where(
				and(
					inArray(events.id, hostEventIds.map((e) => e.eventId)),
					isNull(events.organizationId),
				),
			);
	}

	await db
		.update(lumaHostMappings)
		.set({
			clerkUserId: userId,
			organizationId: org.id,
			isVerified: true,
			verificationToken: null,
			pendingClaimType: null,
			updatedAt: new Date(),
		})
		.where(eq(lumaHostMappings.id, mapping.id));

	if (isPersonalClaim) {
		await clerk.users.updateUserMetadata(userId, {
			publicMetadata: {
				...((user.publicMetadata as Record<string, unknown>) || {}),
				lumaHostId: mapping.lumaHostApiId,
				isLumaHost: true,
				personalOrgId: org.id,
				personalOrgSlug: org.slug,
			},
		});
	}

	revalidatePath("/");
	revalidatePath(`/c/${org.slug}`);

	return {
		success: true,
		message: isPersonalClaim
			? "Perfil personal verificado exitosamente"
			: "Comunidad creada exitosamente",
		organizationSlug: org.slug,
	};
}

export async function inviteHost(
	lumaHostApiId: string,
	email: string,
	claimType: ClaimType = "community",
) {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "No autenticado" };
	}

	const existingMapping = await db.query.lumaHostMappings.findFirst({
		where: eq(lumaHostMappings.lumaHostApiId, lumaHostApiId),
	});

	if (existingMapping?.clerkUserId) {
		return { success: false, error: "Este host ya tiene cuenta vinculada" };
	}

	const hostInfo = await db.query.eventHosts.findFirst({
		where: eq(eventHosts.lumaHostApiId, lumaHostApiId),
	});

	const hostName = hostInfo?.name || "Host";
	const token = nanoid(32);
	const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-host?token=${token}`;

	if (existingMapping) {
		await db
			.update(lumaHostMappings)
			.set({
				verificationToken: token,
				verificationEmail: email,
				pendingClaimType: claimType,
				updatedAt: new Date(),
			})
			.where(eq(lumaHostMappings.id, existingMapping.id));
	} else {
		await db.insert(lumaHostMappings).values({
			lumaHostApiId,
			lumaHostName: hostName,
			lumaHostEmail: email,
			lumaHostAvatarUrl: hostInfo?.avatarUrl,
			verificationToken: token,
			verificationEmail: email,
			pendingClaimType: claimType,
			isVerified: false,
		});
	}

	await resend.emails.send({
		from: "Hack0 <noreply@hack0.dev>",
		to: email,
		subject: `Te invitamos a vincular tu perfil de ${hostName} en Hack0`,
		html: `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="font-size: 24px; color: #111;">Invitación a Hack0</h1>
				<p>Te invitamos a vincular tu perfil de host <strong>${hostName}</strong> de Luma con tu cuenta de Hack0.</p>
				<p>Esto te permitirá gestionar tus eventos directamente desde Hack0.</p>
				<a href="${verifyUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
					Vincular mi perfil
				</a>
				<p style="color: #666; font-size: 14px;">
					Si no reconoces esta invitación, puedes ignorar este email.
				</p>
			</div>
		`,
	});

	revalidatePath("/god/pending");

	return { success: true, message: `Invitación enviada a ${email}` };
}

export async function getUnclaimedHosts() {
	const hosts = await db.query.eventHosts.findMany({
		columns: {
			lumaHostApiId: true,
			name: true,
			avatarUrl: true,
		},
	});

	const uniqueHosts = new Map<
		string,
		{ lumaHostApiId: string; name: string | null; avatarUrl: string | null }
	>();

	for (const host of hosts) {
		if (!uniqueHosts.has(host.lumaHostApiId)) {
			uniqueHosts.set(host.lumaHostApiId, host);
		}
	}

	const result = [];

	for (const [lumaHostApiId, host] of uniqueHosts) {
		const mapping = await db.query.lumaHostMappings.findFirst({
			where: eq(lumaHostMappings.lumaHostApiId, lumaHostApiId),
		});

		if (!mapping?.clerkUserId) {
			const eventCount = await db.query.eventHosts.findMany({
				where: eq(eventHosts.lumaHostApiId, lumaHostApiId),
				columns: { eventId: true },
			});

			result.push({
				...host,
				eventCount: eventCount.length,
				pendingInviteEmail: mapping?.verificationEmail || null,
				email: mapping?.lumaHostEmail || null,
			});
		}
	}

	return result.sort((a, b) => b.eventCount - a.eventCount);
}
