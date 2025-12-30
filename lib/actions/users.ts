"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { type NewUser, type User, users } from "@/lib/db/schema";

export async function getCurrentUser(): Promise<User | null> {
	const { userId } = await auth();
	if (!userId) return null;

	const user = await db.query.users.findFirst({
		where: eq(users.clerkId, userId),
	});

	return user || null;
}

export async function getOrCreateCurrentUser(): Promise<User | null> {
	const { userId } = await auth();
	if (!userId) return null;

	const existing = await db.query.users.findFirst({
		where: eq(users.clerkId, userId),
	});

	if (existing) {
		await db
			.update(users)
			.set({ lastSeenAt: new Date() })
			.where(eq(users.id, existing.id));
		return existing;
	}

	const client = await clerkClient();
	const clerkUser = await client.users.getUser(userId);

	const githubAccount = clerkUser.externalAccounts.find(
		(account) => account.provider === "github",
	);
	const githubUsername = githubAccount?.username;

	const displayName =
		[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

	const [newUser] = await db
		.insert(users)
		.values({
			clerkId: userId,
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

export async function createOrUpdateUser(
	data: Omit<Partial<NewUser>, "clerkId">,
) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Usuario no autenticado");
	}

	const existing = await db.query.users.findFirst({
		where: eq(users.clerkId, userId),
	});

	if (existing) {
		const [updated] = await db
			.update(users)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(users.clerkId, userId))
			.returning();

		return updated;
	}

	const client = await clerkClient();
	const clerkUser = await client.users.getUser(userId);

	const githubAccount = clerkUser.externalAccounts.find(
		(account) => account.provider === "github",
	);
	const githubUsername = githubAccount?.username;

	const displayName =
		[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

	const [created] = await db
		.insert(users)
		.values({
			clerkId: userId,
			email: clerkUser.primaryEmailAddress?.emailAddress,
			displayName,
			avatarUrl: clerkUser.imageUrl,
			username: clerkUser.username || githubUsername || null,
			githubUrl: githubUsername ? `https://github.com/${githubUsername}` : null,
			...data,
		})
		.returning();

	return created;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
	const user = await getCurrentUser();
	return user?.hasCompletedOnboarding || false;
}

export async function updateUserProfile(
	data: Partial<
		Pick<
			User,
			| "bio"
			| "headline"
			| "country"
			| "region"
			| "city"
			| "skills"
			| "domains"
			| "websiteUrl"
			| "githubUrl"
			| "linkedinUrl"
			| "twitterUrl"
			| "isOpenToWork"
			| "isOpenToFreelance"
			| "isOpenToCollab"
			| "isOpenToMentor"
			| "isOpenToSpeaking"
			| "isPublic"
			| "showEmail"
		>
	>,
) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Usuario no autenticado");
	}

	const [updated] = await db
		.update(users)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(users.clerkId, userId))
		.returning();

	return updated;
}
