import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

/** Comma-separated emails that may open /admin, from HACK0_ADMIN_EMAILS. */
function adminEmails() {
  return new Set(
    (process.env.HACK0_ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Gate for every admin page and action: signed out goes to sign-in, signed in without a listed email gets a 404.
 * The check sits next to the data, as Clerk recommends, not in the proxy.
 */
export async function requireAdmin(): Promise<void> {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
  const user = await currentUser();
  const allowed = adminEmails();
  const emails = user?.emailAddresses.filter((e) => e.verification?.status === "verified").map((e) => e.emailAddress.toLowerCase()) ?? [];
  if (!emails.some((e) => allowed.has(e))) notFound();
}
