import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import { isBefore } from "date-fns";
import { z } from "zod";
import { scoreLATAM } from "@/lib/scraper/latam-filter";
import type { RawHackathon } from "@/lib/scraper/types";

const MODEL = gateway("anthropic/claude-haiku-4.5");

/**
 * Recognized global tech companies/institutions whose hackathons are likely open to LATAM.
 * When an event with LATAM score=0 has one of these in its name, organizer, or description,
 * route it to the global LLM instead of fast-dropping. The LLM decides if it's actually
 * open to LATAM participants.
 */
const RECOGNIZED_GLOBAL_ORGANIZERS_RE = new RegExp(
	"\\b(" +
		[
			// Major tech companies (only match as organizer/name, not in descriptions)
			"gitlab",
			"digitalocean",
			"amazon",
			"aws",
			"google",
			"microsoft",
			"apple",
			"nvidia",
			"ibm",
			"oracle",
			"salesforce",
			"stripe",
			"vercel",
			"cloudflare",
			"mongodb",
			"datadog",
			"confluent",
			"snowflake",
			"databricks",
			"hugging\\s?face",
			"openai",
			"anthropic",
			"github",
			"hashicorp",
			"twilio",
			"auth0",
			"okta",
			"jetbrains",
			"figma",
			"postman",
			"coinbase",
			"binance",
			"solana",
			"ethereum",
			"polygon",
			// Hackathon platforms
			"ethglobal",
			"devfolio",
			"dorahacks",
			// International institutions
			"iata",
			"united\\s?nations",
			"unicef",
			"world\\s?bank",
			"nasa",
			// AI/ML specific
			"stability\\s?ai",
			"cohere",
			"replicate",
			"together\\s?ai",
			"groq",
			"mistral",
			"deepmind",
			"comma\\.?ai",
		].join("|") +
		")",
	"i",
);

/**
 * Check if an event looks like it's from a recognized global organizer.
 * Examines name, description, organizers, and sponsors.
 */
function looksLikeRecognizedGlobalEvent(h: RawHackathon): boolean {
	// Only check name + organizers — description/sponsors have too much noise
	const textBlob = [h.name, ...(h.organizers?.map((o) => o.name) ?? [])]
		.filter(Boolean)
		.join(" ");
	return RECOGNIZED_GLOBAL_ORGANIZERS_RE.test(textBlob);
}

/**
 * Hackathon keyword regex. If name OR description matches → assume isHackathon=true
 * for rule-based fast-keep (score ≥ 80), skipping LLM.
 * If NO match → still need LLM to confirm it's not a meetup/conference/course.
 */
const HACKATHON_KEYWORDS =
	/\b(hackathon|hackaton|hackat[oó]n|datathon|buildathon|appathon|devathon|ideathon|innovathon|coderathon|hackday|hack[\s-]day|hackfest|hack[\s-]fest|hack[\s-]night|code[\s-]?jam|coding[\s-]challenge|programming[\s-]challenge|maratona[\s-]de[\s-]programac|desafio[\s-](de[\s-])?programac|reto[\s-](de[\s-])?codigo)\b/i;

/**
 * Markers injected by the Devpost detail-page parser into the eligibility field.
 * These are used to fast-track decisions without an LLM call.
 */
const DEVPOST_CONFIRMED_HACKATHON_MARKER = "devpost_hackathon_confirmed";
const DEVPOST_CONFIRMED_CONFERENCE_MARKER = "devpost_schema_type_conference";

/**
 * Returns true if the Devpost detail page confirmed this is a genuine hackathon
 * (submission form or judging criteria detected on the page).
 */
function hasDevpostHackathonConfirmation(h: RawHackathon): boolean {
	return (
		h.sourceType === "devpost" &&
		(h.eligibility?.includes(DEVPOST_CONFIRMED_HACKATHON_MARKER) ?? false)
	);
}

/**
 * Returns true if the Devpost detail page detected a conference schema type,
 * indicating this is likely not a hackathon.
 */
function hasDevpostConferenceSignal(h: RawHackathon): boolean {
	return (
		h.sourceType === "devpost" &&
		(h.eligibility?.includes(DEVPOST_CONFIRMED_CONFERENCE_MARKER) ?? false)
	);
}

// ---------------------------------------------------------------------------
// Step 1: filterFuture
// ---------------------------------------------------------------------------

