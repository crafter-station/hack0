"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function SnowflakeIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<line x1="12" y1="2" x2="12" y2="22" />
			<line x1="2" y1="12" x2="22" y2="12" />
			<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
			<line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
			<line x1="12" y1="2" x2="9" y2="5" />
			<line x1="12" y1="2" x2="15" y2="5" />
			<line x1="12" y1="22" x2="9" y2="19" />
			<line x1="12" y1="22" x2="15" y2="19" />
			<line x1="2" y1="12" x2="5" y2="9" />
			<line x1="2" y1="12" x2="5" y2="15" />
			<line x1="22" y1="12" x2="19" y2="9" />
			<line x1="22" y1="12" x2="19" y2="15" />
		</svg>
	);
}

const navItems = [
	{ href: "/events", label: "Eventos" },
	{ href: "/c/discover", label: "Comunidades" },
	{ href: "/roadmap", label: "Roadmap" },
];

export function MainNav() {
	const pathname = usePathname();
	const isGiftActive = pathname.startsWith("/gift");

	return (
		<nav className="hidden md:flex items-center gap-4 text-xs">
			<Link
				href="/gift"
				className={`
					inline-flex items-center gap-1.5 px-2.5 py-1
					bg-emerald-600 dark:bg-emerald-700
					text-white font-medium
					hover:bg-emerald-700 dark:hover:bg-emerald-600
					transition-colors
					${isGiftActive ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-background" : ""}
				`}
			>
				<SnowflakeIcon className="h-3 w-3" />
				<span>Regalo</span>
			</Link>

			{navItems.map((item) => {
				const isActive =
					pathname === item.href ||
					(item.href !== "/" &&
						pathname.startsWith(item.href.split("/").slice(0, 2).join("/")));

				return (
					<Link
						key={item.href}
						href={item.href}
						className={`transition-colors ${
							isActive
								? "text-foreground"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
