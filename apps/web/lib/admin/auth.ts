import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

/** Comma-separated, lowercased values of an env var; a leading @ is dropped. */
function list(name: string) {
  return new Set(
    (process.env[name] ?? "")
      .split(",")
      .map((v) => v.trim().replace(/^@/, "").toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Gate for every admin page and action: signed out goes to sign-in, signed in without a listed email
 * (HACK0_ADMIN_EMAILS) or a listed GitHub username (HACK0_ADMIN_GITHUB) gets a 404.
 * The check sits next to the data, as Clerk recommends, not in the proxy.
 */
export async function requireAdmin(): Promise<void> {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
  const user = await currentUser();
  const emails = list("HACK0_ADMIN_EMAILS");
  const githubs = list("HACK0_ADMIN_GITHUB");
  const byEmail =
    user?.emailAddresses.some((e) => e.verification?.status === "verified" && emails.has(e.emailAddress.toLowerCase())) ?? false;
  const byGithub =
    user?.externalAccounts.some(
      (a) => a.provider.endsWith("github") && a.verification?.status === "verified" && githubs.has((a.username ?? "").toLowerCase()),
    ) ?? false;
  if (!byEmail && !byGithub) notFound();
}
