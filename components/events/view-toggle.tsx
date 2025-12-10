"use client";

import { Calendar, List } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ViewToggle() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Read current view from URL params
	const currentView = (searchParams.get("view") as "table" | "calendar") || "table";

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
			size="sm"
		>
			<ToggleGroupItem value="table" aria-label="Vista de tabla">
				<List className="h-4 w-4" />
			</ToggleGroupItem>
			<ToggleGroupItem value="calendar" aria-label="Vista de calendario">
				<Calendar className="h-4 w-4" />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}