import { eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import type {
	CommunityDirectoryFilters,
	CommunitySizeFilter,
} from "@/lib/community-directory-filters";
import { organizations } from "@/lib/db/schema";

function getSizeCondition(
	size: CommunitySizeFilter,
	memberCountSql: SQL<number>,
) {
	if (size === "small") return sql`${memberCountSql} < 100`;
	if (size === "medium") {
		return sql`${memberCountSql} >= 100 AND ${memberCountSql} < 1000`;
	}
	return sql`${memberCountSql} >= 1000`;
}

export function getCommunityDirectoryConditions(
	filters: CommunityDirectoryFilters,
	memberCountSql: SQL<number>,
) {
	const conditions: SQL[] = [
		eq(organizations.isPublic, true),
		eq(organizations.isPersonalOrg, false),
	];

	if (filters.search) {
		conditions.push(
			or(
				ilike(organizations.name, `%${filters.search}%`),
				ilike(organizations.displayName, `%${filters.search}%`),
				ilike(organizations.description, `%${filters.search}%`),
			)!,
		);
	}

	if (filters.types.length > 0) {
		conditions.push(inArray(organizations.type, filters.types));
	}

	if (filters.countries.length > 0) {
		conditions.push(inArray(organizations.country, filters.countries));
	}

	if (filters.tags.length > 0) {
		conditions.push(
			or(
				...filters.tags.map((tag) => sql`${tag} = ANY(${organizations.tags})`),
			)!,
		);
	}

	if (filters.verification.length === 1) {
		if (filters.verification[0] === "verified") {
			conditions.push(eq(organizations.isVerified, true));
		} else {
			conditions.push(
				or(
					eq(organizations.isVerified, false),
					sql`${organizations.isVerified} IS NULL`,
				)!,
			);
		}
	}

	if (filters.sizes.length > 0) {
		conditions.push(
			or(
				...filters.sizes.map((size) => getSizeCondition(size, memberCountSql)),
			)!,
		);
	}

	return conditions;
}
