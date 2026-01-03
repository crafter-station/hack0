"use client";

import {
	BadgeCheck,
	LayoutGrid,
	List,
	MapPin,
	Search,
	SlidersHorizontal,
	X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";

const POPULAR_TYPES = [
	"community",
	"startup",
	"investor",
	"consulting",
	"law_firm",
	"coworking",
	"university",
	"company",
	"ngo",
] as const;

const COOKIE_NAME = "hack0-communities-view";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function saveViewPreference(view: "cards" | "table") {
	document.cookie = `${COOKIE_NAME}=${view}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

interface OrgFiltersProps {
	defaultSearch?: string;
	defaultType?: string;
	defaultDepartment?: string;
	defaultVerified?: boolean;
	defaultView?: "cards" | "table";
	showRoleFilter?: boolean;
	defaultRole?: string;
	departments?: string[];
}

export function OrgFilters({
	defaultSearch = "",
	defaultType = "",
	defaultDepartment = "",
	defaultVerified = false,
	defaultView = "cards",
	showRoleFilter = false,
	defaultRole = "all",
	departments = [],
}: OrgFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState(defaultSearch);
	const [selectedType, setSelectedType] = useState(defaultType);
	const [selectedDepartment, setSelectedDepartment] =
		useState(defaultDepartment);
	const [verified, setVerified] = useState(defaultVerified);
	const [role, setRole] = useState(defaultRole);

	const currentView =
		(searchParams.get("view") as "cards" | "table") || defaultView;

	const activeFiltersCount =
		(selectedType ? 1 : 0) +
		(selectedDepartment ? 1 : 0) +
		(verified ? 1 : 0) +
		(role !== "all" ? 1 : 0);

	const updateUrl = (updates: Record<string, string | boolean>) => {
		const params = new URLSearchParams(searchParams.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (value === "" || value === false || value === "all") {
				params.delete(key);
			} else {
				params.set(key, String(value));
			}
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	const handleViewChange = (value: "cards" | "table") => {
		if (!value) return;
		saveViewPreference(value);
		updateUrl({ view: value });
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		updateUrl({
			search,
			type: selectedType,
			department: selectedDepartment,
			verified,
			role,
		});
	};

	const clearAllFilters = () => {
		setSearch("");
		setSelectedType("");
		setSelectedDepartment("");
		setVerified(false);
		setRole("all");
		router.push(pathname);
	};

	return (
		<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
			<ButtonGroup>
				<ToggleGroup
					type="single"
					value={currentView}
					onValueChange={handleViewChange}
					className="h-7"
				>
					<ToggleGroupItem
						value="cards"
						aria-label="Tarjetas"
						className="h-7 px-2"
					>
						<LayoutGrid className="h-3.5 w-3.5" />
					</ToggleGroupItem>
					<ToggleGroupItem
						value="table"
						aria-label="Lista"
						className="h-7 px-2"
					>
						<List className="h-3.5 w-3.5" />
					</ToggleGroupItem>
				</ToggleGroup>
			</ButtonGroup>

			<form onSubmit={handleSearch} className="relative flex-1 sm:flex-none">
				<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Buscar..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="h-7 w-full sm:w-36 border border-border/50 bg-background pl-7 pr-7 text-xs placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none transition-colors"
				/>
				{search && (
					<button
						type="button"
						onClick={() => {
							setSearch("");
							updateUrl({ search: "" });
						}}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				)}
			</form>

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
				<PopoverContent align="end" className="w-72 p-0 border-border/50">
					<div className="px-3 py-2 border-b border-border/50 bg-muted/20">
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

					<div className="p-3 space-y-3">
						{showRoleFilter && (
							<div className="space-y-1.5">
								<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
									Rol
								</label>
								<div className="flex flex-wrap gap-1">
									{["all", "owner", "admin", "member", "follower"].map((r) => (
										<button
											key={r}
											onClick={() => {
												setRole(r);
												updateUrl({ role: r });
											}}
											className={`border px-2 py-1 text-[10px] font-medium transition-colors ${
												role === r
													? "border-foreground/20 bg-foreground text-background"
													: "border-border/50 text-muted-foreground hover:text-foreground"
											}`}
										>
											{r === "all"
												? "Todos"
												: r === "owner"
													? "Owner"
													: r === "admin"
														? "Admin"
														: r === "member"
															? "Miembro"
															: "Seguidor"}
										</button>
									))}
								</div>
							</div>
						)}

						<div className="space-y-1.5">
							<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Tipo
							</label>
							<div className="flex flex-wrap gap-1">
								{POPULAR_TYPES.map((type) => (
									<button
										key={type}
										onClick={() => {
											const newType = selectedType === type ? "" : type;
											setSelectedType(newType);
											updateUrl({ type: newType });
										}}
										className={`border px-2 py-1 text-[10px] font-medium transition-colors ${
											selectedType === type
												? "border-foreground/20 bg-foreground text-background"
												: "border-border/50 text-muted-foreground hover:text-foreground"
										}`}
									>
										{ORGANIZER_TYPE_LABELS[type]}
									</button>
								))}
							</div>
						</div>

						{departments.length > 0 && (
							<div className="space-y-1.5">
								<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
									Ubicación
								</label>
								<div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
									{departments.map((dept) => (
										<button
											key={dept}
											onClick={() => {
												const newDept = selectedDepartment === dept ? "" : dept;
												setSelectedDepartment(newDept);
												updateUrl({ department: newDept });
											}}
											className={`border px-2 py-1 text-[10px] font-medium transition-colors ${
												selectedDepartment === dept
													? "border-foreground/20 bg-foreground text-background"
													: "border-border/50 text-muted-foreground hover:text-foreground"
											}`}
										>
											<MapPin className="h-2.5 w-2.5 inline mr-1" />
											{dept}
										</button>
									))}
								</div>
							</div>
						)}

						<div className="space-y-1.5">
							<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Estado
							</label>
							<button
								onClick={() => {
									setVerified(!verified);
									updateUrl({ verified: !verified });
								}}
								className={`flex w-full items-center gap-2 border px-2.5 py-1.5 text-xs font-medium transition-colors ${
									verified
										? "border-emerald-400/30 bg-emerald-400/10 text-emerald-500"
										: "border-border/50 text-muted-foreground hover:text-foreground"
								}`}
							>
								<BadgeCheck className="h-3 w-3" />
								Solo verificadas
								{verified && <span className="ml-auto">✓</span>}
							</button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
