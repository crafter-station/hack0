import { task, schedules, metadata } from "@trigger.dev/sdk/v3";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { lumaCalendars, lumaEventMappings, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { LumaClient, type LumaEvent } from "@/lib/luma";
import { transformLumaEvent, mergeEventUpdates, shouldUpdateEvent } from "@/lib/luma/transform";
import { createUniqueSlug } from "@/lib/slug-utils";

interface SyncResult {
  calendarId: string;
  eventsFound: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsSkipped: number;
  errors: string[];
}

async function uploadEventImage(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;

  try {
    const utapi = new UTApi();
    const uploadResult = await utapi.uploadFilesFromUrl(imageUrl);
    return uploadResult.data?.url || null;
  } catch (error) {
    console.error("Failed to upload image:", error);
    return null;
  }
}

async function syncSingleEvent(
  lumaEvent: LumaEvent,
  calendarId: string,
  organizationId: string,
): Promise<{ created: boolean; updated: boolean; error?: string }> {
  try {
    const existingMapping = await db.query.lumaEventMappings.findFirst({
      where: eq(lumaEventMappings.lumaEventId, lumaEvent.api_id),
    });

    if (existingMapping) {
      if (!shouldUpdateEvent(existingMapping.lumaUpdatedAt!, lumaEvent.updated_at)) {
        return { created: false, updated: false };
      }

      const existingEvent = await db.query.events.findFirst({
        where: eq(events.id, existingMapping.eventId!),
      });

      if (!existingEvent) {
        return { created: false, updated: false, error: "Mapped event not found" };
      }

      const updates = mergeEventUpdates(existingEvent, lumaEvent);

      if (Object.keys(updates).length > 1) {
        await db
          .update(events)
          .set(updates)
          .where(eq(events.id, existingMapping.eventId!));

        await db
          .update(lumaEventMappings)
          .set({
            lastSyncedAt: new Date(),
            lumaUpdatedAt: new Date(lumaEvent.updated_at),
          })
          .where(eq(lumaEventMappings.id, existingMapping.id));

        return { created: false, updated: true };
      }

      return { created: false, updated: false };
    }

    const eventData = transformLumaEvent(lumaEvent, { organizationId });

    if (lumaEvent.cover_url) {
      const uploadedUrl = await uploadEventImage(lumaEvent.cover_url);
      if (uploadedUrl) {
        eventData.eventImageUrl = uploadedUrl;
      }
    }

    const slug = await createUniqueSlug(eventData.name);
    eventData.slug = slug;

    const [newEvent] = await db.insert(events).values(eventData).returning();

    await db.insert(lumaEventMappings).values({
      lumaEventId: lumaEvent.api_id,
      eventId: newEvent.id,
      lumaCalendarId: calendarId,
      lastSyncedAt: new Date(),
      lumaUpdatedAt: new Date(lumaEvent.updated_at),
    });

    return { created: true, updated: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { created: false, updated: false, error: errorMessage };
  }
}

export const lumaCalendarSyncTask = task({
  id: "luma-calendar-sync",
  maxDuration: 300,
  run: async (payload: {
    calendarId: string;
    forceFullSync?: boolean;
  }): Promise<SyncResult> => {
    const { calendarId, forceFullSync = false } = payload;

    metadata.set("calendarId", calendarId);
    metadata.set("step", "fetching_calendar");

    const calendar = await db.query.lumaCalendars.findFirst({
      where: eq(lumaCalendars.id, calendarId),
    });

    if (!calendar) {
      throw new Error(`Calendar not found: ${calendarId}`);
    }

    if (!calendar.lumaApiKey) {
      throw new Error("Calendar has no API key configured");
    }

    metadata.set("calendarName", calendar.lumaCalendarSlug || calendarId);
    metadata.set("step", "connecting_to_luma");

    const client = new LumaClient({
      apiKey: calendar.lumaApiKey,
    });

    const syncOptions: { after?: Date } = {};
    if (!forceFullSync && calendar.lastSyncAt) {
      syncOptions.after = calendar.lastSyncAt;
    }

    metadata.set("step", "fetching_events");

    const lumaEvents = await client.getAllCalendarEvents(syncOptions);

    metadata.set("eventsFound", lumaEvents.length);
    metadata.set("step", "syncing_events");

    const result: SyncResult = {
      calendarId,
      eventsFound: lumaEvents.length,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsSkipped: 0,
      errors: [],
    };

    for (let i = 0; i < lumaEvents.length; i++) {
      const lumaEvent = lumaEvents[i];
      metadata.set("progress", `${i + 1}/${lumaEvents.length}`);
      metadata.set("currentEvent", lumaEvent.name);

      if (lumaEvent.status !== "published" || lumaEvent.visibility !== "public") {
        result.eventsSkipped++;
        continue;
      }

      const syncResult = await syncSingleEvent(
        lumaEvent,
        calendarId,
        calendar.organizationId!,
      );

      if (syncResult.error) {
        result.errors.push(`${lumaEvent.name}: ${syncResult.error}`);
      } else if (syncResult.created) {
        result.eventsCreated++;
      } else if (syncResult.updated) {
        result.eventsUpdated++;
      } else {
        result.eventsSkipped++;
      }
    }

    await db
      .update(lumaCalendars)
      .set({ lastSyncAt: new Date() })
      .where(eq(lumaCalendars.id, calendarId));

    metadata.set("step", "completed");
    metadata.set("eventsCreated", result.eventsCreated);
    metadata.set("eventsUpdated", result.eventsUpdated);
    metadata.set("eventsSkipped", result.eventsSkipped);

    return result;
  },
});

export const lumaScheduledSyncTask = schedules.task({
  id: "luma-scheduled-sync",
  cron: "0 */6 * * *",
  run: async () => {
    metadata.set("step", "fetching_active_calendars");

    const activeCalendars = await db.query.lumaCalendars.findMany({
      where: eq(lumaCalendars.isActive, true),
    });

    metadata.set("calendarsFound", activeCalendars.length);

    const results: SyncResult[] = [];

    for (const calendar of activeCalendars) {
      metadata.set("currentCalendar", calendar.lumaCalendarSlug || calendar.id);

      try {
        const result = await lumaCalendarSyncTask.triggerAndWait({
          calendarId: calendar.id,
        });

        if (result.ok) {
          results.push(result.output);
        }
      } catch (error) {
        console.error(`Failed to sync calendar ${calendar.id}:`, error);
      }
    }

    const totals = results.reduce(
      (acc, r) => ({
        eventsFound: acc.eventsFound + r.eventsFound,
        eventsCreated: acc.eventsCreated + r.eventsCreated,
        eventsUpdated: acc.eventsUpdated + r.eventsUpdated,
        eventsSkipped: acc.eventsSkipped + r.eventsSkipped,
      }),
      { eventsFound: 0, eventsCreated: 0, eventsUpdated: 0, eventsSkipped: 0 },
    );

    metadata.set("totalEventsFound", totals.eventsFound);
    metadata.set("totalEventsCreated", totals.eventsCreated);
    metadata.set("totalEventsUpdated", totals.eventsUpdated);
    metadata.set("step", "completed");

    return {
      calendarsProcessed: results.length,
      ...totals,
    };
  },
});

export const lumaSyncSingleCalendarTask = task({
  id: "luma-sync-single-calendar",
  maxDuration: 120,
  run: async (payload: {
    organizationId: string;
    lumaApiKey: string;
    lumaCalendarSlug: string;
  }) => {
    const { organizationId, lumaApiKey, lumaCalendarSlug } = payload;

    metadata.set("step", "validating_api_key");
    metadata.set("calendarSlug", lumaCalendarSlug);

    const client = new LumaClient({ apiKey: lumaApiKey });

    const lumaEvents = await client.listCalendarEvents();

    if (lumaEvents.events.length === 0) {
      metadata.set("step", "no_events_found");
      return { success: true, eventsFound: 0, message: "No events found in calendar" };
    }

    metadata.set("step", "creating_calendar_record");
    metadata.set("eventsFound", lumaEvents.events.length + (lumaEvents.hasMore ? "+" : ""));

    const [calendar] = await db
      .insert(lumaCalendars)
      .values({
        organizationId,
        lumaCalendarSlug,
        lumaApiKey,
        syncFrequency: "6h",
        isActive: true,
      })
      .returning();

    metadata.set("step", "syncing_events");

    const syncResult = await lumaCalendarSyncTask.triggerAndWait({
      calendarId: calendar.id,
      forceFullSync: true,
    });

    metadata.set("step", "completed");

    return {
      success: true,
      calendarId: calendar.id,
      ...(syncResult.ok ? syncResult.output : { error: "Sync failed" }),
    };
  },
});
