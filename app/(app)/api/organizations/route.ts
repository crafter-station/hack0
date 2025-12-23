import { auth } from "@clerk/nextjs/server";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communityMembers, organizations } from "@/lib/db/schema";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		const { searchParams } = new URL(request.url);

		const search = searchParams.get("search") || undefined;
		const type = searchParams.get("type") || undefined;
		const verifiedOnly = searchParams.get("verified") === "true";
		const orderBy = (searchParams.get("orderBy") as "popular" | "recent" | "name") || "popular";
		const limit = Math.min(
			Number.parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10),
			MAX_LIMIT
		);
		const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

		const conditions = [
			eq(organizations.isPublic, true),
			eq(organizations.isPersonalOrg, false),
		];

		if (search) {
			conditions.push(
				or(
					ilike(organizations.name, `%${search}%`),
					ilike(organizations.displayName, `%${search}%`),
					ilike(organizations.description, `%${search}%`)
				)!
			);
		}

		if (type) {
			conditions.push(eq(organizations.type, type));
		}

		if (verifiedOnly) {
			conditions.push(eq(organizations.isVerified, true));
		}

		// Get total count for pagination
		const [{ total }] = await db
			.select({ total: count() })
			.from(organizations)
			.where(and(...conditions));

		// Subquery for member count
		const memberCountSubquery = db
			.select({
				communityId: communityMembers.communityId,
				memberCount: count().as("member_count"),
			})
			.from(communityMembers)
			.groupBy(communityMembers.communityId)
			.as("member_counts");

		// Build query with member count
		let query = db
			.select({
				id: organizations.id,
				slug: organizations.slug,
				name: organizations.name,
				displayName: organizations.displayName,
				description: organizations.description,
				type: organizations.type,
				logoUrl: organizations.logoUrl,
				isVerified: organizations.isVerified,
				createdAt: organizations.createdAt,
				memberCount: sql<number>`COALESCE(${memberCountSubquery.memberCount}, 0)`.as("member_count"),
			})
			.from(organizations)
			.leftJoin(memberCountSubquery, eq(organizations.id, memberCountSubquery.communityId))
			.where(and(...conditions))
			.$dynamic();

		// Apply ordering
		if (orderBy === "popular") {
			query = query.orderBy(desc(sql`COALESCE(${memberCountSubquery.memberCount}, 0)`));
		} else if (orderBy === "recent") {
			query = query.orderBy(desc(organizations.createdAt));
		} else if (orderBy === "name") {
			query = query.orderBy(organizations.name);
		}

		const communities = await query.limit(limit).offset(offset);

		// Get user memberships if authenticated
		let userMemberships: Set<string> = new Set();
		if (userId) {
			const memberships = await db.query.communityMembers.findMany({
				where: eq(communityMembers.userId, userId),
				columns: { communityId: true },
			});
			userMemberships = new Set(memberships.map((m) => m.communityId));
		}

		const result = communities.map((c) => ({
			id: c.id,
			slug: c.slug,
			name: c.name,
			displayName: c.displayName,
			description: c.description,
			type: c.type,
			logoUrl: c.logoUrl,
			isVerified: c.isVerified,
			memberCount: Number(c.memberCount),
			isFollowing: userMemberships.has(c.id),
		}));

		const hasMore = offset + communities.length < total;

		return NextResponse.json({
			communities: result,
			total,
			limit,
			offset,
			hasMore,
		});
	} catch (error) {
		console.error("Error fetching organizations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch organizations" },
			{ status: 500 }
		);
	}
}
