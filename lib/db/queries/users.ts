import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getUserByClerkId(clerkId: string) {
	return db.query.users.findFirst({
		where: eq(users.clerkId, clerkId),
	});
}

export async function getUserById(id: string) {
	return db.query.users.findFirst({
		where: eq(users.id, id),
	});
}

export async function getUserByUsername(username: string) {
	return db.query.users.findFirst({
		where: eq(users.username, username),
	});
}

export async function getOrCreateUser(clerkId: string) {
	const existing = await getUserByClerkId(clerkId);
	if (existing) {
		await db
			.update(users)
			.set({ lastSeenAt: new Date() })
			.where(eq(users.id, existing.id));
		return existing;
	}

	const client = await clerkClient();
	const clerkUser = await client.users.getUser(clerkId);

	const githubAccount = clerkUser.externalAccounts.find(
		(account) => account.provider === "github",
	);
	const githubUsername = githubAccount?.username;

	const displayName =
		[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

	const [newUser] = await db
		.insert(users)
		.values({
			clerkId,
			email: clerkUser.primaryEmailAddress?.emailAddress,
			displayName,
			avatarUrl: clerkUser.imageUrl,
			username: clerkUser.username || githubUsername || null,
			githubUrl: githubUsername ? `https://github.com/${githubUsername}` : null,
			lastSeenAt: new Date(),
		})
		.returning();

	return newUser;
}

export async function syncUserFromClerk(clerkId: string) {
	const client = await clerkClient();
	const clerkUser = await client.users.getUser(clerkId);

	const githubAccount = clerkUser.externalAccounts.find(
		(account) => account.provider === "github",
	);
	const githubUsername = githubAccount?.username;

	const displayName =
		[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

	const [user] = await db
		.insert(users)
		.values({
			clerkId,
			email: clerkUser.primaryEmailAddress?.emailAddress,
			displayName,
			avatarUrl: clerkUser.imageUrl,
			username: clerkUser.username || githubUsername || null,
			githubUrl: githubUsername ? `https://github.com/${githubUsername}` : null,
			lastSeenAt: new Date(),
		})
		.onConflictDoUpdate({
			target: users.clerkId,
			set: {
				email: clerkUser.primaryEmailAddress?.emailAddress,
				displayName,
				avatarUrl: clerkUser.imageUrl,
				username: clerkUser.username || githubUsername || undefined,
				githubUrl: githubUsername
					? `https://github.com/${githubUsername}`
					: undefined,
				updatedAt: new Date(),
				lastSeenAt: new Date(),
			},
		})
		.returning();

	return user;
}

export async function updateUserStats(
	clerkId: string,
	stats: Partial<{
		eventsAttendedCount: number;
		eventsOrganizedCount: number;
		hackathonsCount: number;
		hackathonWinsCount: number;
		communitiesCount: number;
		achievementsCount: number;
		totalPoints: number;
	}>,
) {
	return db
		.update(users)
		.set({
			...stats,
			updatedAt: new Date(),
		})
		.where(eq(users.clerkId, clerkId));
}
