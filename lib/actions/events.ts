"use server";

import { auth } from "@clerk/nextjs/server";
import {
	and,
	asc,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	or,
	sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type Event,
	type EventSponsor,
	eventSponsors,
	events,
	type NewEvent,
	type NewEventSponsor,
	type Organization,
	organizations,
} from "@/lib/db/schema";
import { notifySubscribersOfNewEvent } from "@/lib/email/notify-subscribers";
import { type EventCategory, getCategoryById } from "@/lib/event-categories";
import { isGodMode } from "@/lib/god-mode";
import { createUniqueSlug } from "@/lib/slug-utils";
import { getUserCommunityRole } from "./community-members";

export interface EventFilters {
	category?: EventCategory;
	search?: string;
	eventType?: string[];
	organizerType?: string[];
	skillLevel?: string[];
	format?: string[];
	status?: string[];
	domain?: string[];
	country?: string[];
	department?: string[];
	juniorFriendly?: boolean;
	page?: number;
	limit?: number;
}

interface OrganizationInfo {
	id: string;
	slug: string;
	name: string;
	displayName: string | null;
	isVerified: boolean | null;
}

export type EventWithOrg = Event & { organization: OrganizationInfo | null };

export interface EventsResult {
	events: EventWithOrg[];
	total: number;
	page: number;
	totalPages: number;
	hasMore: boolean;
}

