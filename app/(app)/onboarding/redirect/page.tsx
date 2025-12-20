import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PostOnboardingChoice } from "@/components/onboarding/post-onboarding-choice";
import { getOrCreatePersonalOrg } from "@/lib/actions/organizations";
import { getUserPreferences } from "@/lib/actions/user-preferences";
import { db } from "@/lib/db";
import { communityMembers } from "@/lib/db/schema";
import { isGodMode } from "@/lib/god-mode";

interface OnboardingRedirectPageProps {
	searchParams: Promise<{ redirect_url?: string; skip_choice?: string }>;
}

export default async function OnboardingRedirectPage({
	searchParams,
}: OnboardingRedirectPageProps) {
	const { userId } = await auth();
	const { redirect_url, skip_choice } = await searchParams;

	if (!userId) {
		redirect("/sign-in");
	}

	// God mode users can go directly to events (but create personal org first)
	const godMode = await isGodMode();
	if (godMode) {
		await getOrCreatePersonalOrg();
		redirect("/events");
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

	// For organizers: show choice screen (unless skip_choice is set)
	if (prefs.role === "organizer" && !skip_choice) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<SiteHeader />
				<main className="mx-auto max-w-2xl px-4 lg:px-8 py-12 flex-1 w-full">
					<PostOnboardingChoice personalOrgSlug={personalOrg.slug} />
				</main>
				<SiteFooter />
			</div>
		);
	}

	// For organizers with skip_choice: go to personal org
	if (prefs.role === "organizer") {
		redirect(`/c/${personalOrg.slug}`);
	}

	// For members, check if they follow any communities
	const followedCommunities = await db.query.communityMembers.findMany({
		where: eq(communityMembers.userId, userId),
		limit: 1,
	});

	if (followedCommunities.length > 0) {
		redirect("/events");
	}

	redirect("/c");
}
