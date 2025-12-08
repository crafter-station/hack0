import { notifySubscribersOfNewEvent } from "@/lib/email/notify-subscribers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Check for authorization (simple API key for now)
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.NOTIFY_API_KEY;

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    const result = await notifySubscribersOfNewEvent({ eventId });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Notifications sent",
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
