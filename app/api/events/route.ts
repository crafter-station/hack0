import { NextResponse } from "next/server";
import { getHackathons } from "@/lib/actions/hackathons";

export async function GET() {
  try {
    const result = await getHackathons({ limit: 50 });
    return NextResponse.json({ events: result.hackathons });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
