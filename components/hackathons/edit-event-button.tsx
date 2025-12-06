"use client";

import { useEffect, useState } from "react";
import { EditEventDialog } from "./edit-event-dialog";
import { canEditEvent } from "@/lib/actions/claims";
import { Pencil } from "lucide-react";
import type { Hackathon } from "@/lib/db/schema";

interface EditEventButtonProps {
  event: Hackathon;
}

export function EditEventButton({ event }: EditEventButtonProps) {
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    canEditEvent(event.id).then((result) => {
      setCanEdit(result);
      setLoading(false);
    });
  }, [event.id]);

  if (loading || !canEdit) {
    return null;
  }

  return (
    <EditEventDialog event={event}>
      <button className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background/90 backdrop-blur-sm px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
        <Pencil className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Editar evento</span>
        <span className="sm:hidden">Editar</span>
      </button>
    </EditEventDialog>
  );
}
