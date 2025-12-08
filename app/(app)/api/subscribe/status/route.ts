import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ exists: false }, { status: 200 });
  }

  try {
    const subscription = await db
      .select({
        isVerified: subscriptions.isVerified,
        isActive: subscriptions.isActive,
      })
      .from(subscriptions)
      .where(eq(subscriptions.email, email.toLowerCase()))
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
