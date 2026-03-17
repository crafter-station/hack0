"use server";

import { and, desc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { type Event, events } from "@/lib/db/schema";

export type ScraperFilter = "pending" | "approved" | "rejected" | "all";

export async function getScraperInbox(
	filter: ScraperFilter = "pending",
	source?: string,
): Promise<Event[]> {
	const conditions: ReturnType<typeof eq>[] = [];

	if (filter !== "all") {
		conditions.push(eq(events.approvalStatus, filter));
	}
	if (source) {
		conditions.push(eq(events.scrapeSource, source));
	}

	const rows = await db
		.select()
		.from(events)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(events.createdAt))
		.limit(500);

	return rows;
}

export async function getScraperStats(): Promise<{
	pending: number;
	approvedToday: number;
	rejectedToday: number;
	total: number;
}> {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const [pendingRow, approvedTodayRow, rejectedTodayRow, totalRow] =
		await Promise.all([
			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(
					and(
						isNotNull(events.scrapeSource),
						eq(events.approvalStatus, "pending"),
					),
				),
			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(
					and(
						isNotNull(events.scrapeSource),
						eq(events.approvalStatus, "approved"),
						gte(events.updatedAt, todayStart),
					),
				),
			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(
					and(
						isNotNull(events.scrapeSource),
						eq(events.approvalStatus, "rejected"),
						gte(events.updatedAt, todayStart),
					),
				),
			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(isNotNull(events.scrapeSource)),
		]);

	return {
		pending: Number(pendingRow[0]?.count ?? 0),
		approvedToday: Number(approvedTodayRow[0]?.count ?? 0),
		rejectedToday: Number(rejectedTodayRow[0]?.count ?? 0),
		total: Number(totalRow[0]?.count ?? 0),
	};
}

export async function approveScrapedEvent(
	id: string,
): Promise<{ success: boolean }> {
	try {
		await db
			.update(events)
			.set({ isApproved: true, approvalStatus: "approved" })
			.where(eq(events.id, id));
		return { success: true };
	} catch {
		return { success: false };
	}
}

export async function rejectScrapedEvent(
	id: string,
): Promise<{ success: boolean }> {
	try {
		await db
			.update(events)
			.set({ isApproved: false, approvalStatus: "rejected" })
			.where(eq(events.id, id));
		return { success: true };
	} catch {
		return { success: false };
	}
}

export async function bulkApprove(
	ids: string[],
): Promise<{ success: boolean; count: number }> {
	if (ids.length === 0) return { success: true, count: 0 };
	try {
		await db
			.update(events)
			.set({ isApproved: true, approvalStatus: "approved" })
			.where(inArray(events.id, ids));
		return { success: true, count: ids.length };
	} catch {
		return { success: false, count: 0 };
	}
}

export async function bulkReject(
	ids: string[],
): Promise<{ success: boolean; count: number }> {
	if (ids.length === 0) return { success: true, count: 0 };
	try {
		await db
			.update(events)
			.set({ isApproved: false, approvalStatus: "rejected" })
			.where(inArray(events.id, ids));
		return { success: true, count: ids.length };
	} catch {
		return { success: false, count: 0 };
	}
}

export async function bulkApproveByFilter(
	source?: string,
	confidenceMin?: number,
	confidenceMax?: number,
): Promise<{ success: boolean; count: number }> {
	try {
		const conditions = [
			isNotNull(events.scrapeSource),
			eq(events.approvalStatus, "pending"),
		];
		if (source) {
			conditions.push(eq(events.scrapeSource, source));
		}
		if (confidenceMin !== undefined) {
			conditions.push(gte(events.scrapeConfidence, confidenceMin));
		}
		if (confidenceMax !== undefined) {
			conditions.push(lt(events.scrapeConfidence, confidenceMax));
		}

		const result = await db
			.update(events)
			.set({ isApproved: true, approvalStatus: "approved" })
			.where(and(...conditions));

		return { success: true, count: Number(result.rowCount ?? 0) };
	} catch {
		return { success: false, count: 0 };
	}
}

export async function updateScrapedEvent(
	id: string,
	data: Partial<
		Pick<
			Event,
			| "name"
			| "description"
			| "startDate"
			| "endDate"
			| "registrationDeadline"
			| "country"
			| "city"
			| "venue"
			| "eventType"
			| "format"
			| "skillLevel"
			| "scope"
			| "websiteUrl"
			| "registrationUrl"
			| "eventImageUrl"
			| "prizePool"
			| "prizeCurrency"
			| "prizeDescription"
		>
	>,
): Promise<{ success: boolean }> {
	try {
		await db.update(events).set(data).where(eq(events.id, id));
		return { success: true };
	} catch {
		return { success: false };
	}
}
