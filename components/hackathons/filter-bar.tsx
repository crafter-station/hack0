"use client";

import { Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { searchParamsParsers } from "@/lib/search-params";
import {
  FORMAT_OPTIONS,
  STATUS_OPTIONS,
} from "@/lib/event-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function FilterBar() {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false,
  });

  const {
    search,
    format,
    status,
    juniorFriendly,
  } = filters;

  const activeFiltersCount =
    format.length +
    status.length +
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
    <div className="flex items-center gap-2">
      {/* Search input - compact */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
          className="h-8 w-32 sm:w-40 rounded-md border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all"
        />
        {search && (
          <button
            onClick={() => setFilters({ search: "", page: 1 })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* More filters popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors ${
              activeFiltersCount > 0
                ? "border-foreground/20 bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {activeFiltersCount > 0 && (
              <span className={`rounded-full px-1.5 text-xs font-medium ${
                activeFiltersCount > 0 ? "bg-background text-foreground" : "bg-foreground/10"
              }`}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filtros</h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {/* Junior friendly */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Nivel
              </label>
              <button
                onClick={() => setFilters({ juniorFriendly: !juniorFriendly, page: 1 })}
                className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  juniorFriendly
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Para principiantes
                {juniorFriendly && <span className="ml-auto">✓</span>}
              </button>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      format.includes(option.value)
                        ? "border-foreground/20 bg-foreground text-background"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      status.includes(option.value)
                        ? "border-foreground/20 bg-foreground text-background"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
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
