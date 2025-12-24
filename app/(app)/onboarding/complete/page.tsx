import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PostOnboardingChoice } from "@/components/onboarding/post-onboarding-choice";
import { getOrCreatePersonalOrg } from "@/lib/actions/organizations";
import { getUserPreferences } from "@/lib/actions/user-preferences";

interface OnboardingCompletePageProps {
	searchParams: Promise<{ redirect_url?: string }>;
}

export default async function OnboardingCompletePage({
	searchParams,
}: OnboardingCompletePageProps) {
	const { userId } = await auth();
	const { redirect_url } = await searchParams;

	if (!userId) {
		redirect("/sign-in");
	}

	const prefs = await getUserPreferences();
	if (!prefs?.hasCompletedOnboarding) {
		redirect("/onboarding");
	}

	if (prefs.role !== "organizer") {
		redirect(redirect_url || "/c/discover");
	}

	let personalOrg = null;
	try {
		personalOrg = await getOrCreatePersonalOrg();
	} catch (error) {
		console.error("Failed to create personal org:", error);
	}

	if (!personalOrg) {
		redirect(redirect_url || "/c/discover");
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />
			<main className="mx-auto max-w-2xl px-4 lg:px-8 py-12 flex-1 w-full">
				<PostOnboardingChoice
					personalOrgSlug={personalOrg.slug}
					redirectUrl={redirect_url}
				/>
			</main>
			<SiteFooter />
		</div>
	);
}
