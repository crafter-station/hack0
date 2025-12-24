"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMounted } from "@/hooks/use-mounted";

const navItems = [
	{ href: "/", label: "Inicio" },
	{ href: "/events", label: "Eventos" },
	{ href: "/c/discover", label: "Comunidades" },
	{ href: "/gift/gallery", label: "Galería 🎄" },
];

const secondaryItems = [
	{ href: "/roadmap", label: "Roadmap" },
	{ href: "mailto:hey@hack0.dev", label: "Contacto", external: true },
];

export function MobileNav() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const mounted = useMounted();

	if (!mounted) {
		return (
			<button
				type="button"
				className="md:hidden inline-flex h-7 w-7 items-center justify-center text-muted-foreground"
			>
				<Menu className="h-4 w-4" />
				<span className="sr-only">Menú</span>
			</button>
		);
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger className="md:hidden inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
				<Menu className="h-4 w-4" />
				<span className="sr-only">Menú</span>
			</SheetTrigger>
			<SheetContent side="left" className="w-full sm:w-80 p-0">
				<div className="flex flex-col h-full">
					<div className="p-6 border-b border-border/50">
						<Link
							href="/"
							className="flex items-center"
							onClick={() => setOpen(false)}
						>
							<span className="text-lg font-semibold tracking-tight">
								hack0
							</span>
							<span className="text-lg text-muted-foreground">.dev</span>
						</Link>
					</div>

					<nav className="flex-1 p-6">
						<div className="space-y-1">
							{navItems.map((item) => {
								const isActive =
									pathname === item.href ||
									(item.href !== "/" && pathname.startsWith(item.href));
								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setOpen(false)}
										className={`
											block py-3 text-xl font-medium tracking-tight transition-colors
											${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
										`}
									>
										{item.label}
									</Link>
								);
							})}
						</div>

						<div className="mt-8 pt-8 border-t border-border/50 space-y-1">
							<p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
								Recursos
							</p>
							{secondaryItems.map((item) =>
								item.external ? (
									<a
										key={item.href}
										href={item.href}
										onClick={() => setOpen(false)}
										className="block py-2 text-base text-muted-foreground hover:text-foreground transition-colors"
									>
										{item.label}
									</a>
								) : (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setOpen(false)}
										className="block py-2 text-base text-muted-foreground hover:text-foreground transition-colors"
									>
										{item.label}
									</Link>
								),
							)}
						</div>
					</nav>

					<div className="p-6 border-t border-border/50">
						<p className="text-xs text-muted-foreground">
							Mapeando el ecosistema tech de LATAM 🌎
						</p>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
