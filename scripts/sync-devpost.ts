import "dotenv/config";
import { ingestEventCandidates } from "@/lib/ingestion/ingest";
import { parseIngestionMode } from "@/lib/ingestion/safety";
import { runPostProcessor } from "@/lib/scraper/post-processor";
import { scrapeDevpost } from "@/lib/scraper/sources/devpost";

const mode = parseIngestionMode(process.argv.slice(2));
const skipPostProcess = process.argv.includes("--skip-post-process");

async function main() {
	console.log("[devpost-sync] scraping Devpost");
	const raw = await scrapeDevpost();

	const filtered = skipPostProcess
		? raw
		: (await runPostProcessor(raw)).hackathons;

	const ingestion = await ingestEventCandidates(filtered, { mode });

	console.log(
		JSON.stringify(
			{
				scraped: raw.length,
				filtered: filtered.length,
				skipPostProcess,
				...ingestion,
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
