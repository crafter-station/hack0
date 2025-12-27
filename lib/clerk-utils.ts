"use server";

import { clerkClient } from "@clerk/nextjs/server";

export async function getUserInfo(userId: string) {
	const client = await clerkClient();
	const user = await client.users.getUser(userId);

	const githubAccount = user.externalAccounts.find(
		(account) => account.provider === "github",
	);

	const githubUsername = githubAccount?.username || null;

	const emailPrefix = user.primaryEmailAddress?.emailAddress?.split("@")[0];
	const formattedEmailPrefix = emailPrefix
		? emailPrefix
				.replace(/[._]/g, " ")
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ")
		: null;

	const fullName =
		`${user.firstName || ""} ${user.lastName || ""}`.trim() ||
		user.username ||
		formattedEmailPrefix ||
		"Usuario";

	return {
		userId: user.id,
		username: user.username,
		githubUsername,
		fullName,
		firstName: user.firstName,
		lastName: user.lastName,
		imageUrl: user.imageUrl,
		email: user.primaryEmailAddress?.emailAddress,
		emailPrefix,
	};
}

export async function getPersonalOrgSlug(userId: string): Promise<string> {
	const info = await getUserInfo(userId);

	const baseSlug =
		info.githubUsername ||
		info.username ||
		info.emailPrefix ||
		userId.slice(0, 8);

	const sanitizedSlug = baseSlug
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, "")
		.slice(0, 32);

	return sanitizedSlug || userId.slice(0, 8);
}
