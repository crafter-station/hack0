"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
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
];

export function SettingsSidebar({ slug }: SettingsSidebarProps) {
	const currentSection = "general";

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
