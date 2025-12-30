import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
	try {
		const evt = await verifyWebhook(req);

		const { id } = evt.data;
		const eventType = evt.type;

		console.log(`[Clerk Webhook] Received ${eventType} for user ${id}`);

		if (eventType === "user.created") {
			const {
				id: clerkId,
				email_addresses,
				first_name,
				last_name,
				image_url,
				username,
				external_accounts,
			} = evt.data;

			const primaryEmail = email_addresses.find(
				(e) => e.id === evt.data.primary_email_address_id,
			)?.email_address;

			const displayName =
				[first_name, last_name].filter(Boolean).join(" ") || null;

			const githubAccount = external_accounts?.find(
				(account) => account.provider === "github",
			);
			const githubUsername = githubAccount?.username;

			await db
				.insert(users)
				.values({
					clerkId,
					email: primaryEmail,
					displayName,
					avatarUrl: image_url,
					username: username || githubUsername || null,
					githubUrl: githubUsername
						? `https://github.com/${githubUsername}`
						: null,
				})
				.onConflictDoNothing();

			console.log(`[Clerk Webhook] Created user ${clerkId}`);
		}

		if (eventType === "user.updated") {
			const {
				id: clerkId,
				email_addresses,
				first_name,
				last_name,
				image_url,
				username,
				external_accounts,
			} = evt.data;

			const primaryEmail = email_addresses.find(
				(e) => e.id === evt.data.primary_email_address_id,
			)?.email_address;

			const displayName =
				[first_name, last_name].filter(Boolean).join(" ") || null;

			const githubAccount = external_accounts?.find(
				(account) => account.provider === "github",
			);
			const githubUsername = githubAccount?.username;

			await db
				.update(users)
				.set({
					email: primaryEmail,
					displayName,
					avatarUrl: image_url,
					username: username || githubUsername || undefined,
					githubUrl: githubUsername
						? `https://github.com/${githubUsername}`
						: undefined,
					updatedAt: new Date(),
				})
				.where(eq(users.clerkId, clerkId));

			console.log(`[Clerk Webhook] Updated user ${clerkId}`);
		}

		if (eventType === "user.deleted") {
			const { id: clerkId } = evt.data;

			if (clerkId) {
				await db
					.update(users)
					.set({
						isPublic: false,
						updatedAt: new Date(),
					})
					.where(eq(users.clerkId, clerkId));

				console.log(`[Clerk Webhook] Soft-deleted user ${clerkId}`);
			}
		}

		return new Response("OK", { status: 200 });
	} catch (err) {
		console.error("[Clerk Webhook] Error:", err);
		return new Response("Error verifying webhook", { status: 400 });
	}
}
