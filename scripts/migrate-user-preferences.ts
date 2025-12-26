import { clerkClient } from "@clerk/nextjs/server";
import { db } from "../lib/db";
import { userPreferences, users } from "../lib/db/schema";

async function migrateUserPreferences() {
	console.log("Starting migration from userPreferences to users...\n");

	const allPrefs = await db.select().from(userPreferences);
	console.log(`Found ${allPrefs.length} userPreferences records to migrate\n`);

	let successCount = 0;
	let errorCount = 0;

	for (const pref of allPrefs) {
		try {
			console.log(`Processing user: ${pref.clerkUserId}`);

			const client = await clerkClient();
			const clerkUser = await client.users.getUser(pref.clerkUserId);

			const githubAccount = clerkUser.externalAccounts.find(
				(account) => account.provider === "github",
			);
			const githubUsername = githubAccount?.username;

			const displayName =
				[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
				null;

			await db
				.insert(users)
				.values({
					clerkId: pref.clerkUserId,
					email: clerkUser.primaryEmailAddress?.emailAddress,
					displayName,
					avatarUrl: clerkUser.imageUrl,
					username: clerkUser.username || githubUsername || null,
					githubUrl: githubUsername
						? `https://github.com/${githubUsername}`
						: null,
					region: pref.department,
					city: pref.city,
					role: pref.role,
					formatPreference: pref.formatPreference,
					skillLevel: pref.skillLevel,
					hasCompletedOnboarding: pref.hasCompletedOnboarding,
					createdAt: pref.createdAt,
					updatedAt: pref.updatedAt,
				})
				.onConflictDoUpdate({
					target: users.clerkId,
					set: {
						region: pref.department,
						city: pref.city,
						role: pref.role,
						formatPreference: pref.formatPreference,
						skillLevel: pref.skillLevel,
						hasCompletedOnboarding: pref.hasCompletedOnboarding,
						updatedAt: new Date(),
					},
				});

			console.log(`  ✓ Migrated: ${displayName || pref.clerkUserId}`);
			successCount++;
		} catch (error) {
			console.error(`  ✗ Error migrating ${pref.clerkUserId}:`, error);
			errorCount++;
		}
	}

	console.log("\n=== Migration Complete ===");
	console.log(`Success: ${successCount}`);
	console.log(`Errors: ${errorCount}`);
	console.log(`Total: ${allPrefs.length}`);
}

migrateUserPreferences()
	.then(() => {
		console.log("\nMigration finished.");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Migration failed:", error);
		process.exit(1);
	});
