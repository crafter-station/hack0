"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { eventHosts, events, hostClaims, organizations } from "@/lib/db/schema";
import { isAdmin } from "./claims";

export async function getEventHosts(eventId: string) {
	const hosts = await db
		.select()
		.from(eventHosts)
		.where(eq(eventHosts.eventId, eventId))
		.orderBy(eventHosts.createdAt);

	return hosts;
}

export async function getUserHostStatus(eventId: string) {
	const { userId } = await auth();
	if (!userId) return null;

	const host = await db
		.select()
		.from(eventHosts)
		.where(and(eq(eventHosts.eventId, eventId), eq(eventHosts.userId, userId)))
		.limit(1);

	return host[0] || null;
}

export async function getUserHostClaim(eventHostId: string) {
	const { userId } = await auth();
	if (!userId) return null;

	const claim = await db
		.select()
		.from(hostClaims)
		.where(
			and(
				eq(hostClaims.eventHostId, eventHostId),
				eq(hostClaims.userId, userId),
			),
		)
		.limit(1);

	return claim[0] || null;
}

export interface CreateHostClaimInput {
	eventHostId: string;
	proofUrl: string;
	proofDescription?: string;
}

export async function createHostClaim(input: CreateHostClaimInput) {
	const { userId } = await auth();

	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const host = await db.query.eventHosts.findFirst({
		where: eq(eventHosts.id, input.eventHostId),
	});

	if (!host) {
		return { success: false, error: "Host no encontrado" };
	}

	if (host.userId) {
		return {
			success: false,
			error: "Este host ya está vinculado a un usuario",
		};
	}

	const existingClaim = await db
		.select()
		.from(hostClaims)
		.where(
			and(
				eq(hostClaims.eventHostId, input.eventHostId),
				eq(hostClaims.userId, userId),
			),
		)
		.limit(1);

	if (existingClaim.length > 0) {
		return {
			success: false,
			error: "Ya tienes una solicitud pendiente para este host",
		};
	}

	await db.insert(hostClaims).values({
		eventHostId: input.eventHostId,
		userId,
		proofUrl: input.proofUrl,
		proofDescription: input.proofDescription,
	});

	revalidatePath("/");
	return { success: true };
}

export async function getAllHostClaims() {
	const admin = await isAdmin();
	if (!admin) return [];

	const claims = await db
		.select({
			id: hostClaims.id,
			eventHostId: hostClaims.eventHostId,
			userId: hostClaims.userId,
			proofUrl: hostClaims.proofUrl,
			proofDescription: hostClaims.proofDescription,
			status: hostClaims.status,
			createdAt: hostClaims.createdAt,
			hostName: eventHosts.name,
			hostAvatarUrl: eventHosts.avatarUrl,
			eventId: eventHosts.eventId,
			eventName: events.name,
			eventShortCode: events.shortCode,
			organizationSlug: organizations.slug,
		})
		.from(hostClaims)
		.leftJoin(eventHosts, eq(hostClaims.eventHostId, eventHosts.id))
		.leftJoin(events, eq(eventHosts.eventId, events.id))
		.leftJoin(organizations, eq(events.organizationId, organizations.id))
		.orderBy(desc(hostClaims.createdAt));

	return claims;
}

export async function approveHostClaim(claimId: string) {
	const { userId } = await auth();
	const admin = await isAdmin();

	if (!admin || !userId) {
		return { success: false, error: "No autorizado" };
	}

	const claim = await db.query.hostClaims.findFirst({
		where: eq(hostClaims.id, claimId),
	});

	if (!claim) {
		return { success: false, error: "Claim no encontrado" };
	}

	const personalOrg = await db.query.organizations.findFirst({
		where: and(
			eq(organizations.ownerUserId, claim.userId),
			eq(organizations.isPersonalOrg, true),
		),
	});

	await db
		.update(hostClaims)
		.set({
			status: "approved",
			reviewedAt: new Date(),
			reviewedBy: userId,
		})
		.where(eq(hostClaims.id, claimId));

	await db
		.update(eventHosts)
		.set({
			userId: claim.userId,
			representingOrgId: personalOrg?.id || null,
			updatedAt: new Date(),
		})
		.where(eq(eventHosts.id, claim.eventHostId));

	revalidatePath("/god/hosts");
	return { success: true };
}

export async function rejectHostClaim(claimId: string, reason?: string) {
	const { userId } = await auth();
	const admin = await isAdmin();

	if (!admin || !userId) {
		return { success: false, error: "No autorizado" };
	}

	await db
		.update(hostClaims)
		.set({
			status: "rejected",
			reviewedAt: new Date(),
			reviewedBy: userId,
			rejectionReason: reason,
		})
		.where(eq(hostClaims.id, claimId));

	revalidatePath("/god/hosts");
	return { success: true };
}

export async function getEventHostClaims(eventId: string) {
	const claims = await db
		.select({
			claim: hostClaims,
			host: eventHosts,
		})
		.from(hostClaims)
		.innerJoin(eventHosts, eq(hostClaims.eventHostId, eventHosts.id))
		.where(eq(eventHosts.eventId, eventId))
		.orderBy(hostClaims.createdAt);

	return claims;
}
