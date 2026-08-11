import { metadata, task } from "@trigger.dev/sdk/v3";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventSourceLinks, events } from "@/lib/db/schema";
import {
	assertWriteAllowed,
	ingestionModeFromWriteFlag,
} from "@/lib/ingestion/safety";
import { buildEventSourceIdentityKey } from "@/lib/ingestion/source-link";
import {
	LumaCalendarPublisherClient,
	prepareLumaCalendarListing,
} from "@/lib/luma/calendar-publisher";
import { eventIngestionQueue } from "@/trigger/event-ingestion-queue";

export const lumaCalendarPublisherTask = task({
	id: "luma-calendar-publisher",
	queue: eventIngestionQueue,
	maxDuration: 120,
	run: async (payload: { eventId: string; write?: boolean }) => {
		const mode = ingestionModeFromWriteFlag(payload.write);
		assertWriteAllowed(mode);
		metadata.set("mode", mode);
		metadata.set("eventId", payload.eventId);

		const event = await db.query.events.findFirst({
			where: eq(events.id, payload.eventId),
		});
		if (!event) throw new Error(`Event ${payload.eventId} was not found`);
		if (!event.isApproved || event.approvalStatus !== "approved") {
			return {
				success: true,
				action: "skipped" as const,
				reason: "event_not_public",
			};
		}

		const apiKey = process.env.HACK0_LUMA_CALENDAR_API_KEY;
		if (!apiKey) {
			throw new Error("HACK0_LUMA_CALENDAR_API_KEY is required");
		}

		const client = new LumaCalendarPublisherClient(apiKey);
		const calendar = await client.getCalendar();
		metadata.set("calendarId", calendar.id);
		metadata.set("calendarName", calendar.name);

		const activeLink = await db.query.eventSourceLinks.findFirst({
			where: and(
				eq(eventSourceLinks.eventId, event.id),
				eq(eventSourceLinks.provider, "luma"),
				eq(eventSourceLinks.linkType, "calendar_listing"),
				eq(eventSourceLinks.calendarExternalId, calendar.id),
				eq(eventSourceLinks.status, "active"),
			),
		});
		if (activeLink) {
			return {
				success: true,
				action: "skipped" as const,
				reason: "calendar_listing_already_linked",
				linkId: activeLink.id,
			};
		}

		const prepared = await prepareLumaCalendarListing(event, client);
		const lookup = await client.lookupEvent(prepared.payload);
		if (lookup.event?.status === "rejected") {
			throw new Error(
				"The event was previously rejected by the Hack0 Luma calendar",
			);
		}
		const remote =
			lookup.event ||
			(mode === "write" ? await client.addEvent(prepared.payload) : null);

		if (mode === "dry-run") {
			return {
				success: true,
				action: lookup.event
					? ("already_present" as const)
					: ("would_add" as const),
				calendarId: calendar.id,
				platform: prepared.payload.platform,
				sourceUrl: prepared.sourceUrl,
				durationInferred: prepared.durationInferred,
				remoteStatus: lookup.event?.status ?? null,
			};
		}

		if (!remote) throw new Error("Luma did not return a calendar listing");

		const externalId =
			prepared.payload.platform === "luma"
				? prepared.payload.event_id
				: remote.id;
		const identityKey = buildEventSourceIdentityKey({
			provider: "luma",
			linkType: "calendar_listing",
			externalId,
			calendarExternalId: calendar.id,
		});
		const now = new Date();
		const [link] = await db
			.insert(eventSourceLinks)
			.values({
				eventId: event.id,
				provider: "luma",
				linkType: "calendar_listing",
				identityKey,
				externalId,
				externalUrl: prepared.sourceUrl,
				calendarExternalId: calendar.id,
				syncMode: "bidirectional",
				status: "active",
				lastOutboundAt: now,
				metadata: {
					platform: prepared.payload.platform,
					listingId: remote.id,
					listingStatus: remote.status,
					durationInferred: prepared.durationInferred,
				},
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: eventSourceLinks.identityKey,
				set: {
					status: "active",
					lastOutboundAt: now,
					lastError: null,
					metadata: {
						platform: prepared.payload.platform,
						listingId: remote.id,
						listingStatus: remote.status,
						durationInferred: prepared.durationInferred,
					},
					updatedAt: now,
				},
			})
			.returning({
				id: eventSourceLinks.id,
				eventId: eventSourceLinks.eventId,
			});

		if (link.eventId !== event.id) {
			throw new Error(
				`Luma listing ${identityKey} is already linked to another event`,
			);
		}

		return {
			success: true,
			action: lookup.event ? ("linked_existing" as const) : ("added" as const),
			calendarId: calendar.id,
			platform: prepared.payload.platform,
			linkId: link.id,
			remoteId: remote.id,
			remoteStatus: remote.status,
		};
	},
});
