"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
	{ href: "/events", label: "Eventos" },
	{ href: "/c/discover", label: "Comunidades" },
	{ href: "/gift/gallery", label: "Galería 🎄" },
	{ href: "/roadmap", label: "Roadmap" },
];

export function MainNav() {
	const pathname = usePathname();

	return (
		<nav className="hidden md:flex items-center gap-4 text-xs">
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
