import "dotenv/config";
import { ingestEventCandidates } from "@/lib/ingestion/ingest";
import { parseIngestionMode } from "@/lib/ingestion/safety";
import { scrapeDevpost } from "@/lib/scraper/sources/devpost";

async function main() {
	const mode = parseIngestionMode(process.argv.slice(2));
	console.log(`[seed-scraper] collecting Devpost candidates (${mode})`);
	const raw = await scrapeDevpost();
	const result = await ingestEventCandidates(raw, { mode });
	console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
