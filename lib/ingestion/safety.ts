export type IngestionMode = "dry-run" | "write";
export type DatabaseEnvironment = "development" | "staging" | "production";

export interface IngestionTaskPayload {
	write?: boolean;
}

const DATABASE_ENVIRONMENTS = new Set<DatabaseEnvironment>([
	"development",
	"staging",
	"production",
]);

export function parseIngestionMode(args: readonly string[]): IngestionMode {
	const hasWrite = args.includes("--write");
	const hasDryRun = args.includes("--dry-run");

	if (hasWrite && hasDryRun) {
		throw new Error("Use either --write or --dry-run, not both");
	}

	return hasWrite ? "write" : "dry-run";
}

export function ingestionModeFromWriteFlag(write?: boolean): IngestionMode {
	return write === true ? "write" : "dry-run";
}

export function assertWriteAllowed(
	mode: IngestionMode,
	env: Readonly<Record<string, string | undefined>> = process.env,
): void {
	if (mode === "dry-run") return;

	const databaseEnvironment = env.HACK0_DATABASE_ENV;
	if (
		!databaseEnvironment ||
		!DATABASE_ENVIRONMENTS.has(databaseEnvironment as DatabaseEnvironment)
	) {
		throw new Error(
			"HACK0_DATABASE_ENV must be development, staging, or production before writes are allowed",
		);
	}

	if (env.HACK0_ALLOW_WRITES !== "true") {
		throw new Error("Set HACK0_ALLOW_WRITES=true to authorize database writes");
	}

	if (
		databaseEnvironment === "production" &&
		env.HACK0_ALLOW_PRODUCTION_WRITES !== "true"
	) {
		throw new Error(
			"Production writes require HACK0_ALLOW_PRODUCTION_WRITES=true",
		);
	}
}
