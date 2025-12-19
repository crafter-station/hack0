import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token");
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hack0.dev";

	if (!token) {
		return NextResponse.redirect(
			`${baseUrl}/subscribe/error?reason=missing-token`,
		);
	}

	try {
		const subscription = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.verificationToken, token))
			.limit(1);

		if (subscription.length === 0) {
			return NextResponse.redirect(
				`${baseUrl}/subscribe/error?reason=invalid-token`,
			);
		}

		const sub = subscription[0];

		if (sub.isVerified) {
			return NextResponse.redirect(`${baseUrl}/subscribe/success?already=true`);
		}

		// Generate new unsubscribe token if needed
		const unsubscribeToken = sub.unsubscribeToken || nanoid(32);

		await db
			.update(subscriptions)
			.set({
				isVerified: true,
				isActive: true,
				verificationToken: null,
				unsubscribeToken,
			})
			.where(eq(subscriptions.id, sub.id));

		return NextResponse.redirect(`${baseUrl}/subscribe/success`);
	} catch (error) {
		console.error("Verify error:", error);
		return NextResponse.redirect(`${baseUrl}/subscribe/error?reason=unknown`);
	}
}
