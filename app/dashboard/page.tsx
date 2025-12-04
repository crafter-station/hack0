import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  getUserOrganization,
  getOrganizationEvents,
  getOrganizationStats,
} from "@/lib/actions/organizations";
import { getOrgImportJobs } from "@/lib/actions/import";
import { Calendar, Settings, ExternalLink, Loader2, Plus } from "lucide-react";
import { formatEventDateRange } from "@/lib/event-utils";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user has an org, redirect to onboarding if not
  const org = await getUserOrganization();
  if (!org) {
    redirect("/onboarding");
  }

  const [events, stats, importJobs] = await Promise.all([
    getOrganizationEvents(),
    getOrganizationStats(),
    getOrgImportJobs(5),
  ]);

  const pendingJobs = importJobs.filter(
    (job) => job.status === "pending" || job.status === "processing"
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
            <p className="text-sm text-muted-foreground">
              Dashboard de organización
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuración</span>
            </Link>
            <Link
              href="/dashboard/events/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground text-background px-4 text-sm font-medium transition-colors hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" />
              Nuevo evento
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-lg border border-border p-5">
            <p className="text-sm text-muted-foreground">Total eventos</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {stats.totalEvents}
            </p>
          </div>
          <div className="rounded-lg border border-border p-5">
            <p className="text-sm text-muted-foreground">Eventos activos</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {stats.activeEvents}
            </p>
          </div>
          <div className="rounded-lg border border-border p-5">
            <p className="text-sm text-muted-foreground">Eventos pasados</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {stats.endedEvents}
            </p>
          </div>
        </div>

        {/* Events List */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <h2 className="font-medium">Tus eventos</h2>
          </div>

          {events.length === 0 && pendingJobs.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Aún no has creado ningún evento
              </p>
              <Link
                href="/dashboard/events/new"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground text-background px-4 text-sm font-medium transition-colors hover:bg-foreground/90"
              >
                <Plus className="h-4 w-4" />
                Nuevo evento
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingJobs.map((job) => (
                <div
                  key={job.id}
                  className="px-5 py-4 flex items-center justify-between gap-4 bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">
                        Importando evento...
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {job.sourceUrl}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {job.status === "pending" ? "En cola" : "Procesando"}
                  </div>
                </div>
              ))}
              {events.map((event) => (
                <div
                  key={event.id}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${event.slug}`}
                      className="font-medium hover:underline truncate block"
                    >
                      {event.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {event.startDate && event.endDate
                        ? formatEventDateRange(
                            new Date(event.startDate),
                            new Date(event.endDate)
                          )
                        : "Sin fecha"}
                      {" · "}
                      {event.status}
                      {!event.isApproved && (
                        <span className="text-amber-600"> · Pendiente de aprobación</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${event.slug}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted"
                      title="Ver evento"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
