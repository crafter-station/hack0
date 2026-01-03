"use client";

import { Award, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
	slug: string;
}

const sidebarItems = [
	{
		id: "general",
		label: "General",
		icon: Settings,
		href: (slug: string) => `/c/${slug}/settings`,
	},
	{
		id: "badge",
		label: "Insignias",
		icon: Award,
		href: (slug: string) => `/c/${slug}/settings/badge`,
	},
	{
		id: "campaigns",
		label: "Campañas",
		icon: Sparkles,
		href: (slug: string) => `/c/${slug}/settings/campaigns`,
	},
];

export function SettingsSidebar({ slug }: SettingsSidebarProps) {
	const pathname = usePathname();

	const currentSection = pathname.includes("/settings/campaigns")
		? "campaigns"
		: pathname.includes("/settings/badge")
			? "badge"
			: "general";

	return (
		<aside className="w-full md:w-56 shrink-0 space-y-4">
			<h2 className="text-lg font-semibold">Configuración</h2>

			<Input type="search" placeholder="Buscar..." className="w-full" />

			<nav className="flex flex-col gap-1">
				{sidebarItems.map((item) => {
					const isActive = currentSection === item.id;
					const Icon = item.icon;

					return (
						<Link
							key={item.id}
							href={item.href(slug)}
							className={cn(
								"flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
								isActive
									? "bg-muted font-medium text-foreground"
									: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
							)}
						>
							<Icon className="h-4 w-4" />
							{item.label}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
