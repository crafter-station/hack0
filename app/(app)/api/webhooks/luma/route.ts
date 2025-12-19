import { tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import type { LumaWebhookPayload } from "@/lib/luma/types";
import type { lumaWebhookProcessorTask } from "@/trigger/luma-webhook-processor";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as LumaWebhookPayload;

		if (!body.event_type) {
			return NextResponse.json(
				{ error: "Invalid webhook payload: missing event_type" },
				{ status: 400 },
			);
		}

		console.log(`[Luma Webhook] Received: ${body.event_type}`, {
			eventId: body.data?.event?.api_id,
			eventName: body.data?.event?.name,
			calendarId: body.data?.calendar_api_id,
		});

		await tasks.trigger<typeof lumaWebhookProcessorTask>(
			"luma-webhook-processor",
			{
				event_type: body.event_type,
				data: body.data,
			},
		);

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("[Luma Webhook] Error processing webhook:", error);

		return NextResponse.json(
			{ error: "Failed to process webhook" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json({
		status: "ok",
		message: "Luma webhook endpoint is active",
	});
}
