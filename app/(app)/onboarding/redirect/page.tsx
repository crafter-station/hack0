import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserPreferences } from "@/lib/actions/user-preferences";
import { getUserOrganization } from "@/lib/actions/organizations";
import { db } from "@/lib/db";
import { communityMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function OnboardingRedirectPage() {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const prefs = await getUserPreferences();

	if (!prefs || !prefs.hasCompletedOnboarding) {
		redirect("/onboarding");
	}

	if (prefs.role === "organizer") {
		const userOrg = await getUserOrganization();

		if (userOrg) {
			redirect(`/c/${userOrg.slug}`);
		}

		redirect("/c/new");
	}

	const followedCommunities = await db.query.communityMembers.findMany({
		where: eq(communityMembers.userId, userId),
		limit: 1,
	});

	if (followedCommunities.length > 0) {
		redirect("/");
	}

	redirect("/c");
}
