"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

/**
 * Admin link and Clerk's account menu (with sign out) for signed-in visitors.
 * Resolved on the client so public pages stay static: reading the session on the server would make every ISR page dynamic.
 * `part` splits them for the phone header, where the avatar stays in the bar and the link moves into the menu.
 */
export function AccountNav({ part = "both" }: { part?: "both" | "link" | "avatar" }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return (
    <>
      {part !== "avatar" && <Link href="/admin">admin</Link>}
      {part !== "link" && <UserButton />}
    </>
  );
}