export async function getEvents(
	filters: EventFilters = {},
): Promise<EventsResult> {
	const {
		category = "all",
		search,
		eventType,
		organizerType,
		skillLevel,
		format,
		status,
		domain,
		country,
		department,
		juniorFriendly,
		page = 1,
		limit = 12,
	} = filters;

	const conditions: ReturnType<typeof eq>[] = [];

	// Only show approved events
	conditions.push(eq(events.isApproved, true));

	// Exclude child events from main list (they appear nested under parent)
	conditions.push(isNull(events.parentEventId));

	// Category filter - filter by event types in category (skip if "all" or no eventTypes)
	const categoryConfig = getCategoryById(category);
	if (categoryConfig && categoryConfig.eventTypes !== null) {
		conditions.push(
			inArray(events.eventType, categoryConfig.eventTypes as any),
		);
	}

	// Event type filter (within category)
	if (eventType && eventType.length > 0) {
		conditions.push(
			or(...eventType.map((t) => eq(events.eventType, t as any)))!,
		);
	}

	// Organizer type filter
	if (organizerType && organizerType.length > 0) {
		conditions.push(
			or(...organizerType.map((t) => eq(organizations.type, t as any)))!,
		);
	}

	// Junior friendly filter (derived from skillLevel: beginner or all)
	if (juniorFriendly) {
		conditions.push(
			or(eq(events.skillLevel, "beginner"), eq(events.skillLevel, "all"))!,
		);
	}

	// Search filter
	if (search?.trim()) {
		conditions.push(
			or(
				ilike(events.name, `%${search}%`),
				ilike(events.description, `%${search}%`),
				ilike(organizations.name, `%${search}%`),
			)!,
		);
	}

	// Skill level filter
	if (skillLevel && skillLevel.length > 0) {
		conditions.push(
			or(
				...skillLevel.map((level) =>
					eq(
						events.skillLevel,
						level as "beginner" | "intermediate" | "advanced" | "all",
					),
				),
			)!,
		);
	}

	// Format filter
	if (format && format.length > 0) {
		conditions.push(
			or(
				...format.map((f) =>
					eq(events.format, f as "virtual" | "in-person" | "hybrid"),
				),
			)!,
		);
	}

	// Status filter - calculated dynamically based on dates
	if (status && status.length > 0) {
		const statusConditions = status.map((s) => {
			switch (s) {
				case "ended":
					// Event has ended (endDate < now)
					return sql`${events.endDate} IS NOT NULL AND ${events.endDate} < NOW()`;
				case "ongoing":
					// Event is happening now (startDate <= now AND endDate > now)
					return sql`${events.startDate} IS NOT NULL AND ${events.startDate} <= NOW() AND (${events.endDate} IS NULL OR ${events.endDate} > NOW())`;
				case "open":
					// Registration is open (deadline > now AND not yet started or no start date)
					return sql`${events.registrationDeadline} IS NOT NULL AND ${events.registrationDeadline} > NOW() AND (${events.startDate} IS NULL OR ${events.startDate} > NOW())`;
				case "upcoming":
					// Upcoming (not ended, not ongoing, registration closed or no deadline)
					return sql`(${events.endDate} IS NULL OR ${events.endDate} > NOW()) AND (${events.startDate} IS NULL OR ${events.startDate} > NOW()) AND (${events.registrationDeadline} IS NULL OR ${events.registrationDeadline} <= NOW())`;
				default:
					return sql`1=1`;
			}
		});
		conditions.push(or(...statusConditions)!);
	}

	// Domain filter (uses array contains)
	if (domain && domain.length > 0) {
		conditions.push(
			or(...domain.map((d) => sql`${d} = ANY(${events.domains})`))!,
		);
	}

	// Country filter
	if (country && country.length > 0) {
		conditions.push(or(...country.map((c) => eq(events.country, c)))!);
	}

	// Department filter
	if (department && department.length > 0) {
		conditions.push(or(...department.map((d) => eq(events.department, d)))!);
	}

	// Build where clause
	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Get total count
	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(events)
		.where(whereClause);
	const total = Number(countResult[0]?.count || 0);

	// Compute sort priority based on event status
	// 1 = ongoing (en curso - happening now)
	// 2 = open (abierto - registration open)
	// 3 = upcoming (próximamente - hasn't started, no deadline or deadline passed)
	// 4 = ended (terminado) - always last
	const statusPriority = sql<number>`
    CASE
      WHEN ${events.endDate} IS NOT NULL AND ${events.endDate} < NOW() THEN 4
      WHEN ${events.startDate} IS NOT NULL AND ${events.startDate} <= NOW()
           AND (${events.endDate} IS NULL OR ${events.endDate} > NOW()) THEN 1
      WHEN ${events.registrationDeadline} IS NOT NULL AND ${events.registrationDeadline} > NOW() THEN 2
      ELSE 3
    END
  `;

	// Secondary sort: for ended events, most recent first; for active, soonest first
	const dateSortOrder = sql`
    CASE
      WHEN ${events.endDate} IS NOT NULL AND ${events.endDate} < NOW()
        THEN -EXTRACT(EPOCH FROM ${events.endDate})
      ELSE EXTRACT(EPOCH FROM COALESCE(${events.startDate}, '9999-12-31'))
    END
  `;

	// Get paginated results
	const offset = (page - 1) * limit;
	const results = await db
		.select({
			event: events,
			organization: organizations,
		})
		.from(events)
		.leftJoin(organizations, eq(events.organizationId, organizations.id))
		.where(whereClause)
		.orderBy(
			desc(events.isFeatured), // Featured events ALWAYS first
			asc(statusPriority), // Then: upcoming > open > ongoing > ended
			asc(dateSortOrder), // Ended: most recent first; Active: soonest first
		)
		.limit(limit)
		.offset(offset);

	const eventsWithOrg = results.map((r) => ({
		...r.event,
		organization: r.organization,
	}));

	const totalPages = Math.ceil(total / limit);

	return {
		events: eventsWithOrg,
		total,
		page,
		totalPages,
		hasMore: page < totalPages,
	};
}

export async function getEventBySlug(
	slug: string,
	includePending: boolean = false,
): Promise<Event | null> {
	const whereConditions = includePending
		? eq(events.slug, slug)
		: and(eq(events.slug, slug), eq(events.isApproved, true));

	const results = await db
		.select()
		.from(events)
		.where(whereConditions)
		.limit(1);

	const event = results[0] || null;

	// If this is a child event, inherit eventImageUrl from parent
	if (event?.parentEventId) {
		const [parent] = await db
			.select({ eventImageUrl: events.eventImageUrl })
			.from(events)
			.where(eq(events.id, event.parentEventId))
			.limit(1);

		if (parent) {
			return {
				...event,
				eventImageUrl: event.eventImageUrl || parent.eventImageUrl,
			};
		}
	}

	return event;
}

export async function getFeaturedEvents(limit: number = 6): Promise<Event[]> {
	const results = await db
		.select()
		.from(events)
		.where(and(eq(events.isFeatured, true), eq(events.isApproved, true)))
		.orderBy(asc(events.startDate))
		.limit(limit);

	return results;
}

