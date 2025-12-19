"use client";

import { Calendar, List } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ViewToggle() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Read current view from URL params
	const currentView =
		(searchParams.get("view") as "table" | "calendar") || "table";

	const handleValueChange = (value: "table" | "calendar") => {
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
				value="table"
				aria-label="Vista de tabla"
				className="h-7 w-7 p-0"
			>
				<List className="h-3.5 w-3.5" />
			</ToggleGroupItem>
			<ToggleGroupItem
				value="calendar"
				aria-label="Vista de calendario"
				className="h-7 w-7 p-0"
			>
				<Calendar className="h-3.5 w-3.5" />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
