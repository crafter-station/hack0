import { z } from "zod";

export const eventExtractionSchema = z.object({
  name: z.string().describe("Event name/title"),
  description: z
    .string()
    .optional()
    .describe(
      "Event description formatted in Markdown with ## headers and bullet points"
    ),
  startDate: z
    .string()
    .optional()
    .describe("Start date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss)"),
  endDate: z
    .string()
    .optional()
    .describe("End date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss)"),
  city: z.string().optional().describe("City where the event takes place"),
  venue: z.string().optional().describe("Specific venue or location name"),
  format: z
    .enum(["virtual", "in-person", "hybrid"])
    .optional()
    .describe("Event format based on location info"),
  eventType: z
    .enum([
      "hackathon",
      "conference",
      "seminar",
      "research_fair",
      "workshop",
      "bootcamp",
      "summer_school",
      "course",
      "certification",
      "meetup",
      "networking",
      "olympiad",
      "competition",
      "robotics",
      "accelerator",
      "incubator",
      "fellowship",
      "call_for_papers",
    ])
    .optional()
    .describe("Type of event"),
  websiteUrl: z.string().optional().describe("Event website URL"),
  registrationUrl: z.string().optional().describe("Registration/signup URL"),
  prizePool: z.number().optional().describe("Prize pool amount if applicable"),
  prizeCurrency: z
    .enum(["USD", "PEN"])
    .optional()
    .describe("Currency of the prize (USD or PEN/soles)"),
  skillLevel: z
    .enum(["beginner", "intermediate", "advanced", "all"])
    .optional()
    .describe("Target skill level"),
});

export type ExtractedEventData = z.infer<typeof eventExtractionSchema>;
