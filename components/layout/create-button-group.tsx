"use client";

import { Building2, CalendarPlus, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CreateButtonGroupProps {
	personalOrgSlug: string;
}

export function CreateButtonGroup({ personalOrgSlug }: CreateButtonGroupProps) {
	return (
		<ButtonGroup>
			<Link
				href={`/c/${personalOrgSlug}/events/new`}
				className="inline-flex h-7 items-center gap-1.5 bg-foreground px-2.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90 rounded-l-md"
			>
				<CalendarPlus className="h-3 w-3" />
				<span className="hidden sm:inline">Crear evento</span>
			</Link>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="inline-flex h-7 items-center bg-foreground px-1.5 text-background transition-colors hover:bg-foreground/90 border-l border-background/20 rounded-r-md"
					>
						<ChevronDown className="h-3 w-3" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem asChild>
						<Link href="/c/new" className="flex items-center gap-2">
							<Building2 className="h-4 w-4" />
							Comunidad
						</Link>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	);
}
