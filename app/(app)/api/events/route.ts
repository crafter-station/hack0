import { NextResponse } from "next/server";
import { getEvents } from "@/lib/actions/events";

export async function GET() {
	try {
		const result = await getEvents({ limit: 50 });
		return NextResponse.json({ events: result.events });
	} catch (error) {
		console.error("Error fetching events:", error);
		return NextResponse.json({ events: [] }, { status: 500 });
	}
}
