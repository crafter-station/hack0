import { Search, Sparkles } from "lucide-react";
import { EventRowWithChildren } from "./event-row-with-children";
import { LoadMoreButton } from "./load-more-button";
import type { Event } from "@/lib/db/schema";
import type { EventFilters } from "@/lib/actions/events";
import { getCategoryById, type EventCategoryConfig } from "@/lib/event-categories";
import Link from "next/link";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

interface EventListProps {
  events: Event[];
  total?: number;
  hasMore?: boolean;
  filters?: EventFilters;
}

export function EventList({ events, total, hasMore = false, filters = {} }: EventListProps) {
  // Get category config for dynamic columns
  const categoryConfig = getCategoryById(filters.category || "all");
  if (events.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No se encontraron eventos</EmptyTitle>
          <EmptyDescription>
            No hay eventos que coincidan con tus filtros. Intenta ajustar los criterios o explora todas las categorías.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </Link>
            <Link href="/?juniorFriendly=true">
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Para principiantes
              </Button>
            </Link>
          </div>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
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
          {events.map((event) => (
            <EventRowWithChildren key={event.id} event={event} categoryConfig={categoryConfig} />
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
