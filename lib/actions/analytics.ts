"use server";

import { db } from "@/lib/db";
import { importJobs, notificationLogs, events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// ============================================
// IMPORT JOBS
// ============================================

export async function getEventImportJobs(eventId: string) {
  const jobs = await db
    .select()
    .from(importJobs)
    .where(eq(importJobs.eventId, eventId))
    .orderBy(desc(importJobs.createdAt));

  return jobs;
}

export async function getOrganizationImportJobs(organizationId: string) {
  const jobs = await db
    .select({
      id: importJobs.id,
      sourceUrl: importJobs.sourceUrl,
      sourceType: importJobs.sourceType,
      status: importJobs.status,
      triggerRunId: importJobs.triggerRunId,
      errorMessage: importJobs.errorMessage,
      createdAt: importJobs.createdAt,
      completedAt: importJobs.completedAt,
      eventId: importJobs.eventId,
      eventName: events.name,
      eventSlug: events.slug,
    })
    .from(importJobs)
    .leftJoin(events, eq(importJobs.eventId, events.id))
    .where(eq(importJobs.organizationId, organizationId))
    .orderBy(desc(importJobs.createdAt));

  return jobs;
}

// ============================================
// NOTIFICATION LOGS
// ============================================

export async function getEventNotificationLogs(eventId: string) {
  const logs = await db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.eventId, eventId))
    .orderBy(desc(notificationLogs.sentAt))
    .limit(50);

  return logs;
}

export async function getEventNotificationStats(eventId: string) {
  const logs = await db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.eventId, eventId));

  const total = logs.length;
  const sent = logs.filter((l) => l.status === "sent").length;
  const failed = logs.filter((l) => l.status === "failed").length;
  const bounced = logs.filter((l) => l.status === "bounced").length;

  return { total, sent, failed, bounced };
}
