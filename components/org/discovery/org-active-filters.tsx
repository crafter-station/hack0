"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { normalizeCommunityDirectoryFilters } from "@/lib/community-directory-filters";
import { COMMUNITY_TAG_LABELS, ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";
import { LATAM_COUNTRY_OPTIONS } from "@/lib/latam-countries";

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

interface OrgActiveFiltersProps {
	totalResults: number;
}

export function OrgActiveFilters({ totalResults }: OrgActiveFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const countryMap = useMemo(() => {
		const map: Record<string, string> = {};
		for (const country of LATAM_COUNTRY_OPTIONS) {
			map[country.code] = country.name;
		}
		return map;
	}, []);

	const activeFilters = useMemo(() => {
		const filters: ActiveFilter[] = [];
		const normalizedFilters = normalizeCommunityDirectoryFilters({
			search: searchParams.get("search"),
			type: searchParams.get("type"),
			types: searchParams.get("types"),
			countries: searchParams.get("countries"),
			sizes: searchParams.get("sizes"),
			verification: searchParams.get("verification"),
			verified: searchParams.get("verified"),
			tags: searchParams.get("tags"),
		});

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
		if (normalizedFilters.countries.length > 0) {
			for (const code of normalizedFilters.countries) {
				const name = countryMap[code];
				if (name) {
					filters.push({
						key: `country-${code}`,
						param: "countries",
						value: code,
						label: name,
					});
				}
			}
		}

		// Types
		if (normalizedFilters.types.length > 0) {
			for (const type of normalizedFilters.types) {
				filters.push({
					key: `type-${type}`,
					param: "types",
					value: type,
					label: ORGANIZER_TYPE_LABELS[type],
				});
			}
		}

		if (normalizedFilters.sizes.length > 0) {
			for (const size of normalizedFilters.sizes) {
				const label = SIZE_LABELS[size] || size;
				filters.push({
					key: `size-${size}`,
					param: "sizes",
					value: size,
					label,
				});
			}
		}

		if (normalizedFilters.verification.length > 0) {
			for (const v of normalizedFilters.verification) {
				const label = VERIFICATION_LABELS[v] || v;
				filters.push({
					key: `verification-${v}`,
					param: "verification",
					value: v,
					label,
				});
			}
		}

		if (normalizedFilters.tags.length > 0) {
			for (const tag of normalizedFilters.tags) {
				filters.push({
					key: `tag-${tag}`,
					param: "tags",
					value: tag,
					label: COMMUNITY_TAG_LABELS[tag],
				});
			}
		}

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
				const values = currentValue
					.split(",")
					.filter((v) => v !== filter.value);
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
		params.delete("tags");
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
