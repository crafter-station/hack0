import { neon } from "@neondatabase/serverless";

const queryClient = neon(process.env.DATABASE_URL!);

async function checkColumns() {
	console.log("Checking organizations table columns...\n");

	const result = await queryClient`
		SELECT column_name, data_type, is_nullable
		FROM information_schema.columns
		WHERE table_name = 'organizations'
		ORDER BY ordinal_position
	`;

	console.log("Organizations columns:");
	for (const row of result) {
		console.log(
			`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`,
		);
	}

	console.log("\n\nChecking events table columns...\n");

	const eventsResult = await queryClient`
		SELECT column_name, data_type, is_nullable
		FROM information_schema.columns
		WHERE table_name = 'events'
		ORDER BY ordinal_position
	`;

	console.log("Events columns:");
	for (const row of eventsResult) {
		console.log(
			`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`,
		);
	}
}

checkColumns();
