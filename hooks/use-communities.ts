import { useInfiniteQuery } from "@tanstack/react-query";

export interface PublicCommunity {
	id: string;
	slug: string;
	name: string;
	displayName: string | null;
	description: string | null;
	type: string | null;
	logoUrl: string | null;
	coverUrl: string | null;
	isVerified: boolean | null;
	memberCount: number;
	isFollowing: boolean;
	email: string | null;
	country: string | null;
	department: string | null;
	websiteUrl: string | null;
	twitterUrl: string | null;
	linkedinUrl: string | null;
	instagramUrl: string | null;
	githubUrl: string | null;
}

export interface CommunitiesResponse {
	communities: PublicCommunity[];
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
}

export type OrderBy = "popular" | "recent" | "name" | "contact" | "contact_asc";

export interface UseCommunitiesParams {
	search?: string;
	type?: string;
	types?: string[];
	countries?: string[];
	sizes?: string[];
	verification?: string[];
	tags?: string[];
	verifiedOnly?: boolean;
	orderBy?: OrderBy;
	limit?: number;
	initialData?: CommunitiesResponse;
}

export function useCommunities({
	search,
	type,
	types = [],
	countries = [],
	sizes = [],
	verification = [],
	tags = [],
	verifiedOnly,
	orderBy = "popular",
	limit = 12,
	initialData,
}: UseCommunitiesParams = {}) {
	const hasInitialData = initialData !== undefined;

	return useInfiniteQuery({
		queryKey: [
			"communities",
			search,
			type,
			types,
			countries,
			sizes,
			verification,
			tags,
			verifiedOnly,
			orderBy,
		],
		queryFn: async ({ pageParam = 0 }) => {
			const params = new URLSearchParams({
				limit: limit.toString(),
				offset: pageParam.toString(),
				orderBy,
			});

			if (search) params.set("search", search);
			if (type) params.set("type", type);
			if (types.length > 0) params.set("types", types.join(","));
			if (countries.length > 0) params.set("countries", countries.join(","));
			if (sizes.length > 0) params.set("sizes", sizes.join(","));
			if (verification.length > 0) {
				params.set("verification", verification.join(","));
			}
			if (tags.length > 0) params.set("tags", tags.join(","));
			if (verifiedOnly) params.set("verified", "true");

			const response = await fetch(`/api/organizations?${params}`);

			if (!response.ok) {
				throw new Error("Failed to fetch communities");
			}

			return response.json() as Promise<CommunitiesResponse>;
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			return lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined;
		},
		initialData: initialData
			? {
					pages: [initialData],
					pageParams: [0],
				}
			: undefined,
		staleTime: hasInitialData ? 1000 * 60 * 5 : 0,
		refetchOnMount: !hasInitialData,
	});
}
