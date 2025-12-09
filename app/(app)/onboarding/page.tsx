import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { InitialOnboardingForm } from "@/components/onboarding/initial-onboarding-form";
import { hasCompletedOnboarding } from "@/lib/actions/user-preferences";

export default async function OnboardingPage() {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const completed = await hasCompletedOnboarding();
	if (completed) {
		redirect("/onboarding/redirect");
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader showBackButton />

			<main className="mx-auto max-w-4xl px-4 lg:px-8 py-12 flex-1 w-full">
				<div className="space-y-10">
					<div className="text-center space-y-3">
						<h1 className="text-3xl font-bold tracking-tight">
							Bienvenido a hack0
						</h1>
						<p className="text-lg text-muted-foreground">
							Cuéntanos un poco sobre ti para personalizar tu experiencia
						</p>
					</div>

					<div className="rounded-lg border bg-card p-8 md:p-10">
						<InitialOnboardingForm />
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
