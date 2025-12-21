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
	hostClaims,
	lumaHostMappings,
	organizations,
} from "@/lib/db/schema";
import { createUniqueSlug } from "@/lib/slug-utils";
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

	const hostInfo = await db.query.eventHosts.findFirst({
		where: eq(eventHosts.lumaHostApiId, claim.lumaHostApiId),
	});

	const hostName = hostInfo?.name || "Host";
	const hostAvatar = hostInfo?.avatarUrl;

	await db
		.update(hostClaims)
		.set({
			status: "verified",
			verifiedAt: new Date(),
		})
		.where(eq(hostClaims.id, claim.id));

	let personalOrg = await db.query.organizations.findFirst({
		where: and(
			eq(organizations.ownerUserId, claim.claimedByUserId),
			eq(organizations.isPersonalOrg, true),
		),
	});

	if (!personalOrg) {
		const slug = await createUniqueSlug(hostName);
		const [newOrg] = await db
			.insert(organizations)
			.values({
				name: hostName,
				displayName: hostName,
				slug,
				logoUrl: hostAvatar,
				ownerUserId: claim.claimedByUserId,
				isPersonalOrg: true,
				isVerified: true,
			})
			.returning();
		personalOrg = newOrg;
	} else {
		if (hostAvatar && !personalOrg.logoUrl) {
			await db
				.update(organizations)
				.set({
					logoUrl: hostAvatar,
					displayName: personalOrg.displayName || hostName,
				})
				.where(eq(organizations.id, personalOrg.id));
		}
	}

	const hostEventIds = await db.query.eventHosts.findMany({
		where: eq(eventHosts.lumaHostApiId, claim.lumaHostApiId),
		columns: { eventId: true },
	});

	if (hostEventIds.length > 0) {
		const eventIdList = hostEventIds.map((e) => e.eventId);
		await db
			.update(events)
			.set({
				organizationId: personalOrg.id,
			})
			.where(
				and(
					inArray(events.id, eventIdList),
					isNull(events.organizationId),
				),
			);
	}

	const existingMapping = await db.query.lumaHostMappings.findFirst({
		where: eq(lumaHostMappings.lumaHostApiId, claim.lumaHostApiId),
	});

	if (existingMapping) {
		await db
			.update(lumaHostMappings)
			.set({
				clerkUserId: claim.claimedByUserId,
				organizationId: personalOrg.id,
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
			organizationId: personalOrg.id,
			matchSource: "claim",
			confidence: 100,
			isVerified: true,
		});
	}

	const clerk = await clerkClient();
	const user = await clerk.users.getUser(claim.claimedByUserId);

	const updateData: {
		publicMetadata: Record<string, unknown>;
		unsafeMetadata?: Record<string, unknown>;
	} = {
		publicMetadata: {
			...((user.publicMetadata as Record<string, unknown>) || {}),
			lumaHostId: claim.lumaHostApiId,
			isLumaHost: true,
			personalOrgId: personalOrg.id,
			personalOrgSlug: personalOrg.slug,
		},
	};

	if (hostAvatar && !user.imageUrl) {
		updateData.unsafeMetadata = {
			...((user.unsafeMetadata as Record<string, unknown>) || {}),
			lumaAvatarUrl: hostAvatar,
		};
	}

	await clerk.users.updateUserMetadata(claim.claimedByUserId, updateData);

	revalidatePath("/");
	revalidatePath(`/c/${personalOrg.slug}`);

	return {
		success: true,
		message: "Perfil verificado exitosamente",
		organizationSlug: personalOrg.slug,
	};
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

export async function inviteHost(lumaHostApiId: string, email: string) {
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

	const existingInvite = await db.query.hostClaims.findFirst({
		where: and(
			eq(hostClaims.lumaHostApiId, lumaHostApiId),
			eq(hostClaims.verificationMethod, "invite"),
			eq(hostClaims.status, "pending"),
		),
	});

	if (existingInvite) {
		return { success: false, error: "Ya existe una invitación pendiente para este host" };
	}

	const hostInfo = await db.query.eventHosts.findFirst({
		where: eq(eventHosts.lumaHostApiId, lumaHostApiId),
	});

	const hostName = hostInfo?.name || "Host";

	const clerk = await clerkClient();

	let invitation;
	try {
		invitation = await clerk.invitations.createInvitation({
			emailAddress: email,
			redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept`,
			publicMetadata: {
				lumaHostApiId,
				isHostInvite: true,
			},
		});
	} catch (error) {
		const clerkError = error as { errors?: Array<{ code: string }> };
		if (clerkError.errors?.[0]?.code === "form_identifier_exists") {
			const users = await clerk.users.getUserList({
				emailAddress: [email],
			});
			if (users.data.length > 0) {
				const existingUser = users.data[0];
				const token = nanoid(32);

				await db.insert(hostClaims).values({
					lumaHostApiId,
					organizationId: existingMapping?.organizationId || null,
					claimedByUserId: existingUser.id,
					invitedByUserId: userId,
					verificationMethod: "invite",
					verificationToken: token,
					verificationEmail: email,
					status: "pending",
				});

				const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-host?token=${token}`;

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

				return {
					success: true,
					message: `Usuario existente encontrado. Email de verificación enviado a ${email}`,
				};
			}
		}
		return { success: false, error: "Error al crear invitación en Clerk" };
	}

	const token = nanoid(32);

	await db.insert(hostClaims).values({
		lumaHostApiId,
		organizationId: existingMapping?.organizationId || null,
		invitedByUserId: userId,
		clerkInvitationId: invitation.id,
		verificationMethod: "invite",
		verificationToken: token,
		verificationEmail: email,
		status: "pending",
	});

	if (existingMapping) {
		await db
			.update(lumaHostMappings)
			.set({
				lumaHostEmail: email,
				updatedAt: new Date(),
			})
			.where(eq(lumaHostMappings.id, existingMapping.id));
	} else {
		await db.insert(lumaHostMappings).values({
			lumaHostApiId,
			lumaHostName: hostName,
			lumaHostEmail: email,
			matchSource: "manual",
			confidence: 50,
			isVerified: false,
		});
	}

	revalidatePath("/god/pending");

	return {
		success: true,
		message: `Invitación enviada a ${email}`,
		invitationId: invitation.id,
	};
}

