import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import Link from "next/link";
import { SearchTrigger } from "@/components/search-command";
import { AdminLink } from "./admin-link";

interface SiteHeaderProps {
	showBackButton?: boolean;
}

export function SiteHeader({ showBackButton = false }: SiteHeaderProps) {
	return (
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
								hack0
							</span>
							<span className="text-lg text-muted-foreground">.dev</span>
						</Link>
						<nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
							<Link
								href="/"
								className="hover:text-foreground transition-colors"
							>
								Eventos
							</Link>
							<Link
								href="/?juniorFriendly=true"
								className="hover:text-foreground transition-colors"
							>
								Para principiantes
							</Link>
						</nav>
					</div>
					<div className="flex items-center gap-3">
						<SearchTrigger />
						<SignedOut>
							<Link
								href="/sign-in"
								className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								Iniciar sesión
							</Link>
						</SignedOut>
						<SignedIn>
							<AdminLink />
							<Link
								href="/submit"
								className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<Plus className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">Agregar</span>
							</Link>
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
	);
}
