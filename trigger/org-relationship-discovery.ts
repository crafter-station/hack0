import FirecrawlApp from "@mendable/firecrawl-js";
import { metadata, task } from "@trigger.dev/sdk/v3";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type NewOrganizationRelationship,
	organizationRelationships,
} from "@/lib/db/schema";
import {
	CONFIDENCE_SCORE,
	fuzzyMatchOrgName,
	normalizeRelationshipType,
	type RelationshipExtraction,
} from "@/lib/scraper/relationship-schema";

const EXTRACTION_PROMPT = `
Analiza el sitio web de esta organización y encuentra TODAS las relaciones con otras organizaciones del ecosistema tech/startup.

Busca específicamente en:
1. Páginas de Partners/Aliados/Socios
2. Portfolio (si es VC/aceleradora)
3. Inversores/Backers (quienes invirtieron en ellos)
4. Aceleradoras/Incubadoras donde participaron
5. Redes o asociaciones de las que son miembros
6. Sponsors/Patrocinadores

Para cada relación encontrada, extrae:
- organizationName: Nombre exacto de la organización relacionada
- organizationWebsite: URL del sitio web si está disponible
- relationshipType: partner | investor | invested_in | accelerator | incubator | sponsor | member_of | portfolio_company
- description: Descripción breve de la relación
- confidence: high (explícitamente mencionado), medium (implícito), low (incierto)

Enfócate en organizaciones del ecosistema peruano/LATAM.
Solo retorna relaciones que estén explícitamente mencionadas o fuertemente implicadas.
`;

export const orgRelationshipDiscoveryTask = task({
	id: "org-relationship-discovery",
	maxDuration: 300,
	run: async (payload: {
		organizationId: string;
		organizationName: string;
		websiteUrl: string;
	}) => {
		const { organizationId, organizationName, websiteUrl } = payload;

		await metadata.set("status", "starting");
		await metadata.set("organizationName", organizationName);

		const firecrawl = new FirecrawlApp({
			apiKey: process.env.FIRECRAWL_API_KEY!,
		});

		await metadata.set("status", "scraping");

		let result;
		try {
			result = await firecrawl.scrape(websiteUrl, {
				formats: [
					{
						type: "json",
						prompt: EXTRACTION_PROMPT,
					},
				],
			});
		} catch (error: unknown) {
			await metadata.set("status", "error");

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			if (errorMessage.includes("not currently supported")) {
				await metadata.set(
					"error",
					"Este sitio no está soportado por Firecrawl",
				);
				throw new Error("Sitio no soportado");
			}

			if (errorMessage.includes("rate limit")) {
				await metadata.set("error", "Límite de scraping alcanzado");
				throw new Error("Rate limit alcanzado");
			}

			await metadata.set("error", `Error al extraer datos: ${errorMessage}`);
			throw error;
		}

		if (!result.json) {
			await metadata.set("status", "no_data");
			return {
				success: true,
				organizationId,
				relationshipsFound: 0,
				relationshipsCreated: 0,
				message: "No se encontraron relaciones en el sitio web",
			};
		}

		const extracted = result.json as RelationshipExtraction;
		const relationships = extracted.relationships || [];

		await metadata.set("status", "matching");
		await metadata.set("rawRelationshipsFound", relationships.length);

		const allOrgs = await db.query.organizations.findMany({
			columns: {
				id: true,
				name: true,
				displayName: true,
				websiteUrl: true,
			},
		});

		const createdRelationships: NewOrganizationRelationship[] = [];
		const unmatchedOrgs: string[] = [];

		for (const rel of relationships) {
			let matchedOrgId: string | null = null;
			let matchScore = 0;

			if (rel.organizationWebsite) {
				const matchByUrl = allOrgs.find(
					(org) =>
						org.websiteUrl &&
						(org.websiteUrl.includes(rel.organizationWebsite!) ||
							rel.organizationWebsite!.includes(org.websiteUrl)),
				);
				if (matchByUrl) {
					matchedOrgId = matchByUrl.id;
					matchScore = 95;
				}
			}

			if (!matchedOrgId) {
				const fuzzyMatch = fuzzyMatchOrgName(rel.organizationName, allOrgs);
				if (fuzzyMatch && fuzzyMatch.score >= 70) {
					matchedOrgId = fuzzyMatch.id;
					matchScore = fuzzyMatch.score;
				}
			}

			if (!matchedOrgId) {
				unmatchedOrgs.push(rel.organizationName);
				continue;
			}

			if (matchedOrgId === organizationId) {
				continue;
			}

			const relationshipType = normalizeRelationshipType(rel.relationshipType);
			const confidence = CONFIDENCE_SCORE[rel.confidence] * (matchScore / 100);

			const existingRel = await db.query.organizationRelationships.findFirst({
				where: sql`
					${organizationRelationships.sourceOrgId} = ${organizationId}
					AND ${organizationRelationships.targetOrgId} = ${matchedOrgId}
					AND ${organizationRelationships.relationshipType} = ${relationshipType}
				`,
			});

			if (existingRel) {
				continue;
			}

			const newRel: NewOrganizationRelationship = {
				sourceOrgId: organizationId,
				targetOrgId: matchedOrgId,
				relationshipType: relationshipType as never,
				description: rel.description || undefined,
				source: "scraped",
				confidence: Math.round(confidence),
				sourceUrl: websiteUrl,
				isVerified: false,
				isBidirectional: relationshipType === "partner",
			};

			await db.insert(organizationRelationships).values(newRel);
			createdRelationships.push(newRel);
		}

		await metadata.set("status", "completed");
		await metadata.set("relationshipsCreated", createdRelationships.length);
		await metadata.set("unmatchedOrgs", unmatchedOrgs);

		return {
			success: true,
			organizationId,
			relationshipsFound: relationships.length,
			relationshipsCreated: createdRelationships.length,
			unmatchedOrgs,
			message: `Encontradas ${relationships.length} relaciones, creadas ${createdRelationships.length}`,
		};
	},
});
