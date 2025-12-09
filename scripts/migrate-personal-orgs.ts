#!/usr/bin/env bun

/**
 * Migration script to create personal orgs for ALL existing users
 *
 * IMPORTANT: Make sure CLERK_SECRET_KEY matches your database environment:
 * - For PROD database: Use sk_live_... key
 * - For DEV database: Use sk_test_... key
 *
 * Usage:
 *   # With .env configured correctly:
 *   bun run migrate:personal-orgs
 *
 *   # Or with explicit env vars:
 *   CLERK_SECRET_KEY=sk_live_xxx bun run migrate:personal-orgs
 *
 * What it does:
 * 1. Finds ALL users (members and organizers) in user_preferences
 * 2. For each, checks if they already have a personal org
 * 3. If not, creates one with @username slug from GitHub/Clerk
 * 4. Syncs profile image from Clerk
 */

import { db } from "../lib/db";
import { organizations, userPreferences } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

async function createPersonalOrgForUser(userId: string) {
  try {
    // Check if user already has a personal org
    const existingOrg = await db.query.organizations.findFirst({
      where: and(
        eq(organizations.ownerUserId, userId),
        eq(organizations.isPersonalOrg, true)
      ),
    });

    if (existingOrg) {
      console.log(`✓ User ${userId} already has personal org: ${existingOrg.slug}`);
      return { success: true, existed: true, org: existingOrg };
    }

    // Get user info from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const githubAccount = user.externalAccounts.find(
      (account) => account.provider === "github"
    );

    const githubUsername = githubAccount?.username || null;
    const baseSlug = githubUsername || user.username || userId.slice(0, 8);
    // Don't include @ in slug - Next.js interprets @ as route groups
    const slug = baseSlug;

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Usuario";

    // Check if slug is taken
    const slugTaken = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    let finalSlug = slug;
    if (slugTaken) {
      // Add a number suffix if taken
      let counter = 1;
      while (true) {
        finalSlug = `${slug}${counter}`;
        const taken = await db.query.organizations.findFirst({
          where: eq(organizations.slug, finalSlug),
        });
        if (!taken) break;
        counter++;
      }
    }

    // Create personal org
    const [org] = await db
      .insert(organizations)
      .values({
        slug: finalSlug,
        name: fullName,
        displayName: null,
        type: "community",
        ownerUserId: userId,
        isPersonalOrg: true,
        isPublic: false,
        logoUrl: user.imageUrl,
      })
      .returning();

    console.log(`✓ Created personal org for ${fullName}: ${finalSlug}`);
    return { success: true, existed: false, org };
  } catch (error) {
    console.error(`✗ Error creating org for user ${userId}:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log("🚀 Starting personal org migration for ALL users...\n");

  // Get ALL users (both members and organizers)
  const allUsers = await db.query.userPreferences.findMany();

  console.log(`Found ${allUsers.length} users total\n`);

  let created = 0;
  let existed = 0;
  let failed = 0;

  for (const user of allUsers) {
    const result = await createPersonalOrgForUser(user.clerkUserId);

    if (result.success) {
      if (result.existed) {
        existed++;
      } else {
        created++;
      }
    } else {
      failed++;
    }
  }

  console.log("\n📊 Migration complete!");
  console.log(`✓ Created: ${created}`);
  console.log(`✓ Already existed: ${existed}`);
  console.log(`✗ Failed: ${failed}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
