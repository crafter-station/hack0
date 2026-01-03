import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
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

	// Check if user is owner or admin
	if (org.ownerUserId !== userId) {
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
