import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";
import { syncLumaCalendarEvents } from "@/lib/luma/calendar-sync";

for (const path of [".env.vercel.local", ".env.local", ".env"]) {
	if (existsSync(path)) {
		const parsed = parse(readFileSync(path, "utf8"));
		for (const [key, value] of Object.entries(parsed)) {
			process.env[key] ??= value;
		}
	}
}

const dryRun = process.argv.includes("--dry-run");
const includePast = !process.argv.includes("--future-only");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 50;

async function main() {
	const result = await syncLumaCalendarEvents({ dryRun, includePast, limit });
	console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
