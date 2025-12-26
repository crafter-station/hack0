#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { externalCalendars } from "../lib/db/schema";
import { getGlobalLumaClient } from "../lib/luma/client";

interface CommunityInput {
	luma_slug: string;
	name: string;
	city?: string;
	focus_area?: string;
	source_url?: string;
}

interface FirecrawlOutput {
	communities: CommunityInput[];
	discoveredAt?: string;
	source?: string;
}

const PERU_TECH_CALENDARS: CommunityInput[] = [
	{ luma_slug: "crafter-station", name: "Crafter Station", city: "Lima" },
	{ luma_slug: "tribuia", name: "Tribu IA", city: "Lima" },
	{ luma_slug: "sunday-peru", name: "Sunday Peru", city: "Lima" },
	{
		luma_slug: "indie-hackers-aqp",
		name: "Indie Hackers AQP",
		city: "Arequipa",
	},
	{ luma_slug: "gdg-lima", name: "GDG Lima", city: "Lima" },
	{ luma_slug: "aws-peru", name: "AWS User Group Peru", city: "Lima" },
	{ luma_slug: "pythonperu", name: "Python Peru", city: "Lima" },
	{ luma_slug: "javascript-peru", name: "JavaScript Peru", city: "Lima" },
	{ luma_slug: "lima-valley", name: "Lima Valley", city: "Lima" },
	{ luma_slug: "startup-peru", name: "Startup Peru", city: "Lima" },
];

function loadFromFile(filePath: string): CommunityInput[] {
	const fullPath = path.resolve(process.cwd(), filePath);

	if (!fs.existsSync(fullPath)) {
		console.error(`❌ File not found: ${fullPath}`);
		process.exit(1);
	}

	const content = fs.readFileSync(fullPath, "utf-8");
	const data: FirecrawlOutput = JSON.parse(content);

	if (!data.communities || !Array.isArray(data.communities)) {
		console.error("❌ Invalid JSON format: expected { communities: [...] }");
		process.exit(1);
	}

	console.log(`📁 Loaded ${data.communities.length} communities from file`);
	if (data.discoveredAt) {
		console.log(`   Discovered at: ${data.discoveredAt}`);
	}
	if (data.source) {
		console.log(`   Source: ${data.source}`);
	}

	return data.communities;
}

async function main() {
	const seedSource = process.env.SEED_SOURCE || "hardcoded";
	const filePath = process.env.SEED_FILE || "./data/firecrawl-communities.json";

	console.log("🌱 Seeding external calendars...\n");
	console.log(`Mode: ${seedSource.toUpperCase()}`);

	let calendarsToSeed: CommunityInput[];

	if (seedSource === "file") {
		calendarsToSeed = loadFromFile(filePath);
	} else {
		calendarsToSeed = PERU_TECH_CALENDARS;
		console.log(
			`📋 Using hardcoded list: ${calendarsToSeed.length} communities`,
		);
	}

	console.log("");

	const lumaClient = getGlobalLumaClient();

	let created = 0;
	let skipped = 0;
	let invalid = 0;

	for (const community of calendarsToSeed) {
		const slug = community.luma_slug;

		const existing = await db.query.externalCalendars.findFirst({
			where: eq(externalCalendars.slug, slug),
		});

		if (existing) {
			console.log(`⏭️  Already exists: ${slug}`);
			skipped++;
			continue;
		}

		try {
			const entity = await lumaClient.lookupEntity(slug);

			if (!entity) {
				console.log(`⚠️  Invalid slug skipped: ${slug}`);
				invalid++;
				continue;
			}

			await db.insert(externalCalendars).values({
				sourceType: "luma",
				externalId: entity.api_id,
				slug: slug,
				name: entity.name || community.name,
				description: entity.bio || null,
				avatarUrl: entity.avatar_url || null,
				coverUrl: entity.cover_url || null,
				country: "PE",
				city: community.city || null,
				isActive: true,
				syncFrequency: "daily",
				discoveredFrom: community.source_url || seedSource,
			});

			console.log(`✅ Created: ${slug} (${entity.name})`);
			created++;

			await new Promise((resolve) => setTimeout(resolve, 300));
		} catch (error) {
			console.error(
				`❌ Error processing ${slug}:`,
				error instanceof Error ? error.message : error,
			);
			invalid++;
		}
	}

	console.log(`
═══════════════════════════════
Seed Complete
───────────────────────────────
Created: ${created}
Skipped (existing): ${skipped}
Invalid/Failed: ${invalid}
Total processed: ${calendarsToSeed.length}
═══════════════════════════════
`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
