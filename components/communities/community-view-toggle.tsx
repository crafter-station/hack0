"use client";

import { LayoutGrid, List } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function CommunityViewToggle() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const currentView =
		(searchParams.get("view") as "table" | "cards") || "cards";

	const handleValueChange = (value: "table" | "cards") => {
		if (!value) return;

		const params = new URLSearchParams(searchParams.toString());
		params.set("view", value);
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<ToggleGroup
			type="single"
			value={currentView}
			onValueChange={handleValueChange}
			className="h-7"
		>
			<ToggleGroupItem
				value="cards"
				aria-label="Vista de tarjetas"
				className="h-7 px-2.5 gap-1.5"
			>
				<LayoutGrid className="h-3.5 w-3.5" />
				<span className="text-xs">Tarjetas</span>
			</ToggleGroupItem>
			<ToggleGroupItem
				value="table"
				aria-label="Vista de lista"
				className="h-7 px-2.5 gap-1.5"
			>
				<List className="h-3.5 w-3.5" />
				<span className="text-xs">Lista</span>
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
