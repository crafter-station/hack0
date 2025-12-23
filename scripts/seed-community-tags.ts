import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { type CommunityTag, organizations } from "@/lib/db/schema";

const TYPE_TO_TAGS: Record<string, CommunityTag[]> = {
	startup: ["incubation", "acceleration", "early-stage"],
	investor: ["investment", "early-stage", "growth"],
	university: ["education", "students"],
	student_org: ["education", "students"],
	coworking: ["coworking", "networking"],
	community: ["networking", "events"],
	consulting: ["education", "mentorship"],
	ngo: ["social-impact"],
	government: ["govtech"],
};

const KEYWORD_TO_TAGS: Array<{ keywords: string[]; tags: CommunityTag[] }> = [
	{ keywords: ["fintech"], tags: ["fintech"] },
	{
		keywords: [
			"ia",
			" ai ",
			"inteligencia artificial",
			"machine learning",
			"ml",
		],
		tags: ["data-ai"],
	},
	{ keywords: ["web3", "blockchain", "crypto", "nft"], tags: ["web3"] },
	{ keywords: ["healthtech", "salud", "health"], tags: ["healthtech"] },
	{ keywords: ["edtech", "educación", "education"], tags: ["edtech"] },
	{ keywords: ["agritech", "agrícola", "agro"], tags: ["agritech"] },
	{ keywords: ["legaltech", "legal"], tags: ["legaltech"] },
	{ keywords: ["proptech", "inmobiliario", "real estate"], tags: ["proptech"] },
	{
		keywords: [
			"climatetech",
			"clima",
			"climate",
			"sostenibilidad",
			"sustainability",
		],
		tags: ["climatetech", "sustainability"],
	},
	{ keywords: ["open source", "opensource"], tags: ["open-source"] },
	{ keywords: ["impacto social", "social impact"], tags: ["social-impact"] },
	{
		keywords: ["diversidad", "inclusión", "diversity", "inclusion"],
		tags: ["diversity-inclusion"],
	},
	{ keywords: ["mobile", "app", "ios", "android"], tags: ["mobile"] },
	{
		keywords: ["ciberseguridad", "cybersecurity", "security", "infosec"],
		tags: ["cybersecurity"],
	},
	{
		keywords: [
			"desarrollo",
			"programación",
			"programming",
			"developer",
			"software",
		],
		tags: ["development"],
	},
	{ keywords: ["diseño", "design", "ux", "ui"], tags: ["design"] },
	{ keywords: ["producto", "product"], tags: ["product"] },
	{ keywords: ["incubación", "incubadora", "incubator"], tags: ["incubation"] },
	{
		keywords: ["aceleración", "aceleradora", "accelerator"],
		tags: ["acceleration"],
	},
	{
		keywords: ["red ángel", "angel", "inversión", "investment"],
		tags: ["investment"],
	},
	{ keywords: ["mentoría", "mentor", "mentorship"], tags: ["mentorship"] },
	{ keywords: ["estudiante", "student", "universitario"], tags: ["students"] },
	{ keywords: ["networking", "network"], tags: ["networking"] },
	{ keywords: ["evento", "event"], tags: ["events"] },
];

async function seedCommunityTags() {
	console.log("Starting community tags seed...\n");

	const allOrgs = await db.query.organizations.findMany({
		where: eq(organizations.isPersonalOrg, false),
	});

	console.log(`Found ${allOrgs.length} non-personal organizations\n`);

	let updated = 0;
	let skipped = 0;

	for (const org of allOrgs) {
		const tags = new Set<CommunityTag>();

		if (org.type && TYPE_TO_TAGS[org.type]) {
			for (const tag of TYPE_TO_TAGS[org.type]) {
				tags.add(tag);
			}
		}

		const textToSearch =
			`${org.name || ""} ${org.description || ""}`.toLowerCase();

		for (const { keywords, tags: keywordTags } of KEYWORD_TO_TAGS) {
			for (const keyword of keywords) {
				if (textToSearch.includes(keyword.toLowerCase())) {
					for (const tag of keywordTags) {
						tags.add(tag);
					}
					break;
				}
			}
		}

		if (tags.size > 0) {
			const tagArray = Array.from(tags);

			await db
				.update(organizations)
				.set({ tags: tagArray })
				.where(eq(organizations.id, org.id));

			console.log(`✓ ${org.name}: [${tagArray.join(", ")}]`);
			updated++;
		} else {
			console.log(`- ${org.name}: No tags assigned`);
			skipped++;
		}
	}

	console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}`);
}

seedCommunityTags()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Error seeding tags:", error);
		process.exit(1);
	});
