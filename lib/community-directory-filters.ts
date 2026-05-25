import {
	COMMUNITY_TAGS,
	filterEnumValues,
	LATAM_COUNTRY_CODES,
	ORGANIZER_TYPES,
} from "@/lib/db/schema/constants";

export const COMMUNITY_SIZE_FILTERS = ["small", "medium", "large"] as const;
export const COMMUNITY_VERIFICATION_FILTERS = [
	"verified",
	"unverified",
] as const;

export type CommunitySizeFilter = (typeof COMMUNITY_SIZE_FILTERS)[number];
export type CommunityVerificationFilter =
	(typeof COMMUNITY_VERIFICATION_FILTERS)[number];

export interface CommunityDirectoryFilters {
	search?: string;
	countries: (typeof LATAM_COUNTRY_CODES)[number][];
	types: (typeof ORGANIZER_TYPES)[number][];
	sizes: CommunitySizeFilter[];
	verification: CommunityVerificationFilter[];
	tags: (typeof COMMUNITY_TAGS)[number][];
}

export interface CommunityDirectoryFilterInput {
	search?: string | null;
	countries?: string | null;
	type?: string | null;
	types?: string | null;
	sizes?: string | null;
	verification?: string | null;
	verified?: string | null;
	tags?: string | null;
}

export function splitFilterParam(value: string | null | undefined): string[] {
	return (
		value
			?.split(",")
			.map((item) => item.trim())
			.filter(Boolean) ?? []
	);
}

export function normalizeCommunityDirectoryFilters(
	input: CommunityDirectoryFilterInput,
): CommunityDirectoryFilters {
	const typeValues = [
		...splitFilterParam(input.type),
		...splitFilterParam(input.types),
	];
	const verificationValues = splitFilterParam(input.verification);

	return {
		search: input.search?.trim() || undefined,
		countries: filterEnumValues(
			LATAM_COUNTRY_CODES,
			splitFilterParam(input.countries),
		),
		types: filterEnumValues(ORGANIZER_TYPES, typeValues),
		sizes: filterEnumValues(
			COMMUNITY_SIZE_FILTERS,
			splitFilterParam(input.sizes),
		),
		verification: filterEnumValues(COMMUNITY_VERIFICATION_FILTERS, [
			...verificationValues,
			...(input.verified === "true" ? ["verified"] : []),
		]),
		tags: filterEnumValues(COMMUNITY_TAGS, splitFilterParam(input.tags)),
	};
}
