import Firecrawl from "@mendable/firecrawl-js";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { events, importJobs } from "@/lib/db/schema";
import { getGlobalLumaClient } from "@/lib/luma";
import { computeContentHash } from "@/lib/luma/host-resolver";
import {
	inferCountryFromCity,
	inferEventType,
	type LumaExtractedData,
} from "@/lib/scraper/luma-schema";
import { createUniqueSlug } from "@/lib/slug-utils";

export const lumaImportTask = task({
	id: "luma-import",
	maxDuration: 120,
	run: async (payload: {
		jobId: string;
		lumaUrl: string;
		organizationId: string;
		isVerified: boolean;
		autoPublish: boolean;
	}) => {
		const { jobId, lumaUrl, organizationId, isVerified, autoPublish } = payload;

		metadata.set("step", "extracting");
		metadata.set("lumaUrl", lumaUrl);

		try {
			await db
				.update(importJobs)
				.set({ status: "processing" })
				.where(eq(importJobs.id, jobId));

			const firecrawl = new Firecrawl({
				apiKey: process.env.FIRECRAWL_API_KEY!,
			});

			const result = await firecrawl.scrape(lumaUrl, {
				formats: [
					"markdown",
					"html",
					"links",
					{
						type: "json",
						prompt: `Extract event information from this Luma event page. Return a JSON object with:
- name (string, event title)
- description (string, formatted in MARKDOWN with ## headers, bullet points with -, and **bold** for key info. Structure it with sections like: ## Sobre el evento, ## ¿Qué incluye?, ## Requisitos, ## Premios, etc. as appropriate)
- startDate (ISO 8601 string)
- endDate (ISO 8601 string)
- location (object with venue, city, country, isVirtual boolean)
- organizerName (string)
- registrationUrl (string)
- eventType (string, choose the MOST APPROPRIATE option from this list based on the event content and description):
  * "hackathon" - Programming competitions, hack events
  * "conference" - Conferences, congresses, symposiums
  * "seminar" - Seminars, talks, presentations
  * "research_fair" - Science fairs, poster sessions
  * "workshop" - Practical workshops, hands-on sessions
  * "bootcamp" - Intensive training programs
  * "summer_school" - Summer/winter schools
  * "course" - Courses, diplomas
  * "certification" - Certification programs
  * "meetup" - Community meetups, casual gatherings
  * "networking" - Networking events, mixers
  * "olympiad" - Academic olympiads (math, physics, programming)
  * "competition" - General competitions
  * "robotics" - Robotics tournaments
  * "accelerator" - Acceleration programs
  * "incubator" - Incubator programs
  * "fellowship" - Fellowships, scholarships
  * "call_for_papers" - Academic calls for papers

  IMPORTANT: Choose the option that BEST matches the event's main purpose. For example:
  - If it's a casual community gathering or meetup → use "meetup"
  - If it's focused on professional connections → use "networking"
  - If it's a coding competition → use "hackathon"
  - If it's a talk or presentation series → use "seminar"`,
					},
				],
			});

			if (!result.json) {
				console.error("Firecrawl result:", JSON.stringify(result, null, 2));
				throw new Error("No JSON data extracted from Luma page");
			}

			const extracted = result.json as LumaExtractedData;

			let imageUrl: string | undefined;

			if (result.html) {
				const lumaImageRegex = /https:\/\/images\.lumacdn\.com\/[^\s"'<>]+/g;
				const matches = result.html.match(lumaImageRegex);

				if (matches && matches.length > 0) {
					imageUrl = matches[0];
					console.log("Found Luma CDN image:", imageUrl);
				}
			}

			if (!imageUrl && extracted.imageUrl) {
				const llmImage = extracted.imageUrl;
				if (
					llmImage &&
					!llmImage.includes("placeholder") &&
					!llmImage.includes("_url_here") &&
					!llmImage.includes("example.") &&
					llmImage.startsWith("http") &&
					llmImage.includes("lumacdn.com")
				) {
					imageUrl = llmImage;
				}
			}

			metadata.set("name", extracted.name || "");
			metadata.set("description", extracted.description || "");
			metadata.set("startDate", extracted.startDate || "");
			metadata.set("endDate", extracted.endDate || "");
			metadata.set("city", extracted.location?.city || "");
			metadata.set("venue", extracted.location?.venue || "");
			metadata.set(
				"format",
				extracted.location?.isVirtual ? "virtual" : "in-person",
			);
			metadata.set("organizerName", extracted.organizerName || "");
			metadata.set("registrationUrl", extracted.registrationUrl || lumaUrl);
			metadata.set("websiteUrl", lumaUrl);
			metadata.set("sourceImageUrl", imageUrl || "");
			metadata.set("eventType", extracted.eventType || "");

			metadata.set("step", "uploading_image");

			let eventImageUrl: string | null = null;
			if (imageUrl) {
				try {
					const utapi = new UTApi();
					const uploadResult = await utapi.uploadFilesFromUrl(imageUrl);

					if (uploadResult.data?.url) {
						eventImageUrl = uploadResult.data.url;
						metadata.set("eventImageUrl", eventImageUrl);
					}
				} catch (uploadError) {
					console.error("Failed to upload image:", uploadError);
				}
			}

			metadata.set("step", "completed");

			const eventType =
				extracted.eventType ||
				inferEventType(extracted.name, extracted.description);
			const country = inferCountryFromCity(extracted.location?.city);

			await db
				.update(importJobs)
				.set({
					status: "completed",
					extractedData: JSON.stringify({
						...extracted,
						eventImageUrl,
						eventType,
						country,
					}),
					completedAt: new Date(),
				})
				.where(eq(importJobs.id, jobId));

			if (autoPublish) {
				metadata.set("step", "publishing");

				const slug = await createUniqueSlug(extracted.name);

				const startDate = extracted.startDate
					? new Date(extracted.startDate)
					: null;
				const endDate = extracted.endDate ? new Date(extracted.endDate) : null;

				const sourceContentHash = computeContentHash({
					name: extracted.name,
					description: extracted.description,
					startDate,
					endDate,
					venue: extracted.location?.venue,
				});

				const [newEvent] = await db
					.insert(events)
					.values({
						slug,
						name: extracted.name,
						description: extracted.description || null,
						eventType: eventType as
							| "hackathon"
							| "conference"
							| "seminar"
							| "research_fair"
							| "workshop"
							| "bootcamp"
							| "summer_school"
							| "course"
							| "certification"
							| "meetup"
							| "networking"
							| "olympiad"
							| "competition"
							| "robotics"
							| "accelerator"
							| "incubator"
							| "fellowship"
							| "call_for_papers",
						startDate,
						endDate,
						format: extracted.location?.isVirtual ? "virtual" : "in-person",
						country,
						city: extracted.location?.city || null,
						venue: extracted.location?.venue || null,
						websiteUrl: lumaUrl,
						registrationUrl: extracted.registrationUrl || lumaUrl,
						eventImageUrl,
						organizationId,
						isApproved: isVerified,
						approvalStatus: isVerified ? "approved" : "pending",
						status: "upcoming",
						ownership: "referenced",
						sourceContentHash,
						lastSourceCheckAt: new Date(),
						syncStatus: "synced",
					})
					.returning();

				await db
					.update(importJobs)
					.set({ eventId: newEvent.id })
					.where(eq(importJobs.id, jobId));

				metadata.set("eventId", newEvent.id);
				metadata.set("eventSlug", newEvent.slug);
				metadata.set("isVerified", isVerified);

				metadata.set("step", "adding_to_hack0_calendar");
				try {
					const lumaClient = getGlobalLumaClient();
					const lumaSlug = lumaUrl.split("/").pop();
					if (lumaSlug) {
						const lumaEvent = await lumaClient.getEventBySlug(lumaSlug);
						const addResult = await lumaClient.addEventToCalendar({
							event_api_id: lumaEvent.api_id,
						});
						metadata.set("addedToHack0Calendar", addResult.success);
						if (addResult.error) {
							metadata.set("addToCalendarError", addResult.error);
						}
					} else {
						metadata.set("addedToHack0Calendar", false);
						metadata.set("addToCalendarError", "Could not extract slug from Luma URL");
					}
				} catch (addError) {
					metadata.set("addedToHack0Calendar", false);
					metadata.set(
						"addToCalendarError",
						addError instanceof Error ? addError.message : "Unknown error",
					);
				}

				metadata.set("step", "published");

				return {
					success: true,
					autoPublished: true,
					eventId: newEvent.id,
					eventSlug: newEvent.slug,
				};
			}

			return {
				success: true,
				autoPublished: false,
				data: {
					name: extracted.name,
					description: extracted.description,
					startDate: extracted.startDate,
					endDate: extracted.endDate,
					city: extracted.location?.city,
					venue: extracted.location?.venue,
					format: extracted.location?.isVirtual ? "virtual" : "in-person",
					eventImageUrl,
					organizerName: extracted.organizerName,
					websiteUrl: lumaUrl,
					registrationUrl: extracted.registrationUrl || lumaUrl,
					eventType,
					country,
				},
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			metadata.set("step", "error");
			metadata.set("error", errorMessage);

			await db
				.update(importJobs)
				.set({
					status: "failed",
					errorMessage,
					completedAt: new Date(),
				})
				.where(eq(importJobs.id, jobId));

			throw error;
		}
	},
});
