"use client";

import { UserButton, useAuth } from "@clerk/nextjs";

/**
 * Admin link and Clerk's account menu (with sign out) for signed-in visitors.
 * Resolved on the client so public pages stay static: reading the session on the server would make every ISR page dynamic.
 */
export function AccountNav() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return (
    <>
      <a href="/admin">admin</a>
      <UserButton />
    </>
  );
}
