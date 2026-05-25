import { auth } from "@clerk/nextjs/server";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { normalizeCommunityDirectoryFilters } from "@/lib/community-directory-filters";
import { getCommunityDirectoryConditions } from "@/lib/community-directory-query";
import { db } from "@/lib/db";
import { communityMembers, organizations } from "@/lib/db/schema";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

type OrderBy = "popular" | "recent" | "name" | "contact" | "contact_asc";
const ORDER_BY_VALUES = [
	"popular",
	"recent",
	"name",
	"contact",
	"contact_asc",
] as const;

function isOrderBy(value: string | null): value is OrderBy {
	return ORDER_BY_VALUES.includes(value as OrderBy);
}

function parseIntegerParam(value: string | null, fallback: number) {
	const parsed = Number.parseInt(value || "", 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		const { searchParams } = new URL(request.url);

		const filters = normalizeCommunityDirectoryFilters({
			search: searchParams.get("search"),
			type: searchParams.get("type"),
			types: searchParams.get("types"),
			countries: searchParams.get("countries"),
			sizes: searchParams.get("sizes"),
			verification: searchParams.get("verification"),
			verified: searchParams.get("verified"),
			tags: searchParams.get("tags"),
		});
		const rawOrderBy = searchParams.get("orderBy");
		const orderBy = isOrderBy(rawOrderBy) ? rawOrderBy : "popular";
		const limit = Math.min(
			Math.max(parseIntegerParam(searchParams.get("limit"), DEFAULT_LIMIT), 1),
			MAX_LIMIT,
		);
		const offset = Math.max(
			parseIntegerParam(searchParams.get("offset"), 0),
			0,
		);

		const memberCountSubquery = db
			.select({
				communityId: communityMembers.communityId,
				memberCount: count().as("member_count"),
			})
			.from(communityMembers)
			.groupBy(communityMembers.communityId)
			.as("member_counts");
		const memberCountSql = sql<number>`COALESCE(${memberCountSubquery.memberCount}, 0)`;

		const conditions = getCommunityDirectoryConditions(filters, memberCountSql);

		const [{ total }] = await db
			.select({ total: count() })
			.from(organizations)
			.leftJoin(
				memberCountSubquery,
				eq(organizations.id, memberCountSubquery.communityId),
			)
			.where(and(...conditions));

		let query = db
			.select({
				id: organizations.id,
				slug: organizations.slug,
				name: organizations.name,
				displayName: organizations.displayName,
				description: organizations.description,
				type: organizations.type,
				logoUrl: organizations.logoUrl,
				coverUrl: organizations.coverUrl,
				isVerified: organizations.isVerified,
				createdAt: organizations.createdAt,
				memberCount: memberCountSql.as("member_count"),
				email: organizations.email,
				country: organizations.country,
				department: organizations.department,
				websiteUrl: organizations.websiteUrl,
				twitterUrl: organizations.twitterUrl,
				linkedinUrl: organizations.linkedinUrl,
				instagramUrl: organizations.instagramUrl,
				githubUrl: organizations.githubUrl,
			})
			.from(organizations)
			.leftJoin(
				memberCountSubquery,
				eq(organizations.id, memberCountSubquery.communityId),
			)
			.where(and(...conditions))
			.$dynamic();

		const contactCountSql = sql`(
			CASE WHEN ${organizations.websiteUrl} IS NOT NULL THEN 1 ELSE 0 END +
			CASE WHEN ${organizations.email} IS NOT NULL THEN 1 ELSE 0 END +
			CASE WHEN ${organizations.twitterUrl} IS NOT NULL THEN 1 ELSE 0 END +
			CASE WHEN ${organizations.linkedinUrl} IS NOT NULL THEN 1 ELSE 0 END +
			CASE WHEN ${organizations.instagramUrl} IS NOT NULL THEN 1 ELSE 0 END +
			CASE WHEN ${organizations.githubUrl} IS NOT NULL THEN 1 ELSE 0 END
		)`;

		if (orderBy === "popular") {
			query = query.orderBy(desc(memberCountSql));
		} else if (orderBy === "recent") {
			query = query.orderBy(desc(organizations.createdAt));
		} else if (orderBy === "name") {
			query = query.orderBy(asc(organizations.name));
		} else if (orderBy === "contact") {
			query = query.orderBy(desc(contactCountSql));
		} else if (orderBy === "contact_asc") {
			query = query.orderBy(asc(contactCountSql));
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
			coverUrl: c.coverUrl,
			isVerified: c.isVerified,
			memberCount: Number(c.memberCount),
			isFollowing: userMemberships.has(c.id),
			email: c.email,
			country: c.country,
			department: c.department,
			websiteUrl: c.websiteUrl,
			twitterUrl: c.twitterUrl,
			linkedinUrl: c.linkedinUrl,
			instagramUrl: c.instagramUrl,
			githubUrl: c.githubUrl,
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
			{ status: 500 },
		);
	}
}
