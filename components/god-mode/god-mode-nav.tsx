"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface GodModeNavProps {
	tabs: Array<{ id: string; label: string; href: string }>;
}

export function GodModeNav({ tabs }: GodModeNavProps) {
	const pathname = usePathname();

	return (
		<nav className="flex items-center gap-1 border-t -mb-px">
			{tabs.map((tab) => {
				const isActive = pathname.startsWith(tab.href);
				return (
					<Link
						key={tab.id}
						href={tab.href}
						className={`relative px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
							isActive
								? "border-foreground text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
						}`}
					>
						{tab.label}
					</Link>
				);
			})}
		</nav>
	);
}
