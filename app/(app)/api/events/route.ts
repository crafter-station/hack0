import { type NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/actions/events";
import { loadSearchParams } from "@/lib/search-params";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parseLimit(value: string | null) {
	const parsed = Number.parseInt(value || "", 10);
	if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
	return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
	try {
		const rawParams = Object.fromEntries(request.nextUrl.searchParams);
		const params = await loadSearchParams(rawParams);
		const hasTimeFilter = request.nextUrl.searchParams.has("timeFilter");
		const result = await getEvents({
			category: params.category,
			search: params.search,
			eventType: params.eventType,
			organizerType: params.organizerType,
			skillLevel: params.skillLevel,
			format: params.format,
			status: params.status,
			domain: params.domain,
			country: params.country,
			department: params.department,
			juniorFriendly: params.juniorFriendly,
			mine: params.mine,
			page: params.page,
			limit: parseLimit(request.nextUrl.searchParams.get("limit")),
			timeFilter: hasTimeFilter ? params.timeFilter : "upcoming",
		});

		return NextResponse.json({
			events: result.events,
			total: result.total,
			page: result.page,
			totalPages: result.totalPages,
			hasMore: result.hasMore,
		});
	} catch (error) {
		console.error("Error fetching events:", error);
		return NextResponse.json({ events: [] }, { status: 500 });
	}
}
