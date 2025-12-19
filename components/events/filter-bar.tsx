"use client";

import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	DEPARTMENT_OPTIONS,
	FORMAT_OPTIONS,
	STATUS_OPTIONS,
} from "@/lib/event-utils";
import { searchParamsParsers } from "@/lib/search-params";

export function FilterBar() {
	const [open, setOpen] = useState(false);
	const [filters, setFilters] = useQueryStates(searchParamsParsers, {
		shallow: false,
	});

	const { search, format, status, department, juniorFriendly } = filters;

	const activeFiltersCount =
		format.length +
		status.length +
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

			{/* More filters popover */}
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
				<PopoverContent align="end" className="w-80 p-0 border-border/50">
					<div className="p-4 border-b bg-muted/30">
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

					<div className="p-4 space-y-5">
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

						{/* Format */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Formato
							</label>
							<div className="flex flex-wrap gap-2">
								{FORMAT_OPTIONS.map((option) => (
									<button
										key={option.value}
										onClick={() => {
											const newFormat = format.includes(option.value)
												? format.filter((v) => v !== option.value)
												: [...format, option.value];
											setFilters({ format: newFormat, page: 1 });
										}}
										className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
											format.includes(option.value)
												? "border-foreground/20 bg-foreground text-background shadow-sm"
												: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
										}`}
									>
										{option.label}
									</button>
								))}
							</div>
						</div>

						{/* Status */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Estado
							</label>
							<div className="flex flex-wrap gap-2">
								{STATUS_OPTIONS.map((option) => (
									<button
										key={option.value}
										onClick={() => {
											const newStatus = status.includes(option.value)
												? status.filter((v) => v !== option.value)
												: [...status, option.value];
											setFilters({ status: newStatus, page: 1 });
										}}
										className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
											status.includes(option.value)
												? "border-foreground/20 bg-foreground text-background shadow-sm"
												: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
										}`}
									>
										{option.label}
									</button>
								))}
							</div>
						</div>

						{/* Department/Region */}
						<div className="space-y-2.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Región
							</label>
							<div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin">
								{DEPARTMENT_OPTIONS.filter((opt) =>
									[
										"Lima",
										"Arequipa",
										"Cusco",
										"Lambayeque",
										"Junín",
										"Puno",
										"Huánuco",
										"Ica",
										"Ayacucho",
									].includes(opt.value),
								).map((option) => (
									<button
										key={option.value}
										onClick={() => {
											const newDepartment = department.includes(option.value)
												? department.filter((v) => v !== option.value)
												: [...department, option.value];
											setFilters({ department: newDepartment, page: 1 });
										}}
										className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
											department.includes(option.value)
												? "border-foreground/20 bg-foreground text-background shadow-sm"
												: "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-foreground/20"
										}`}
									>
										{option.label}
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
