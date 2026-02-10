"use client";

import { useUser } from "@clerk/nextjs";
import {
	CalendarClock,
	History,
	SlidersHorizontal,
	Sparkles,
	User,
} from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	DOMAIN_LABELS,
	EVENT_TYPE_LABELS,
	FORMATS,
	ORGANIZER_TYPE_LABELS,
	SKILL_LEVELS,
} from "@/lib/db/schema";
import type { TimeFilter } from "@/lib/search-params";

const SKILL_LEVEL_LABELS: Record<string, string> = {
	beginner: "Principiante",
	intermediate: "Intermedio",
	advanced: "Avanzado",
	all: "Todos los niveles",
};

const FORMAT_LABELS: Record<string, string> = {
	virtual: "Virtual",
	"in-person": "Presencial",
	hybrid: "Híbrido",
};

const POPULAR_EVENT_TYPES = [
	"hackathon",
	"conference",
	"workshop",
] as const;

const POPULAR_DOMAINS = [
	"ai",
	"web3",
	"general",
] as const;

const POPULAR_DEPARTMENTS = [
	"Lima",
	"Arequipa",
];

interface FiltersState {
	eventType: string[];
	organizerType: string[];
	skillLevel: string[];
	format: string[];
	domain: string[];
	department: string[];
	juniorFriendly: boolean;
	mine: boolean;
	timeFilter: TimeFilter;
}

interface EventsFiltersPopoverProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: FiltersState;
	onFiltersChange: (updates: Partial<FiltersState & { page: number }>) => void;
	onClearAll: () => void;
}

