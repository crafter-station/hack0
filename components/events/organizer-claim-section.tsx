"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { UserCheck } from "lucide-react";
import { OrganizerClaimDialog } from "./organizer-claim-dialog";
import { getUserOrganizerClaim } from "@/lib/actions/claims";
import type { OrganizerClaim } from "@/lib/db/schema";

interface OrganizerClaimSectionProps {
  eventId: string;
  eventName: string;
}

export function OrganizerClaimSection({
  eventId,
  eventName,
}: OrganizerClaimSectionProps) {
  const [claim, setClaim] = useState<OrganizerClaim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserOrganizerClaim(eventId).then((result) => {
      setClaim(result);
      setLoading(false);
    });
  }, [eventId]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente de validación";
      case "approved":
        return "Aprobado";
      case "rejected":
        return "Rechazado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-amber-500";
      case "approved":
        return "text-emerald-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="flex items-center gap-3 border-t pt-6 text-sm">
      <span className="text-muted-foreground">¿Eres el organizador?</span>

      <SignedOut>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-foreground hover:underline"
        >
          <UserCheck className="h-3.5 w-3.5" />
          Reclamar evento
        </Link>
      </SignedOut>

      <SignedIn>
        {loading ? (
          <span className="text-muted-foreground">Cargando...</span>
        ) : claim ? (
          <span
            className={`inline-flex items-center gap-1.5 ${getStatusColor(
              claim.status || "pending"
            )}`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            {getStatusLabel(claim.status || "pending")}
          </span>
        ) : (
          <OrganizerClaimDialog eventId={eventId} eventName={eventName}>
            <button className="inline-flex items-center gap-1.5 text-foreground hover:underline">
              <UserCheck className="h-3.5 w-3.5" />
              Solicitar acceso
            </button>
          </OrganizerClaimDialog>
        )}
      </SignedIn>
    </div>
  );
}
