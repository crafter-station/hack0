import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { UTApi } from "uploadthing/server";
import { type NewOrganization, organizations } from "@/lib/db/schema";
import extractedData from "@/public/extract-data-2025-12-23.json";

const useProd = process.argv.includes("--prod");
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is required");
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const utapi = new UTApi();

const SYSTEM_OWNER_USER_ID =
	process.env.SYSTEM_OWNER_USER_ID || "system_ecosistema_import";

type ExtractedOrg = (typeof extractedData.organizations)[number];

const serviceToOrgType: Record<string, NewOrganization["type"]> = {
	"Pre-incubación": "startup",
	Incubación: "startup",
	Incubacion: "startup",
	Aceleración: "startup",
	Aceleracion: "startup",
	"Fondo de inversión": "investor",
	"Fondo de Inversión": "investor",
	"Corporate Venture Capital": "investor",
	"Red Ángel": "investor",
	"Red Angel": "investor",
	SAFI: "investor",
	Consultoras: "consulting",
	Consultora: "consulting",
	"Estudios de abogados": "law_firm",
	Coworking: "coworking",
	"Innovación Abierta": "company",
	"Innovación abierta": "company",
	Otros: "community",
	Otro: "community",
};

function mapServiceToType(service: string): NewOrganization["type"] {
	return serviceToOrgType[service] || "community";
}

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&#8211;/g, "–")
		.replace(/&#8212;/g, "—")
		.replace(/&#038;/g, "&")
		.replace(/&#8217;/g, "'")
		.replace(/&#8220;/g, '"')
		.replace(/&#8221;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.trim();
}

function extractValue<T extends { value: string }>(
	arr: T[] | undefined,
): string[] {
	if (!arr || arr.length === 0) return [];
	return arr.map((item) => item.value).filter(Boolean);
}

function buildDescription(org: ExtractedOrg): string | undefined {
	const parts: string[] = [];

	if (org.headquarters && org.headquarters !== org.region) {
		parts.push(`📍 ${org.headquarters}`);
	}

	const industries = extractValue(org.industries_served);
	if (industries.length > 0) {
		parts.push(`🏭 Industrias: ${industries.join(", ")}`);
	}

	const services = extractValue(org.services_offered);
	if (services.length > 0) {
		parts.push(`🛠️ Servicios: ${services.join(", ")}`);
	}

	const benefits = extractValue(org.benefits);
	if (benefits.length > 0) {
		const cleanBenefits = benefits.filter((b) => b.length > 3);
		if (cleanBenefits.length > 0) {
			parts.push(`✨ Beneficios: ${cleanBenefits.join(", ")}`);
		}
	}

	const partners = extractValue(org.key_partners);
	if (partners.length > 0) {
		parts.push(`🤝 Aliados: ${partners.join(", ")}`);
	}

	return parts.length > 0 ? parts.join("\n\n") : undefined;
}

async function uploadLogo(
	logoUrl: string,
	orgName: string,
): Promise<string | undefined> {
	if (!logoUrl || !logoUrl.startsWith("http")) return undefined;

	try {
		console.log(`   📸 Uploading logo for ${orgName}...`);
		const result = await utapi.uploadFilesFromUrl(logoUrl);

		if (result.data?.url) {
			console.log(`   ✅ Logo uploaded: ${result.data.url}`);
			return result.data.url;
		}
		console.log(`   ⚠️ Logo upload failed for ${orgName}`);
		return undefined;
	} catch (error) {
		console.log(
			`   ⚠️ Logo upload error for ${orgName}:`,
			error instanceof Error ? error.message : "Unknown",
		);
		return undefined;
	}
}

async function transformOrg(
	org: ExtractedOrg,
	uploadLogos: boolean,
): Promise<NewOrganization> {
	const social = org.social_media_links || {};

	let finalLogoUrl: string | undefined = org.logo_url || undefined;
	if (uploadLogos && org.logo_url) {
		const uploadedUrl = await uploadLogo(org.logo_url, org.name);
		if (uploadedUrl) {
			finalLogoUrl = uploadedUrl;
		}
	}

	const cleanName = decodeHtmlEntities(org.name);

	return {
		slug: org.slug,
		name: cleanName,
		displayName: cleanName,
		description: buildDescription(org),
		type: mapServiceToType(org.primary_service),
		email: (org as { contact_email?: string }).contact_email || undefined,
		country: "PE",
		department: org.region || undefined,
		websiteUrl: org.website_url || undefined,
		logoUrl: finalLogoUrl,
		facebookUrl: social.facebook || undefined,
		instagramUrl: social.instagram || undefined,
		linkedinUrl: social.linkedin || undefined,
		twitterUrl: social.twitter || undefined,
		ownerUserId: SYSTEM_OWNER_USER_ID,
		isPublic: true,
		isPersonalOrg: false,
		isVerified: false,
	};
}

async function seedEcosistemaOrgs() {
	const uploadLogos = process.argv.includes("--upload-logos");
	const dryRun = process.argv.includes("--dry-run");

	console.log(
		`🚀 Seeding ${extractedData.organizations.length} organizations from Ecosistema Peruano...`,
	);
	console.log(`   Environment: ${useProd ? "🔴 PRODUCTION" : "🟢 DEV"}`);
	console.log(
		`   Database: ${DATABASE_URL.split("@")[1]?.split("/")[0] || "configured"}`,
	);
	console.log(
		`   Upload logos: ${uploadLogos ? "YES" : "NO (use --upload-logos to enable)"}`,
	);
	console.log(`   Dry run: ${dryRun ? "YES" : "NO"}`);
	console.log("");

	let inserted = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (let i = 0; i < extractedData.organizations.length; i++) {
		const rawOrg = extractedData.organizations[i];
		console.log(
			`[${i + 1}/${extractedData.organizations.length}] Processing: ${rawOrg.name}`,
		);

		try {
			const org = await transformOrg(rawOrg, uploadLogos);

			if (dryRun) {
				console.log(`   🔍 Would insert: ${org.slug}`);
				console.log(
					`      Type: ${org.type} | Website: ${org.websiteUrl || "N/A"}`,
				);
				inserted++;
				continue;
			}

			await db
				.insert(organizations)
				.values(org)
				.onConflictDoNothing({ target: organizations.slug });

			inserted++;
			console.log(`   ✅ ${org.slug} (${org.type})`);
			if (org.department)
				console.log(`      📍 ${org.department}, ${org.country}`);
			if (org.websiteUrl) console.log(`      🌐 ${org.websiteUrl}`);
			if (org.email) console.log(`      📧 ${org.email}`);
		} catch (error) {
			skipped++;
			const msg = `${rawOrg.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
			errors.push(msg);
			console.log(
				`   ❌ Error: ${error instanceof Error ? error.message : "Unknown"}`,
			);
		}

		if (uploadLogos && i < extractedData.organizations.length - 1) {
			await new Promise((r) => setTimeout(r, 500));
		}
	}

	console.log(`\n📊 Results:`);
	console.log(`   Processed: ${inserted + skipped}`);
	console.log(`   Inserted: ${inserted}`);
	console.log(`   Skipped/Errors: ${skipped}`);

	if (errors.length > 0) {
		console.log(`\n❌ Errors:`);
		for (const error of errors.slice(0, 10)) {
			console.log(`   ${error}`);
		}
		if (errors.length > 10) {
			console.log(`   ... and ${errors.length - 10} more`);
		}
	}
}

seedEcosistemaOrgs()
	.then(() => {
		console.log("\n✅ Done!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Fatal error:", error);
		process.exit(1);
	});
