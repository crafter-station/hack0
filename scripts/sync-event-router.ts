import "dotenv/config";
import { ingestEventCandidates } from "@/lib/ingestion/ingest";
import { parseIngestionMode } from "@/lib/ingestion/safety";
import { fetchEventRouterCandidates } from "@/lib/scraper/sources/event-router";

const args = process.argv.slice(2);
const mode = parseIngestionMode(args);

function argument(name: string) {
	return args
		.find((value) => value.startsWith(`--${name}=`))
		?.slice(name.length + 3);
}

function positiveIntegerArgument(name: string) {
	const value = argument(name);
	if (!value) return undefined;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(`--${name} must be a positive integer`);
	}
	return parsed;
}

async function main() {
	const ownedArg = argument("owned");
	if (ownedArg && ownedArg !== "true" && ownedArg !== "false") {
		throw new Error("--owned must be true or false");
	}

	console.log(`[event-router-sync] collecting canonical events (${mode})`);
	const collection = await fetchEventRouterCandidates({
		from: argument("from"),
		owned: ownedArg ? ownedArg === "true" : undefined,
		maxEvents: positiveIntegerArgument("max-events"),
	});
	const ingestion = await ingestEventCandidates(collection.candidates, {
		mode,
	});

	console.log(
		JSON.stringify(
			{
				collected: collection.candidates.length,
				adapterRejected: collection.rejections.length,
				adapterRejections: collection.rejections.slice(0, 25),
				source: collection.metadata,
				sample: collection.candidates.slice(0, 10).map((candidate) => ({
					name: candidate.name,
					startDate: candidate.startDate,
					city: candidate.city,
					country: candidate.country,
					url: candidate.sourceUrl,
					ownership:
						candidate.raw &&
						typeof candidate.raw === "object" &&
						"ownership" in candidate.raw
							? candidate.raw.ownership
							: null,
				})),
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
