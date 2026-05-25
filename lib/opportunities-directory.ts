import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import {
	LATAM_COUNTRY_CODES,
	ORGANIZER_TYPE_LABELS,
} from "@/lib/db/schema/constants";

export type OpportunityCategory =
	| "accelerator"
	| "incubator"
	| "investor"
	| "open_innovation"
	| "startup_program";

export type OpportunityDirectoryEntry = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	type: string | null;
	typeLabel: string;
	category: OpportunityCategory;
	categoryLabel: string;
	city: string | null;
	department: string | null;
	websiteUrl: string | null;
	logoUrl: string | null;
	isVerified: boolean | null;
};

export type OpportunityDirectorySummary = {
	total: number;
	accelerators: number;
	incubators: number;
	investors: number;
	openInnovation: number;
	withWebsite: number;
};

type RawOpportunityOrganization = typeof organizations.$inferSelect;

const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
	accelerator: "Aceleradora",
	incubator: "Incubadora",
	investor: "Fondo / inversión",
	open_innovation: "Innovación abierta",
	startup_program: "Programa startup",
};

const OPPORTUNITY_TERMS = [
	"aceleración",
	"aceleracion",
	"aceleradora",
	"capital",
	"corporate venture capital",
	"fondo de inversión",
	"fondo de inversion",
	"incubación",
	"incubacion",
	"incubadora",
	"innovación abierta",
	"innovacion abierta",
	"pre-incubación",
	"pre-incubacion",
	"red ángel",
	"red angel",
	"venture",
];
const LATAM_ORG_COUNTRIES = LATAM_COUNTRY_CODES.filter(
	(code) => code !== "GLOBAL",
);
const LATAM_ORG_COUNTRY_SET = new Set<string>(LATAM_ORG_COUNTRIES);

function normalize(value: string | null | undefined) {
	return (value || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function searchableText(org: RawOpportunityOrganization) {
	return normalize([org.name, org.displayName, org.description].join(" "));
}

function getOpportunityCategory(
	org: RawOpportunityOrganization,
): OpportunityCategory | null {
	const text = searchableText(org);

	if (org.type === "investor" || text.includes("fondo de inversion")) {
		return "investor";
	}
	if (text.includes("aceleracion") || text.includes("aceleradora")) {
		return "accelerator";
	}
	if (
		text.includes("incubacion") ||
		text.includes("incubadora") ||
		text.includes("pre-incubacion")
	) {
		return "incubator";
	}
	if (text.includes("innovacion abierta")) {
		return "open_innovation";
	}
	if (text.includes("startup") || text.includes("venture")) {
		return "startup_program";
	}

	return null;
}

function isOpportunityOrg(org: RawOpportunityOrganization) {
	const text = searchableText(org);
	return (
		Boolean(org.country && LATAM_ORG_COUNTRY_SET.has(org.country)) &&
		(org.type === "investor" ||
			OPPORTUNITY_TERMS.some((term) => text.includes(term)))
	);
}

function toEntry(
	org: RawOpportunityOrganization,
): OpportunityDirectoryEntry | null {
	const category = getOpportunityCategory(org);
	if (!category) return null;

	return {
		id: org.id,
		slug: org.slug,
		name: org.displayName || org.name,
		description: org.description,
		type: org.type,
		typeLabel: org.type
			? ORGANIZER_TYPE_LABELS[org.type] || org.type
			: "Organización",
		category,
		categoryLabel: CATEGORY_LABELS[category],
		city: org.city,
		department: org.department,
		websiteUrl: org.websiteUrl,
		logoUrl: org.logoUrl,
		isVerified: org.isVerified,
	};
}

async function getOpportunityOrganizations() {
	const rows = await db
		.select()
		.from(organizations)
		.orderBy(asc(organizations.name));

	return rows
		.filter(
			(org) =>
				org.isPublic === true &&
				org.isPersonalOrg === false &&
				isOpportunityOrg(org),
		)
		.map(toEntry)
		.filter((entry): entry is OpportunityDirectoryEntry => Boolean(entry));
}

export async function getOpportunityDirectorySummary(): Promise<OpportunityDirectorySummary> {
	const entries = await getOpportunityOrganizations();

	return {
		total: entries.length,
		accelerators: entries.filter((entry) => entry.category === "accelerator")
			.length,
		incubators: entries.filter((entry) => entry.category === "incubator")
			.length,
		investors: entries.filter((entry) => entry.category === "investor").length,
		openInnovation: entries.filter(
			(entry) => entry.category === "open_innovation",
		).length,
		withWebsite: entries.filter((entry) => Boolean(entry.websiteUrl)).length,
	};
}

export async function getOpportunityDirectoryEntries({
	search,
	limit = 96,
}: {
	search?: string;
	limit?: number;
} = {}) {
	const entries = await getOpportunityOrganizations();
	const query = normalize(search);

	return entries
		.filter((entry) => {
			if (!query) return true;
			return normalize(
				[
					entry.name,
					entry.description,
					entry.typeLabel,
					entry.categoryLabel,
					entry.city,
					entry.department,
				].join(" "),
			).includes(query);
		})
		.sort((a, b) => {
			if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
			if (a.websiteUrl !== b.websiteUrl) return a.websiteUrl ? -1 : 1;
			return a.name.localeCompare(b.name);
		})
		.slice(0, limit);
}
