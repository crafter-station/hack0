import { neon } from "@neondatabase/serverless";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
	eventHostOrganizations,
	eventSponsors,
	events,
	type NewOrganizationRelationship,
	organizationRelationships,
} from "@/lib/db/schema";

const DEV_DATABASE_URL =
	"postgresql://neondb_owner:npg_4FXYQLJszBZ5@ep-morning-smoke-ad5hhywz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const PROD_DATABASE_URL =
	"postgresql://neondb_owner:npg_4FXYQLJszBZ5@ep-green-pond-adl5gijz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const useProd = process.argv.includes("--prod");
const dryRun = process.argv.includes("--dry-run");

const DATABASE_URL =
	process.env.DATABASE_URL || (useProd ? PROD_DATABASE_URL : DEV_DATABASE_URL);

const sqlClient = neon(DATABASE_URL);
const db = drizzle(sqlClient);

async function inferCoHostingRelationships() {
	console.log("\n🤝 Inferring co-hosting relationships...");

	const eventsWithMultipleHosts = await db
		.select({
			eventId: eventHostOrganizations.eventId,
			orgId: eventHostOrganizations.organizationId,
			isPrimary: eventHostOrganizations.isPrimary,
			status: eventHostOrganizations.status,
		})
		.from(eventHostOrganizations)
		.where(eq(eventHostOrganizations.status, "approved"));

	const eventHostsMap = new Map<string, string[]>();
	for (const host of eventsWithMultipleHosts) {
		const existing = eventHostsMap.get(host.eventId) || [];
		existing.push(host.orgId);
		eventHostsMap.set(host.eventId, existing);
	}

	const relationships: NewOrganizationRelationship[] = [];
	const seen = new Set<string>();

	for (const [eventId, orgIds] of eventHostsMap) {
		if (orgIds.length < 2) continue;

		for (let i = 0; i < orgIds.length; i++) {
			for (let j = i + 1; j < orgIds.length; j++) {
				const key = [orgIds[i], orgIds[j]].sort().join("-");
				if (seen.has(key)) continue;
				seen.add(key);

				relationships.push({
					sourceOrgId: orgIds[i],
					targetOrgId: orgIds[j],
					relationshipType: "co_host",
					source: "inferred",
					confidence: 90,
					isBidirectional: true,
					isVerified: true,
					description: `Co-hosted event together`,
				});
			}
		}
	}

	console.log(`   Found ${relationships.length} co-hosting relationships`);
	return relationships;
}

async function inferSponsorshipRelationships() {
	console.log("\n💰 Inferring sponsorship relationships...");

	const sponsorships = await db
		.select({
			eventId: eventSponsors.eventId,
			sponsorOrgId: eventSponsors.organizationId,
			tier: eventSponsors.tier,
		})
		.from(eventSponsors);

	const eventOrgsMap = new Map<string, string>();
	const eventsWithOrgs = await db
		.select({
			eventId: events.id,
			orgId: events.organizationId,
		})
		.from(events)
		.where(sql`${events.organizationId} IS NOT NULL`);

	for (const ev of eventsWithOrgs) {
		if (ev.orgId) {
			eventOrgsMap.set(ev.eventId, ev.orgId);
		}
	}

	const relationships: NewOrganizationRelationship[] = [];
	const seen = new Set<string>();

	for (const sponsorship of sponsorships) {
		const eventOrgId = eventOrgsMap.get(sponsorship.eventId);
		if (!eventOrgId) continue;
		if (eventOrgId === sponsorship.sponsorOrgId) continue;

		const key = `${sponsorship.sponsorOrgId}-${eventOrgId}`;
		if (seen.has(key)) continue;
		seen.add(key);

		const strength =
			sponsorship.tier === "platinum"
				? 10
				: sponsorship.tier === "gold"
					? 8
					: sponsorship.tier === "silver"
						? 6
						: 5;

		relationships.push({
			sourceOrgId: sponsorship.sponsorOrgId,
			targetOrgId: eventOrgId,
			relationshipType: "sponsor",
			source: "inferred",
			confidence: 95,
			strength,
			isBidirectional: false,
			isVerified: true,
			description: `Sponsored their event (${sponsorship.tier})`,
		});
	}

	console.log(`   Found ${relationships.length} sponsorship relationships`);
	return relationships;
}

async function checkExistingRelationship(
	sourceOrgId: string,
	targetOrgId: string,
	type: string,
): Promise<boolean> {
	const existing = await db
		.select({ id: organizationRelationships.id })
		.from(organizationRelationships)
		.where(
			and(
				eq(organizationRelationships.sourceOrgId, sourceOrgId),
				eq(organizationRelationships.targetOrgId, targetOrgId),
				eq(organizationRelationships.relationshipType, type as never),
			),
		)
		.limit(1);
	return existing.length > 0;
}

async function insertRelationships(
	relationships: NewOrganizationRelationship[],
) {
	let inserted = 0;
	let skipped = 0;

	for (const rel of relationships) {
		const exists = await checkExistingRelationship(
			rel.sourceOrgId,
			rel.targetOrgId,
			rel.relationshipType,
		);

		if (exists) {
			skipped++;
			continue;
		}

		if (dryRun) {
			console.log(
				`   [DRY RUN] Would insert: ${rel.sourceOrgId} --[${rel.relationshipType}]--> ${rel.targetOrgId}`,
			);
			inserted++;
		} else {
			try {
				await db.insert(organizationRelationships).values(rel);
				inserted++;
			} catch (error) {
				console.log(`   ⚠️ Error inserting relationship:`, error);
			}
		}
	}

	return { inserted, skipped };
}

async function main() {
	console.log(`🚀 Inferring relationships from events...`);
	console.log(`   Environment: ${useProd ? "🔴 PRODUCTION" : "🟢 DEV"}`);
	console.log(
		`   Database: ${DATABASE_URL.split("@")[1]?.split("/")[0] || "configured"}`,
	);
	console.log(`   Dry run: ${dryRun ? "YES" : "NO"}`);

	const coHostingRels = await inferCoHostingRelationships();
	const sponsorRels = await inferSponsorshipRelationships();

	const allRelationships = [...coHostingRels, ...sponsorRels];
	console.log(
		`\n📊 Total relationships to process: ${allRelationships.length}`,
	);

	const { inserted, skipped } = await insertRelationships(allRelationships);

	console.log(`\n✅ Results:`);
	console.log(`   Inserted: ${inserted}`);
	console.log(`   Skipped (already exist): ${skipped}`);
}

main()
	.then(() => {
		console.log("\n✅ Done!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Fatal error:", error);
		process.exit(1);
	});