export interface PlatformStats {
	totalEvents: number;
	totalPrizePool: number;
	totalCities: number;
	activeEvents: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
	const [countResult, prizeResult, citiesResult, activeResult] =
		await Promise.all([
			// Total events
			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(eq(events.isApproved, true)),
			// Total prize pool (normalized to USD, PEN converted at 3.5 exchange rate)
			db
				.select({
					total: sql<number>`COALESCE(SUM(
        CASE
          WHEN ${events.prizeCurrency} = 'PEN' THEN ${events.prizePool} / 3.5
          ELSE ${events.prizePool}
        END
      ), 0)`,
				})
				.from(events)
				.where(eq(events.isApproved, true)),
			// Unique cities
			db
				.select({ count: sql<number>`COUNT(DISTINCT ${events.city})` })
				.from(events)
				.where(
					and(eq(events.isApproved, true), sql`${events.city} IS NOT NULL`),
				),
			// Active events (ongoing + open)
			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(
					and(
						eq(events.isApproved, true),
						sql`(${events.endDate} IS NULL OR ${events.endDate} > NOW())`,
					),
				),
		]);

	return {
		totalEvents: Number(countResult[0]?.count || 0),
		totalPrizePool: Number(prizeResult[0]?.total || 0),
		totalCities: Number(citiesResult[0]?.count || 0),
		activeEvents: Number(activeResult[0]?.count || 0),
	};
}

export async function getUpcomingEvents(limit: number = 10): Promise<Event[]> {
	const results = await db
		.select()
		.from(events)
		.where(
			and(
				eq(events.isApproved, true),
				or(eq(events.status, "upcoming"), eq(events.status, "open")),
			),
		)
		.orderBy(asc(events.startDate))
		.limit(limit);

	return results;
}

export interface CreateEventInput {
	name: string;
	description?: string;
	websiteUrl?: string;
	eventType?: string;
	format?: string;
	skillLevel?: string;
	country?: string;
	department?: string;
	city?: string;
	venue?: string;
	timezone?: string;
	startDate?: string;
	endDate?: string;
	registrationDeadline?: string;
	prizePool?: number;
	prizeCurrency?: "USD" | "PEN";
	registrationUrl?: string;
	organizationId: string;
	eventImageUrl?: string;
}

export interface CreateEventResult {
	success: boolean;
	event?: Event;
	error?: string;
}

export async function createEvent(
	input: CreateEventInput,
): Promise<CreateEventResult> {
	try {
		const { userId } = await auth();

		if (!userId) {
			return { success: false, error: "No autenticado" };
		}

		if (input.organizationId) {
			const godMode = await isGodMode();

			if (!godMode) {
				const userRole = await getUserCommunityRole(input.organizationId);

				if (userRole !== "owner" && userRole !== "admin") {
					return {
						success: false,
						error: "No tienes permisos para crear eventos en esta comunidad",
					};
				}
			}
		}

		// Generate unique slug using centralized utility
		const slug = await createUniqueSlug(input.name);

		let isApproved = false;
		let approvalStatus: "pending" | "approved" = "pending";

		if (input.organizationId) {
			const [org] = await db
				.select({ isVerified: organizations.isVerified })
				.from(organizations)
				.where(eq(organizations.id, input.organizationId))
				.limit(1);

			if (org?.isVerified) {
				isApproved = true;
				approvalStatus = "approved";
			}
		}

		const eventData: NewEvent = {
			slug,
			name: input.name,
			description: input.description,
			websiteUrl: input.websiteUrl || input.registrationUrl,
			registrationUrl: input.registrationUrl || input.websiteUrl,
			eventType: (input.eventType as any) || "hackathon",
			format: (input.format as any) || "virtual",
			skillLevel: (input.skillLevel as any) || "all",
			country: input.country || "PE",
			department: input.department,
			city: input.city,
			venue: input.venue,
			timezone: input.timezone || "America/Lima",
			startDate: input.startDate ? new Date(input.startDate) : undefined,
			endDate: input.endDate ? new Date(input.endDate) : undefined,
			registrationDeadline: input.registrationDeadline
				? new Date(input.registrationDeadline)
				: undefined,
			prizePool: input.prizePool,
			prizeCurrency: (input.prizeCurrency as any) || "USD",
			eventImageUrl: input.eventImageUrl,
			status: "upcoming",
			isApproved,
			approvalStatus,
			isFeatured: false,
			organizationId: input.organizationId,
		};

		const result = await db.insert(events).values(eventData).returning();

		if (result.length === 0) {
			return { success: false, error: "Error al crear el evento" };
		}

		if (isApproved) {
			await notifySubscribersOfNewEvent({ eventId: result[0].id });
		}

		return { success: true, event: result[0] };
	} catch (error) {
		console.error("Error creating event:", error);
		return { success: false, error: "Error al crear el evento" };
	}
}

