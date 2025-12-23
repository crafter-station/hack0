"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LATAM_COUNTRIES, ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";

const SIZE_LABELS: Record<string, string> = {
	small: "< 100 miembros",
	medium: "100 - 1k miembros",
	large: "> 1k miembros",
};

const VERIFICATION_LABELS: Record<string, string> = {
	verified: "Verificadas",
	unverified: "Sin verificar",
};

const CATEGORY_LABELS: Record<string, string> = {
	desarrollo: "Desarrollo",
	diseno: "Diseño",
	"data-ia": "Data & IA",
	negocios: "Negocios",
	comunidad: "Comunidad",
};

interface ActiveFilter {
	key: string;
	param: string;
	value: string;
	label: string;
}

interface CommunityActiveFiltersProps {
	totalResults: number;
}

export function CommunityActiveFilters({
	totalResults,
}: CommunityActiveFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const countryMap = useMemo(() => {
		const map: Record<string, string> = {};
		for (const country of LATAM_COUNTRIES) {
			map[country.code] = country.name;
		}
		return map;
	}, []);

	const activeFilters = useMemo(() => {
		const filters: ActiveFilter[] = [];

		// Category
		const category = searchParams.get("category");
		if (category && CATEGORY_LABELS[category]) {
			filters.push({
				key: `category-${category}`,
				param: "category",
				value: category,
				label: CATEGORY_LABELS[category],
			});
		}

		// Countries
		const countries = searchParams.get("countries");
		if (countries) {
			for (const code of countries.split(",")) {
				const name = countryMap[code] || code;
				filters.push({
					key: `country-${code}`,
					param: "countries",
					value: code,
					label: name,
				});
			}
		}

		// Types
		const types = searchParams.get("types");
		if (types) {
			for (const type of types.split(",")) {
				const label =
					ORGANIZER_TYPE_LABELS[type as keyof typeof ORGANIZER_TYPE_LABELS] ||
					type;
				filters.push({
					key: `type-${type}`,
					param: "types",
					value: type,
					label,
				});
			}
		}

		// Sizes
		const sizes = searchParams.get("sizes");
		if (sizes) {
			for (const size of sizes.split(",")) {
				const label = SIZE_LABELS[size] || size;
				filters.push({
					key: `size-${size}`,
					param: "sizes",
					value: size,
					label,
				});
			}
		}

		// Verification
		const verification = searchParams.get("verification");
		if (verification) {
			for (const v of verification.split(",")) {
				const label = VERIFICATION_LABELS[v] || v;
				filters.push({
					key: `verification-${v}`,
					param: "verification",
					value: v,
					label,
				});
			}
		}

		// Search
		const search = searchParams.get("search");
		if (search) {
			filters.push({
				key: "search",
				param: "search",
				value: search,
				label: `"${search}"`,
			});
		}

		return filters;
	}, [searchParams, countryMap]);

	const removeFilter = (filter: ActiveFilter) => {
		const params = new URLSearchParams(searchParams.toString());

		if (filter.param === "search" || filter.param === "category") {
			params.delete(filter.param);
		} else {
			const currentValue = params.get(filter.param);
			if (currentValue) {
				const values = currentValue.split(",").filter((v) => v !== filter.value);
				if (values.length === 0) {
					params.delete(filter.param);
				} else {
					params.set(filter.param, values.join(","));
				}
			}
		}

		router.push(`${pathname}?${params.toString()}`);
	};

	const clearAllFilters = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("search");
		params.delete("category");
		params.delete("countries");
		params.delete("types");
		params.delete("sizes");
		params.delete("verification");
		router.push(`${pathname}?${params.toString()}`);
	};

	if (activeFilters.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap items-center gap-2 mb-4">
			<span className="text-xs text-muted-foreground">
				{totalResults} resultado{totalResults !== 1 ? "s" : ""}
			</span>
			{activeFilters.map((filter) => (
				<button
					key={filter.key}
					onClick={() => removeFilter(filter)}
					className="flex items-center gap-1 px-2 py-1 text-xs text-foreground bg-muted hover:bg-muted/80 transition-colors"
				>
					{filter.label}
					<X className="w-3 h-3" />
				</button>
			))}
			<button
				onClick={clearAllFilters}
				className="text-xs text-muted-foreground hover:text-foreground transition-colors"
			>
				Limpiar filtros
			</button>
		</div>
	);
}
