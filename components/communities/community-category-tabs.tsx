"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const CATEGORY_TABS = [
	{ id: "todas", label: "Todas" },
	{ id: "desarrollo", label: "Desarrollo" },
	{ id: "diseno", label: "Diseño" },
	{ id: "data-ia", label: "Data & IA" },
	{ id: "negocios", label: "Negocios" },
	{ id: "comunidad", label: "Comunidad" },
] as const;

// Map category tabs to organization types
export const CATEGORY_TYPE_MAP: Record<string, string[]> = {
	todas: [],
	desarrollo: ["community", "startup", "company"],
	diseno: ["community", "coworking"],
	"data-ia": ["community", "university", "company"],
	negocios: ["startup", "investor", "consulting", "law_firm", "coworking"],
	comunidad: ["community", "ngo", "student_org"],
};

interface CommunityCategoryTabsProps {
	activeTab?: string;
}

export function CommunityCategoryTabs({
	activeTab = "todas",
}: CommunityCategoryTabsProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const handleTabChange = (tabId: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (tabId === "todas") {
			params.delete("category");
		} else {
			params.set("category", tabId);
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="flex items-center gap-1">
			{CATEGORY_TABS.map((tab) => (
				<button
					key={tab.id}
					onClick={() => handleTabChange(tab.id)}
					className={`px-3 py-1.5 text-xs font-medium transition-colors ${
						activeTab === tab.id
							? "text-foreground border-b-2 border-foreground"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
