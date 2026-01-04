import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getCurrentUser } from "@/lib/actions/users";

interface OnboardingPageProps {
	searchParams: Promise<{ redirect_url?: string }>;
}

export default async function OnboardingPage({
	searchParams,
}: OnboardingPageProps) {
	const { userId } = await auth();
	const { redirect_url } = await searchParams;

	if (!userId) {
		redirect("/sign-in");
	}

	const user = await getCurrentUser();
	if (user?.hasCompletedOnboarding) {
		if (user.role === "organizer") {
			redirect(redirect_url || "/onboarding/complete");
		}
		redirect(redirect_url || "/c/discover");
	}

	return <OnboardingFlow redirectUrl={redirect_url} />;
}
