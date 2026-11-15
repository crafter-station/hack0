type EmailAddress = { emailAddress: string; verification?: { status?: string | null } | null };
type AccountUser = { primaryEmailAddress: EmailAddress | null };

type SessionGate = { ok: true; email: string } | { ok: false; status: 401 | 403; code: string; message: string };

/** The primary email, only when Clerk has verified it. */
export function verifiedPrimaryEmail(user: AccountUser): string | null {
  const primary = user.primaryEmailAddress;
  return primary?.verification?.status === "verified" ? primary.emailAddress : null;
}

/** Who may read a recorded session: a signed-in user whose verified primary email owns the workshop. */
export async function gateSession(user: AccountUser | null, owns: (email: string) => Promise<boolean>): Promise<SessionGate> {
  if (!user) return { ok: false, status: 401, code: "auth.signed-out", message: "Sign in to read this session." };
  const email = verifiedPrimaryEmail(user);
  if (!email) return { ok: false, status: 403, code: "auth.unverified-email", message: "Your primary email is not verified." };
  if (!(await owns(email)))
    return { ok: false, status: 403, code: "auth.not-entitled", message: "This account has no purchase for the workshop." };
  return { ok: true, email };
}
