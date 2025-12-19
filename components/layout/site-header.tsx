import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { SearchTrigger } from "@/components/search-command";
import { isGodMode } from "@/lib/god-mode";
import { UserDropdown } from "./user-dropdown";

interface SiteHeaderProps {
	showBackButton?: boolean;
}

export async function SiteHeader({ showBackButton = false }: SiteHeaderProps) {
	const { userId } = await auth();

	const [personalOrg, godMode] = await Promise.all([
		userId
			? (async () => {
					const { getOrCreatePersonalOrg } = await import(
						"@/lib/actions/organizations"
					);
					return await getOrCreatePersonalOrg();
				})()
			: null,
		isGodMode(),
	]);

	return (
		<header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-6">
				<div className="flex h-11 items-center justify-between">
					<div className="flex items-center gap-5">
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
							<span className="text-sm font-semibold tracking-tight">
								<span className="sm:hidden">h0</span>
								<span className="hidden sm:inline">hack0</span>
							</span>
							<span className="hidden sm:inline text-sm text-muted-foreground">
								.dev
							</span>
						</Link>
						<nav className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
							<Link
								href="/events"
								className="hover:text-foreground transition-colors"
							>
								Eventos
							</Link>
							<Link
								href="/c/discover"
								className="hover:text-foreground transition-colors"
							>
								Comunidades
							</Link>
							<Link
								href="/roadmap"
								className="hover:text-foreground transition-colors"
							>
								Roadmap
							</Link>
							<Link
								href="/feed"
								className="hover:text-foreground transition-colors"
							>
								Feed
							</Link>
						</nav>
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
								<Link
									href={`/c/${personalOrg.slug}/events/new`}
									className="inline-flex h-7 items-center gap-1.5 bg-foreground px-2.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
								>
									<Plus className="h-3 w-3" />
									<span className="hidden sm:inline">Crear evento</span>
								</Link>
							)}
							<UserDropdown isGodMode={godMode} />
						</SignedIn>
					</div>
				</div>
			</div>
		</header>
	);
}
