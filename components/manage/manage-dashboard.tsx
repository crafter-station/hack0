"use client";

import { Share2, Users, Edit3, Sparkles, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { InviteDialog } from "./invite-dialog";
import { ShareEventDialog } from "./share-event-dialog";
import { EditEventDialog } from "@/components/events/edit-event-dialog";
import type { Event, Organization } from "@/lib/db/schema";

interface ManageDashboardProps {
  event: Event & {
    organization?: Organization | null;
  };
}

export function ManageDashboard({ event }: ManageDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card divide-y">
        <InviteDialog event={event}>
          <button className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-accent/50 group">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Invitar miembros</p>
                <p className="text-xs text-muted-foreground">Gestionar invitaciones a la comunidad</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        </InviteDialog>

        <ShareEventDialog event={event}>
          <button className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-accent/50 group">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                <Share2 className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Compartir evento</p>
                <p className="text-xs text-muted-foreground">Redes sociales y enlaces</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        </ShareEventDialog>

        <EditEventDialog event={event}>
          <button className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-accent/50 group">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <Edit3 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Editar detalles</p>
                <p className="text-xs text-muted-foreground">Actualizar información del evento</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        </EditEventDialog>

        <button
          disabled
          className="w-full flex items-center justify-between p-4 text-left opacity-50 cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Generar banner con IA</p>
              <p className="text-xs text-muted-foreground">Próximamente con Nano Banana 🍌</p>
            </div>
          </div>
        </button>
      </div>

      {event.organization && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Comunidad</p>
              </div>
              <p className="text-lg font-semibold">{event.organization.displayName || event.organization.name}</p>
              <p className="text-sm text-muted-foreground">
                Ver todos los eventos de esta comunidad
              </p>
            </div>
            <Link
              href={`/c/${event.organization.slug}`}
              className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Ver feed
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
