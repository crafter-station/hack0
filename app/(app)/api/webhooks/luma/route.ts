import { tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import type { LumaWebhookPayload } from "@/lib/luma/types";
import type { lumaWebhookProcessorTask } from "@/trigger/luma-webhook-processor";

export async function POST(request: Request) {
	try {
		const rawBody = await request.text();
		console.log("[Luma Webhook] Raw payload:", rawBody);

		const body = JSON.parse(rawBody) as LumaWebhookPayload;

		if (!body.type) {
			console.error("[Luma Webhook] Missing type. Keys:", Object.keys(body));
			return NextResponse.json(
				{ error: "Invalid webhook payload: missing type" },
				{ status: 400 },
			);
		}

		console.log(`[Luma Webhook] Received: ${body.type}`, {
			eventId: body.data?.api_id,
			eventName: body.data?.name,
			calendarId: body.data?.calendar?.id,
		});

		await tasks.trigger<typeof lumaWebhookProcessorTask>(
			"luma-webhook-processor",
			{
				event_type: body.type,
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
