import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { SearchTrigger } from "@/components/search-command";
import { isGodMode } from "@/lib/god-mode";
import { CreateButtonGroup } from "./create-button-group";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { UserDropdown } from "./user-dropdown";

interface SiteHeaderProps {
	showBackButton?: boolean;
}

export async function SiteHeader({ showBackButton = false }: SiteHeaderProps) {
	const { userId } = await auth();

	const [personalOrg, godMode, adminCommunities] = await Promise.all([
		userId
			? (async () => {
					const { getOrCreatePersonalOrg } = await import(
						"@/lib/actions/organizations"
					);
					return await getOrCreatePersonalOrg();
				})()
			: null,
		isGodMode(),
		userId
			? (async () => {
					const { getAllUserOrganizations } = await import(
						"@/lib/actions/organizations"
					);
					const allOrgs = await getAllUserOrganizations();
					return allOrgs.filter(
						(org) => org.role === "owner" || org.role === "admin",
					);
				})()
			: [],
	]);

	return (
		<header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="flex h-11 items-center justify-between">
					<div className="flex items-center gap-3 md:gap-5">
						<MobileNav />
						{showBackButton && (
							<Link
								href="/"
								className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
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
						<Link href="/" className="flex items-center gap-2">
							<span className="flex items-center">
								<span className="text-sm font-semibold tracking-tight">hack0</span>
								<span className="text-sm text-muted-foreground">.dev</span>
							</span>
							<span className="font-mono text-[10px] font-medium uppercase tracking-wider text-violet-500 border border-violet-500/30 px-1.5 py-0.5 rounded-sm">
								beta
							</span>
						</Link>
						<MainNav />
					</div>
					<div className="flex items-center gap-2">
						<SearchTrigger />
						<SignedOut>
							<Link
								href="/sign-in"
								className="inline-flex h-7 items-center border border-border/50 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								Iniciar sesión
							</Link>
						</SignedOut>
						<SignedIn>
							{personalOrg && (
								<CreateButtonGroup personalOrgSlug={personalOrg.slug} />
							)}
							<UserDropdown
								isGodMode={godMode}
								adminCommunities={adminCommunities}
							/>
						</SignedIn>
					</div>
				</div>
			</div>
		</header>
	);
}