export async function approveEvent(
	eventId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await db
			.update(events)
			.set({ isApproved: true, approvalStatus: "approved" })
			.where(eq(events.id, eventId));

		// Notify subscribers of the new event
		await notifySubscribersOfNewEvent({ eventId });

		return { success: true };
	} catch (error) {
		console.error("Error approving event:", error);
		return { success: false, error: "Error al aprobar el evento" };
	}
}

export async function rejectEvent(
	eventId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await db
			.update(events)
			.set({ isApproved: false, approvalStatus: "rejected" })
			.where(eq(events.id, eventId));

		return { success: true };
	} catch (error) {
		console.error("Error rejecting event:", error);
		return { success: false, error: "Error al rechazar el evento" };
	}
}

export async function deleteEvent(
	eventId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId } = await auth();

		if (!userId) {
			return { success: false, error: "No autenticado" };
		}

		const godMode = await isGodMode();

		const event = await db.query.events.findFirst({
			where: eq(events.id, eventId),
			with: {
				organization: true,
			},
		});

		if (!event) {
			return { success: false, error: "Evento no encontrado" };
		}

		const isOwner = event.organization?.ownerUserId === userId;

		if (!godMode && !isOwner) {
			return {
				success: false,
				error: "No tienes permiso para borrar este evento",
			};
		}

		await db.delete(eventSponsors).where(eq(eventSponsors.eventId, eventId));

		await db.delete(events).where(eq(events.id, eventId));

		return { success: true };
	} catch (error) {
		console.error("Error deleting event:", error);
		return { success: false, error: "Error al borrar el evento" };
	}
}

export type ApprovalFilter = "all" | "pending" | "approved" | "rejected";

export async function getEventsByApprovalStatus(
	filter: ApprovalFilter = "pending",
): Promise<Event[]> {
	let whereClause;

	if (filter === "all") {
		whereClause = undefined;
	} else if (filter === "pending") {
		whereClause = eq(events.approvalStatus, "pending");
	} else if (filter === "approved") {
		whereClause = eq(events.approvalStatus, "approved");
	} else {
		whereClause = eq(events.approvalStatus, "rejected");
	}

	const result = await db
		.select()
		.from(events)
		.where(whereClause)
		.orderBy(desc(events.createdAt));

	return result;
}

// Keep for backwards compatibility
export async function getPendingEvents(): Promise<Event[]> {
	return getEventsByApprovalStatus("pending");
}

// ============================================
// CHILD EVENTS - For multi-day/multi-venue events
// ============================================

export async function getChildEvents(parentEventId: string): Promise<Event[]> {
	const [parent] = await db
		.select({ eventImageUrl: events.eventImageUrl })
		.from(events)
		.where(eq(events.id, parentEventId))
		.limit(1);

	const results = await db
		.select({
			event: events,
			organization: organizations,
		})
		.from(events)
		.leftJoin(organizations, eq(events.organizationId, organizations.id))
		.where(
			and(eq(events.parentEventId, parentEventId), eq(events.isApproved, true)),
		)
		.orderBy(asc(events.dayNumber), asc(events.startDate));

	if (parent) {
		return results.map((r) => ({
			...r.event,
			eventImageUrl: r.event.eventImageUrl || parent.eventImageUrl,
			organization: r.organization,
		}));
	}

	return results.map((r) => ({
		...r.event,
		organization: r.organization,
	}));
}

