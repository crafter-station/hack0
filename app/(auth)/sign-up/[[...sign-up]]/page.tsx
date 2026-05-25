import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Hack0Wordmark } from "@/components/brand/hack0-logo";

interface SignUpPageProps {
	searchParams: Promise<{ redirect_url?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
	const { redirect_url } = await searchParams;

	const onboardingUrl = redirect_url
		? `/onboarding?redirect_url=${encodeURIComponent(redirect_url)}`
		: "/onboarding";

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex h-14 items-center">
						<Link href="/" className="flex items-end gap-1">
							<Hack0Wordmark className="h-7 w-[98px]" />
							<span className="pb-[2px] font-mono text-sm text-muted-foreground">
								.dev
							</span>
						</Link>
					</div>
				</div>
			</header>

			<main className="flex-1 flex items-center justify-center p-4">
				<SignUp
					forceRedirectUrl={onboardingUrl}
					fallbackRedirectUrl={redirect_url || "/onboarding"}
					appearance={{
						elements: {
							rootBox: "mx-auto",
							card: "bg-background border border-border shadow-none",
							headerTitle: "text-foreground",
							headerSubtitle: "text-muted-foreground",
							socialButtonsBlockButton:
								"bg-muted border-border text-foreground hover:bg-muted/80",
							socialButtonsBlockButtonText: "text-foreground font-medium",
							dividerLine: "bg-border",
							dividerText: "text-muted-foreground",
							formFieldLabel: "text-foreground",
							formFieldInput: "bg-background border-border text-foreground",
							formButtonPrimary:
								"bg-brand-green text-brand-black hover:bg-brand-green/90",
							footerActionLink: "text-brand-green hover:text-brand-green/80",
							identityPreviewText: "text-foreground",
							identityPreviewEditButton:
								"text-muted-foreground hover:text-foreground",
						},
					}}
				/>
			</main>
		</div>
	);
}
