"use server";

import { clerkClient } from "@clerk/nextjs/server";

export async function getUserInfo(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const githubAccount = user.externalAccounts.find(
    (account) => account.provider === "github"
  );

  const githubUsername = githubAccount?.username || null;

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Usuario";

  return {
    userId: user.id,
    username: user.username,
    githubUsername,
    fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    email: user.primaryEmailAddress?.emailAddress,
  };
}

export async function getPersonalOrgSlug(userId: string): Promise<string> {
  const info = await getUserInfo(userId);

  const baseSlug = info.githubUsername || info.username || userId.slice(0, 8);

  // Don't include @ in the slug - Next.js interprets @ as route groups
  // We'll show @ in the UI, but store the slug without it
  return baseSlug;
}
