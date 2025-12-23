"use client";

import { Check, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { LATAM_COUNTRIES, ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";

const SIZE_FILTERS = [
	{ id: "small", label: "< 100 miembros", max: 100 },
	{ id: "medium", label: "100 - 1k miembros", min: 100, max: 1000 },
	{ id: "large", label: "> 1k miembros", min: 1000 },
] as const;

const VERIFICATION_FILTERS = [
	{ id: "verified", label: "Verificadas" },
	{ id: "unverified", label: "Sin verificar" },
] as const;

const POPULAR_TYPES = [
	"community",
	"startup",
	"university",
	"company",
	"ngo",
	"coworking",
	"investor",
] as const;

interface CommunitySidebarFiltersProps {
	defaultSearch?: string;
	defaultCountries?: string[];
	defaultTypes?: string[];
	defaultSizes?: string[];
	defaultVerification?: string[];
	availableCountries?: string[];
}

export function CommunitySidebarFilters({
	defaultSearch = "",
	defaultCountries = [],
	defaultTypes = [],
	defaultSizes = [],
	defaultVerification = [],
	availableCountries = [],
}: CommunitySidebarFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [search, setSearch] = useState(defaultSearch);

	const updateUrl = useCallback(
		(key: string, values: string[]) => {
			const params = new URLSearchParams(searchParams.toString());
			if (values.length === 0) {
				params.delete(key);
			} else {
				params.set(key, values.join(","));
			}
			router.push(`${pathname}?${params.toString()}`);
		},
		[router, pathname, searchParams],
	);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const params = new URLSearchParams(searchParams.toString());
		if (search) {
			params.set("search", search);
		} else {
			params.delete("search");
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	const toggleFilter = (
		key: string,
		value: string,
		currentValues: string[],
	) => {
		const newValues = currentValues.includes(value)
			? currentValues.filter((v) => v !== value)
			: [...currentValues, value];
		updateUrl(key, newValues);
	};

	// Get country names from codes
	const countryMap = useMemo(() => {
		const map: Record<string, string> = {};
		for (const country of LATAM_COUNTRIES) {
			map[country.code] = country.name;
		}
		return map;
	}, []);

	// Filter to show only countries that have communities
	const displayCountries = useMemo(() => {
		if (availableCountries.length > 0) {
			return LATAM_COUNTRIES.filter((c) =>
				availableCountries.includes(c.code),
			);
		}
		return LATAM_COUNTRIES.filter((c) => c.code !== "GLOBAL");
	}, [availableCountries]);

	return (
		<aside className="hidden lg:block w-[220px] flex-shrink-0">
			{/* Search */}
			<form
				onSubmit={handleSearchSubmit}
				className="flex items-center border border-border/50 bg-transparent h-8 mb-4 hover:border-border transition-colors focus-within:border-foreground/30"
			>
				<Search className="w-3.5 h-3.5 text-muted-foreground ml-2.5" />
				<input
					type="text"
					placeholder="Buscar..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full px-2 py-1 bg-transparent text-foreground text-xs placeholder:text-muted-foreground focus:outline-none"
				/>
				{search && (
					<button
						type="button"
						onClick={() => {
							setSearch("");
							const params = new URLSearchParams(searchParams.toString());
							params.delete("search");
							router.push(`${pathname}?${params.toString()}`);
						}}
						className="pr-2 text-muted-foreground hover:text-foreground"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				)}
			</form>

			<div className="space-y-5">
				{/* Countries */}
				<div>
					<h3 className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">
						Países
					</h3>
					<div className="space-y-0.5">
						{displayCountries.map((country) => (
							<label
								key={country.code}
								className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/30 transition-colors"
							>
								<div
									className={`w-4 h-4 border flex items-center justify-center transition-colors ${
										defaultCountries.includes(country.code)
											? "bg-foreground border-foreground"
											: "border-muted-foreground/60 bg-transparent"
									}`}
									onClick={() =>
										toggleFilter("countries", country.code, defaultCountries)
									}
								>
									{defaultCountries.includes(country.code) && (
										<Check className="w-3 h-3 text-background" />
									)}
								</div>
								<span
									className="text-muted-foreground"
									onClick={() =>
										toggleFilter("countries", country.code, defaultCountries)
									}
								>
									{country.name}
								</span>
							</label>
						))}
					</div>
				</div>

				{/* Type */}
				<div>
					<h3 className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">
						Tipo
					</h3>
					<div className="space-y-0.5">
						{POPULAR_TYPES.map((type) => (
							<label
								key={type}
								className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/30 transition-colors"
							>
								<div
									className={`w-4 h-4 border flex items-center justify-center transition-colors ${
										defaultTypes.includes(type)
											? "bg-foreground border-foreground"
											: "border-muted-foreground/60 bg-transparent"
									}`}
									onClick={() => toggleFilter("types", type, defaultTypes)}
								>
									{defaultTypes.includes(type) && (
										<Check className="w-3 h-3 text-background" />
									)}
								</div>
								<span
									className="text-muted-foreground"
									onClick={() => toggleFilter("types", type, defaultTypes)}
								>
									{ORGANIZER_TYPE_LABELS[type]}
								</span>
							</label>
						))}
					</div>
				</div>

				{/* Size */}
				<div>
					<h3 className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">
						Tamaño
					</h3>
					<div className="space-y-0.5">
						{SIZE_FILTERS.map((size) => (
							<label
								key={size.id}
								className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/30 transition-colors"
							>
								<div
									className={`w-4 h-4 border flex items-center justify-center transition-colors ${
										defaultSizes.includes(size.id)
											? "bg-foreground border-foreground"
											: "border-muted-foreground/60 bg-transparent"
									}`}
									onClick={() => toggleFilter("sizes", size.id, defaultSizes)}
								>
									{defaultSizes.includes(size.id) && (
										<Check className="w-3 h-3 text-background" />
									)}
								</div>
								<span
									className="text-muted-foreground"
									onClick={() => toggleFilter("sizes", size.id, defaultSizes)}
								>
									{size.label}
								</span>
							</label>
						))}
					</div>
				</div>

				{/* Verification */}
				<div>
					<h3 className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">
						Verificación
					</h3>
					<div className="space-y-0.5">
						{VERIFICATION_FILTERS.map((item) => (
							<label
								key={item.id}
								className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/30 transition-colors"
							>
								<div
									className={`w-4 h-4 border flex items-center justify-center transition-colors ${
										defaultVerification.includes(item.id)
											? "bg-foreground border-foreground"
											: "border-muted-foreground/60 bg-transparent"
									}`}
									onClick={() =>
										toggleFilter("verification", item.id, defaultVerification)
									}
								>
									{defaultVerification.includes(item.id) && (
										<Check className="w-3 h-3 text-background" />
									)}
								</div>
								<span
									className="text-muted-foreground"
									onClick={() =>
										toggleFilter("verification", item.id, defaultVerification)
									}
								>
									{item.label}
								</span>
							</label>
						))}
					</div>
				</div>
			</div>
		</aside>
	);
}