export async function getParentEvents(): Promise<Event[]> {
	// Get all events that have child events
	const parentIds = await db
		.selectDistinct({ parentEventId: events.parentEventId })
		.from(events)
		.where(sql`${events.parentEventId} IS NOT NULL`);

	if (parentIds.length === 0) return [];

	const ids = parentIds.map((p) => p.parentEventId).filter(Boolean) as string[];

	const results = await db.select().from(events).where(inArray(events.id, ids));

	return results;
}

// ============================================
// SPONSORS - Event sponsors/partners (using organizations)
// ============================================

export interface EventSponsorWithOrg extends EventSponsor {
	organization: Organization;
}

export async function getEventSponsors(
	eventId: string,
): Promise<EventSponsorWithOrg[]> {
	const results = await db
		.select({
			id: eventSponsors.id,
			eventId: eventSponsors.eventId,
			organizationId: eventSponsors.organizationId,
			tier: eventSponsors.tier,
			orderIndex: eventSponsors.orderIndex,
			createdAt: eventSponsors.createdAt,
			organization: organizations,
		})
		.from(eventSponsors)
		.innerJoin(
			organizations,
			eq(eventSponsors.organizationId, organizations.id),
		)
		.where(eq(eventSponsors.eventId, eventId))
		.orderBy(
			asc(sql`
        CASE ${eventSponsors.tier}
          WHEN 'platinum' THEN 1
          WHEN 'gold' THEN 2
          WHEN 'silver' THEN 3
          WHEN 'bronze' THEN 4
          WHEN 'partner' THEN 5
          WHEN 'community' THEN 6
        END
      `),
			asc(eventSponsors.orderIndex),
		);

	return results;
}

export interface AddEventSponsorInput {
	eventId: string;
	organizationId: string;
	tier?: "platinum" | "gold" | "silver" | "bronze" | "partner" | "community";
	orderIndex?: number;
}

export async function addEventSponsor(
	input: AddEventSponsorInput,
): Promise<{ success: boolean; eventSponsor?: EventSponsor; error?: string }> {
	try {
		const sponsorData: NewEventSponsor = {
			eventId: input.eventId,
			organizationId: input.organizationId,
			tier: input.tier || "partner",
			orderIndex: input.orderIndex || 0,
		};

		const result = await db
			.insert(eventSponsors)
			.values(sponsorData)
			.returning();

		if (result.length === 0) {
			return { success: false, error: "Error al agregar el sponsor" };
		}

		return { success: true, eventSponsor: result[0] };
	} catch (error) {
		console.error("Error adding event sponsor:", error);
		return { success: false, error: "Error al agregar el sponsor" };
	}
}

export async function updateEventSponsor(
	eventSponsorId: string,
	input: Partial<Omit<AddEventSponsorInput, "eventId" | "organizationId">>,
): Promise<{ success: boolean; error?: string }> {
	try {
		await db
			.update(eventSponsors)
			.set({
				tier: input.tier,
				orderIndex: input.orderIndex,
			})
			.where(eq(eventSponsors.id, eventSponsorId));

		return { success: true };
	} catch (error) {
		console.error("Error updating event sponsor:", error);
		return { success: false, error: "Error al actualizar el sponsor" };
	}
}

export async function removeEventSponsor(
	eventSponsorId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await db.delete(eventSponsors).where(eq(eventSponsors.id, eventSponsorId));
		return { success: true };
	} catch (error) {
		console.error("Error removing event sponsor:", error);
		return { success: false, error: "Error al eliminar el sponsor" };
	}
}

export async function getDepartmentsWithEvents(): Promise<string[]> {
	const result = await db
		.selectDistinct({ department: events.department })
		.from(events)
		.where(
			and(
				eq(events.isApproved, true),
				eq(events.country, "PE"),
				sql`${events.department} IS NOT NULL`,
			),
		);
	return result.map((r) => r.department).filter(Boolean) as string[];
}

export async function getCountriesWithEvents(): Promise<string[]> {
	const { ISO_TO_MAP_ID } = await import("@/lib/geo/peru-departments");
	const result = await db
		.selectDistinct({ country: events.country })
		.from(events)
		.where(
			and(
				eq(events.isApproved, true),
				sql`${events.country} IS NOT NULL`,
			),
		);
	return result
		.map((r) => r.country ? ISO_TO_MAP_ID[r.country] : null)
		.filter(Boolean) as string[];
}
