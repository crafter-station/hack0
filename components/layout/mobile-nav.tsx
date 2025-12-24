"use client";

import { Gift, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMounted } from "@/hooks/use-mounted";

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
	{ href: "/", label: "Inicio" },
	{ href: "/events", label: "Eventos" },
	{ href: "/c/discover", label: "Comunidades" },
];

const secondaryItems = [
	{ href: "/roadmap", label: "Roadmap" },
	{ href: "mailto:hey@hack0.dev", label: "Contacto", external: true },
];

export function MobileNav() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const mounted = useMounted();
	const isGiftActive = pathname.startsWith("/gift");

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
						{/* Festive Gift Banner */}
						<Link
							href="/gift"
							onClick={() => setOpen(false)}
							className={`
								flex items-center gap-3 p-4 mb-6
								bg-emerald-600 dark:bg-emerald-700
								text-white
								hover:bg-emerald-700 dark:hover:bg-emerald-600
								transition-colors
								${isGiftActive ? "ring-2 ring-emerald-400" : ""}
							`}
						>
							<div className="flex items-center justify-center w-10 h-10 bg-white/10">
								<Gift className="h-5 w-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<span className="font-semibold">Regalo de Navidad</span>
									<SnowflakeIcon className="h-3.5 w-3.5 opacity-75" />
								</div>
								<span className="text-xs text-white/80">
									Crea tu tarjeta personalizada
								</span>
							</div>
						</Link>

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
