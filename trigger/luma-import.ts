import { task, metadata } from "@trigger.dev/sdk/v3";
import Firecrawl from "@mendable/firecrawl-js";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { importJobs, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  type LumaExtractedData,
  inferEventType,
  inferCountryFromCity,
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
          {
            type: "json",
            prompt: `Extract event information from this Luma event page. Return a JSON object with:
- name (string, event title)
- description (string, formatted in MARKDOWN with ## headers, bullet points with -, and **bold** for key info. Structure it with sections like: ## Sobre el evento, ## ¿Qué incluye?, ## Requisitos, ## Premios, etc. as appropriate)
- startDate (ISO 8601 string)
- endDate (ISO 8601 string)
- location (object with venue, city, country, isVirtual boolean)
- imageUrl (string, banner/cover image URL)
- organizerName (string)
- registrationUrl (string)`,
          },
        ],
      });

      if (!result.json) {
        console.error("Firecrawl result:", JSON.stringify(result, null, 2));
        throw new Error("No JSON data extracted from Luma page");
      }

      const extracted = result.json as LumaExtractedData;

      let imageUrl = extracted.imageUrl;
      if (!imageUrl && result.metadata?.ogImage) {
        imageUrl = result.metadata.ogImage as string;
      }

      metadata.set("name", extracted.name || "");
      metadata.set("description", extracted.description || "");
      metadata.set("startDate", extracted.startDate || "");
      metadata.set("endDate", extracted.endDate || "");
      metadata.set("city", extracted.location?.city || "");
      metadata.set("venue", extracted.location?.venue || "");
      metadata.set(
        "format",
        extracted.location?.isVirtual ? "virtual" : "in-person"
      );
      metadata.set("organizerName", extracted.organizerName || "");
      metadata.set("registrationUrl", extracted.registrationUrl || lumaUrl);
      metadata.set("websiteUrl", lumaUrl);
      metadata.set("sourceImageUrl", imageUrl || "");

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

      const eventType = inferEventType(
        extracted.name,
        extracted.description
      );
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
            startDate: extracted.startDate
              ? new Date(extracted.startDate)
              : null,
            endDate: extracted.endDate ? new Date(extracted.endDate) : null,
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
          })
          .returning();

        await db
          .update(importJobs)
          .set({ eventId: newEvent.id })
          .where(eq(importJobs.id, jobId));

        metadata.set("eventId", newEvent.id);
        metadata.set("eventSlug", newEvent.slug);
        metadata.set("isVerified", isVerified);
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
