"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, Users } from "lucide-react";

export type EntityType = "events" | "organizations";

const ENTITY_TABS: { id: EntityType; label: string; icon: React.ReactNode }[] = [
	{ id: "events", label: "Eventos", icon: <Calendar className="h-3.5 w-3.5" /> },
	{ id: "organizations", label: "Organizaciones", icon: <Users className="h-3.5 w-3.5" /> },
];

export function EntityTabs() {
	const searchParams = useSearchParams();
	const currentEntity = (searchParams.get("entity") as EntityType) || "events";

	return (
		<div className="flex items-center gap-1">
			{ENTITY_TABS.map((tab) => {
				const isActive = currentEntity === tab.id;

				const params = new URLSearchParams();
				params.set("entity", tab.id);

				return (
					<Link
						key={tab.id}
						href={`/?${params.toString()}`}
						className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
							isActive
								? "bg-foreground text-background"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{tab.icon}
						<span className="hidden sm:inline">{tab.label}</span>
					</Link>
				);
			})}
		</div>
	);
}
