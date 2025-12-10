import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { GodModeBanner } from "@/components/god-mode/god-mode-banner";
import { SearchTrigger } from "@/components/search-command";
import { ThemeSwitcherButton } from "@/components/theme-switcher-button";
import { getAllUserOrganizations } from "@/lib/actions/organizations";
import { db } from "@/lib/db";
import { organizations as orgsTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { OrgSwitcher } from "./org-switcher";

interface SiteHeaderProps {
	showBackButton?: boolean;
}

export async function SiteHeader({ showBackButton = false }: SiteHeaderProps) {
	const { userId } = await auth();
	const organizations = userId ? await getAllUserOrganizations() : [];

	// Get or create user's personal org (ensures all logged-in users have one)
	const personalOrg = userId
		? await (async () => {
				const { getOrCreatePersonalOrg } = await import("@/lib/actions/organizations");
				return await getOrCreatePersonalOrg();
		  })()
		: null;

	return (
		<>
			<GodModeBanner />
			<header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<div className="flex h-14 items-center justify-between">
						<div className="flex items-center gap-6">
							{showBackButton && (
								<Link
									href="/"
									className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="m12 19-7-7 7-7" />
										<path d="M19 12H5" />
									</svg>
								</Link>
							)}
							<Link href="/" className="flex items-center font-mono">
								<span className="text-lg font-semibold tracking-tight">
									<span className="sm:hidden">h0</span>
									<span className="hidden sm:inline">hack0</span>
								</span>
								<span className="hidden sm:inline text-lg text-muted-foreground">
									.dev
								</span>
							</Link>
							<nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
								<Link
									href="/events"
									className="hover:text-foreground transition-colors"
								>
									Eventos
								</Link>
								<Link
									href="/feed"
									className="hover:text-foreground transition-colors"
								>
									Tu Feed
								</Link>
							</nav>
						</div>
						<div className="flex items-center gap-3">
							<SearchTrigger />
							<ThemeSwitcherButton />
							<SignedOut>
								<Link
									href="/sign-in"
									className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									Iniciar sesión
								</Link>
							</SignedOut>
							<SignedIn>
								<OrgSwitcher
									organizations={organizations}
									personalOrg={personalOrg}
								/>
								<UserButton
									appearance={{
										elements: {
											avatarBox: "h-8 w-8",
										},
									}}
								/>
							</SignedIn>
						</div>
					</div>
				</div>
			</header>
		</>
	);
}
