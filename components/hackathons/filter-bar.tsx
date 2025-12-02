"use client";

import { Search, X, Sparkles } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { searchParamsParsers } from "@/lib/search-params";
import {
  EVENT_TYPE_OPTIONS,
  FORMAT_OPTIONS,
  STATUS_OPTIONS,
  SKILL_LEVEL_OPTIONS,
} from "@/lib/event-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onSelect: (values: string[]) => void;
}

function FilterDropdown({ label, options, selected, onSelect }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onSelect(selected.filter((v) => v !== value));
    } else {
      onSelect([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors hover:bg-muted ${
            selected.length > 0
              ? "border-foreground/20 bg-muted text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
          {selected.length > 0 && (
            <span className="ml-1 rounded bg-foreground/10 px-1.5 py-0.5 text-xs font-medium">
              {selected.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="space-y-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
                selected.includes(option.value) ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              {option.label}
              {selected.includes(option.value) && (
                <span className="text-foreground">✓</span>
              )}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="mt-2 border-t pt-2">
            <button
              onClick={() => onSelect([])}
              className="w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Limpiar
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function FilterBar() {
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false,
  });

  const {
    search,
    eventType,
    format,
    status,
    skillLevel,
    juniorFriendly,
  } = filters;

  const activeFiltersCount =
    eventType.length +
    format.length +
    status.length +
    skillLevel.length +
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

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left - Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Search input */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
              className="h-8 w-40 rounded-md border border-border bg-transparent pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0" />

          {/* Junior friendly toggle */}
          <button
            onClick={() => setFilters({ juniorFriendly: !juniorFriendly, page: 1 })}
            className={`inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors ${
              juniorFriendly
                ? "border-foreground/20 bg-muted text-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Principiantes</span>
          </button>

          {/* Filter dropdowns */}
          <FilterDropdown
            label="Tipo"
            options={EVENT_TYPE_OPTIONS}
            selected={eventType}
            onSelect={(v) => setFilters({ eventType: v, page: 1 })}
          />

          <FilterDropdown
            label="Formato"
            options={FORMAT_OPTIONS}
            selected={format}
            onSelect={(v) => setFilters({ format: v, page: 1 })}
          />

          <FilterDropdown
            label="Estado"
            options={STATUS_OPTIONS}
            selected={status}
            onSelect={(v) => setFilters({ status: v, page: 1 })}
          />

          <FilterDropdown
            label="Nivel"
            options={SKILL_LEVEL_OPTIONS}
            selected={skillLevel}
            onSelect={(v) => setFilters({ skillLevel: v, page: 1 })}
          />

          {/* Clear all button */}
          {activeFiltersCount > 0 && (
            <>
              <div className="h-4 w-px bg-border flex-shrink-0" />
              <button
                onClick={clearAllFilters}
                className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Limpiar</span> ({activeFiltersCount})
              </button>
            </>
          )}
        </div>

        {/* Right - Sponsor CTA */}
        <a
          href="mailto:railly@crafterstation.com?subject=Quiero destacar mi evento en hack0.dev"
          className="hidden md:inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 text-sm text-amber-500 transition-colors hover:bg-amber-500/10 flex-shrink-0"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          ¿Destacar tu evento?
        </a>
      </div>
    </div>
  );
}
