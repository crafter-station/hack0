import { notFound } from "next/navigation";

/**
 * Gate for every admin page and action. Fails closed: until Clerk is set up, the panel only opens in local development.
 * Replace the body with a Clerk check (`await auth()` plus an allow-list) once `clerk init` has run.
 */
export async function requireAdmin(): Promise<void> {
  if (process.env.NODE_ENV === "development") return;
  notFound();
}
