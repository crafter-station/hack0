"use client";

import {
	Calendar,
	Eye,
	LayoutGrid,
	List,
	Map,
	Search,
	SlidersHorizontal,
	Sparkles,
	X,
} from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { searchParamsParsers } from "@/lib/search-params";

type ViewMode = "table" | "cards" | "calendar" | "map" | "preview";

const COOKIE_NAME = "hack0-events-view";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function saveViewPreference(view: ViewMode) {
	document.cookie = `${COOKIE_NAME}=${view}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

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
	"bootcamp",
	"competition",
	"olympiad",
	"meetup",
] as const;

const POPULAR_ORGANIZERS = [
	"university",
	"company",
	"community",
	"government",
	"startup",
] as const;

const POPULAR_DOMAINS = [
	"ai",
	"web3",
	"fintech",
	"healthtech",
	"edtech",
	"cybersecurity",
	"data-science",
	"general",
] as const;

const POPULAR_DEPARTMENTS = [
	"Lima",
	"Arequipa",
	"Cusco",
	"Lambayeque",
	"Junín",
	"Puno",
];

export function EventsToolbar() {
	const [open, setOpen] = useState(false);
	const [filters, setFilters] = useQueryStates(searchParamsParsers, {
		shallow: false,
	});

	const {
		search,
		view,
		eventType,
		organizerType,
		skillLevel,
		format,
		domain,
		department,
		juniorFriendly,
	} = filters;

	const activeFiltersCount =
		eventType.length +
		organizerType.length +
		skillLevel.length +
		format.length +
		domain.length +
		department.length +
		(juniorFriendly ? 1 : 0);

	const clearAllFilters = () => {
		setFilters({
			search: "",
			eventType: [],
			organizerType: [],
			skillLevel: [],
			format: [],
			status: [],
			domain: [],
			country: [],
			department: [],
			juniorFriendly: false,
			page: 1,
		});
	};

	const handleViewChange = (value: ViewMode) => {
		if (!value) return;
		saveViewPreference(value);
		setFilters({ view: value });
	};

	return (
		<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
			<ButtonGroup>
				<ToggleGroup
					type="single"
					value={view}
					onValueChange={handleViewChange}
					className="h-7"
				>
					<ToggleGroupItem value="cards" aria-label="Tarjetas" className="h-7 px-2">
						<LayoutGrid className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem value="table" aria-label="Lista" className="h-7 px-2">
						<List className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem value="calendar" aria-label="Calendario" className="h-7 px-2">
						<Calendar className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem value="map" aria-label="Mapa" className="h-7 px-2">
						<Map className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem value="preview" aria-label="Vista previa" className="h-7 px-2">
						<Eye className="h-3.5 w-3.5" />
					</ToggleGroupItem>
				</ToggleGroup>
			</ButtonGroup>

			<div className="relative flex-1 sm:flex-none">
				<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Buscar..."
					value={search}
					onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
					className="h-7 w-full sm:w-36 border border-border/50 bg-background pl-7 pr-7 text-xs placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none transition-colors"
				/>
				{search && (
					<button
						onClick={() => setFilters({ search: "", page: 1 })}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				)}
			</div>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						className={`inline-flex h-7 items-center gap-1.5 border px-2 text-xs font-medium transition-colors ${
							activeFiltersCount > 0
								? "border-foreground/20 bg-foreground text-background"
								: "border-border/50 text-muted-foreground hover:text-foreground"
						}`}
					>
						<SlidersHorizontal className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">Filtros</span>
						{activeFiltersCount > 0 && (
							<span
								className={`px-1 text-[10px] font-semibold ${
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
					<div className="px-3 py-2 border-b border-border/50 bg-muted/20 shrink-0">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-xs">Filtros</h4>
							{activeFiltersCount > 0 && (
								<button
									onClick={clearAllFilters}
									className="text-[10px] text-muted-foreground hover:text-foreground transition-colors font-medium"
								>
									Limpiar ({activeFiltersCount})
								</button>
							)}
						</div>
					</div>

					<div className="p-3 space-y-3 overflow-y-auto">
						<div className="space-y-1.5">
							<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Nivel
							</label>
							<button
								onClick={() =>
									setFilters({ juniorFriendly: !juniorFriendly, page: 1 })
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
								Tipo
							</label>
							<div className="flex flex-wrap gap-1">
								{POPULAR_EVENT_TYPES.map((type) => (
									<button
										key={type}
										onClick={() => {
											const newEventType = eventType.includes(type)
												? eventType.filter((v) => v !== type)
												: [...eventType, type];
											setFilters({ eventType: newEventType, page: 1 });
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
								Organizador
							</label>
							<div className="flex flex-wrap gap-1">
								{POPULAR_ORGANIZERS.map((type) => (
									<button
										key={type}
										onClick={() => {
											const newOrganizerType = organizerType.includes(type)
												? organizerType.filter((v) => v !== type)
												: [...organizerType, type];
											setFilters({ organizerType: newOrganizerType, page: 1 });
										}}
										className={`border px-2 py-1 text-[10px] font-medium transition-colors ${
											organizerType.includes(type)
												? "border-foreground/20 bg-foreground text-background"
												: "border-border/50 text-muted-foreground hover:text-foreground"
										}`}
									>
										{ORGANIZER_TYPE_LABELS[type]}
									</button>
								))}
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Habilidad
							</label>
							<div className="flex flex-wrap gap-1">
								{SKILL_LEVELS.map((level) => (
									<button
										key={level}
										onClick={() => {
											const newSkillLevel = skillLevel.includes(level)
												? skillLevel.filter((v) => v !== level)
												: [...skillLevel, level];
											setFilters({ skillLevel: newSkillLevel, page: 1 });
										}}
										className={`border px-2 py-1 text-[10px] font-medium transition-colors ${
											skillLevel.includes(level)
												? "border-foreground/20 bg-foreground text-background"
												: "border-border/50 text-muted-foreground hover:text-foreground"
										}`}
									>
										{SKILL_LEVEL_LABELS[level]}
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
											setFilters({ format: newFormat, page: 1 });
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
											setFilters({ domain: newDomain, page: 1 });
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
											setFilters({ department: newDepartment, page: 1 });
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
		</div>
	);
}
