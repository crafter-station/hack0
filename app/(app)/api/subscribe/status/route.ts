import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const email = searchParams.get("email");
	const communityId = searchParams.get("communityId");

	if (!email) {
		return NextResponse.json({ exists: false }, { status: 200 });
	}

	try {
		const conditions = communityId
			? and(
					eq(subscriptions.email, email.toLowerCase()),
					eq(subscriptions.communityId, communityId),
				)
			: and(
					eq(subscriptions.email, email.toLowerCase()),
					isNull(subscriptions.communityId),
				);

		const subscription = await db
			.select({
				isVerified: subscriptions.isVerified,
				isActive: subscriptions.isActive,
			})
			.from(subscriptions)
			.where(conditions)
			.limit(1);

		if (subscription.length === 0) {
			return NextResponse.json({ exists: false }, { status: 200 });
		}

		return NextResponse.json({
			exists: true,
			isVerified: subscription[0].isVerified,
			isActive: subscription[0].isActive,
		});
	} catch {
		return NextResponse.json({ exists: false }, { status: 200 });
	}
}
