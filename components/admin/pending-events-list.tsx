"use client";

import { useState } from "react";
import { Check, X, ExternalLink, Calendar, MapPin } from "lucide-react";
import { approveEvent, rejectEvent } from "@/lib/actions/hackathons";
import type { Event } from "@/lib/db/schema";
import { formatEventDate, getEventTypeLabel, getFormatLabel } from "@/lib/event-utils";

interface PendingEventsListProps {
  events: Event[];
}

export function PendingEventsList({ events: initialEvents }: PendingEventsListProps) {
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (eventId: string) => {
    setLoading(eventId);
    const result = await approveEvent(eventId);
    if (result.success) {
      setEvents(events.filter((e) => e.id !== eventId));
    }
    setLoading(null);
  };

  const handleReject = async (eventId: string) => {
    if (!confirm("¿Estás seguro de rechazar este evento? Se eliminará permanentemente.")) {
      return;
    }
    setLoading(eventId);
    const result = await rejectEvent(eventId);
    if (result.success) {
      setEvents(events.filter((e) => e.id !== eventId));
    }
    setLoading(null);
  };

  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium">Eventos Pendientes de Aprobación</h2>
          {events.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-xs font-medium text-amber-500">
              {events.length}
            </span>
          )}
        </div>

        {/* Placeholder para mantener consistencia visual */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <span className="rounded-md px-2.5 py-1 text-xs font-medium bg-background text-foreground shadow-sm">
            Pendientes
          </span>
        </div>
      </div>

      {/* List */}
      <div className="divide-y">
        {events.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No hay eventos pendientes de aprobación
          </div>
        ) : (
          events.map((event) => (
        <div key={event.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">{event.name}</h3>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {getEventTypeLabel(event.eventType)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                {event.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatEventDate(new Date(event.startDate))}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {getFormatLabel(event.format)} {event.city && `· ${event.city}`}
                </span>
              </div>

              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {event.description}
                </p>
              )}

              <div className="flex items-center gap-2">
                <a
                  href={event.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {event.websiteUrl}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleApprove(event.id)}
                disabled={loading === event.id}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-500 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Aprobar
              </button>
              <button
                onClick={() => handleReject(event.id)}
                disabled={loading === event.id}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Rechazar
              </button>
            </div>
          </div>
        </div>
          ))
        )}
      </div>
    </div>
  );
}
