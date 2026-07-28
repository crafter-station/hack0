import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { assertWriteAllowed, parseIngestionMode } from "@/lib/ingestion/safety";

const COUNTRY_FIXES = [
	{
		id: "92c0e905-74e7-4391-a0e4-d30bd71b0765",
		name: "[El Salvador] Full day Hackathon: The next craft",
		fromCountry: "PE",
		fromCity: null,
		toCountry: "SV",
		toCity: null,
	},
	{
		id: "baac7b81-3ae3-4e4c-adf6-4bb9f8f5235b",
		name: "[Bogotá] Full day Hackathon: The next craft",
		fromCountry: "PE",
		fromCity: null,
		toCountry: "CO",
		toCity: "Bogotá",
	},
	{
		id: "9f44e766-f7bf-4514-98d0-eca8b54d54c3",
		name: "[Ciudad de Guatemala] Full day Hackathon: The next craft",
		fromCountry: "PE",
		fromCity: null,
		toCountry: "GT",
		toCity: "Ciudad de Guatemala",
	},
] as const;

const DUPLICATE_FIX = {
	id: "4baa8071-4786-4249-b616-6650b798a224",
	name: "Zero to Agent: Lima - PUCP",
	websiteUrl: "https://luma.com/hveetdob",
	canonicalEventId: "19846e8e-c0aa-49d2-a5d9-f0c6546e7407",
} as const;

const mode = parseIngestionMode(process.argv.slice(2));
const targetIds = [...COUNTRY_FIXES.map((fix) => fix.id), DUPLICATE_FIX.id];

async function readTargets() {
	return db
		.select({
			id: events.id,
			name: events.name,
			country: events.country,
			city: events.city,
			websiteUrl: events.websiteUrl,
			isApproved: events.isApproved,
			approvalStatus: events.approvalStatus,
		})
		.from(events)
		.where(inArray(events.id, targetIds));
}

function assertExpectedState(rows: Awaited<ReturnType<typeof readTargets>>) {
	if (rows.length !== targetIds.length) {
		throw new Error(
			`Expected ${targetIds.length} target events, found ${rows.length}`,
		);
	}

	for (const fix of COUNTRY_FIXES) {
		const row = rows.find((event) => event.id === fix.id);
		if (
			!row ||
			row.name !== fix.name ||
			row.country !== fix.fromCountry ||
			row.city !== fix.fromCity
		) {
			throw new Error(`Country target ${fix.id} is not in its expected state`);
		}
	}

	const duplicate = rows.find((event) => event.id === DUPLICATE_FIX.id);
	if (
		!duplicate ||
		duplicate.name !== DUPLICATE_FIX.name ||
		duplicate.websiteUrl !== DUPLICATE_FIX.websiteUrl ||
		duplicate.isApproved !== true ||
		duplicate.approvalStatus !== "approved"
	) {
		throw new Error(
			`Duplicate target ${DUPLICATE_FIX.id} is not in its expected state`,
		);
	}
}

function assertRemediatedState(rows: Awaited<ReturnType<typeof readTargets>>) {
	for (const fix of COUNTRY_FIXES) {
		const row = rows.find((event) => event.id === fix.id);
		if (
			!row ||
			row.name !== fix.name ||
			row.country !== fix.toCountry ||
			row.city !== fix.toCity
		) {
			throw new Error(`Country correction was not verified for ${fix.id}`);
		}
	}

	const duplicate = rows.find((event) => event.id === DUPLICATE_FIX.id);
	if (
		!duplicate ||
		duplicate.name !== DUPLICATE_FIX.name ||
		duplicate.websiteUrl !== DUPLICATE_FIX.websiteUrl ||
		duplicate.isApproved !== false ||
		duplicate.approvalStatus !== "rejected"
	) {
		throw new Error(
			`Duplicate suppression was not verified for ${DUPLICATE_FIX.id}`,
		);
	}
}

async function applyFixes() {
	for (const fix of COUNTRY_FIXES) {
		const updated = await db
			.update(events)
			.set({
				country: fix.toCountry,
				city: fix.toCity,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(events.id, fix.id),
					eq(events.name, fix.name),
					eq(events.country, fix.fromCountry),
				),
			)
			.returning({ id: events.id });

		if (updated.length !== 1) {
			throw new Error(`Country update failed for ${fix.id}`);
		}
	}

	const hidden = await db
		.update(events)
		.set({
			isApproved: false,
			approvalStatus: "rejected",
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(events.id, DUPLICATE_FIX.id),
				eq(events.name, DUPLICATE_FIX.name),
				eq(events.websiteUrl, DUPLICATE_FIX.websiteUrl),
				eq(events.isApproved, true),
				eq(events.approvalStatus, "approved"),
			),
		)
		.returning({ id: events.id });

	if (hidden.length !== 1) {
		throw new Error(`Duplicate update failed for ${DUPLICATE_FIX.id}`);
	}
}

async function main() {
	assertWriteAllowed(mode);
	const before = await readTargets();
	assertExpectedState(before);

	const changes = {
		countries: COUNTRY_FIXES.map((fix) => ({
			id: fix.id,
			name: fix.name,
			from: { country: fix.fromCountry, city: fix.fromCity },
			to: { country: fix.toCountry, city: fix.toCity },
		})),
		duplicate: {
			id: DUPLICATE_FIX.id,
			name: DUPLICATE_FIX.name,
			action: "hide_and_reject",
			canonicalEventId: DUPLICATE_FIX.canonicalEventId,
		},
	};

	if (mode === "dry-run") {
		console.log(JSON.stringify({ mode, changes }, null, 2));
		return;
	}

	await applyFixes();
	const after = await readTargets();
	assertRemediatedState(after);
	console.log(JSON.stringify({ mode, changes, after }, null, 2));
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
