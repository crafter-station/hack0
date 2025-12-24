import { useInfiniteQuery } from "@tanstack/react-query";

export interface PublicCommunity {
	id: string;
	slug: string;
	name: string;
	displayName: string | null;
	description: string | null;
	type: string | null;
	logoUrl: string | null;
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
	verifiedOnly?: boolean;
	orderBy?: OrderBy;
	limit?: number;
	initialData?: CommunitiesResponse;
}

export function useCommunities({
	search,
	type,
	verifiedOnly,
	orderBy = "popular",
	limit = 12,
	initialData,
}: UseCommunitiesParams = {}) {
	const hasInitialData = initialData !== undefined;

	return useInfiniteQuery({
		queryKey: ["communities", search, type, verifiedOnly, orderBy],
		queryFn: async ({ pageParam = 0 }) => {
			const params = new URLSearchParams({
				limit: limit.toString(),
				offset: pageParam.toString(),
				orderBy,
			});

			if (search) params.set("search", search);
			if (type) params.set("type", type);
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
