"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
	communityMembers,
	eventHosts,
	events,
	organizations,
	users,
} from "@/lib/db/schema";
import { canManageEventById } from "./permissions";

export async function getAssignableMembers(eventId: string) {
	const event = await db.query.events.findFirst({
		where: eq(events.id, eventId),
		with: { organization: true },
	});

	if (!event?.organizationId) {
		return [];
	}

	const members = await db
		.select({
			userId: communityMembers.userId,
			role: communityMembers.role,
			user: users,
		})
		.from(communityMembers)
		.leftJoin(users, eq(communityMembers.userId, users.clerkId))
		.where(
			and(
				eq(communityMembers.communityId, event.organizationId),
				inArray(communityMembers.role, ["owner", "admin", "member"]),
			),
		);

	return members.map((m) => ({
		userId: m.userId,
		role: m.role,
		displayName: m.user?.displayName || m.user?.username || "Usuario",
		avatarUrl: m.user?.avatarUrl,
	}));
}

export async function assignEventHost(eventId: string, userId: string) {
	const { userId: currentUserId } = await auth();
	if (!currentUserId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const canManage = await canManageEventById(eventId);
	if (!canManage) {
		return {
			success: false,
			error: "No tienes permiso para gestionar este evento",
		};
	}

	const user = await db.query.users.findFirst({
		where: eq(users.clerkId, userId),
	});

	if (!user) {
		return { success: false, error: "Usuario no encontrado" };
	}

	const existingHost = await db
		.select()
		.from(eventHosts)
		.where(and(eq(eventHosts.eventId, eventId), eq(eventHosts.userId, userId)))
		.limit(1);

	if (existingHost.length > 0) {
		return { success: false, error: "Este usuario ya es host del evento" };
	}

	const personalOrg = await db.query.organizations.findFirst({
		where: and(
			eq(organizations.ownerUserId, userId),
			eq(organizations.isPersonalOrg, true),
		),
	});

	await db.insert(eventHosts).values({
		eventId,
		source: "manual",
		name: user.displayName || user.username || "Usuario",
		avatarUrl: user.avatarUrl,
		userId,
		representingOrgId: personalOrg?.id,
		assignedBy: currentUserId,
	});

	revalidatePath("/");
	return { success: true };
}

export async function removeEventHost(eventHostId: string) {
	const { userId } = await auth();
	if (!userId) {
		return { success: false, error: "Debes iniciar sesión" };
	}

	const host = await db.query.eventHosts.findFirst({
		where: eq(eventHosts.id, eventHostId),
	});

	if (!host) {
		return { success: false, error: "Host no encontrado" };
	}

	const canManage = await canManageEventById(host.eventId);
	if (!canManage) {
		return {
			success: false,
			error: "No tienes permiso para gestionar este evento",
		};
	}

	await db.delete(eventHosts).where(eq(eventHosts.id, eventHostId));

	revalidatePath("/");
	return { success: true };
}

export async function getEventHostsWithUsers(eventId: string) {
	const hosts = await db
		.select({
			host: eventHosts,
			user: users,
		})
		.from(eventHosts)
		.leftJoin(users, eq(eventHosts.userId, users.clerkId))
		.where(eq(eventHosts.eventId, eventId))
		.orderBy(eventHosts.createdAt);

	return hosts.map((h) => ({
		...h.host,
		linkedUser: h.user
			? {
					clerkId: h.user.clerkId,
					displayName: h.user.displayName,
					username: h.user.username,
					avatarUrl: h.user.avatarUrl,
				}
			: null,
	}));
}
