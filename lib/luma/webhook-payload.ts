import { z } from "zod";
import type { LumaEventData, LumaWebhookPayload } from "@/lib/luma/types";

const dateTimeString = z
	.string()
	.refine((value) => !Number.isNaN(Date.parse(value)), "Invalid datetime");

const webhookPayloadSchema = z
	.object({
		type: z.string().min(1),
		data: z
			.object({
				id: z.string().min(1),
				api_id: z.string().min(1).optional(),
				name: z.string().min(1),
				url: z.string().url(),
				start_at: dateTimeString,
				end_at: dateTimeString.nullable().optional(),
				timezone: z.string().min(1).nullable().optional(),
				cover_url: z.string().url().nullable().optional(),
				platform: z.enum(["luma", "external"]),
			})
			.passthrough(),
	})
	.passthrough();

export function parseLumaWebhookPayload(
	rawBody: string,
): LumaWebhookPayload | null {
	let value: unknown;
	try {
		value = JSON.parse(rawBody);
	} catch {
		return null;
	}

	const parsed = webhookPayloadSchema.safeParse(value);
	if (!parsed.success) return null;

	const rawData = parsed.data.data;
	const data = {
		...rawData,
		api_id: rawData.api_id ?? rawData.id,
		end_at: rawData.end_at ?? rawData.start_at,
		timezone: rawData.timezone ?? "UTC",
		cover_url: rawData.cover_url ?? null,
	} as unknown as LumaEventData;

	return {
		type: parsed.data.type,
		data,
	};
}
