import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { ensureUniqueOrgShortCode } from "@/lib/slug-utils";

type UniversitySeed = {
	slug: string;
	name: string;
	websiteUrl: string;
	description: string;
	city: string;
	department: string;
	tags: string[];
};

const universities: UniversitySeed[] = [
	{
		slug: "pucp",
		name: "Pontificia Universidad Católica del Perú",
		websiteUrl: "https://www.pucp.edu.pe/",
		description:
			"Universidad peruana con actividad relevante para formación, investigación, emprendimiento y comunidades tech.",
		city: "Lima",
		department: "Lima",
		tags: ["education", "students", "events", "incubation"],
	},
	{
		slug: "uni",
		name: "Universidad Nacional de Ingeniería",
		websiteUrl: "https://www.uni.edu.pe/",
		description:
			"Universidad pública peruana de ingeniería, ciencia y tecnología con comunidades y eventos para builders.",
		city: "Lima",
		department: "Lima",
		tags: ["education", "students", "events", "development"],
	},
	{
		slug: "unmsm",
		name: "Universidad Nacional Mayor de San Marcos",
		websiteUrl: "https://unmsm.edu.pe/",
		description:
			"Universidad pública peruana con comunidades estudiantiles, investigación y programas de innovación.",
		city: "Lima",
		department: "Lima",
		tags: ["education", "students", "events", "data-ai"],
	},
	{
		slug: "utec",
		name: "Universidad de Ingeniería y Tecnología",
		websiteUrl: "https://utec.edu.pe/",
		description:
			"Universidad peruana enfocada en ingeniería, tecnología, innovación y emprendimiento.",
		city: "Lima",
		department: "Lima",
		tags: ["education", "students", "events", "incubation"],
	},
	{
		slug: "upc",
		name: "Universidad Peruana de Ciencias Aplicadas",
		websiteUrl: "https://www.upc.edu.pe/",
		description:
			"Universidad peruana con programas de tecnología, emprendimiento y comunidades estudiantiles.",
		city: "Lima",
		department: "Lima",
		tags: ["education", "students", "events", "development"],
	},
	{
		slug: "universidad-de-lima",
		name: "Universidad de Lima",
		websiteUrl: "https://www.ulima.edu.pe/",
		description:
			"Universidad peruana con programas de ingeniería, innovación, empresa y tecnología.",
		city: "Lima",
		department: "Lima",
		tags: ["education", "students", "events", "product"],
	},
	{
		slug: "universidad-del-pacifico",
		name: "Universidad del Pacífico",
		websiteUrl: "https://www.up.edu.pe/",
		description:
			"Universidad peruana con foco en gestión, economía, innovación y emprendimiento.",
		city: "Lima",
		department: "Lima",
		tags: ["education", "students", "events", "investment"],
	},
	{
		slug: "utp",
		name: "Universidad Tecnológica del Perú",
		websiteUrl: "https://www.utp.edu.pe/",
		description:
			"Universidad peruana con programas de tecnología, ingeniería y comunidades estudiantiles.",
		city: "Lima",
		department: "Lima",
		tags: ["education", "students", "events", "development"],
	},
];

function faviconUrl(websiteUrl: string) {
	const { hostname } = new URL(websiteUrl);
	return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
}

async function upsertUniversity(seed: UniversitySeed, dryRun: boolean) {
	const existing = await db.query.organizations.findFirst({
		where: eq(organizations.slug, seed.slug),
	});
	const values = {
		name: seed.name,
		displayName: seed.name,
		description: seed.description,
		type: "university" as const,
		email: null,
		country: "PE",
		department: seed.department,
		city: seed.city,
		websiteUrl: seed.websiteUrl,
		logoUrl: faviconUrl(seed.websiteUrl),
		coverUrl: null,
		ownerUserId: process.env.SYSTEM_OWNER_USER_ID || "system_curated_index",
		isPublic: true,
		isPersonalOrg: false,
		isVerified: true,
		tags: seed.tags,
		updatedAt: new Date(),
	};

	if (dryRun) {
		return {
			slug: seed.slug,
			action: existing ? "would_update" : "would_create",
		};
	}

	if (existing) {
		await db
			.update(organizations)
			.set(values)
			.where(eq(organizations.id, existing.id));
		return { slug: seed.slug, action: "updated" };
	}

	await db.insert(organizations).values({
		...values,
		slug: seed.slug,
		shortCode: await ensureUniqueOrgShortCode(),
	});
	return { slug: seed.slug, action: "created" };
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");
	const results = [];

	for (const university of universities) {
		results.push(await upsertUniversity(university, dryRun));
	}

	console.log(
		JSON.stringify(
			{
				dryRun,
				total: results.length,
				created: results.filter((result) => result.action === "created").length,
				updated: results.filter((result) => result.action === "updated").length,
				wouldCreate: results.filter(
					(result) => result.action === "would_create",
				).length,
				wouldUpdate: results.filter(
					(result) => result.action === "would_update",
				).length,
				results,
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