export async function verifyHostInvite(userId: string, lumaHostApiId: string) {
	const existingMapping = await db.query.lumaHostMappings.findFirst({
		where: eq(lumaHostMappings.lumaHostApiId, lumaHostApiId),
	});

	if (existingMapping?.clerkUserId) {
		if (existingMapping.clerkUserId === userId) {
			const org = await db.query.organizations.findFirst({
				where: eq(organizations.id, existingMapping.organizationId!),
			});
			return {
				success: true,
				message: "Ya estás vinculado a este perfil",
				organizationSlug: org?.slug,
			};
		}
		return { success: false, error: "Este perfil ya fue reclamado por otro usuario" };
	}

	const pendingClaim = await db.query.hostClaims.findFirst({
		where: and(
			eq(hostClaims.lumaHostApiId, lumaHostApiId),
			eq(hostClaims.verificationMethod, "invite"),
			eq(hostClaims.status, "pending"),
		),
	});

	if (pendingClaim) {
		await db
			.update(hostClaims)
			.set({
				claimedByUserId: userId,
				status: "verified",
				verifiedAt: new Date(),
			})
			.where(eq(hostClaims.id, pendingClaim.id));
	}

	const hostInfo = await db.query.eventHosts.findFirst({
		where: eq(eventHosts.lumaHostApiId, lumaHostApiId),
	});

	const hostName = hostInfo?.name || "Host";
	const hostAvatar = hostInfo?.avatarUrl;

	let personalOrg = await db.query.organizations.findFirst({
		where: and(
			eq(organizations.ownerUserId, userId),
			eq(organizations.isPersonalOrg, true),
		),
	});

	if (!personalOrg) {
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
		personalOrg = newOrg;
	} else {
		if (hostAvatar && !personalOrg.logoUrl) {
			await db
				.update(organizations)
				.set({
					logoUrl: hostAvatar,
					displayName: personalOrg.displayName || hostName,
				})
				.where(eq(organizations.id, personalOrg.id));
		}
	}

	const hostEventIds = await db.query.eventHosts.findMany({
		where: eq(eventHosts.lumaHostApiId, lumaHostApiId),
		columns: { eventId: true },
	});

	if (hostEventIds.length > 0) {
		const eventIdList = hostEventIds.map((e) => e.eventId);
		await db
			.update(events)
			.set({
				organizationId: personalOrg.id,
			})
			.where(
				and(
					inArray(events.id, eventIdList),
					isNull(events.organizationId),
				),
			);
	}

	if (existingMapping) {
		await db
			.update(lumaHostMappings)
			.set({
				clerkUserId: userId,
				organizationId: personalOrg.id,
				matchSource: "claim",
				confidence: 100,
				isVerified: true,
				updatedAt: new Date(),
			})
			.where(eq(lumaHostMappings.id, existingMapping.id));
	} else {
		await db.insert(lumaHostMappings).values({
			lumaHostApiId,
			lumaHostName: hostName,
			clerkUserId: userId,
			organizationId: personalOrg.id,
			matchSource: "claim",
			confidence: 100,
			isVerified: true,
		});
	}

	const clerk = await clerkClient();
	const user = await clerk.users.getUser(userId);

	await clerk.users.updateUserMetadata(userId, {
		publicMetadata: {
			...((user.publicMetadata as Record<string, unknown>) || {}),
			lumaHostId: lumaHostApiId,
			isLumaHost: true,
			isHostInvite: undefined,
			personalOrgId: personalOrg.id,
			personalOrgSlug: personalOrg.slug,
		},
	});

	revalidatePath("/");
	revalidatePath(`/c/${personalOrg.slug}`);
	revalidatePath("/god/pending");

	return {
		success: true,
		message: "Perfil vinculado exitosamente",
		organizationSlug: personalOrg.slug,
	};
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
		{ lumaHostApiId: string; name: string; avatarUrl: string | null }
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
			const pendingInvite = await db.query.hostClaims.findFirst({
				where: and(
					eq(hostClaims.lumaHostApiId, lumaHostApiId),
					eq(hostClaims.status, "pending"),
				),
			});

			const eventCount = await db.query.eventHosts.findMany({
				where: eq(eventHosts.lumaHostApiId, lumaHostApiId),
				columns: { eventId: true },
			});

			result.push({
				...host,
				eventCount: eventCount.length,
				pendingInviteEmail: pendingInvite?.verificationEmail || null,
				email: mapping?.lumaHostEmail || null,
			});
		}
	}

	return result.sort((a, b) => b.eventCount - a.eventCount);
}
