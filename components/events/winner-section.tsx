"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { TrophyIcon } from "@/components/icons/trophy";
import { WinnerClaimDialog } from "./winner-claim-dialog";
import { getUserWinnerClaim } from "@/lib/actions/claims";
import type { WinnerClaim } from "@/lib/db/schema";

interface WinnerSectionProps {
  eventId: string;
  eventName: string;
}

export function WinnerSection({ eventId, eventName }: WinnerSectionProps) {
  const [claim, setClaim] = useState<WinnerClaim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserWinnerClaim(eventId).then((result) => {
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
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "approved":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/30";
      default:
        return "border-border";
    }
  };

  return (
    <div className="space-y-4 border-t pt-6">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Ganadores
      </h2>
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          ¿Quedaste en el podio de este evento?
        </p>

        <SignedOut>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <TrophyIcon className="h-4 w-4" />
            Registrar mi victoria
          </Link>
        </SignedOut>

        <SignedIn>
          {loading ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground">
              Cargando...
            </span>
          ) : claim ? (
            <div className="space-y-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${getStatusColor(
                  claim.status || "pending"
                )}`}
              >
                {claim.position === 1 ? "🥇" : claim.position === 2 ? "🥈" : "🥉"}
                {getStatusLabel(claim.status || "pending")}
              </span>
              {claim.status === "rejected" && claim.rejectionReason && (
                <p className="text-xs text-red-500">{claim.rejectionReason}</p>
              )}
            </div>
          ) : (
            <WinnerClaimDialog eventId={eventId} eventName={eventName}>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <TrophyIcon className="h-4 w-4" />
                Registrar mi victoria
              </button>
            </WinnerClaimDialog>
          )}
        </SignedIn>
      </div>
    </div>
  );
}
