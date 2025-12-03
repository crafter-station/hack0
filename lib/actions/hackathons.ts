"use server";

import { db } from "@/lib/db";
import { events, sponsors, type Event, type NewEvent, type Sponsor, type NewSponsor } from "@/lib/db/schema";
import { eq, and, or, ilike, sql, desc, asc, inArray, isNull } from "drizzle-orm";
import { notifySubscribersOfNewEvent } from "@/lib/email/notify-subscribers";
import { getCategoryById, type EventCategory } from "@/lib/event-categories";

// Alias for backwards compatibility
export type Hackathon = Event;

export interface HackathonFilters {
  category?: EventCategory;
  search?: string;
  eventType?: string[];
  organizerType?: string[];
  skillLevel?: string[];
  format?: string[];
  status?: string[];
  domain?: string[];
  country?: string[];
  juniorFriendly?: boolean;
  page?: number;
  limit?: number;
}

export interface HackathonsResult {
  hackathons: Hackathon[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export async function getHackathons(
  filters: HackathonFilters = {}
): Promise<HackathonsResult> {
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
      inArray(events.eventType, categoryConfig.eventTypes as any)
    );
  }

  // Event type filter (within category)
  if (eventType && eventType.length > 0) {
    conditions.push(
      or(
        ...eventType.map((t) =>
          eq(events.eventType, t as any)
        )
      )!
    );
  }

  // Organizer type filter
  if (organizerType && organizerType.length > 0) {
    conditions.push(
      or(
        ...organizerType.map((t) =>
          eq(events.organizerType, t as any)
        )
      )!
    );
  }

  // Junior friendly filter
  if (juniorFriendly) {
    conditions.push(eq(events.isJuniorFriendly, true));
  }

  // Search filter
  if (search && search.trim()) {
    conditions.push(
      or(
        ilike(events.name, `%${search}%`),
        ilike(events.description, `%${search}%`),
        ilike(events.organizerName, `%${search}%`)
      )!
    );
  }

  // Skill level filter
  if (skillLevel && skillLevel.length > 0) {
    conditions.push(
      or(
        ...skillLevel.map((level) =>
          eq(events.skillLevel, level as "beginner" | "intermediate" | "advanced" | "all")
        )
      )!
    );
  }

  // Format filter
  if (format && format.length > 0) {
    conditions.push(
      or(
        ...format.map((f) =>
          eq(events.format, f as "virtual" | "in-person" | "hybrid")
        )
      )!
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
      or(
        ...domain.map((d) => sql`${d} = ANY(${events.domains})`)
      )!
    );
  }

  // Country filter
  if (country && country.length > 0) {
    conditions.push(
      or(...country.map((c) => eq(events.country, c)))!
    );
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
  // 1 = ongoing (happening now)
  // 2 = open (registration open)
  // 3 = upcoming (hasn't started)
  // 4 = ended
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
    .select()
    .from(events)
    .where(whereClause)
    .orderBy(
      desc(events.isFeatured),      // Featured events ALWAYS first
      asc(statusPriority),          // Then: ongoing > open > upcoming > ended
      asc(dateSortOrder)            // Ended: most recent first; Active: soonest first
    )
    .limit(limit)
    .offset(offset);

  const totalPages = Math.ceil(total / limit);

  return {
    hackathons: results,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

export async function getHackathonBySlug(
  slug: string
): Promise<Hackathon | null> {
  const results = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isApproved, true)))
    .limit(1);

  return results[0] || null;
}

export async function getFeaturedHackathons(
  limit: number = 6
): Promise<Hackathon[]> {
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
  const [countResult, prizeResult, citiesResult, activeResult] = await Promise.all([
    // Total events
    db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.isApproved, true)),
    // Total prize pool (normalized to USD, PEN converted at 3.5 exchange rate)
    db.select({
      total: sql<number>`COALESCE(SUM(
        CASE
          WHEN ${events.prizeCurrency} = 'PEN' THEN ${events.prizePool} / 3.5
          ELSE ${events.prizePool}
        END
      ), 0)`
    })
      .from(events)
      .where(eq(events.isApproved, true)),
    // Unique cities
    db.select({ count: sql<number>`COUNT(DISTINCT ${events.city})` })
      .from(events)
      .where(and(eq(events.isApproved, true), sql`${events.city} IS NOT NULL`)),
    // Active events (ongoing + open)
    db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(
        eq(events.isApproved, true),
        sql`(${events.endDate} IS NULL OR ${events.endDate} > NOW())`
      )),
  ]);

  return {
    totalEvents: Number(countResult[0]?.count || 0),
    totalPrizePool: Number(prizeResult[0]?.total || 0),
    totalCities: Number(citiesResult[0]?.count || 0),
    activeEvents: Number(activeResult[0]?.count || 0),
  };
}

export async function getUpcomingHackathons(
  limit: number = 10
): Promise<Hackathon[]> {
  const results = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.isApproved, true),
        or(
          eq(events.status, "upcoming"),
          eq(events.status, "open")
        )
      )
    )
    .orderBy(asc(events.startDate))
    .limit(limit);

  return results;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export interface CreateEventInput {
  name: string;
  description?: string;
  websiteUrl: string;
  eventType?: string;
  format?: string;
  skillLevel?: string;
  country?: string;
  city?: string;
  isJuniorFriendly?: boolean;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  organizerName?: string;
  prizePool?: number;
  registrationUrl?: string;
  organizationId?: string;
}

