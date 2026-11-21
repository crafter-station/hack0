import { currentUser } from "@clerk/nextjs/server";
import { getEntitlementByEmail } from "@/lib/entitlements";
import { verifiedPrimaryEmail } from "@/lib/session-access";
import { WORKSHOP } from "../workshop";

type Me = { userId: string; name: string; avatarUrl: string | null; email: string | null; verified: boolean };

/** The signed-in account as the testimonial shows it. A Clerk placeholder avatar counts as no photo. */
export async function me(): Promise<Me | null> {
  const user = await currentUser();
  if (!user) return null;
  const email = verifiedPrimaryEmail(user);
  const verified = email ? (await getEntitlementByEmail(email, WORKSHOP.id)).hasEntitlement : false;
  return {
    userId: user.id,
    name: user.fullName ?? user.username ?? "",
    avatarUrl: user.hasImage ? user.imageUrl : null,
    email,
    verified,
  };
}