export function filterFuture(hackathons: RawHackathon[]): {
	kept: RawHackathon[];
	droppedCount: number;
} {
	const now = new Date();
	const kept: RawHackathon[] = [];
	let droppedCount = 0;

	for (const h of hackathons) {
		// Try endDate first, then fall back to startDate
		const rawDate = h.endDate ?? h.startDate;

		if (!rawDate) {
			// Can't determine — safer to keep
			kept.push(h);
			continue;
		}

		const parsed = new Date(rawDate);
		if (Number.isNaN(parsed.getTime())) {
			// Unparseable — keep
			kept.push(h);
			continue;
		}

		if (isBefore(parsed, now)) {
			droppedCount++;
			console.debug(`[filterFuture] drop past: "${h.name}" (${rawDate})`);
		} else {
			kept.push(h);
		}
	}

	console.info(
		`[filterFuture] ${hackathons.length} in → ${kept.length} kept, ${droppedCount} dropped (past)`,
	);
	return { kept, droppedCount };
}

// ---------------------------------------------------------------------------
// Step 2: llmEnrichRaw
// ---------------------------------------------------------------------------

const enrichSchema = z.object({
	results: z.array(
		z.object({
			index: z.number(),
			startDate: z.string().nullable(),
			endDate: z.string().nullable(),
			country: z.string().nullable(),
			city: z.string().nullable(),
			organizers: z
				.array(
					z.object({
						name: z.string(),
						url: z.string().optional(),
					}),
				)
				.nullable(),
			languages: z.array(z.string()).nullable(),
			prizePoolUsd: z.number().nullable(),
			modality: z.enum(["online", "in_person", "hybrid", "unknown"]).nullable(),
		}),
	),
});

function needsEnrichment(h: RawHackathon): boolean {
	// languages removed: defaults to ["en"] downstream, not worth an LLM call
	return (
		!h.startDate ||
		!h.country ||
		!h.organizers ||
		h.organizers.length === 0 ||
		!h.modality
	);
}

