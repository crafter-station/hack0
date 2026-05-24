import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "@trigger.dev/sdk/v3";
import { parse } from "dotenv";

for (const path of [".env.vercel.local", ".env.local", ".env"]) {
	if (!process.env.TRIGGER_PROJECT_ID && existsSync(path)) {
		const parsed = parse(readFileSync(path, "utf8"));
		if (parsed.TRIGGER_PROJECT_ID) {
			process.env.TRIGGER_PROJECT_ID = parsed.TRIGGER_PROJECT_ID;
		}
	}
}

const project = process.env.TRIGGER_PROJECT_ID;

if (!project) {
	throw new Error("TRIGGER_PROJECT_ID is required for Trigger.dev");
}

export default defineConfig({
	project,
	runtime: "node",
	logLevel: "log",
	maxDuration: 120,
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
		},
	},
	dirs: ["./trigger", "./trigger/scrapers"],
});
