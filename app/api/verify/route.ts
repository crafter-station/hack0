import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return redirect("/subscribe/error?reason=missing-token");
    }

    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.verificationToken, token))
      .limit(1);

    if (subscription.length === 0) {
      return redirect("/subscribe/error?reason=invalid-token");
    }

    const sub = subscription[0];

    if (sub.isVerified) {
      return redirect("/subscribe/success?already=true");
    }

    // Generate new unsubscribe token if needed
    const unsubscribeToken = sub.unsubscribeToken || nanoid(32);

    await db
      .update(subscriptions)
      .set({
        isVerified: true,
        isActive: true,
        verificationToken: null,
        unsubscribeToken,
      })
      .where(eq(subscriptions.id, sub.id));

    return redirect("/subscribe/success");
  } catch (error) {
    console.error("Verify error:", error);
    return redirect("/subscribe/error?reason=unknown");
  }
}
