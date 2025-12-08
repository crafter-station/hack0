import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAllUserOrganizations } from "@/lib/actions/organizations";

export async function GET() {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ organizations: [] });
		}

		const organizations = await getAllUserOrganizations();

		return NextResponse.json({
			organizations,
		});
	} catch (error) {
		console.error("Error fetching user communities:", error);
		return NextResponse.json(
			{ error: "Failed to fetch communities" },
			{ status: 500 },
		);
	}
}
