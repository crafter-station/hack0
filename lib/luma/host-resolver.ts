import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	lumaHostMappings,
	eventHosts,
	type NewEventHost,
	type NewLumaHostMapping,
} from "@/lib/db/schema";
import type { LumaEventHost } from "./types";

export interface HostResolutionResult {
	organizationId: string | null;
	primaryHost: LumaEventHost | null;
	isVerified: boolean;
}

export async function resolveOrganization(
	hosts: LumaEventHost[],
): Promise<HostResolutionResult> {
	if (!hosts || hosts.length === 0) {
		return {
			organizationId: null,
			primaryHost: null,
			isVerified: false,
		};
	}

	for (const host of hosts) {
		const mapping = await db.query.lumaHostMappings.findFirst({
			where: eq(lumaHostMappings.lumaHostApiId, host.api_id),
		});

		if (mapping?.isVerified && mapping.organizationId) {
			return {
				organizationId: mapping.organizationId,
				primaryHost: host,
				isVerified: true,
			};
		}
	}

	return {
		organizationId: null,
		primaryHost: hosts[0] || null,
		isVerified: false,
	};
}

export async function saveEventHosts(
	eventId: string,
	hosts: LumaEventHost[],
	primaryHostApiId?: string,
): Promise<void> {
	if (!hosts || hosts.length === 0) return;

	const hostRecords: NewEventHost[] = hosts.map((host) => ({
		eventId,
		lumaHostApiId: host.api_id,
		name: host.name,
		email: host.email,
		avatarUrl: host.avatar_url,
		role: "host" as const,
		isPrimary: host.api_id === primaryHostApiId,
	}));

	for (const record of hostRecords) {
		await db
			.insert(eventHosts)
			.values(record)
			.onConflictDoUpdate({
				target: [eventHosts.eventId, eventHosts.lumaHostApiId],
				set: {
					name: record.name,
					email: record.email,
					avatarUrl: record.avatarUrl,
					isPrimary: record.isPrimary,
				},
			});
	}
}

export async function upsertHostMappings(
	hosts: LumaEventHost[],
): Promise<void> {
	if (!hosts || hosts.length === 0) return;

	for (const host of hosts) {
		const existingMapping = await db.query.lumaHostMappings.findFirst({
			where: eq(lumaHostMappings.lumaHostApiId, host.api_id),
		});

		if (existingMapping) {
			await db
				.update(lumaHostMappings)
				.set({
					lastSeenAt: new Date(),
					lumaHostName: host.name,
					lumaHostEmail: host.email,
					lumaHostAvatarUrl: host.avatar_url,
				})
				.where(eq(lumaHostMappings.id, existingMapping.id));
		} else {
			const newMapping: NewLumaHostMapping = {
				lumaHostApiId: host.api_id,
				lumaHostName: host.name,
				lumaHostEmail: host.email,
				lumaHostAvatarUrl: host.avatar_url,
				isVerified: false,
				lastSeenAt: new Date(),
			};

			await db.insert(lumaHostMappings).values(newMapping);
		}
	}
}

export function computeContentHash(event: {
	name: string;
	description?: string | null;
	startDate?: Date | null;
	endDate?: Date | null;
	venue?: string | null;
}): string {
	const content = JSON.stringify({
		name: event.name,
		description: event.description?.slice(0, 500),
		startDate: event.startDate?.toISOString(),
		endDate: event.endDate?.toISOString(),
		venue: event.venue,
	});

	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).padStart(16, "0");
}
