import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  isAdmin,
  getAllOrganizerClaims,
  getAllWinnerClaims,
} from "@/lib/actions/claims";
import { getEventsByApprovalStatus } from "@/lib/actions/events";
import { AdminClaimsList } from "@/components/admin/claims-list";
import { PendingEventsList } from "@/components/admin/pending-events-list";
import { Shield, UserCheck, Calendar } from "lucide-react";
import { TrophyIcon } from "@/components/icons/trophy";

export default async function AdminPage() {
  const admin = await isAdmin();

  if (!admin) {
    redirect("/");
  }

  const [organizerClaims, winnerClaims, allEvents] = await Promise.all([
    getAllOrganizerClaims(),
    getAllWinnerClaims(),
    getEventsByApprovalStatus("all"),
  ]);

  const pendingOrganizers = organizerClaims.filter((c) => c.status === "pending");
  const pendingWinners = winnerClaims.filter((c) => c.status === "pending");
  const pendingEvents = allEvents.filter((e) => e.approvalStatus === "pending");
  const approvedEvents = allEvents.filter((e) => e.approvalStatus === "approved");
  const rejectedEvents = allEvents.filter((e) => e.approvalStatus === "rejected");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Panel de Administración
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gestiona las solicitudes de verificación de organizadores y victorias
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* Eventos */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{pendingEvents.length}</p>
                <p className="text-xs text-muted-foreground">Eventos pend.</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10">
                <Calendar className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{approvedEvents.length}</p>
                <p className="text-xs text-muted-foreground">Eventos aprob.</p>
              </div>
            </div>
          </div>
          {/* Organizadores */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
                <UserCheck className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{pendingOrganizers.length}</p>
                <p className="text-xs text-muted-foreground">Org. pend.</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10">
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {organizerClaims.filter((c) => c.status === "approved").length}
                </p>
                <p className="text-xs text-muted-foreground">Org. aprob.</p>
              </div>
            </div>
          </div>
          {/* Victorias */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
                <TrophyIcon className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{pendingWinners.length}</p>
                <p className="text-xs text-muted-foreground">Vic. pend.</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10">
                <TrophyIcon className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {winnerClaims.filter((c) => c.status === "approved").length}
                </p>
                <p className="text-xs text-muted-foreground">Vic. aprob.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lists */}
        <div className="space-y-8">
          <PendingEventsList events={allEvents} />

          <AdminClaimsList
            title="Solicitudes de Organizadores"
            type="organizer"
            claims={organizerClaims}
          />
          <AdminClaimsList
            title="Solicitudes de Victorias"
            type="winner"
            claims={winnerClaims}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
