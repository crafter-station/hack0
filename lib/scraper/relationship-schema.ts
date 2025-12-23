import { z } from "zod";

export const RelationshipExtractionSchema = z.object({
	relationships: z.array(
		z.object({
			organizationName: z
				.string()
				.describe("Nombre exacto de la organización relacionada"),
			organizationWebsite: z
				.string()
				.url()
				.nullable()
				.optional()
				.describe("URL del sitio web si está disponible"),
			relationshipType: z
				.enum([
					"partner",
					"investor",
					"invested_in",
					"accelerator",
					"incubator",
					"sponsor",
					"member_of",
					"portfolio_company",
				])
				.describe("Tipo de relación"),
			description: z
				.string()
				.nullable()
				.optional()
				.describe("Descripción breve de la relación"),
			confidence: z
				.enum(["high", "medium", "low"])
				.describe("Nivel de confianza"),
		}),
	),
});

export type RelationshipExtraction = z.infer<
	typeof RelationshipExtractionSchema
>;

export const RELATIONSHIP_TYPE_MAP: Record<string, string> = {
	partner: "partner",
	investor: "investor",
	invested_in: "invested_by",
	accelerator: "accelerated_by",
	incubator: "incubated_by",
	sponsor: "sponsor",
	member_of: "member_of",
	portfolio_company: "investor",
};

export const CONFIDENCE_SCORE: Record<string, number> = {
	high: 90,
	medium: 70,
	low: 50,
};

export function normalizeRelationshipType(
	type: string,
	isInverse: boolean = false,
): string {
	const normalized = RELATIONSHIP_TYPE_MAP[type] || type;

	if (isInverse) {
		switch (normalized) {
			case "investor":
				return "invested_by";
			case "invested_by":
				return "investor";
			case "accelerated":
				return "accelerated_by";
			case "accelerated_by":
				return "accelerated";
			case "incubated":
				return "incubated_by";
			case "incubated_by":
				return "incubated";
			default:
				return normalized;
		}
	}

	return normalized;
}

export function fuzzyMatchOrgName(
	name: string,
	candidates: Array<{ id: string; name: string; displayName: string | null }>,
): { id: string; score: number } | null {
	const normalizedName = name.toLowerCase().trim();

	for (const candidate of candidates) {
		const candidateName = (candidate.displayName || candidate.name)
			.toLowerCase()
			.trim();

		if (normalizedName === candidateName) {
			return { id: candidate.id, score: 100 };
		}

		if (
			normalizedName.includes(candidateName) ||
			candidateName.includes(normalizedName)
		) {
			return { id: candidate.id, score: 85 };
		}

		const normalizedWords = new Set(normalizedName.split(/\s+/));
		const candidateWords = new Set(candidateName.split(/\s+/));
		const commonWords = [...normalizedWords].filter((w) =>
			candidateWords.has(w),
		);
		if (
			commonWords.length >= 2 ||
			(commonWords.length === 1 && normalizedWords.size <= 2)
		) {
			return { id: candidate.id, score: 70 };
		}
	}

	return null;
}
