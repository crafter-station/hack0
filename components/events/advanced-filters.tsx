"use client";

import { Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { searchParamsParsers } from "@/lib/search-params";
import {
	EVENT_TYPE_LABELS,
	ORGANIZER_TYPE_LABELS,
	SKILL_LEVELS,
	FORMATS,
	DOMAINS,
	DOMAIN_LABELS,
} from "@/lib/db/schema";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { DEPARTMENT_OPTIONS } from "@/lib/event-utils";

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

export function AdvancedFilters() {
	const [open, setOpen] = useState(false);
	const [filters, setFilters] = useQueryStates(searchParamsParsers, {
		shallow: false,
	});

	const {
		search,
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

	return (
		<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
			{/* Search input */}
			<div className="relative flex-1 sm:flex-none">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Buscar eventos..."
					value={search}
					onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
					className="h-9 w-full sm:w-56 rounded-lg border border-border bg-background pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
				/>
				{search && (
					<button
						onClick={() => setFilters({ search: "", page: 1 })}
						className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Advanced filters popover */}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
							activeFiltersCount > 0
								? "border-foreground/20 bg-foreground text-background shadow-sm"
								: "border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-foreground/10"
						}`}
					>
						<SlidersHorizontal className="h-4 w-4" />
						<span className="hidden sm:inline">Filtros</span>
						{activeFiltersCount > 0 && (
							<span
								className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
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
				<PopoverContent align="end" className="w-96 p-0 border-border/50 max-h-[80vh] overflow-hidden flex flex-col">
					<div className="p-4 border-b bg-muted/30 shrink-0">
						<div className="flex items-center justify-between">
							<h4 className="font-semibold text-sm">Filtros avanzados</h4>
							{activeFiltersCount > 0 && (
								<button
									onClick={clearAllFilters}
									className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
								>
									Limpiar ({activeFiltersCount})
								</button>
							)}
						</div>
					</div>

					<div className="p-4 space-y-5 overflow-y-auto">
						{/* Junior friendly */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Nivel
							</label>
							<button
								onClick={() =>
									setFilters({ juniorFriendly: !juniorFriendly, page: 1 })
								}
								className={`flex w-full items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
									juniorFriendly
										? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-500 shadow-sm ring-1 ring-amber-500/20"
										: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
								}`}
							>
								<Sparkles className="h-4 w-4" />
								Para principiantes
								{juniorFriendly && (
									<span className="ml-auto text-amber-600 dark:text-amber-400">
										✓
									</span>
								)}
							</button>
						</div>

						{/* Event Type */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Tipo de evento
							</label>
							<div className="flex flex-wrap gap-2">
								{POPULAR_EVENT_TYPES.map((type) => (
									<button
										key={type}
										onClick={() => {
											const newEventType = eventType.includes(type)
												? eventType.filter((v) => v !== type)
												: [...eventType, type];
											setFilters({ eventType: newEventType, page: 1 });
										}}
										className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
											eventType.includes(type)
												? "border-foreground/20 bg-foreground text-background shadow-sm"
												: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
										}`}
									>
										{EVENT_TYPE_LABELS[type]}
									</button>
								))}
							</div>
						</div>

						{/* Organizer Type */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Organizador
							</label>
							<div className="flex flex-wrap gap-2">
								{POPULAR_ORGANIZERS.map((type) => (
									<button
										key={type}
										onClick={() => {
											const newOrganizerType = organizerType.includes(type)
												? organizerType.filter((v) => v !== type)
												: [...organizerType, type];
											setFilters({ organizerType: newOrganizerType, page: 1 });
										}}
										className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
											organizerType.includes(type)
												? "border-foreground/20 bg-foreground text-background shadow-sm"
												: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
										}`}
									>
										{ORGANIZER_TYPE_LABELS[type]}
									</button>
								))}
							</div>
						</div>

						{/* Skill Level */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Nivel de habilidad
							</label>
							<div className="flex flex-wrap gap-2">
								{SKILL_LEVELS.map((level) => (
									<button
										key={level}
										onClick={() => {
											const newSkillLevel = skillLevel.includes(level)
												? skillLevel.filter((v) => v !== level)
												: [...skillLevel, level];
											setFilters({ skillLevel: newSkillLevel, page: 1 });
										}}
										className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
											skillLevel.includes(level)
												? "border-foreground/20 bg-foreground text-background shadow-sm"
												: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
										}`}
									>
										{SKILL_LEVEL_LABELS[level]}
									</button>
								))}
							</div>
						</div>

						{/* Format */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Formato
							</label>
							<div className="flex flex-wrap gap-2">
								{FORMATS.map((fmt) => (
									<button
										key={fmt}
										onClick={() => {
											const newFormat = format.includes(fmt)
												? format.filter((v) => v !== fmt)
												: [...format, fmt];
											setFilters({ format: newFormat, page: 1 });
										}}
										className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
											format.includes(fmt)
												? "border-foreground/20 bg-foreground text-background shadow-sm"
												: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
										}`}
									>
										{FORMAT_LABELS[fmt]}
									</button>
								))}
							</div>
						</div>

						{/* Domains */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Dominio / Tema
							</label>
							<div className="flex flex-wrap gap-2">
								{POPULAR_DOMAINS.map((dom) => (
									<button
										key={dom}
										onClick={() => {
											const newDomain = domain.includes(dom)
												? domain.filter((v) => v !== dom)
												: [...domain, dom];
											setFilters({ domain: newDomain, page: 1 });
										}}
										className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
											domain.includes(dom)
												? "border-foreground/20 bg-foreground text-background shadow-sm"
												: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
										}`}
									>
										{DOMAIN_LABELS[dom]}
									</button>
								))}
							</div>
						</div>

						{/* Department/Region */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Región
							</label>
							<div className="flex flex-wrap gap-2">
								{POPULAR_DEPARTMENTS.map((dept) => (
									<button
										key={dept}
										onClick={() => {
											const newDepartment = department.includes(dept)
												? department.filter((v) => v !== dept)
												: [...department, dept];
											setFilters({ department: newDepartment, page: 1 });
										}}
										className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
											department.includes(dept)
												? "border-foreground/20 bg-foreground text-background shadow-sm"
												: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
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
