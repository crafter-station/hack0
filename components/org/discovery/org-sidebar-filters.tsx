"use client";

import { Check, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useState } from "react";
import {
	COMMUNITY_TAG_CATEGORIES,
	COMMUNITY_TAG_LABELS,
	type CommunityTag,
	ORGANIZER_TYPE_LABELS,
} from "@/lib/db/schema";
import { LATAM_COUNTRY_OPTIONS } from "@/lib/latam-countries";

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

interface OrgSidebarFiltersProps {
	defaultSearch?: string;
	defaultCountries?: string[];
	defaultTypes?: string[];
	defaultSizes?: string[];
	defaultVerification?: string[];
	defaultTags?: string[];
	availableCountries?: string[];
	availableTags?: string[];
}

function FilterButton({
	selected,
	onClick,
	children,
	trailing,
}: {
	selected: boolean;
	onClick: () => void;
	children: ReactNode;
	trailing?: ReactNode;
}) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			onClick={onClick}
			className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/30"
		>
			<span
				className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
					selected
						? "border-foreground bg-foreground"
						: "border-muted-foreground/60 bg-transparent"
				}`}
			>
				{selected && <Check className="h-3 w-3 text-background" />}
			</span>
			<span className="min-w-0 flex-1 truncate text-muted-foreground">
				{children}
			</span>
			{trailing}
		</button>
	);
}

export function OrgSidebarFilters({
	defaultSearch = "",
	defaultCountries = [],
	defaultTypes = [],
	defaultSizes = [],
	defaultVerification = [],
	defaultTags = [],
	availableCountries = [],
	availableTags = [],
}: OrgSidebarFiltersProps) {
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

	const handleSearchSubmit = (e: FormEvent) => {
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

	const availableCountrySet = new Set(
		availableCountries.map((country) => country.toUpperCase()),
	);
	const displayCountries = LATAM_COUNTRY_OPTIONS.map((country) => ({
		...country,
		hasCommunities: availableCountrySet.has(country.code),
	})).sort((a, b) => {
		if (a.hasCommunities !== b.hasCommunities) {
			return a.hasCommunities ? -1 : 1;
		}
		return a.name.localeCompare(b.name, "es");
	});

	return (
		<aside className="hidden lg:block w-[190px] flex-shrink-0">
			<form
				onSubmit={handleSearchSubmit}
				className="flex items-center border border-border/50 bg-transparent h-8 mb-4 hover:border-border transition-colors focus-within:border-foreground/30"
			>
				<Search className="w-3.5 h-3.5 text-muted-foreground ml-2.5" />
				<input
					type="text"
					name="community-search"
					autoComplete="off"
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
						aria-label="Limpiar búsqueda"
						className="pr-2 text-muted-foreground hover:text-foreground"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				)}
			</form>

			<div className="space-y-5">
				<div>
					<h3 className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
						Países
					</h3>
					<div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
						{displayCountries.map((country) => (
							<FilterButton
								key={country.code}
								selected={defaultCountries.includes(country.code)}
								onClick={() =>
									toggleFilter("countries", country.code, defaultCountries)
								}
								trailing={
									country.hasCommunities ? (
										<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
									) : null
								}
							>
								<span className="mr-1">{country.flag}</span>
								{country.name}
							</FilterButton>
						))}
						<Link
							href="/roadmap#latam"
							className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							<Plus className="w-3.5 h-3.5" />
							<span>Ver mapa LATAM</span>
						</Link>
					</div>
				</div>

				<div>
					<h3 className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
						Tipo
					</h3>
					<div className="space-y-0.5">
						{POPULAR_TYPES.map((type) => (
							<FilterButton
								key={type}
								selected={defaultTypes.includes(type)}
								onClick={() => toggleFilter("types", type, defaultTypes)}
							>
								{ORGANIZER_TYPE_LABELS[type]}
							</FilterButton>
						))}
					</div>
				</div>

				<div>
					<h3 className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
						Tamaño
					</h3>
					<div className="space-y-0.5">
						{SIZE_FILTERS.map((size) => (
							<FilterButton
								key={size.id}
								selected={defaultSizes.includes(size.id)}
								onClick={() => toggleFilter("sizes", size.id, defaultSizes)}
							>
								{size.label}
							</FilterButton>
						))}
					</div>
				</div>

				<div>
					<h3 className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
						Verificación
					</h3>
					<div className="space-y-0.5">
						{VERIFICATION_FILTERS.map((item) => (
							<FilterButton
								key={item.id}
								selected={defaultVerification.includes(item.id)}
								onClick={() =>
									toggleFilter("verification", item.id, defaultVerification)
								}
							>
								{item.label}
							</FilterButton>
						))}
					</div>
				</div>

				{Object.entries(COMMUNITY_TAG_CATEGORIES).map(
					([categoryKey, category]) => {
						const categoryTags = category.tags.filter(
							(tag) =>
								availableTags.length === 0 || availableTags.includes(tag),
						);
						if (categoryTags.length === 0) return null;

						return (
							<div key={categoryKey}>
								<h3 className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
									{category.label}
								</h3>
								<div className="space-y-0.5">
									{categoryTags.map((tag) => (
										<FilterButton
											key={tag}
											selected={defaultTags.includes(tag)}
											onClick={() => toggleFilter("tags", tag, defaultTags)}
										>
											{COMMUNITY_TAG_LABELS[tag as CommunityTag]}
										</FilterButton>
									))}
								</div>
							</div>
						);
					},
				)}
			</div>
		</aside>
	);
}
