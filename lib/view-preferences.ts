import { cookies } from "next/headers";

export type EventsView = "table" | "cards" | "calendar" | "map" | "preview";
export type CommunitiesView = "cards" | "table";

const EVENTS_VIEW_COOKIE = "hack0-events-view";
const COMMUNITIES_VIEW_COOKIE = "hack0-communities-view";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getEventsViewPreference(): Promise<EventsView> {
	const cookieStore = await cookies();
	const value = cookieStore.get(EVENTS_VIEW_COOKIE)?.value;

	if (
		value &&
		["table", "cards", "calendar", "map", "preview"].includes(value)
	) {
		return value as EventsView;
	}

	return "cards"; // Default
}

export async function getCommunitiesViewPreference(): Promise<CommunitiesView> {
	const cookieStore = await cookies();
	const value = cookieStore.get(COMMUNITIES_VIEW_COOKIE)?.value;

	if (value && ["cards", "table"].includes(value)) {
		return value as CommunitiesView;
	}

	return "cards"; // Default
}

export function setEventsViewPreferenceCookie(view: EventsView): string {
	return `${EVENTS_VIEW_COOKIE}=${view}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function setCommunitiesViewPreferenceCookie(
	view: CommunitiesView,
): string {
	return `${COMMUNITIES_VIEW_COOKIE}=${view}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}
