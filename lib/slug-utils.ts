import { and, eq, isNull, ne } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

/**
 * Generates a URL-safe slug from a string
 * - Converts to lowercase
 * - Removes accents (á → a, ñ → n, etc.)
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start/end
 *
 * @example
 * generateSlug("Hackathon MINEDU 2025") // "hackathon-minedu-2025"
 * generateSlug("V Congreso de Tecnología, Innovación y Hab...") // "v-congreso-de-tecnologia-innovacion-y-hab"
 * generateSlug("Perú Fintech Forum") // "peru-fintech-forum"
 */
export function generateSlug(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.normalize("NFD") // Decompose accented characters
		.replace(/[\u0300-\u036f]/g, "") // Remove diacritics
		.replace(/ñ/g, "n") // Handle Spanish ñ specifically
		.replace(/[^a-z0-9\s-]/g, "") // Remove all non-alphanumeric except spaces and hyphens
		.trim()
		.replace(/\s+/g, "-") // Replace spaces with hyphens
		.replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
		.replace(/^-+|-+$/g, ""); // Trim hyphens from start and end
}

/**
 * Ensures a slug is unique in the database by appending a number suffix if needed
 *
 * @param baseSlug - The desired slug
 * @param existingId - Optional event ID to exclude from uniqueness check (for updates)
 * @returns A unique slug, potentially with -2, -3, etc. appended
 *
 * @example
 * // If "hackathon-2025" exists:
 * await ensureUniqueSlug("hackathon-2025") // "hackathon-2025-2"
 *
 * // Updating existing event (exclude self from check):
 * await ensureUniqueSlug("hackathon-2025", "event-uuid") // "hackathon-2025" if it's the same event
 */
export async function ensureUniqueSlug(
	baseSlug: string,
	existingId?: string,
): Promise<string> {
	let slug = baseSlug;
	let counter = 2;
	let isUnique = false;

	while (!isUnique) {
		// Check if slug exists (excluding the event being updated)
		const existing = await db
			.select({ id: events.id })
			.from(events)
			.where(
				existingId
					? and(eq(events.slug, slug), ne(events.id, existingId))
					: eq(events.slug, slug),
			)
			.limit(1);

		if (existing.length === 0) {
			isUnique = true;
		} else {
			// Append counter and try again
			slug = `${baseSlug}-${counter}`;
			counter++;
		}
	}

	return slug;
}

/**
 * Generates a unique slug from event name
 * Convenience function that combines generateSlug + ensureUniqueSlug
 *
 * @param name - Event name
 * @param existingId - Optional event ID for updates
 * @returns A unique, URL-safe slug
 *
 * @example
 * await createUniqueSlug("HackAru 2025") // "hackaru-2025"
 * await createUniqueSlug("HackAru 2025") // "hackaru-2025-2" (if first one exists)
 */
export async function createUniqueSlug(
	name: string,
	existingId?: string,
): Promise<string> {
	const baseSlug = generateSlug(name);
	return ensureUniqueSlug(baseSlug, existingId);
}

/**
 * Validates that a slug meets format requirements
 * - Only lowercase letters, numbers, and hyphens
 * - No consecutive hyphens
 * - No leading/trailing hyphens
 * - Minimum 1 character
 *
 * @param slug - The slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidSlugFormat(slug: string): boolean {
	if (!slug || slug.length === 0) return false;

	// Must match: lowercase alphanumeric and hyphens only
	if (!/^[a-z0-9-]+$/.test(slug)) return false;

	// No consecutive hyphens
	if (/--/.test(slug)) return false;

	// No leading or trailing hyphens
	if (slug.startsWith("-") || slug.endsWith("-")) return false;

	return true;
}

/**
 * Zod schema for validating slug format
 * Use this for API validation, form validation, etc.
 *
 * @example
 * const schema = z.object({ slug: slugSchema });
 * schema.parse({ slug: "hackathon-2025" }); // OK
 * schema.parse({ slug: "INVALID-SLUG" }); // Throws error
 */
export const slugSchema = z
	.string()
	.min(1, "Slug cannot be empty")
	.max(200, "Slug is too long")
	.regex(
		/^[a-z0-9-]+$/,
		"Slug must contain only lowercase letters, numbers, and hyphens",
	)
	.regex(/^[^-]/, "Slug cannot start with a hyphen")
	.regex(/[^-]$/, "Slug cannot end with a hyphen")
	.regex(/^(?!.*--).*$/, "Slug cannot contain consecutive hyphens")
	.describe("A URL-safe slug identifier");

/**
 * Zod refinement for checking slug uniqueness in database
 * Use with .refine() for async validation
 *
 * @example
 * const schema = z.object({
 *   slug: slugSchema.refine(isSlugUnique, "Slug already exists")
 * });
 */
export const isSlugUnique = async (slug: string, existingId?: string) => {
	const existing = await db
		.select({ id: events.id })
		.from(events)
		.where(
			existingId
				? and(eq(events.slug, slug), ne(events.id, existingId))
				: eq(events.slug, slug),
		)
		.limit(1);

	return existing.length === 0;
};

export function generateShortCode(): string {
	return nanoid();
}

export async function ensureUniqueShortCode(): Promise<string> {
	let code = nanoid();
	let isUnique = false;

	while (!isUnique) {
		const existing = await db
			.select({ id: events.id })
			.from(events)
			.where(eq(events.shortCode, code))
			.limit(1);

		if (existing.length === 0) {
			isUnique = true;
		} else {
			code = nanoid();
		}
	}

	return code;
}
