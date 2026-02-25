export interface LumaCalendar {
	id: string;
	url: string;
	name: string;
	slug: string | null;
	website: string | null;
	avatar_url: string | null;
	description: string | null;
	is_personal: boolean;
	twitter_handle: string | null;
	youtube_handle: string | null;
	cover_image_url: string | null;
	instagram_handle: string | null;
	social_image_url: string | null;
}

export interface LumaHost {
	id: string;
	name: string;
	avatar_url: string | null;
}

export interface LumaEventData {
	id: string;
	api_id: string;
	url: string;
	name: string;
	description?: string;
	start_at: string;
	end_at: string;
	timezone: string;
	cover_url: string | null;
	calendar?: LumaCalendar;
	hosts?: LumaHost[];
	platform: string;
	geo_address_json?: {
		city?: string;
		region?: string;
		country?: string;
		latitude?: string;
		longitude?: string;
		place_id?: string;
		address?: string;
		description?: string;
		city_state?: string;
		full_address?: string;
	} | null;
	geo_latitude?: string | null;
	geo_longitude?: string | null;
	meeting_url?: string | null;
}

export interface LumaWebhookPayload {
	type: string;
	data: LumaEventData;
}

export interface LumaWebhookTaskPayload {
	event_type: string;
	data: LumaEventData;
}

export interface LumaApiEvent {
	api_id: string;
	name: string;
	description?: string;
	description_md?: string;
	start_at: string;
	end_at: string;
	timezone: string;
	cover_url: string | null;
	url: string;
	meeting_url?: string | null;
	geo_address_json?: {
		city?: string;
		region?: string;
		country?: string;
		latitude?: string;
		longitude?: string;
		place_id?: string;
		address?: string;
		description?: string;
		city_state?: string;
		full_address?: string;
	} | null;
	geo_latitude?: string | null;
	geo_longitude?: string | null;
	visibility?: string;
}