export interface CreateEventResult {
  success: boolean;
  event?: Event;
  error?: string;
}

export async function createEvent(input: CreateEventInput): Promise<CreateEventResult> {
  try {
    // Generate unique slug
    let baseSlug = generateSlug(input.name);
    let slug = baseSlug;
    let counter = 1;

    // Check for existing slug and make unique if necessary
    while (true) {
      const existing = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.slug, slug))
        .limit(1);

      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const eventData: NewEvent = {
      slug,
      name: input.name,
      description: input.description,
      websiteUrl: input.websiteUrl,
      registrationUrl: input.registrationUrl || input.websiteUrl,
      eventType: (input.eventType as any) || "hackathon",
      format: (input.format as any) || "virtual",
      skillLevel: (input.skillLevel as any) || "all",
      country: input.country || "PE",
      city: input.city,
      isJuniorFriendly: input.isJuniorFriendly || false,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      registrationDeadline: input.registrationDeadline
        ? new Date(input.registrationDeadline)
        : undefined,
      organizerName: input.organizerName,
      prizePool: input.prizePool,
      status: "upcoming",
      isApproved: false, // Requires manual approval
      approvalStatus: "pending",
      isFeatured: false,
      organizationId: input.organizationId,
    };

    const result = await db.insert(events).values(eventData).returning();

    if (result.length === 0) {
      return { success: false, error: "Error al crear el evento" };
    }

    return { success: true, event: result[0] };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Error al crear el evento" };
  }
}

export async function approveEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
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

export async function rejectEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
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

export type ApprovalFilter = "all" | "pending" | "approved" | "rejected";

export async function getEventsByApprovalStatus(filter: ApprovalFilter = "pending"): Promise<Event[]> {
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
  const results = await db
    .select()
    .from(events)
    .where(and(
      eq(events.parentEventId, parentEventId),
      eq(events.isApproved, true)
    ))
    .orderBy(asc(events.dayNumber), asc(events.startDate));

  return results;
}

export async function getParentEvents(): Promise<Event[]> {
  // Get all events that have child events
  const parentIds = await db
    .selectDistinct({ parentEventId: events.parentEventId })
    .from(events)
    .where(sql`${events.parentEventId} IS NOT NULL`);

  if (parentIds.length === 0) return [];

  const ids = parentIds.map(p => p.parentEventId).filter(Boolean) as string[];

  const results = await db
    .select()
    .from(events)
    .where(inArray(events.id, ids));

  return results;
}

// ============================================
// SPONSORS - Event sponsors/partners
// ============================================

export async function getEventSponsors(eventId: string): Promise<Sponsor[]> {
  const results = await db
    .select()
    .from(sponsors)
    .where(eq(sponsors.eventId, eventId))
    .orderBy(
      asc(sql`
        CASE ${sponsors.tier}
          WHEN 'platinum' THEN 1
          WHEN 'gold' THEN 2
          WHEN 'silver' THEN 3
          WHEN 'bronze' THEN 4
          WHEN 'partner' THEN 5
          WHEN 'community' THEN 6
        END
      `),
      asc(sponsors.orderIndex)
    );

  return results;
}

export interface CreateSponsorInput {
  eventId: string;
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  tier?: "platinum" | "gold" | "silver" | "bronze" | "partner" | "community";
  orderIndex?: number;
}

export async function createSponsor(input: CreateSponsorInput): Promise<{ success: boolean; sponsor?: Sponsor; error?: string }> {
  try {
    const sponsorData: NewSponsor = {
      eventId: input.eventId,
      name: input.name,
      logoUrl: input.logoUrl,
      websiteUrl: input.websiteUrl,
      tier: input.tier || "partner",
      orderIndex: input.orderIndex || 0,
    };

    const result = await db.insert(sponsors).values(sponsorData).returning();

    if (result.length === 0) {
      return { success: false, error: "Error al crear el sponsor" };
    }

    return { success: true, sponsor: result[0] };
  } catch (error) {
    console.error("Error creating sponsor:", error);
    return { success: false, error: "Error al crear el sponsor" };
  }
}

export async function updateSponsor(
  sponsorId: string,
  input: Partial<CreateSponsorInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(sponsors)
      .set({
        name: input.name,
        logoUrl: input.logoUrl,
        websiteUrl: input.websiteUrl,
        tier: input.tier,
        orderIndex: input.orderIndex,
      })
      .where(eq(sponsors.id, sponsorId));

    return { success: true };
  } catch (error) {
    console.error("Error updating sponsor:", error);
    return { success: false, error: "Error al actualizar el sponsor" };
  }
}

export async function deleteSponsor(sponsorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(sponsors).where(eq(sponsors.id, sponsorId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting sponsor:", error);
    return { success: false, error: "Error al eliminar el sponsor" };
  }
}
