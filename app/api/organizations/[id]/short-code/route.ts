import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communityMembers, organizations } from "@/lib/db/schema";
import { isGodMode } from "@/lib/god-mode";
import { ensureUniqueOrgShortCode } from "@/lib/slug-utils";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, id),
	});

	if (!org) {
		return NextResponse.json(
			{ error: "Organization not found" },
			{ status: 404 },
		);
	}

	// Check permissions: god mode, owner, or admin
	const godMode = await isGodMode();
	let hasPermission = godMode || org.ownerUserId === userId;

	if (!hasPermission) {
		// Check if user is admin of the community
		const membership = await db.query.communityMembers.findFirst({
			where: and(
				eq(communityMembers.communityId, id),
				eq(communityMembers.userId, userId),
			),
		});

		hasPermission =
			membership?.role === "owner" || membership?.role === "admin";
	}

	if (!hasPermission) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	// If already has a shortCode, return it
	if (org.shortCode) {
		return NextResponse.json({ shortCode: org.shortCode });
	}

	// Generate new shortCode
	const shortCode = await ensureUniqueOrgShortCode();

	await db
		.update(organizations)
		.set({ shortCode })
		.where(eq(organizations.id, id));

	return NextResponse.json({ shortCode });
}