export function EventsFiltersPopover({
	open,
	onOpenChange,
	filters,
	onFiltersChange,
	onClearAll,
}: EventsFiltersPopoverProps) {
	const { isSignedIn } = useUser();
	const {
		eventType,
		organizerType,
		skillLevel,
		format,
		domain,
		department,
		juniorFriendly,
		mine,
		timeFilter,
	} = filters;

	const activeFiltersCount =
		eventType.length +
		organizerType.length +
		skillLevel.length +
		format.length +
		domain.length +
		department.length +
		(juniorFriendly ? 1 : 0) +
		(mine ? 1 : 0) +
		(timeFilter !== "all" ? 1 : 0);

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<button
					className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
						activeFiltersCount > 0
							? "border-foreground/20 bg-foreground text-background hover:bg-foreground/90"
							: "border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
					}`}
				>
					<SlidersHorizontal className="h-4 w-4" />
					<span className="hidden sm:inline">Filtros</span>
					{activeFiltersCount > 0 && (
						<span
							className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
								activeFiltersCount > 0
									? "bg-background text-foreground"
									: "bg-foreground/10"
							}`}
						>
							{activeFiltersCount}
						</span>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-80 p-0 border-border/50 max-h-[80vh] overflow-hidden flex flex-col"
			>
				<div className="px-4 py-3 border-b border-border/50 bg-muted/20 shrink-0">
					<div className="flex items-center justify-between">
						<h4 className="font-medium text-sm">Filtros</h4>
						{activeFiltersCount > 0 && (
							<button
								onClick={onClearAll}
								className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
							>
								Limpiar todo
							</button>
						)}
					</div>
				</div>

				<div className="p-3 space-y-3 overflow-y-auto">
					<div className="space-y-1.5">
						<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
							Tiempo
						</label>
						<ToggleGroup
							type="single"
							value={timeFilter}
							onValueChange={(value) => {
								if (value)
									onFiltersChange({ timeFilter: value as TimeFilter, page: 1 });
							}}
							className="h-7 w-full justify-start"
						>
							<ToggleGroupItem
								value="upcoming"
								aria-label="Próximos"
								className="h-7 px-2 gap-1 flex-1"
							>
								<CalendarClock className="h-3.5 w-3.5" />
								<span className="text-[10px]">Próximos</span>
							</ToggleGroupItem>
							<ToggleGroupItem
								value="all"
								aria-label="Todos"
								className="h-7 px-2 gap-1 flex-1"
							>
								<span className="text-[10px]">Todos</span>
							</ToggleGroupItem>
							<ToggleGroupItem
								value="past"
								aria-label="Pasados"
								className="h-7 px-2 gap-1 flex-1"
							>
								<History className="h-3.5 w-3.5" />
								<span className="text-[10px]">Pasados</span>
							</ToggleGroupItem>
						</ToggleGroup>
					</div>

					{isSignedIn && (
						<div className="space-y-1.5">
							<button
								onClick={() => onFiltersChange({ mine: !mine, page: 1 })}
								className={`flex w-full items-center gap-2 border px-2.5 py-1.5 text-xs font-medium transition-colors ${
									mine
										? "border-foreground/20 bg-foreground text-background"
										: "border-border/50 text-muted-foreground hover:text-foreground"
								}`}
							>
								<User className="h-3 w-3" />
								Solo mis eventos
								{mine && <span className="ml-auto">✓</span>}
							</button>
						</div>
					)}

					<div className="space-y-1.5">
						<button
							onClick={() =>
								onFiltersChange({ juniorFriendly: !juniorFriendly, page: 1 })
							}
							className={`flex w-full items-center gap-2 border px-2.5 py-1.5 text-xs font-medium transition-colors ${
								juniorFriendly
									? "border-amber-400/30 bg-amber-400/10 text-amber-400"
									: "border-border/50 text-muted-foreground hover:text-foreground"
							}`}
						>
							<Sparkles className="h-3 w-3" />
							Para principiantes
							{juniorFriendly && <span className="ml-auto">✓</span>}
						</button>
					</div>

					<div className="space-y-1.5">
						<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
							Tipo de evento
						</label>
						<div className="flex flex-wrap gap-1">
							{POPULAR_EVENT_TYPES.map((type) => (
								<button
									key={type}
									onClick={() => {
										const newEventType = eventType.includes(type)
											? eventType.filter((v) => v !== type)
											: [...eventType, type];
										onFiltersChange({ eventType: newEventType, page: 1 });
									}}
									className={`border px-2 py-1 text-[10px] font-medium transition-colors ${
										eventType.includes(type)
											? "border-foreground/20 bg-foreground text-background"
											: "border-border/50 text-muted-foreground hover:text-foreground"
									}`}
								>
									{EVENT_TYPE_LABELS[type]}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
							Formato
						</label>
						<div className="flex flex-wrap gap-1">
							{FORMATS.map((fmt) => (
								<button
									key={fmt}
									onClick={() => {
										const newFormat = format.includes(fmt)
											? format.filter((v) => v !== fmt)
											: [...format, fmt];
										onFiltersChange({ format: newFormat, page: 1 });
									}}
									className={`border px-2 py-1 text-[10px] font-medium transition-colors ${
										format.includes(fmt)
											? "border-foreground/20 bg-foreground text-background"
											: "border-border/50 text-muted-foreground hover:text-foreground"
									}`}
								>
									{FORMAT_LABELS[fmt]}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
							Tema
						</label>
						<div className="flex flex-wrap gap-1">
							{POPULAR_DOMAINS.map((dom) => (
								<button
									key={dom}
									onClick={() => {
										const newDomain = domain.includes(dom)
											? domain.filter((v) => v !== dom)
											: [...domain, dom];
										onFiltersChange({ domain: newDomain, page: 1 });
									}}
									className={`border px-2 py-1 text-[10px] font-medium transition-colors ${
										domain.includes(dom)
											? "border-foreground/20 bg-foreground text-background"
											: "border-border/50 text-muted-foreground hover:text-foreground"
									}`}
								>
									{DOMAIN_LABELS[dom]}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
							Región
						</label>
						<div className="flex flex-wrap gap-1">
							{POPULAR_DEPARTMENTS.map((dept) => (
								<button
									key={dept}
									onClick={() => {
										const newDepartment = department.includes(dept)
											? department.filter((v) => v !== dept)
											: [...department, dept];
										onFiltersChange({ department: newDepartment, page: 1 });
									}}
									className={`border px-2 py-1 text-[10px] font-medium transition-colors ${
										department.includes(dept)
											? "border-foreground/20 bg-foreground text-background"
											: "border-border/50 text-muted-foreground hover:text-foreground"
									}`}
								>
									{dept}
								</button>
							))}
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
