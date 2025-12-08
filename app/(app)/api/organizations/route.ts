import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
	try {
		const allOrgs = await db
			.select()
			.from(organizations)
			.orderBy(desc(organizations.createdAt))
			.limit(20);

		return NextResponse.json({
			organizations: allOrgs,
		});
	} catch (error) {
		console.error("Error fetching organizations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch organizations" },
			{ status: 500 },
		);
	}
}
