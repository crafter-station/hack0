import { canonicalizeEventUrl } from "@/lib/scraper/deduplicator";

export interface EventSourceSuppression {
	reason: "duplicate";
	canonicalEventId: string;
	note: string;
}

const EVENT_SOURCE_SUPPRESSIONS = new Map<string, EventSourceSuppression>([
	[
		"luma.com/hveetdob",
		{
			reason: "duplicate",
			canonicalEventId: "19846e8e-c0aa-49d2-a5d9-f0c6546e7407",
			note: "Duplicate listing for Zero to Agent: Lima",
		},
	],
]);

export function getEventSourceSuppression(
	url: string | null | undefined,
): EventSourceSuppression | null {
	const canonicalUrl = canonicalizeEventUrl(url);
	if (!canonicalUrl) return null;
	return EVENT_SOURCE_SUPPRESSIONS.get(canonicalUrl) ?? null;
}
