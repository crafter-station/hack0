export const EVENT_SOURCE_LINK_TYPES = ["origin", "calendar_listing"] as const;
export const EVENT_SOURCE_SYNC_MODES = [
	"inbound",
	"outbound",
	"bidirectional",
] as const;

export type EventSourceLinkType = (typeof EVENT_SOURCE_LINK_TYPES)[number];
export type EventSourceSyncMode = (typeof EVENT_SOURCE_SYNC_MODES)[number];

export interface EventSourceIdentityInput {
	provider: string;
	linkType: EventSourceLinkType;
	externalId: string;
	calendarExternalId?: string | null;
}

function normalizeIdentityPart(
	value: string,
	field: string,
	maxLength: number,
) {
	const normalized = value.trim().toLowerCase();
	if (!normalized) throw new Error(`${field} is required`);
	if (normalized.length > maxLength) {
		throw new Error(`${field} cannot exceed ${maxLength} characters`);
	}
	return encodeURIComponent(normalized);
}

export function buildEventSourceIdentityKey(
	input: EventSourceIdentityInput,
): string {
	if (input.linkType === "calendar_listing" && !input.calendarExternalId) {
		throw new Error("calendarExternalId is required for calendar listings");
	}

	const provider = normalizeIdentityPart(input.provider, "provider", 50);
	const externalId = normalizeIdentityPart(input.externalId, "externalId", 255);
	const calendarExternalId = input.calendarExternalId
		? normalizeIdentityPart(input.calendarExternalId, "calendarExternalId", 255)
		: "_";

	const identityKey = [
		provider,
		input.linkType,
		calendarExternalId,
		externalId,
	].join(":");
	if (identityKey.length > 700) {
		throw new Error("Source identity exceeds the storage limit");
	}
	return identityKey;
}
