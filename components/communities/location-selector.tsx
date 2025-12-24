"use client";

import { Check, ChevronsUpDown, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export const ACTIVE_COUNTRIES = [
	{ code: "PE", name: "Perú" },
	{ code: "CO", name: "Colombia" },
	{ code: "CL", name: "Chile" },
] as const;

export const REGIONS_BY_COUNTRY: Record<string, string[]> = {
	PE: [
		"Amazonas",
		"Áncash",
		"Apurímac",
		"Arequipa",
		"Ayacucho",
		"Cajamarca",
		"Callao",
		"Cusco",
		"Huancavelica",
		"Huánuco",
		"Ica",
		"Junín",
		"La Libertad",
		"Lambayeque",
		"Lima",
		"Loreto",
		"Madre de Dios",
		"Moquegua",
		"Pasco",
		"Piura",
		"Puno",
		"San Martín",
		"Tacna",
		"Tumbes",
		"Ucayali",
	],
	CO: [
		"Amazonas",
		"Antioquia",
		"Arauca",
		"Atlántico",
		"Bogotá D.C.",
		"Bolívar",
		"Boyacá",
		"Caldas",
		"Caquetá",
		"Casanare",
		"Cauca",
		"Cesar",
		"Chocó",
		"Córdoba",
		"Cundinamarca",
		"Guainía",
		"Guaviare",
		"Huila",
		"La Guajira",
		"Magdalena",
		"Meta",
		"Nariño",
		"Norte de Santander",
		"Putumayo",
		"Quindío",
		"Risaralda",
		"San Andrés y Providencia",
		"Santander",
		"Sucre",
		"Tolima",
		"Valle del Cauca",
		"Vaupés",
		"Vichada",
	],
	CL: [
		"Arica y Parinacota",
		"Tarapacá",
		"Antofagasta",
		"Atacama",
		"Coquimbo",
		"Valparaíso",
		"Metropolitana de Santiago",
		"O'Higgins",
		"Maule",
		"Ñuble",
		"Biobío",
		"La Araucanía",
		"Los Ríos",
		"Los Lagos",
		"Aysén",
		"Magallanes",
	],
};

interface LocationSelectorProps {
	country: string;
	onCountryChange: (country: string) => void;
	region: string;
	onRegionChange: (region: string) => void;
	disabled?: boolean;
	className?: string;
}

export function LocationSelector({
	country,
	onCountryChange,
	region,
	onRegionChange,
	disabled = false,
	className = "",
}: LocationSelectorProps) {
	const [countryOpen, setCountryOpen] = useState(false);
	const [regionOpen, setRegionOpen] = useState(false);

	const selectedCountry = ACTIVE_COUNTRIES.find((c) => c.code === country);
	const availableRegions = country ? REGIONS_BY_COUNTRY[country] || [] : [];

	return (
		<div className={`flex gap-2 ${className}`}>
			<Popover open={countryOpen} onOpenChange={setCountryOpen}>
				<PopoverTrigger asChild>
					<ButtonGroup className="flex-1 [&>*]:!rounded-none">
						<ButtonGroupText className="!rounded-none">
							<MapPin className="h-4 w-4" />
						</ButtonGroupText>
						<Button
							type="button"
							variant="outline"
							role="combobox"
							className="flex-1 justify-between !rounded-none font-normal"
							disabled={disabled}
						>
							{selectedCountry?.name || "País"}
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</ButtonGroup>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0" align="start">
					<Command>
						<CommandList>
							<CommandGroup>
								{ACTIVE_COUNTRIES.map((c) => (
									<CommandItem
										key={c.code}
										value={c.code}
										onSelect={(value) => {
											const newCountry = value.toUpperCase();
											onCountryChange(newCountry);
											if (country !== newCountry) {
												onRegionChange("");
											}
											setCountryOpen(false);
										}}
									>
										{c.name}
										{country === c.code && (
											<Check className="ml-auto h-4 w-4" />
										)}
									</CommandItem>
								))}
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup>
								<CommandItem asChild>
									<Link
										href="/roadmap#latam"
										className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
									>
										<Plus className="h-4 w-4" />
										¿Tu país? Súmate
									</Link>
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			<Popover open={regionOpen} onOpenChange={setRegionOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						role="combobox"
						className="flex-1 justify-between !rounded-none font-normal"
						disabled={disabled || !country}
					>
						{region || "Región"}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[220px] p-0" align="start">
					<Command>
						<CommandInput placeholder="Buscar región..." />
						<CommandList>
							<CommandEmpty>No encontrado</CommandEmpty>
							<CommandGroup>
								{availableRegions.map((r) => (
									<CommandItem
										key={r}
										value={r}
										onSelect={(value) => {
											onRegionChange(value);
											setRegionOpen(false);
										}}
									>
										{r}
										{region === r && <Check className="ml-auto h-4 w-4" />}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
