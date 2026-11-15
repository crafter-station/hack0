"use client";

import { useClerk } from "@clerk/nextjs";

/** Signs the current account out and lands on sign-in, so the visitor can come back with the email of their purchase. */
export function SwitchAccount({ to, children }: { to: string; children: React.ReactNode }) {
  const { signOut } = useClerk();
  return (
    <button type="button" className="th-cta" onClick={() => signOut({ redirectUrl: to })}>
      {children}
    </button>
  );
}
