import { Search, Sparkles } from "lucide-react";
import { EventRowWithChildren } from "./event-row-with-children";
import { LoadMoreButton } from "./load-more-button";
import type { Hackathon } from "@/lib/db/schema";
import type { HackathonFilters } from "@/lib/actions/hackathons";
import { getCategoryById, type EventCategoryConfig } from "@/lib/event-categories";
import Link from "next/link";

interface HackathonListProps {
  hackathons: Hackathon[];
  total?: number;
  hasMore?: boolean;
  filters?: HackathonFilters;
}

export function HackathonList({ hackathons, total, hasMore = false, filters = {} }: HackathonListProps) {
  // Get category config for dynamic columns
  const categoryConfig = getCategoryById(filters.category || "all");
  if (hackathons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-medium">No se encontraron eventos</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          No hay eventos que coincidan con tus filtros. Intenta ajustar los criterios o explora todas las categorías.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Ver todos
          </Link>
          <Link
            href="/?juniorFriendly=true"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Para principiantes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      {total !== undefined && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} evento{total !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Header - hidden on mobile, dynamic based on category */}
        <div className={`hidden lg:grid ${
          categoryConfig?.showPrize
            ? "grid-cols-[1fr_180px_120px_100px_130px]"
            : categoryConfig?.showSkillLevel
            ? "grid-cols-[1fr_180px_120px_120px_130px]"
            : "grid-cols-[1fr_180px_120px_130px]"
        } gap-4 items-center px-5 py-2.5 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider`}>
          <div>Evento</div>
          <div>Fecha</div>
          <div>Formato</div>
          {categoryConfig?.showPrize && <div className="text-right">Premio</div>}
          {categoryConfig?.showSkillLevel && <div>Nivel</div>}
          <div className="text-right">Estado</div>
        </div>

        {/* Initial rows */}
        <div className="divide-y divide-border">
          {hackathons.map((hackathon) => (
            <EventRowWithChildren key={hackathon.id} event={hackathon} categoryConfig={categoryConfig} />
          ))}
        </div>

        {/* Load more button and additional rows */}
        <LoadMoreButton
          filters={filters}
          initialPage={1}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
}
