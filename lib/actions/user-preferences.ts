"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	userPreferences,
	type NewUserPreferences,
	type UserPreferences,
} from "@/lib/db/schema";

export async function getUserPreferences(): Promise<UserPreferences | null> {
	const { userId } = await auth();
	if (!userId) return null;

	const prefs = await db.query.userPreferences.findFirst({
		where: eq(userPreferences.clerkUserId, userId),
	});

	return prefs || null;
}

export async function createOrUpdateUserPreferences(
	data: Omit<NewUserPreferences, "clerkUserId">,
) {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Usuario no autenticado");
	}

	const existing = await db.query.userPreferences.findFirst({
		where: eq(userPreferences.clerkUserId, userId),
	});

	if (existing) {
		const [updated] = await db
			.update(userPreferences)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(userPreferences.clerkUserId, userId))
			.returning();

		return updated;
	}

	const [created] = await db
		.insert(userPreferences)
		.values({
			clerkUserId: userId,
			...data,
		})
		.returning();

	return created;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
	const prefs = await getUserPreferences();
	return prefs?.hasCompletedOnboarding || false;
}
