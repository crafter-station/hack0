"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InviteManager } from "@/components/communities/invite-manager";
import type { Event } from "@/lib/db/schema";

interface InviteDialogProps {
  event: Event;
  children?: React.ReactNode;
}

export function InviteDialog({ event, children }: InviteDialogProps) {
  if (!event.organizationId) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Invitar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invitar a la comunidad</DialogTitle>
          <DialogDescription>
            Crea enlaces de invitación para que otros usuarios se unan a tu comunidad
          </DialogDescription>
        </DialogHeader>
        <InviteManager communityId={event.organizationId} />
      </DialogContent>
    </Dialog>
  );
}
