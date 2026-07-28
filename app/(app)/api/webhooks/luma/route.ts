import { tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { parseLumaWebhookPayload } from "@/lib/luma/webhook-payload";
import {
	getLumaWebhookSecrets,
	verifyLumaWebhookSignature,
} from "@/lib/luma/webhook-security";
import type { lumaWebhookProcessorTask } from "@/trigger/luma-webhook-processor";

export async function POST(request: Request) {
	try {
		const rawBody = await request.text();
		const webhookId = request.headers.get("webhook-id");
		const secrets = getLumaWebhookSecrets();

		if (secrets.length === 0) {
			console.error("[Luma Webhook] No webhook secret configured");
			return NextResponse.json(
				{ error: "Webhook is not configured" },
				{ status: 503 },
			);
		}

		const verification = verifyLumaWebhookSignature({
			secrets,
			signatureHeader: request.headers.get("webhook-signature"),
			rawBody,
		});
		if (!verification.valid) {
			console.warn("[Luma Webhook] Rejected request", {
				webhookId,
				reason: verification.reason,
			});
			return NextResponse.json(
				{ error: "Invalid webhook signature" },
				{ status: 401 },
			);
		}

		if (!webhookId) {
			return NextResponse.json(
				{ error: "Missing webhook delivery ID" },
				{ status: 400 },
			);
		}

		const body = parseLumaWebhookPayload(rawBody);
		if (!body) {
			return NextResponse.json(
				{ error: "Invalid webhook payload" },
				{ status: 400 },
			);
		}

		console.log(`[Luma Webhook] Received: ${body.type}`, {
			webhookId,
			eventId: body.data?.api_id,
			calendarId: body.data?.calendar?.id,
		});

		await tasks.trigger<typeof lumaWebhookProcessorTask>(
			"luma-webhook-processor",
			{
				event_type: body.type,
				data: body.data,
			},
			{
				idempotencyKey: webhookId,
				idempotencyKeyTTL: "30d",
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
