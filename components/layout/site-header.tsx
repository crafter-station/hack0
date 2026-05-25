import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Hack0Wordmark } from "@/components/brand/hack0-logo";
import { SearchTrigger } from "@/components/search-command";
import { isGodMode } from "@/lib/god-mode";
import { GithubStars } from "./github-stars";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { UserDropdown } from "./user-dropdown";

interface SiteHeaderProps {
	showBackButton?: boolean;
	hideThemeToggle?: boolean;
}

export async function SiteHeader({
	showBackButton = false,
	hideThemeToggle = false,
}: SiteHeaderProps) {
	const { userId } = await auth();

	const [godMode, adminCommunities] = await Promise.all([
		isGodMode(),
		userId
			? (async () => {
					try {
						const { getAllUserOrganizations } = await import(
							"@/lib/actions/organizations"
						);
						const allOrgs = await getAllUserOrganizations();
						return allOrgs.flatMap((org) => {
							if (org.role !== "owner" && org.role !== "admin") {
								return [];
							}

							return [
								{
									organization: {
										id: org.organization.id,
										slug: org.organization.slug,
										name: org.organization.name,
										displayName: org.organization.displayName,
										logoUrl: org.organization.logoUrl,
										isPersonalOrg: org.organization.isPersonalOrg,
									},
									role: org.role,
								},
							];
						});
					} catch (error) {
						console.error("Failed to get user organizations:", error);
						return [];
					}
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
						<Link href="/" className="flex items-center">
							<span className="flex items-end gap-1">
								<Hack0Wordmark className="h-5 w-[70px]" />
								<span className="pb-[1px] font-mono text-[11px] text-muted-foreground">
									.dev
								</span>
							</span>
						</Link>
						<MainNav />
					</div>
					<div className="flex items-center gap-2">
						<GithubStars />
						<SearchTrigger />
						{!userId && (
							<Link
								href="/sign-in"
								className="inline-flex h-7 items-center border border-border/50 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								Iniciar sesión
							</Link>
						)}
						{userId && (
							<UserDropdown
								isGodMode={godMode}
								adminCommunities={adminCommunities}
								hideThemeToggle={hideThemeToggle}
							/>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
