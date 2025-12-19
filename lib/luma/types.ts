export interface LumaEventHost {
	api_id: string;
	name: string;
	email?: string;
	avatar_url?: string;
	bio?: string;
}

export interface LumaEventLocation {
	type: "online" | "offline" | "hybrid";
	address?: string;
	city?: string;
	region?: string;
	country?: string;
	latitude?: number;
	longitude?: number;
	place_name?: string;
	link?: string;
}

export interface LumaTicketType {
	api_id: string;
	name: string;
	price: number;
	currency: string;
	quantity?: number;
	description?: string;
}

export interface LumaEvent {
	api_id: string;
	name: string;
	slug?: string;
	description?: string;
	description_md?: string;
	start_at: string;
	end_at?: string;
	timezone: string;
	cover_url?: string;
	url: string;
	registration_url?: string;
	location?: LumaEventLocation;
	hosts?: LumaEventHost[];
	ticket_types?: LumaTicketType[];
	visibility: "public" | "private" | "unlisted";
	status: "draft" | "published" | "cancelled";
	created_at: string;
	updated_at: string;
	calendar_api_id: string;
	geo_latitude?: number;
	geo_longitude?: number;
	geo_address_json?: string;
	meeting_url?: string;
	zoom_meeting_url?: string;
}

export interface LumaCalendar {
	api_id: string;
	name: string;
	slug?: string;
	description?: string;
	cover_url?: string;
	logo_url?: string;
	url: string;
	timezone?: string;
	created_at: string;
	social_links?: {
		twitter?: string;
		instagram?: string;
		linkedin?: string;
		website?: string;
	};
}

export interface LumaGuest {
	api_id: string;
	email: string;
	name?: string;
	avatar_url?: string;
	status: "registered" | "invited" | "waitlisted" | "declined" | "checked_in";
	created_at: string;
	registered_at?: string;
	checked_in_at?: string;
	ticket_type_api_id?: string;
	approval_status?: "pending" | "approved" | "rejected";
}

export interface LumaApiResponse<T> {
	entries: T[];
	has_more: boolean;
	next_cursor?: string;
}

export interface LumaEventResponse {
	event: LumaEvent;
}

export interface LumaCalendarEventsResponse {
	entries: { event: LumaEvent }[];
	has_more: boolean;
	next_cursor?: string;
}

export interface LumaGuestsResponse {
	entries: { guest: LumaGuest }[];
	has_more: boolean;
	next_cursor?: string;
}

export interface LumaApiErrorResponse {
	error: {
		code: string;
		message: string;
	};
}

export type LumaEventVisibility = "public" | "private" | "unlisted";
export type LumaEventStatus = "draft" | "published" | "cancelled";
export type LumaGuestStatus =
	| "registered"
	| "invited"
	| "waitlisted"
	| "declined"
	| "checked_in";
export type LumaGuestApproval = "pending" | "approved" | "rejected";

export type LumaWebhookEventType =
	| "event.created"
	| "event.updated"
	| "guest.registered"
	| "guest.updated"
	| "ticket.registered"
	| "calendar.event.added"
	| "calendar.person.subscribed";

export interface LumaWebhook {
	api_id: string;
	url: string;
	event_types: LumaWebhookEventType[];
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface LumaWebhookResponse {
	webhook: LumaWebhook;
}

export interface LumaWebhooksListResponse {
	entries: { webhook: LumaWebhook }[];
	has_more: boolean;
	next_cursor?: string;
}

export interface LumaWebhookPayload {
	event_type: LumaWebhookEventType;
	data: {
		event?: LumaEvent;
		guest?: LumaGuest;
		calendar_api_id?: string;
	};
	timestamp: string;
}