export async function llmEnrichRaw(hackathons: RawHackathon[]): Promise<{
	hackathons: RawHackathon[];
	llmCalls: number;
	enrichmentDetails: EnrichmentDetail[];
}> {
	const BATCH_SIZE = 15;
	let llmCalls = 0;
	const enrichmentDetails: EnrichmentDetail[] = [];

	// Identify indices that need enrichment
	const enrichIndices: number[] = [];
	for (let i = 0; i < hackathons.length; i++) {
		if (needsEnrichment(hackathons[i])) {
			enrichIndices.push(i);
		}
	}

	console.info(
		`[llmEnrichRaw] ${hackathons.length} total, ${enrichIndices.length} need enrichment`,
	);
	if (enrichIndices.length === 0) {
		return { hackathons, llmCalls, enrichmentDetails };
	}

	// Work on a mutable copy
	const result = [...hackathons];

	// Process in batches
	for (
		let batchStart = 0;
		batchStart < enrichIndices.length;
		batchStart += BATCH_SIZE
	) {
		const batchIndices = enrichIndices.slice(
			batchStart,
			batchStart + BATCH_SIZE,
		);
		const batchInput = batchIndices.map((globalIdx, localIdx) => {
			const h = hackathons[globalIdx];
			return {
				index: localIdx,
				name: h.name,
				description: h.description ?? null,
				startDate: h.startDate ?? null,
				endDate: h.endDate ?? null,
				country: h.country ?? null,
				city: h.city ?? null,
				venue: h.venue ?? null,
				fullAddress: h.fullAddress ?? null,
				organizers: h.organizers ?? null,
				sponsors: h.sponsors?.map((s) => s.name) ?? null,
				languages: h.languages ?? null,
				prizePool: h.prizePool ?? null,
				modality: h.modality ?? null,
				themes: h.themes ?? null,
				// Truncate eligibility — often contains Spanish/Portuguese text with location clues
				eligibility: h.eligibility ? h.eligibility.slice(0, 400) : null,
				websiteUrl: h.websiteUrl ?? null,
				sourceUrl: h.sourceUrl,
			};
		});

		const batchNum = batchStart / BATCH_SIZE + 1;
		const totalBatches = Math.ceil(enrichIndices.length / BATCH_SIZE);
		console.debug(
			`[llmEnrichRaw] batch ${batchNum}/${totalBatches}: sending ${batchIndices.length} events`,
		);
		try {
			const { object } = await generateObject({
				model: MODEL,
				schema: enrichSchema,
				prompt: `Completa los campos faltantes (null) de estos hackathones usando ÚNICAMENTE la información proporcionada en cada objeto.

REGLAS ESTRICTAS:
- Solo completa campos que son null. Nunca modifiques campos que ya tienen valor.
- Si no puedes determinar un valor con alta confianza a partir del texto disponible, retorna null. NO adivines ni uses conocimiento general sobre el organizador.
- Para country: infiere del city, venue, fullAddress, eligibility, websiteUrl (TLD: .mx→MX, .co→CO, .br→BR, .ar→AR, .cl→CL, .pe→PE), o nombre del evento. Usa código ISO 2 letras. Si no hay evidencia clara, retorna null.
- Para languages: infiere del idioma del nombre/descripción/eligibility. Si el texto está en español→"es", portugués→"pt", inglés→"en". Retorna null si no hay texto suficiente.
- Para modality: "online" si dice virtual/remote/online, "in_person" si hay venue/ciudad física, "unknown" si no hay evidencia.
- Para fechas: usa formato ISO 8601 (YYYY-MM-DD). Solo si hay fechas explícitas en el texto.
- Para prizePoolUsd: solo si prizePool ya tiene un valor en otra moneda, conviértelo (BRL×0.20, MXN×0.055, COP×0.00025, ARS×0.001, PEN×0.27, CLP×0.001). Si prizePool es null, retorna null.
- Para organizers: extrae solo si el nombre/descripción menciona explícitamente un organizador.

${JSON.stringify(batchInput)}`,
			});

			llmCalls++;
			console.info(
				`[llmEnrichRaw] batch ${batchNum}/${totalBatches}: LLM returned ${object.results.length} enriched records`,
			);

			// Apply enriched fields — never overwrite existing values
			for (const enriched of object.results) {
				const globalIdx = batchIndices[enriched.index];
				if (globalIdx === undefined) continue;

				const original = result[globalIdx];
				const updated = { ...original };
				const detail: EnrichmentDetail = {
					name: original.name,
					fieldsEnriched: [],
					fieldsAlreadyPresent: [],
					fieldsFailed: [],
				};

				const ENRICH_FIELDS = [
					"startDate",
					"endDate",
					"country",
					"city",
					"organizers",
					"languages",
					"prizePoolUsd",
					"modality",
				] as const;
				for (const field of ENRICH_FIELDS) {
					const enrichedVal =
						field === "organizers"
							? enriched.organizers && enriched.organizers.length > 0
								? enriched.organizers
								: null
							: field === "languages"
								? enriched.languages && enriched.languages.length > 0
									? enriched.languages
									: null
								: enriched[field as keyof typeof enriched];

					const origField = field === "prizePoolUsd" ? "prizePool" : field;
					const origHasVal =
						origField === "organizers"
							? original.organizers && original.organizers.length > 0
							: origField === "languages"
								? original.languages && original.languages.length > 0
								: !!(original as unknown as Record<string, unknown>)[origField];

					if (origHasVal) {
						detail.fieldsAlreadyPresent.push(field);
					} else if (enrichedVal) {
						detail.fieldsEnriched.push(field);
					} else {
						detail.fieldsFailed.push(field);
					}
				}

				if (enriched.startDate && !original.startDate) {
					updated.startDate = enriched.startDate;
				}
				if (enriched.endDate && !original.endDate) {
					updated.endDate = enriched.endDate;
				}
				if (enriched.country && !original.country) {
					updated.country = enriched.country;
				}
				if (enriched.city && !original.city) {
					updated.city = enriched.city;
				}
				if (
					enriched.organizers &&
					enriched.organizers.length > 0 &&
					(!original.organizers || original.organizers.length === 0)
				) {
					updated.organizers = enriched.organizers;
				}
				if (
					enriched.languages &&
					enriched.languages.length > 0 &&
					(!original.languages || original.languages.length === 0)
				) {
					updated.languages = enriched.languages;
				}
				if (enriched.prizePoolUsd != null && !original.prizePool) {
					updated.prizePool = `$${enriched.prizePoolUsd} USD`;
				}
				if (enriched.modality && !original.modality) {
					updated.modality = enriched.modality;
				}

				enrichmentDetails.push(detail);
				console.debug(
					`[llmEnrichRaw] "${original.name}": enriched=[${detail.fieldsEnriched.join(",")}] already=[${detail.fieldsAlreadyPresent.join(",")}] failed=[${detail.fieldsFailed.join(",")}]`,
				);
				result[globalIdx] = updated;
			}
		} catch (err) {
			console.error(
				`[llmEnrichRaw] batch ${batchNum}/${totalBatches} failed (non-fatal): ${err instanceof Error ? err.message : err}`,
			);
		}
	}

	console.info(
		`[llmEnrichRaw] done: ${llmCalls} LLM calls, ${enrichmentDetails.length} events enriched`,
	);
	return { hackathons: result, llmCalls, enrichmentDetails };
}

// ---------------------------------------------------------------------------
// Step 3: classifyLatamHybrid
// ---------------------------------------------------------------------------

