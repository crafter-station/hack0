/** @jsxImportSource react */
import { ImageResponse } from "@takumi-rs/image-response";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import sharp from "sharp";
import { EventOGTemplate } from "@/components/og/event-template";
import { db } from "@/lib/db";
import { events, organizations } from "@/lib/db/schema";
import {
	formatEventDateSmart,
	getEventStatus,
	getEventTypeLabel,
} from "@/lib/event-utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const slug = searchParams.get("slug");
		const code = searchParams.get("code");

		if (!slug && !code) {
			return new Response("Missing slug or code parameter", { status: 400 });
		}

		const results = await db
			.select({
				event: events,
				organization: organizations,
			})
			.from(events)
			.leftJoin(organizations, eq(events.organizationId, organizations.id))
			.where(code ? eq(events.shortCode, code) : eq(events.slug, slug!))
			.limit(1);

		if (!results[0]) {
			return new Response("Event not found", { status: 404 });
		}

		const { event, organization } = results[0];

		const startDate = event.startDate ? new Date(event.startDate) : null;
		const status = getEventStatus(event);
		const eventTypeLabel = getEventTypeLabel(event.eventType);

		const prizePool =
			event.prizePool && event.prizePool > 0
				? `${event.prizeCurrency === "PEN" ? "S/" : "$"}${event.prizePool.toLocaleString()}`
				: undefined;

		const location =
			event.format === "virtual"
				? "Virtual"
				: event.department || event.city || "Perú";

		const dateStr = startDate
			? formatEventDateSmart(startDate)
			: "Por confirmar";

		let eventImageDataUri: string | undefined;
		if (event.eventImageUrl) {
			try {
				const imageResponse = await fetch(event.eventImageUrl);
				if (imageResponse.ok) {
					const imageBuffer = await imageResponse.arrayBuffer();
					const base64 = Buffer.from(imageBuffer).toString("base64");
					const contentType =
						imageResponse.headers.get("content-type") || "image/jpeg";
					eventImageDataUri = `data:${contentType};base64,${base64}`;
				}
			} catch (imgError) {
				console.error("Failed to fetch event image:", imgError);
			}
		}

		const isJuniorFriendly = event.skillLevel === "beginner" || event.skillLevel === "all";

		const pngResponse = new ImageResponse(
			<EventOGTemplate
				eventName={event.name}
				organizerName={
					organization?.displayName || organization?.name || "hack0.dev"
				}
				eventImage={eventImageDataUri}
				date={dateStr ?? "Por confirmar"}
				location={location}
				prizePool={prizePool}
				eventType={eventTypeLabel}
				isJuniorFriendly={isJuniorFriendly}
				status={status.status}
			/>,
			{
				width: 1200,
				height: 630,
				format: "png",
			},
		);

		const pngBuffer = await pngResponse.arrayBuffer();
		const jpegBuffer = await sharp(Buffer.from(pngBuffer))
			.jpeg({ quality: 72, progressive: true })
			.toBuffer();

		return new Response(jpegBuffer, {
			headers: {
				"Content-Type": "image/jpeg",
				"Cache-Control": "public, max-age=86400, s-maxage=86400",
			},
		});
	} catch (error) {
		console.error("OG Image generation error:", error);
		return new Response("Failed to generate image", { status: 500 });
	}
}
