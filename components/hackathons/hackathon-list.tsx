import { Search, Sparkles, Plus } from "lucide-react";
import { EventRow } from "./event-row";
import { LoadMoreButton } from "./load-more-button";
import type { Hackathon } from "@/lib/db/schema";
import type { HackathonFilters } from "@/lib/actions/hackathons";
import Link from "next/link";

interface HackathonListProps {
  hackathons: Hackathon[];
  total?: number;
  hasMore?: boolean;
  filters?: HackathonFilters;
}

export function HackathonList({ hackathons, total, hasMore = false, filters = {} }: HackathonListProps) {
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
        {/* Header - hidden on mobile */}
        <div className="hidden lg:grid grid-cols-[1fr_180px_120px_100px_130px] gap-4 items-center px-5 py-2.5 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div>Evento</div>
          <div>Fecha</div>
          <div>Formato</div>
          <div className="text-right">Premio</div>
          <div className="text-right">Estado</div>
        </div>

        {/* Initial rows */}
        <div className="divide-y divide-border">
          {hackathons.map((hackathon) => (
            <EventRow key={hackathon.id} event={hackathon} />
          ))}
        </div>

        {/* Load more button and additional rows */}
        <LoadMoreButton
          filters={filters}
          initialPage={1}
          hasMore={hasMore}
        />
      </div>

      {/* Submit CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-8">
        <Link
          href="/submit"
          className="flex items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground hover:border-muted-foreground/30"
        >
          <Plus className="h-4 w-4" />
          <span>¿Conoces un evento? <span className="text-foreground font-medium">Agrégalo</span></span>
        </Link>
        <a
          href="mailto:railly@crafterstation.com?subject=Quiero destacar mi evento en hack0.dev"
          className="flex items-center justify-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-4 text-sm text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          <span>¿Quieres ser <span className="text-amber-500 font-medium">Sponsored</span>?</span>
        </a>
      </div>
    </div>
  );
}
