import type {
	LumaApiErrorResponse,
	LumaCalendarEventsResponse,
	LumaEvent,
	LumaEventResponse,
	LumaGuest,
	LumaGuestsResponse,
	LumaWebhook,
	LumaWebhookEventType,
	LumaWebhookResponse,
	LumaWebhooksListResponse,
} from "./types";

const LUMA_API_BASE = "https://public-api.luma.com";
const RATE_LIMIT_PER_MINUTE = 300;

export interface LumaClientConfig {
	apiKey: string;
	calendarApiId?: string;
}

export class LumaApiError extends Error {
	constructor(
		public code: string,
		message: string,
		public status?: number,
	) {
		super(message);
		this.name = "LumaApiError";
	}
}

export class LumaClient {
	private apiKey: string;
	private calendarApiId?: string;
	private requestCount = 0;
	private windowStart = Date.now();

	constructor(config: LumaClientConfig) {
		this.apiKey = config.apiKey;
		this.calendarApiId = config.calendarApiId;
	}

	private async checkRateLimit(): Promise<void> {
		const now = Date.now();
		if (now - this.windowStart > 60000) {
			this.requestCount = 0;
			this.windowStart = now;
		}

		if (this.requestCount >= RATE_LIMIT_PER_MINUTE) {
			const waitTime = 60000 - (now - this.windowStart);
			await new Promise((resolve) => setTimeout(resolve, waitTime));
			this.requestCount = 0;
			this.windowStart = Date.now();
		}

		this.requestCount++;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		await this.checkRateLimit();

		const url = `${LUMA_API_BASE}${endpoint}`;
		const response = await fetch(url, {
			...options,
			headers: {
				"x-luma-api-key": this.apiKey,
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Luma API error response:", errorText);
			let errorData: LumaApiErrorResponse = { error: { code: "UNKNOWN_ERROR", message: `HTTP ${response.status}` } };
			try {
				errorData = JSON.parse(errorText) as LumaApiErrorResponse;
			} catch {
				// Keep default error
			}
			throw new LumaApiError(
				errorData.error?.code || "UNKNOWN_ERROR",
				errorData.error?.message || `HTTP ${response.status}: ${errorText}`,
				response.status,
			);
		}

		return response.json() as Promise<T>;
	}

	async getEvent(eventId: string): Promise<LumaEvent> {
		const params = new URLSearchParams({ id: eventId });
		const response = await this.request<LumaEventResponse>(
			`/v1/event/get?${params}`,
		);
		return response.event;
	}

	async getEventBySlug(slug: string): Promise<LumaEvent> {
		const params = new URLSearchParams({ slug });
		const response = await this.request<LumaEventResponse>(
			`/v1/calendar/lookup-event?${params}`,
		);
		return response.event;
	}

	async listCalendarEvents(options?: {
		cursor?: string;
		after?: Date;
		before?: Date;
	}): Promise<{
		events: LumaEvent[];
		hasMore: boolean;
		nextCursor?: string;
	}> {
		const params = new URLSearchParams();
		if (options?.cursor) params.set("cursor", options.cursor);
		if (options?.after) params.set("after", options.after.toISOString());
		if (options?.before) params.set("before", options.before.toISOString());

		const response = await this.request<LumaCalendarEventsResponse>(
			`/v1/calendar/list-events?${params}`,
		);

		return {
			events: response.entries.map((e) => e.event),
			hasMore: response.has_more,
			nextCursor: response.next_cursor,
		};
	}

	async getAllCalendarEvents(options?: {
		after?: Date;
		before?: Date;
	}): Promise<LumaEvent[]> {
		const allEvents: LumaEvent[] = [];
		let cursor: string | undefined;
		let hasMore = true;

		while (hasMore) {
			const result = await this.listCalendarEvents({
				cursor,
				...options,
			});

			allEvents.push(...result.events);
			hasMore = result.hasMore;
			cursor = result.nextCursor;
		}

		return allEvents;
	}

	async getEventGuests(
		eventApiId: string,
		options?: {
			cursor?: string;
			status?:
				| "registered"
				| "waitlisted"
				| "invited"
				| "declined"
				| "checked_in";
		},
	): Promise<{
		guests: LumaGuest[];
		hasMore: boolean;
		nextCursor?: string;
	}> {
		const params = new URLSearchParams({ event_api_id: eventApiId });
		if (options?.cursor) params.set("cursor", options.cursor);
		if (options?.status) params.set("status", options.status);

		const response = await this.request<LumaGuestsResponse>(
			`/v1/event/get-guests?${params}`,
		);

		return {
			guests: response.entries.map((e) => e.guest),
			hasMore: response.has_more,
			nextCursor: response.next_cursor,
		};
	}

	async getAllEventGuests(
		eventApiId: string,
		status?:
			| "registered"
			| "waitlisted"
			| "invited"
			| "declined"
			| "checked_in",
	): Promise<LumaGuest[]> {
		const allGuests: LumaGuest[] = [];
		let cursor: string | undefined;
		let hasMore = true;

		while (hasMore) {
			const result = await this.getEventGuests(eventApiId, { cursor, status });
			allGuests.push(...result.guests);
			hasMore = result.hasMore;
			cursor = result.nextCursor;
		}

		return allGuests;
	}

	async createImageUploadUrl(
		contentType?: string,
	): Promise<{ upload_url: string; file_url: string }> {
		return this.request("/v1/images/create-upload-url", {
			method: "POST",
			body: JSON.stringify({
				purpose: "event-cover",
				content_type: contentType || "image/jpeg",
			}),
		});
	}

	async uploadCoverImage(imageUrl: string): Promise<string | null> {
		try {
			const imageResponse = await fetch(imageUrl);
			if (!imageResponse.ok) {
				console.error("Failed to fetch image from URL:", imageUrl);
				return null;
			}

			const imageBlob = await imageResponse.blob();
			const contentType = imageBlob.type || "image/jpeg";

			const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
			if (!supportedTypes.includes(contentType)) {
				console.error(`Luma does not support image type: ${contentType}. Supported: ${supportedTypes.join(", ")}`);
				return null;
			}

			const { upload_url, file_url } = await this.createImageUploadUrl(contentType);

			const uploadResponse = await fetch(upload_url, {
				method: "PUT",
				body: imageBlob,
				headers: { "Content-Type": contentType },
			});

			if (!uploadResponse.ok) {
				const errorText = await uploadResponse.text();
				console.error("Failed to upload image to Luma CDN:", uploadResponse.status, errorText);
				return null;
			}

			console.log("Successfully uploaded image to Luma CDN:", file_url);
			return file_url;
		} catch (error) {
			console.error("Error uploading cover image to Luma:", error);
			return null;
		}
	}

	async createEvent(data: {
		name: string;
		start_at: string;
		timezone: string;
		end_at?: string;
		description_md?: string;
		cover_url?: string;
		geo_address_json?: {
			address?: string;
			city?: string;
			region?: string;
			country?: string;
		};
		meeting_url?: string;
		visibility?: "public" | "members-only" | "private";
		max_capacity?: number | null;
	}): Promise<{ api_id: string }> {
		const response = await this.request<{ api_id: string }>(
			"/v1/event/create",
			{
				method: "POST",
				body: JSON.stringify(data),
			},
		);
		return response;
	}

	async updateEvent(
		eventApiId: string,
		data: Partial<{
			name: string;
			start_at: string;
			end_at: string;
			timezone: string;
			description: string;
			cover_url: string;
		}>,
	): Promise<LumaEvent> {
		const response = await this.request<LumaEventResponse>("/v1/event/update", {
			method: "POST",
			body: JSON.stringify({
				event_api_id: eventApiId,
				...data,
			}),
		});
		return response.event;
	}

	async listWebhooks(): Promise<LumaWebhook[]> {
		const response =
			await this.request<LumaWebhooksListResponse>("/v1/webhooks/list");
		return response.entries.map((e) => e.webhook);
	}

	async getWebhook(webhookApiId: string): Promise<LumaWebhook> {
		const params = new URLSearchParams({ webhook_api_id: webhookApiId });
		const response = await this.request<LumaWebhookResponse>(
			`/v1/webhooks/get?${params}`,
		);
		return response.webhook;
	}

	async createWebhook(data: {
		url: string;
		event_types: LumaWebhookEventType[];
	}): Promise<LumaWebhook> {
		const response = await this.request<LumaWebhookResponse>(
			"/v1/webhooks/create",
			{
				method: "POST",
				body: JSON.stringify(data),
			},
		);
		return response.webhook;
	}

	async updateWebhook(
		webhookApiId: string,
		data: Partial<{
			url: string;
			event_types: LumaWebhookEventType[];
			is_active: boolean;
		}>,
	): Promise<LumaWebhook> {
		const response = await this.request<LumaWebhookResponse>(
			"/v1/webhooks/update",
			{
				method: "POST",
				body: JSON.stringify({
					webhook_api_id: webhookApiId,
					...data,
				}),
			},
		);
		return response.webhook;
	}

	async deleteWebhook(webhookApiId: string): Promise<void> {
		await this.request("/v1/webhooks/delete", {
			method: "POST",
			body: JSON.stringify({ webhook_api_id: webhookApiId }),
		});
	}

	async addEventToCalendar(params: {
		event_api_id: string;
	}): Promise<{ success: boolean; error?: string }> {
		try {
			await this.request("/v1/calendar/add-event", {
				method: "POST",
				body: JSON.stringify({
					platform: "luma",
					event_api_id: params.event_api_id,
				}),
			});
			return { success: true };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			return { success: false, error: message };
		}
	}
}

export function createLumaClient(apiKey: string): LumaClient {
	return new LumaClient({ apiKey });
}

let globalClient: LumaClient | null = null;

export function getGlobalLumaClient(): LumaClient {
	if (globalClient) {
		return globalClient;
	}

	const apiKey = process.env.LUMA_API_KEY;
	if (!apiKey) {
		throw new Error(
			"LUMA_API_KEY environment variable is not configured. Please add your Luma API key to the environment variables.",
		);
	}

	globalClient = new LumaClient({ apiKey });
	return globalClient;
}
