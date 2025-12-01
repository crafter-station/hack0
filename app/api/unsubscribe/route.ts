import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return redirect("/unsubscribe/error?reason=missing-token");
    }

    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.unsubscribeToken, token))
      .limit(1);

    if (subscription.length === 0) {
      return redirect("/unsubscribe/error?reason=invalid-token");
    }

    const sub = subscription[0];

    if (!sub.isActive) {
      return redirect("/unsubscribe/success?already=true");
    }

    await db
      .update(subscriptions)
      .set({
        isActive: false,
      })
      .where(eq(subscriptions.id, sub.id));

    return redirect("/unsubscribe/success");
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return redirect("/unsubscribe/error?reason=unknown");
  }
}
