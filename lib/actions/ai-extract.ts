"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import { streamObject } from "ai";
import {
	type ExtractedEventData,
	eventExtractionSchema,
} from "@/lib/schemas/event-extraction";

export async function extractEventFromText(text: string) {
	const stream = createStreamableValue<Partial<ExtractedEventData>>();

	(async () => {
		const currentYear = new Date().getFullYear();

		const { partialObjectStream } = streamObject({
			model: "openai/gpt-4o-mini",
			schema: eventExtractionSchema,
			prompt: `Extract event information from this text. Current year: ${currentYear}.

Rules:
- If dates lack a year, assume ${currentYear} or ${currentYear + 1} based on context
- Keep text in its original language (Spanish/English)
- Format description with Markdown (## headers, bullet points, **bold**)
- For Peruvian events, use PEN currency; otherwise USD
- Infer event type from content (hackathon for coding competitions, meetup for casual gatherings, etc.)

Text:
${text}`,
		});

		for await (const partialObject of partialObjectStream) {
			stream.update(partialObject);
		}

		stream.done();
	})();

	return { object: stream.value };
}

export async function extractEventFromImage(imageBase64: string) {
	const stream = createStreamableValue<Partial<ExtractedEventData>>();

	(async () => {
		const currentYear = new Date().getFullYear();

		const { partialObjectStream } = streamObject({
			model: "openai/gpt-4o-mini",
			schema: eventExtractionSchema,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "image",
							image: imageBase64,
						},
						{
							type: "text",
							text: `Extract event information from this image. Current year: ${currentYear}.

Rules:
- If dates lack a year, assume ${currentYear} or ${currentYear + 1} based on context
- Keep text in its original language (Spanish/English)
- Format description with Markdown (## headers, bullet points, **bold**)
- For Peruvian events, use PEN currency; otherwise USD
- Infer event type from content`,
						},
					],
				},
			],
		});

		for await (const partialObject of partialObjectStream) {
			stream.update(partialObject);
		}

		stream.done();
	})();

	return { object: stream.value };
}

export async function extractEventFromTextAndImage(
	text: string,
	imageBase64?: string,
) {
	const stream = createStreamableValue<Partial<ExtractedEventData>>();

	(async () => {
		const currentYear = new Date().getFullYear();

		const content: Array<
			{ type: "text"; text: string } | { type: "image"; image: string }
		> = [];

		if (imageBase64) {
			content.push({
				type: "image",
				image: imageBase64,
			});
		}

		content.push({
			type: "text",
			text: `Extract event information from ${imageBase64 ? "this image and the following text" : "this text"}. Current year: ${currentYear}.

Rules:
- If dates lack a year, assume ${currentYear} or ${currentYear + 1} based on context
- Keep text in its original language (Spanish/English)
- Format description with Markdown (## headers, bullet points, **bold**)
- For Peruvian events, use PEN currency; otherwise USD
- Infer event type from content (hackathon for coding competitions, meetup for casual gatherings, workshop for hands-on sessions, etc.)

${text ? `Text:\n${text}` : ""}`,
		});

		const { partialObjectStream } = streamObject({
			model: "openai/gpt-4o-mini",
			schema: eventExtractionSchema,
			messages: [
				{
					role: "user",
					content,
				},
			],
		});

		for await (const partialObject of partialObjectStream) {
			stream.update(partialObject);
		}

		stream.done();
	})();

	return { object: stream.value };
}
