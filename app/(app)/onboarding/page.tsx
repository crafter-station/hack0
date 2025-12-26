import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { InitialOnboardingForm } from "@/components/onboarding/initial-onboarding-form";
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

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader showBackButton />

			<main className="mx-auto max-w-lg px-4 lg:px-8 py-12 flex-1 w-full flex items-center">
				<div className="w-full space-y-8">
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-bold tracking-tight">
							Bienvenido a hack0
						</h1>
						<p className="text-muted-foreground">¿Qué te trae por aquí?</p>
					</div>

					<InitialOnboardingForm redirectUrl={redirect_url} />
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
