"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
	events,
	eventHosts,
	lumaHostMappings,
	organizations,
} from "@/lib/db/schema";
import { isGodMode } from "@/lib/god-mode";

export async function getEventsWithoutOrg() {
	const godMode = await isGodMode();
	if (!godMode) {
		return [];
	}

	const pendingEvents = await db.query.events.findMany({
		where: isNull(events.organizationId),
		with: {
			lumaHosts: true,
		},
		orderBy: (events, { desc }) => [desc(events.createdAt)],
		limit: 100,
	});

	return pendingEvents;
}

export async function getAllOrganizationsForSelect() {
	const godMode = await isGodMode();
	if (!godMode) {
		return [];
	}

	const orgs = await db.query.organizations.findMany({
		columns: {
			id: true,
			name: true,
			slug: true,
			logoUrl: true,
		},
		orderBy: (organizations, { asc }) => [asc(organizations.name)],
	});

	return orgs;
}

export async function assignOrganizationToEvent(
	eventId: string,
	organizationId: string,
) {
	const godMode = await isGodMode();
	if (!godMode) {
		return { success: false, error: "No autorizado" };
	}

	try {
		await db
			.update(events)
			.set({ organizationId })
			.where(eq(events.id, eventId));

		const eventHostsList = await db.query.eventHosts.findMany({
			where: eq(eventHosts.eventId, eventId),
		});

		for (const host of eventHostsList) {
			await db
				.update(lumaHostMappings)
				.set({
					organizationId,
					matchSource: "manual",
					confidence: 100,
					isVerified: true,
				})
				.where(eq(lumaHostMappings.lumaHostApiId, host.lumaHostApiId));
		}

		revalidatePath("/god/pending");
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Error desconocido",
		};
	}
}