const classifySchema = z.object({
	results: z.array(
		z.object({
			index: z.number(),
			isLatam: z.boolean(),
			isHackathon: z.boolean(),
			confidence: z.number(),
			reason: z.string(),
			detectedCountry: z.string().optional(),
		}),
	),
});

const classifyGlobalSchema = z.object({
	results: z.array(
		z.object({
			index: z.number(),
			isGlobalOpenToLatam: z.boolean(),
			isHackathon: z.boolean(),
			confidence: z.number(),
			reason: z.string(),
		}),
	),
});

export async function classifyLatamHybrid(hackathons: RawHackathon[]): Promise<{
	hackathons: RawHackathon[];
	droppedNonLatam: number;
	droppedNonHackathon: number;
	llmCalls: number;
	classifyTraces: EventTrace[];
}> {
	const BATCH_SIZE = 10;
	let droppedNonLatam = 0;
	let droppedNonHackathon = 0;
	let llmCalls = 0;

	type ClassifyResult = {
		hackathon: RawHackathon;
		keep: boolean;
		isLatam: boolean;
		isHackathon: boolean;
		confidence?: number;
		detectedCountry?: string;
		classifyPath?: string;
		llmVerdict?: string;
	};

	const classified: ClassifyResult[] = [];
	const borderlineLatamIndices: number[] = []; // LATAM events needing LLM
	const globalIndices: number[] = []; // Global events → always go to LLM

	console.info(`[classifyLatamHybrid] scoring ${hackathons.length} events...`);
	let fastKeep = 0,
		fastDrop = 0,
		rescued = 0;

	// First pass: rule-based scoring
	for (let i = 0; i < hackathons.length; i++) {
		const h = hackathons[i];

		// Devpost detail-page conference signal: fast-drop regardless of LATAM score.
		// This fires when the Devpost page's JSON-LD schema type is "conference" or
		// "BusinessEvent", strongly indicating the event is not a hackathon.
		if (hasDevpostConferenceSignal(h)) {
			fastDrop++;
			console.debug(
				`[classifyLatamHybrid] fast-drop (devpost_schema_type_conference): "${h.name}"`,
			);
			classified.push({
				hackathon: h,
				keep: false,
				isLatam: false,
				isHackathon: false,
				classifyPath: "fast-drop-conference",
			});
			continue;
		}

		// Global events bypass LATAM scoring — always route to global LLM
		if (h.scopeHint === "global") {
			const textToCheck = `${h.name} ${h.description ?? ""}`;
			const looksLikeHackathon = HACKATHON_KEYWORDS.test(textToCheck);
			const isDevpostConfirmed = hasDevpostHackathonConfirmation(h);

			if (isDevpostConfirmed || looksLikeHackathon) {
				console.debug(
					`[classifyLatamHybrid] global-to-llm: "${h.name}" (confirmed=${isDevpostConfirmed})`,
				);
				globalIndices.push(i);
				classified.push({
					hackathon: h,
					keep: false,
					isLatam: true,
					isHackathon: true,
					classifyPath: "global-llm",
				});
			} else {
				console.debug(
					`[classifyLatamHybrid] global-no-keyword-to-llm: "${h.name}"`,
				);
				globalIndices.push(i);
				classified.push({
					hackathon: h,
					keep: false,
					isLatam: true,
					isHackathon: true,
					classifyPath: "global-llm-no-keyword",
				});
			}
			continue;
		}

		const latamScore = scoreLATAM(h);

		if (latamScore.score >= 70) {
			const textToCheck = `${h.name} ${h.description ?? ""}`;
			const looksLikeHackathon = HACKATHON_KEYWORDS.test(textToCheck);
			const isDevpostConfirmed = hasDevpostHackathonConfirmation(h);

			if (looksLikeHackathon || isDevpostConfirmed) {
				fastKeep++;
				console.debug(
					`[classifyLatamHybrid] fast-keep (score=${latamScore.score}, confirmed=${isDevpostConfirmed}): "${h.name}" [${latamScore.signals.join(",")}]`,
				);
				classified.push({
					hackathon: h,
					keep: true,
					isLatam: true,
					isHackathon: true,
					confidence: latamScore.score,
					detectedCountry: latamScore.detectedCountry ?? undefined,
					classifyPath: `fast-keep(${latamScore.score})`,
				});
			} else {
				console.debug(
					`[classifyLatamHybrid] no-keyword (score=${latamScore.score}), routing to LLM: "${h.name}"`,
				);
				borderlineLatamIndices.push(i);
				classified.push({
					hackathon: {
						...h,
						country: h.country ?? latamScore.detectedCountry ?? undefined,
					},
					keep: false,
					isLatam: true,
					isHackathon: true,
					classifyPath: `latam-no-keyword-llm(${latamScore.score})`,
				});
			}
		} else if (latamScore.score < 15) {
			if (looksLikeRecognizedGlobalEvent(h)) {
				rescued++;
				console.debug(
					`[classifyLatamHybrid] rescue-to-global (score=${latamScore.score}): "${h.name}"`,
				);
				globalIndices.push(i);
				classified.push({
					hackathon: h,
					keep: false,
					isLatam: true,
					isHackathon: true,
					classifyPath: `rescue-global(${latamScore.score})`,
				});
			} else {
				fastDrop++;
				console.debug(
					`[classifyLatamHybrid] fast-drop (score=${latamScore.score}): "${h.name}"`,
				);
				classified.push({
					hackathon: h,
					keep: false,
					isLatam: false,
					isHackathon: true,
					classifyPath: `fast-drop(${latamScore.score})`,
				});
			}
		} else {
			console.debug(
				`[classifyLatamHybrid] borderline (score=${latamScore.score}): "${h.name}" [${latamScore.signals.join(",")}]`,
			);
			borderlineLatamIndices.push(i);
			classified.push({
				hackathon: h,
				keep: false,
				isLatam: false,
				isHackathon: true,
				classifyPath: `borderline-llm(${latamScore.score})`,
			});
		}
	}

	console.info(
		`[classifyLatamHybrid] rule-based: ${fastKeep} fast-keep, ${fastDrop} fast-drop, ${rescued} rescued → global, ` +
			`${borderlineLatamIndices.length} LATAM borderline → LLM, ${globalIndices.length} global → LLM`,
	);

	// Second pass: LLM for borderline LATAM items
	const totalLatamBatches = Math.ceil(
		borderlineLatamIndices.length / BATCH_SIZE,
	);
	for (
		let batchStart = 0;
		batchStart < borderlineLatamIndices.length;
		batchStart += BATCH_SIZE
	) {
		const batchGlobalIndices = borderlineLatamIndices.slice(
			batchStart,
			batchStart + BATCH_SIZE,
		);
		const batchInput = batchGlobalIndices.map((globalIdx, localIdx) => {
			const h = hackathons[globalIdx];
			return {
				index: localIdx,
				name: h.name,
				description: h.description,
				country: h.country,
				city: h.city,
				sourceUrl: h.sourceUrl,
				websiteUrl: h.websiteUrl,
				languages: h.languages,
				organizers: h.organizers,
				eligibility: h.eligibility,
			};
		});

		const llmBatchNum = batchStart / BATCH_SIZE + 1;
		console.debug(
			`[classifyLatamHybrid] LATAM LLM batch ${llmBatchNum}/${totalLatamBatches}: ${batchGlobalIndices.length} events`,
		);
		try {
			const { object } = await generateObject({
				model: MODEL,
				schema: classifySchema,
				prompt: `Clasifica estos eventos. Para cada uno determina:
1. isLatam: ¿es relevante para LATAM (Latinoamérica)? true si es en LATAM o abierto/dirigido a participantes de LATAM
2. isHackathon: ¿es genuinamente un hackathon/datathon/buildathon? false si es reclutamiento tech, conferencia, meetup, bootcamp, o curso online
3. confidence: 0-100
4. reason: razón breve en inglés
5. detectedCountry: código ISO 2 letras del país detectado (opcional)

Señales LATAM: universidades latinoamericanas (EAFIT=CO, ITESM/Tec=MX, USP=BR, UBA=AR, PUC=CL/PE), empresas (Bancolombia=CO, Nubank=BR, Mercado Libre=AR), ciudades, TLDs (.mx .co .br .ar .cl .pe .ec .uy).

${JSON.stringify(batchInput)}`,
			});

			llmCalls++;
			const batchKept = object.results.filter(
				(r) => r.isLatam && r.isHackathon,
			).length;
			const batchNonLatam = object.results.filter((r) => !r.isLatam).length;
			const batchNonHack = object.results.filter(
				(r) => r.isLatam && !r.isHackathon,
			).length;
			console.info(
				`[classifyLatamHybrid] LATAM LLM batch ${llmBatchNum}/${totalLatamBatches}: ${batchKept} kept, ${batchNonLatam} non-LATAM, ${batchNonHack} non-hackathon`,
			);
			for (const r of object.results) {
				const h = hackathons[batchGlobalIndices[r.index]];
				if (h)
					console.debug(
						`[classifyLatamHybrid] LLM → "${h.name}": isLatam=${r.isLatam}, isHackathon=${r.isHackathon}, confidence=${r.confidence} — ${r.reason}`,
					);
			}

			for (const r of object.results) {
				const globalIdx = batchGlobalIndices[r.index];
				if (globalIdx === undefined) continue;

				classified[globalIdx] = {
					...classified[globalIdx],
					hackathon: hackathons[globalIdx],
					keep: r.isLatam && r.isHackathon,
					isLatam: r.isLatam,
					isHackathon: r.isHackathon,
					confidence: r.confidence,
					detectedCountry: r.detectedCountry,
					llmVerdict: `isLatam=${r.isLatam} isHack=${r.isHackathon} conf=${r.confidence} — ${r.reason}`,
				};
			}
		} catch (err) {
			console.error(
				`[classifyLatamHybrid] LATAM LLM batch ${llmBatchNum}/${totalLatamBatches} failed (non-fatal): ${err instanceof Error ? err.message : err}`,
			);
			for (const globalIdx of batchGlobalIndices) {
				if (
					!classified[globalIdx].isLatam &&
					!classified[globalIdx].isHackathon
				) {
					classified[globalIdx] = {
						...classified[globalIdx],
						hackathon: hackathons[globalIdx],
						keep: true,
						isLatam: true,
						isHackathon: true,
						confidence: 50,
						llmVerdict: "LLM-error-fallback-keep",
					};
				}
			}
		}
	}

	// Third pass: LLM for global events (different prompt — ask isGlobalOpenToLatam)
	const totalGlobalBatches = Math.ceil(globalIndices.length / BATCH_SIZE);
	for (
		let batchStart = 0;
		batchStart < globalIndices.length;
		batchStart += BATCH_SIZE
	) {
		const batchGlobalIndices = globalIndices.slice(
			batchStart,
			batchStart + BATCH_SIZE,
		);
		const batchInput = batchGlobalIndices.map((globalIdx, localIdx) => {
			const h = hackathons[globalIdx];
			return {
				index: localIdx,
				name: h.name,
				description: h.description,
				sourceUrl: h.sourceUrl,
				websiteUrl: h.websiteUrl,
				prizePool: h.prizePool,
				organizers: h.organizers,
				eligibility: h.eligibility,
				themes: h.themes,
			};
		});

		const llmBatchNum = batchStart / BATCH_SIZE + 1;
		console.debug(
			`[classifyLatamHybrid] global LLM batch ${llmBatchNum}/${totalGlobalBatches}: ${batchGlobalIndices.length} events`,
		);
		try {
			const { object } = await generateObject({
				model: MODEL,
				schema: classifyGlobalSchema,
				prompt: `Classify these global hackathon events. For each one determine:
1. isGlobalOpenToLatam: true ONLY if the organizer has a widely recognized tech product, platform, protocol, or institutional mandate that developers worldwide would know. Examples of qualifying organizers: Google, Microsoft, AWS, Solana, ETHGlobal, NASA. Examples that do NOT qualify: random universities hosting local events branded as "global", GDG chapters at small universities, unknown startups, generic "open innovation" programs without a known platform. The bar is: would a developer in Latin America recognize this organizer and want to participate?
2. isHackathon: Is this genuinely a hackathon/datathon/buildathon where participants BUILD something? false if it's tech recruiting, a conference, meetup, bootcamp, online course, design challenge, or expo.
3. confidence: 0-100
4. reason: brief reason in English

${JSON.stringify(batchInput)}`,
			});

			llmCalls++;
			const batchKept = object.results.filter(
				(r) => r.isGlobalOpenToLatam && r.isHackathon,
			).length;
			const batchDropped = object.results.filter(
				(r) => !r.isGlobalOpenToLatam || !r.isHackathon,
			).length;
			console.info(
				`[classifyLatamHybrid] global LLM batch ${llmBatchNum}/${totalGlobalBatches}: ${batchKept} kept, ${batchDropped} dropped`,
			);
			for (const r of object.results) {
				const h = hackathons[batchGlobalIndices[r.index]];
				if (h)
					console.debug(
						`[classifyLatamHybrid] global LLM → "${h.name}": isGlobalOpenToLatam=${r.isGlobalOpenToLatam}, isHackathon=${r.isHackathon}, confidence=${r.confidence} — ${r.reason}`,
					);
			}

			for (const r of object.results) {
				const globalIdx = batchGlobalIndices[r.index];
				if (globalIdx === undefined) continue;

				classified[globalIdx] = {
					...classified[globalIdx],
					hackathon: hackathons[globalIdx],
					keep: r.isGlobalOpenToLatam && r.isHackathon,
					isLatam: r.isGlobalOpenToLatam,
					isHackathon: r.isHackathon,
					confidence: r.confidence,
					llmVerdict: `isGlobal=${r.isGlobalOpenToLatam} isHack=${r.isHackathon} conf=${r.confidence} — ${r.reason}`,
				};
			}
		} catch (err) {
			console.error(
				`[classifyLatamHybrid] global LLM batch ${llmBatchNum}/${totalGlobalBatches} failed (non-fatal): ${err instanceof Error ? err.message : err}`,
			);
			for (const globalIdx of batchGlobalIndices) {
				classified[globalIdx] = {
					...classified[globalIdx],
					hackathon: hackathons[globalIdx],
					keep: true,
					isLatam: true,
					isHackathon: true,
					confidence: 50,
					llmVerdict: "LLM-error-fallback-keep",
				};
			}
		}
	}

	// Build final list, collect stats, and generate traces
	const kept: RawHackathon[] = [];
	const classifyTraces: EventTrace[] = [];
	for (const item of classified) {
		const h = item.hackathon;
		if (!item.isHackathon) {
			droppedNonHackathon++;
			classifyTraces.push({
				name: h.name,
				source: h.sourceType,
				scopeHint: h.scopeHint,
				exitStage: "classifyDrop",
				exitReason: "not-hackathon",
				classifyPath: item.classifyPath,
				llmVerdict: item.llmVerdict,
			});
		} else if (!item.isLatam) {
			droppedNonLatam++;
			classifyTraces.push({
				name: h.name,
				source: h.sourceType,
				scopeHint: h.scopeHint,
				exitStage: "classifyDrop",
				exitReason: "not-latam",
				classifyPath: item.classifyPath,
				llmVerdict: item.llmVerdict,
			});
		} else {
			const withConfidence =
				item.confidence != null ? { classifyConfidence: item.confidence } : {};
			if (item.detectedCountry && !h.country) {
				kept.push({ ...h, country: item.detectedCountry, ...withConfidence });
			} else {
				kept.push({ ...h, ...withConfidence });
			}
			classifyTraces.push({
				name: h.name,
				source: h.sourceType,
				scopeHint: h.scopeHint,
				exitStage: "kept",
				exitReason: "passed",
				classifyPath: item.classifyPath,
				llmVerdict: item.llmVerdict,
			});
		}
	}

	console.info(
		`[classifyLatamHybrid] done: ${kept.length} kept, ${droppedNonLatam} non-LATAM dropped, ${droppedNonHackathon} non-hackathon dropped, ${llmCalls} LLM calls`,
	);
	return {
		hackathons: kept,
		droppedNonLatam,
		droppedNonHackathon,
		llmCalls,
		classifyTraces,
	};
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Pre-score: cheap rule-based pass to skip enrichment for obvious non-LATAM
// ---------------------------------------------------------------------------

function preScoreFilter(hackathons: RawHackathon[]): {
	toEnrich: RawHackathon[];
	preDropped: RawHackathon[];
	preDroppedCount: number;
} {
	const toEnrich: RawHackathon[] = [];
	const preDropped: RawHackathon[] = [];

	for (const h of hackathons) {
		// Global-hinted events always survive
		if (h.scopeHint === "global") {
			toEnrich.push(h);
			continue;
		}
		// Recognized global organizer → survive
		if (looksLikeRecognizedGlobalEvent(h)) {
			toEnrich.push(h);
			continue;
		}
		// Quick LATAM score (cheap, no LLM)
		const { score } = scoreLATAM(h);
		if (score >= 15) {
			toEnrich.push(h);
			continue;
		}
		// score < 15 AND not recognized → will be fast-dropped anyway, skip enrichment
		preDropped.push(h);
	}

	console.info(
		`[preScoreFilter] ${hackathons.length} in → ${toEnrich.length} to enrich, ${preDropped.length} pre-dropped (score<15, no recognized org)`,
	);
	return { toEnrich, preDropped, preDroppedCount: preDropped.length };
}

// ---------------------------------------------------------------------------
// Structured log for easy review
// ---------------------------------------------------------------------------

export interface EnrichmentDetail {
	name: string;
	fieldsEnriched: string[];
	fieldsAlreadyPresent: string[];
	fieldsFailed: string[]; // LLM returned null
}

/** Per-event trace showing what happened at each pipeline stage */
export interface EventTrace {
	name: string;
	source: string;
	scopeHint?: string;
	/** Pipeline stage where this event exited */
	exitStage: "filterFuture" | "preScore" | "classifyDrop" | "kept";
	/** Reason for exit */
	exitReason: string;
	/** Pre-score LATAM score (if computed) */
	latamScore?: number;
	/** Whether enrichment was applied */
	enriched?: boolean;
	/** Fields enriched by LLM */
	fieldsEnriched?: string[];
	/** Classify path: fast-keep | fast-drop | rescue | borderline-llm | global-llm */
	classifyPath?: string;
	/** LLM classification result */
	llmVerdict?: string;
}

export interface PostProcessorLog {
	raw: number;
	afterFuture: number;
	preDropped: number;
	enriched: number;
	enrichLlmCalls: number;
	classifyLlmCalls: number;
	totalLlmCalls: number;
	fastKeep: number;
	fastDrop: number;
	rescued: number;
	borderlineLlm: number;
	globalLlm: number;
	kept: number;
	droppedPast: number;
	droppedNonLatam: number;
	droppedNonHackathon: number;
	/** Names of events that passed the pipeline */
	keptNames: string[];
	/** Names of rescued events (recognized org, sent to global LLM) */
	rescuedNames: string[];
	/** Names of events pre-dropped before enrichment */
	preDroppedSample: string[];
	/** Per-event enrichment details */
	enrichmentDetails: EnrichmentDetail[];
	/** Full per-event trace through the pipeline */
	eventTraces: EventTrace[];
}

// ---------------------------------------------------------------------------
// Top-level orchestrator: filterFuture → preScore → llmEnrichRaw → classifyLatamHybrid
// ---------------------------------------------------------------------------

export async function runPostProcessor(raw: RawHackathon[]): Promise<{
	hackathons: RawHackathon[];
	droppedPast: number;
	droppedNonLatam: number;
	droppedNonHackathon: number;
	llmCalls: number;
	log: PostProcessorLog;
}> {
	const eventTraces: EventTrace[] = [];

	// Step 1: drop past events
	const { kept: future, droppedCount: droppedPast } = filterFuture(raw);
	// Trace past-dropped events
	const futureNames = new Set(future.map((h) => h.name));
	for (const h of raw) {
		if (!futureNames.has(h.name)) {
			eventTraces.push({
				name: h.name,
				source: h.sourceType,
				scopeHint: h.scopeHint,
				exitStage: "filterFuture",
				exitReason: "past event",
			});
		}
	}

	// Step 2: pre-score to skip enrichment for obvious non-LATAM/non-global
	const { toEnrich, preDroppedCount, preDropped } = preScoreFilter(future);
	// Trace pre-dropped events
	for (const h of preDropped) {
		const { score } = scoreLATAM(h);
		eventTraces.push({
			name: h.name,
			source: h.sourceType,
			scopeHint: h.scopeHint,
			exitStage: "preScore",
			exitReason: `latamScore=${score}, no recognized org`,
			latamScore: score,
		});
	}

	// Step 3: enrich only surviving events
	const {
		hackathons: enriched,
		llmCalls: enrichLlmCalls,
		enrichmentDetails,
	} = await llmEnrichRaw(toEnrich);

	// Step 4: classify LATAM relevance + hackathon type
	const {
		hackathons,
		droppedNonLatam: classifyDropLatam,
		droppedNonHackathon,
		llmCalls: classifyLlmCalls,
		classifyTraces,
	} = await classifyLatamHybrid(enriched);

	// Merge classify traces
	const enrichDetailByName = new Map(enrichmentDetails.map((d) => [d.name, d]));
	for (const ct of classifyTraces) {
		const ed = enrichDetailByName.get(ct.name);
		eventTraces.push({
			...ct,
			enriched: !!ed,
			fieldsEnriched: ed?.fieldsEnriched,
		});
	}

	const droppedNonLatam = classifyDropLatam + preDroppedCount;
	const llmCalls = enrichLlmCalls + classifyLlmCalls;

	// Build structured log
	const log: PostProcessorLog = {
		raw: raw.length,
		afterFuture: future.length,
		preDropped: preDroppedCount,
		enriched: toEnrich.length,
		enrichLlmCalls,
		classifyLlmCalls,
		totalLlmCalls: llmCalls,
		fastKeep: 0,
		fastDrop: 0,
		rescued: 0,
		borderlineLlm: 0,
		globalLlm: 0,
		kept: hackathons.length,
		droppedPast,
		droppedNonLatam,
		droppedNonHackathon,
		keptNames: hackathons.map((h) => h.name),
		rescuedNames: [],
		preDroppedSample: preDropped.slice(0, 10).map((h) => h.name),
		enrichmentDetails,
		eventTraces,
	};

	console.info(
		`[runPostProcessor] ${raw.length} raw → ${hackathons.length} kept ` +
			`(${droppedPast} past, ${preDroppedCount} pre-dropped, ${classifyDropLatam} classify-non-LATAM, ${droppedNonHackathon} non-hackathon, ${llmCalls} LLM calls)`,
	);

	return {
		hackathons,
		droppedPast,
		droppedNonLatam,
		droppedNonHackathon,
		llmCalls,
		log,
	};
}
