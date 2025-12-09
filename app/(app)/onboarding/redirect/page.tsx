import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserPreferences } from "@/lib/actions/user-preferences";
import { getOrCreatePersonalOrg } from "@/lib/actions/organizations";
import { isGodMode } from "@/lib/god-mode";
import { db } from "@/lib/db";
import { communityMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface OnboardingRedirectPageProps {
	searchParams: Promise<{ redirect_url?: string }>;
}

export default async function OnboardingRedirectPage({ searchParams }: OnboardingRedirectPageProps) {
	const { userId } = await auth();
	const { redirect_url } = await searchParams;

	if (!userId) {
		redirect("/sign-in");
	}

	// God mode users can go directly to feed
	const godMode = await isGodMode();
	if (godMode) {
		redirect("/feed");
	}

	const prefs = await getUserPreferences();

	if (!prefs || !prefs.hasCompletedOnboarding) {
		const onboardingUrl = redirect_url
			? `/onboarding?redirect_url=${encodeURIComponent(redirect_url)}`
			: "/onboarding";
		redirect(onboardingUrl);
	}

	if (redirect_url) {
		redirect(redirect_url);
	}

	// Create personal org for ALL users (both organizers and members)
	const personalOrg = await getOrCreatePersonalOrg();

	// Redirect based on role
	if (prefs.role === "organizer") {
		redirect(`/c/${personalOrg.slug}`);
	}

	// For members, check if they follow any communities
	const followedCommunities = await db.query.communityMembers.findMany({
		where: eq(communityMembers.userId, userId),
		limit: 1,
	});

	if (followedCommunities.length > 0) {
		redirect("/feed");
	}

	redirect("/c");
}
