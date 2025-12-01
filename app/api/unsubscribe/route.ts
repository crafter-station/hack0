import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hack0.dev";

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/unsubscribe/error?reason=missing-token`);
  }

  try {
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.unsubscribeToken, token))
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.redirect(`${baseUrl}/unsubscribe/error?reason=invalid-token`);
    }

    const sub = subscription[0];

    if (!sub.isActive) {
      return NextResponse.redirect(`${baseUrl}/unsubscribe/success?already=true`);
    }

    await db
      .update(subscriptions)
      .set({
        isActive: false,
      })
      .where(eq(subscriptions.id, sub.id));

    return NextResponse.redirect(`${baseUrl}/unsubscribe/success`);
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.redirect(`${baseUrl}/unsubscribe/error?reason=unknown`);
  }
}
