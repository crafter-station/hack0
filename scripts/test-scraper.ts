/**
 * Script de prueba: corre el scraper de Devpost y muestra los primeros
 * resultados con toda la info extraída de la detail page.
 *
 * Uso: bun run scripts/test-scraper.ts
 */
import "dotenv/config";
import { scrapeDevpost } from "@/lib/scraper/sources/devpost";

async function main() {
	console.log("🔍 Corriendo scraper Devpost LATAM...\n");

	const raw = await scrapeDevpost();
	console.log(`✅ ${raw.length} eventos encontrados\n`);

	if (raw.length === 0) {
		console.log("⚠️  Sin resultados.");
		return;
	}

	// Mostrar los primeros 5 con detalle completo (raw, sin normalizar)
	for (const event of raw.slice(0, 5)) {
		console.log("═".repeat(70));
		console.log(`📌 ${event.name}`);
		console.log(`   url:           ${event.websiteUrl ?? event.sourceUrl}`);
		console.log(`   modality:      ${event.modality ?? "—"}`);
		console.log(`   country:       ${event.country ?? "—"}`);
		console.log(`   city:          ${event.city ?? "—"}`);
		console.log(`   venue:         ${event.venue ?? "—"}`);
		console.log(
			`   dates:         ${event.startDate ?? "?"} → ${event.endDate ?? "?"}`,
		);
		console.log(`   deadline:      ${event.registrationDeadline ?? "—"}`);
		console.log(`   prizePool:     ${event.prizePool ?? "—"}`);
		console.log(`   prizes:        ${event.prizes?.length ?? 0} items`);
		if (event.prizes?.length) {
			for (const p of event.prizes.slice(0, 3)) {
				console.log(
					`     - ${p.place}: ${p.amount || "N/A"} ${p.description ? `(${p.description.slice(0, 60)})` : ""}`,
				);
			}
		}
		console.log(`   sponsors:      ${event.sponsors?.length ?? 0} items`);
		if (event.sponsors?.length) {
			console.log(`     ${event.sponsors.map((s) => s.name).join(", ")}`);
		}
		console.log(`   judges:        ${event.judges?.length ?? 0} items`);
		if (event.judges?.length) {
			for (const j of event.judges.slice(0, 3)) {
				console.log(
					`     - ${j.name}${j.title ? ` (${j.title})` : ""}${j.organization ? ` @ ${j.organization}` : ""}`,
				);
			}
		}
		console.log(
			`   criteria:      ${event.judgingCriteria?.length ?? 0} items`,
		);
		if (event.judgingCriteria?.length) {
			for (const c of event.judgingCriteria) {
				console.log(`     - ${c.criterion}${c.weight ? ` [${c.weight}]` : ""}`);
			}
		}
		console.log(`   tracks:        ${event.tracks?.join(", ") ?? "—"}`);
		console.log(`   technologies:  ${event.technologies?.join(", ") ?? "—"}`);
		console.log(
			`   teamSize:      ${event.teamSizeMin ?? "?"}-${event.teamSizeMax ?? "?"}`,
		);
		console.log(`   maxPartic.:    ${event.maxParticipants ?? "—"}`);
		console.log(`   curPartic.:    ${event.currentParticipants ?? "—"}`);
		console.log(`   bannerUrl:     ${event.bannerUrl ? "✓" : "—"}`);
		console.log(`   imageUrl:      ${event.imageUrl ? "✓" : "—"}`);
		console.log(`   resources:     ${event.resources?.length ?? 0} items`);
		console.log(`   contactEmail:  ${event.contactEmail ?? "—"}`);
		console.log(`   languages:     ${event.languages?.join(", ") ?? "—"}`);
		console.log(
			`   eligibility:   ${event.eligibility ? event.eligibility.slice(0, 80) + "..." : "—"}`,
		);
		console.log(
			`   rules:         ${event.rules ? "✓ (" + event.rules.length + " chars)" : "—"}`,
		);
		console.log(
			`   description:   ${event.description ? event.description.slice(0, 100) + "..." : "—"}`,
		);
		console.log(
			`   organizers:    ${event.organizers?.map((o) => o.name).join(", ") ?? "—"}`,
		);
		console.log(`   registUrl:     ${event.registrationUrl ?? "—"}`);
	}

	// Summary stats
	const withDesc = raw.filter((r) => r.description).length;
	const withPrizes = raw.filter((r) => r.prizes?.length).length;
	const withSponsors = raw.filter((r) => r.sponsors?.length).length;
	const withJudges = raw.filter((r) => r.judges?.length).length;
	const withCriteria = raw.filter((r) => r.judgingCriteria?.length).length;
	const withBanner = raw.filter((r) => r.bannerUrl).length;
	const withTracks = raw.filter((r) => r.tracks?.length).length;
	const withResources = raw.filter((r) => r.resources?.length).length;
	const withRules = raw.filter((r) => r.rules).length;
	const withContact = raw.filter((r) => r.contactEmail).length;
	const withVenue = raw.filter((r) => r.venue).length;

	console.log("\n" + "═".repeat(70));
	console.log(`📊 Total: ${raw.length} eventos scrapeados`);
	console.log(
		`   con descripción:  ${withDesc} (${Math.round((100 * withDesc) / raw.length)}%)`,
	);
	console.log(
		`   con premios:      ${withPrizes} (${Math.round((100 * withPrizes) / raw.length)}%)`,
	);
	console.log(
		`   con sponsors:     ${withSponsors} (${Math.round((100 * withSponsors) / raw.length)}%)`,
	);
	console.log(
		`   con judges:       ${withJudges} (${Math.round((100 * withJudges) / raw.length)}%)`,
	);
	console.log(
		`   con criteria:     ${withCriteria} (${Math.round((100 * withCriteria) / raw.length)}%)`,
	);
	console.log(
		`   con banner:       ${withBanner} (${Math.round((100 * withBanner) / raw.length)}%)`,
	);
	console.log(
		`   con tracks:       ${withTracks} (${Math.round((100 * withTracks) / raw.length)}%)`,
	);
	console.log(
		`   con resources:    ${withResources} (${Math.round((100 * withResources) / raw.length)}%)`,
	);
	console.log(
		`   con rules:        ${withRules} (${Math.round((100 * withRules) / raw.length)}%)`,
	);
	console.log(
		`   con contacto:     ${withContact} (${Math.round((100 * withContact) / raw.length)}%)`,
	);
	console.log(
		`   con venue:        ${withVenue} (${Math.round((100 * withVenue) / raw.length)}%)`,
	);
}

main().catch(console.error);
