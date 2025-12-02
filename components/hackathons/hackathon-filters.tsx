"use client";

import { Search, X, Sparkles, Filter } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { LATAM_COUNTRIES } from "@/lib/db/schema";
import { useState } from "react";
import { searchParamsParsers } from "@/lib/search-params";

// Event type options
const eventTypeOptions = [
  { value: "hackathon", label: "Hackathon" },
  { value: "conference", label: "Congreso" },
  { value: "workshop", label: "Taller" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "summer_school", label: "Escuela de Verano" },
  { value: "meetup", label: "Meetup" },
  { value: "olympiad", label: "Olimpiada" },
  { value: "competition", label: "Competencia" },
  { value: "accelerator", label: "Aceleradora" },
  { value: "fellowship", label: "Fellowship / Beca" },
];

const organizerTypeOptions = [
  { value: "university", label: "Universidad" },
  { value: "government", label: "Gobierno" },
  { value: "company", label: "Empresa" },
  { value: "community", label: "Comunidad" },
  { value: "ngo", label: "ONG / Fundación" },
  { value: "international_org", label: "Org. Internacional" },
  { value: "student_org", label: "Org. Estudiantil" },
  { value: "startup", label: "Startup" },
];

const skillLevelOptions = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "all", label: "Todos los niveles" },
];

const formatOptions = [
  { value: "virtual", label: "Virtual" },
  { value: "in-person", label: "Presencial" },
  { value: "hybrid", label: "Híbrido" },
];

const statusOptions = [
  { value: "open", label: "Inscripciones abiertas" },
  { value: "upcoming", label: "Próximamente" },
  { value: "ongoing", label: "En curso" },
  { value: "ended", label: "Terminado" },
];

const domainOptions = [
  { value: "ai", label: "AI / Machine Learning" },
  { value: "web3", label: "Web3" },
  { value: "blockchain", label: "Blockchain" },
  { value: "fintech", label: "Fintech" },
  { value: "social-impact", label: "Impacto Social" },
  { value: "govtech", label: "Govtech" },
  { value: "healthtech", label: "Healthtech" },
  { value: "edtech", label: "Edtech" },
  { value: "climate", label: "Clima / Sostenibilidad" },
  { value: "space", label: "Espacio / Aeroespacial" },
  { value: "energy", label: "Energía" },
  { value: "robotics", label: "Robótica" },
  { value: "quantum", label: "Computación Cuántica" },
  { value: "cybersecurity", label: "Ciberseguridad" },
  { value: "mobile", label: "Mobile" },
  { value: "gaming", label: "Gaming" },
  { value: "general", label: "General" },
];

const countryOptions = LATAM_COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.code === "LATAM" ? "🌎" : ""} ${c.name}`,
}));

export function HackathonFilters() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Use nuqs for all filter state
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false, // Trigger server-side re-fetch
  });

  const {
    search,
    eventType,
    organizerType,
    skillLevel,
    format,
    status,
    domain,
    country,
    juniorFriendly,
  } = filters;

  const activeFiltersCount =
    eventType.length +
    organizerType.length +
    skillLevel.length +
    format.length +
    status.length +
    domain.length +
    country.length +
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
      juniorFriendly: false,
      page: 1,
    });
  };

  const removeFromArray = (arr: string[], value: string) =>
    arr.filter((v) => v !== value);

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Junior Friendly Toggle */}
      <Button
        variant={juniorFriendly ? "default" : "outline"}
        size="sm"
        className="w-full gap-2"
        onClick={() => setFilters({ juniorFriendly: !juniorFriendly })}
      >
        <Sparkles className="h-4 w-4" />
        Para principiantes
      </Button>

      {/* Event Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de evento</label>
        <MultiSelect
          value={eventType}
          onValueChange={(v) => setFilters({ eventType: v })}
          options={eventTypeOptions}
          placeholder="Todos los tipos"
        />
      </div>

      {/* Organizer Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Organizador</label>
        <MultiSelect
          value={organizerType}
          onValueChange={(v) => setFilters({ organizerType: v })}
          options={organizerTypeOptions}
          placeholder="Cualquier organizador"
        />
      </div>

      {/* Domain */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Temática</label>
        <MultiSelect
          value={domain}
          onValueChange={(v) => setFilters({ domain: v })}
          options={domainOptions}
          placeholder="Cualquier temática"
        />
      </div>

      {/* Format */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Formato</label>
        <MultiSelect
          value={format}
          onValueChange={(v) => setFilters({ format: v })}
          options={formatOptions}
          placeholder="Cualquier formato"
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Estado</label>
        <MultiSelect
          value={status}
          onValueChange={(v) => setFilters({ status: v })}
          options={statusOptions}
          placeholder="Cualquier estado"
        />
      </div>

      {/* Skill Level */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nivel requerido</label>
        <MultiSelect
          value={skillLevel}
          onValueChange={(v) => setFilters({ skillLevel: v })}
          options={skillLevelOptions}
          placeholder="Cualquier nivel"
        />
      </div>

      {/* Country */}
      <div className="space-y-2">
        <label className="text-sm font-medium">País</label>
        <MultiSelect
          value={country}
          onValueChange={(v) => setFilters({ country: v })}
          options={countryOptions}
          placeholder="Cualquier país"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search and mobile filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Mobile filter drawer */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 lg:hidden relative"
            >
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filtros</DrawerTitle>
              <DrawerDescription>
                Filtra eventos por tipo, formato, temática y más
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
              <FilterContent />
            </div>
            <DrawerFooter>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    clearAllFilters();
                    setDrawerOpen(false);
                  }}
                >
                  Limpiar filtros
                </Button>
                <DrawerClose asChild>
                  <Button className="flex-1">
                    Ver {activeFiltersCount > 0 ? "resultados" : "eventos"}
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop filters */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>

      {/* Active filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {juniorFriendly && (
            <Badge
              variant="default"
              className="cursor-pointer gap-1"
              onClick={() => setFilters({ juniorFriendly: false })}
            >
              <Sparkles className="h-3 w-3" />
              Para principiantes
              <X className="h-3 w-3" />
            </Badge>
          )}
          {eventType.map((v) => (
            <Badge
              key={`event-${v}`}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() =>
                setFilters({ eventType: removeFromArray(eventType, v) })
              }
            >
              {eventTypeOptions.find((o) => o.value === v)?.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {organizerType.map((v) => (
            <Badge
              key={`org-${v}`}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() =>
                setFilters({ organizerType: removeFromArray(organizerType, v) })
              }
            >
              {organizerTypeOptions.find((o) => o.value === v)?.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {domain.map((v) => (
            <Badge
              key={`domain-${v}`}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => setFilters({ domain: removeFromArray(domain, v) })}
            >
              {domainOptions.find((o) => o.value === v)?.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {format.map((v) => (
            <Badge
              key={`format-${v}`}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => setFilters({ format: removeFromArray(format, v) })}
            >
              {formatOptions.find((o) => o.value === v)?.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {status.map((v) => (
            <Badge
              key={`status-${v}`}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => setFilters({ status: removeFromArray(status, v) })}
            >
              {statusOptions.find((o) => o.value === v)?.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {skillLevel.map((v) => (
            <Badge
              key={`skill-${v}`}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() =>
                setFilters({ skillLevel: removeFromArray(skillLevel, v) })
              }
            >
              {skillLevelOptions.find((o) => o.value === v)?.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {country.map((v) => (
            <Badge
              key={`country-${v}`}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() =>
                setFilters({ country: removeFromArray(country, v) })
              }
            >
              {countryOptions.find((o) => o.value === v)?.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs"
          >
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );
}
