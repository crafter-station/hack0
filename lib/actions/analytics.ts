"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, importJobs } from "@/lib/db/schema";

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
