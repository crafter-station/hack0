import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Award, BarChart3, Calendar, Edit3, LayoutDashboard, Users } from "lucide-react";
import { canManageEventBySlug } from "@/lib/actions/permissions";
import { getOrganizationBySlug } from "@/lib/actions/organizations";
import { getEventBySlug, getEventSponsors } from "@/lib/actions/events";
import { getEventWinnerClaims } from "@/lib/actions/claims";
import { getEventOrganizers } from "@/lib/actions/event-organizers";
import { getEventImportJobs, getEventNotificationLogs } from "@/lib/actions/analytics";
import { ManageContent } from "@/components/manage/manage-content";
import { Button } from "@/components/ui/button";

interface ManageEventPageProps {
  params: Promise<{
    slug: string;
    eventSlug: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

async function EventManageHero({
  slug,
  eventSlug,
  currentTab,
}: {
  slug: string;
  eventSlug: string;
  currentTab: string;
}) {
  const event = await getEventBySlug(eventSlug);
  const community = await getOrganizationBySlug(slug);

  if (!event || !community) return null;

  const isHackathon = event.eventType === "hackathon" || event.eventType === "competition" || event.eventType === "olympiad";

  const tabs = [
    { id: "overview", label: "Vista general", icon: LayoutDashboard },
    { id: "edit", label: "Editar", icon: Edit3 },
    { id: "team", label: "Equipo", icon: Users },
    ...(isHackathon ? [{ id: "winners", label: "Ganadores", icon: Award }] : []),
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="border-b bg-muted/30">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Event logo */}
            {event.eventImageUrl ? (
              <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden border border-border">
                <Image
                  src={event.eventImageUrl}
                  alt={event.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-md bg-muted border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
                {event.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight truncate">
                {event.name}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {community.displayName || community.name}
              </p>
            </div>
          </div>

          <Link href={`/c/${slug}/events/${eventSlug}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Ver página</span>
            </Button>
          </Link>
        </div>

        <nav className="flex items-center gap-1 border-t -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/c/${slug}/events/${eventSlug}/manage?tab=${tab.id}`}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}


export default async function ManageEventPage({
  params,
  searchParams,
}: ManageEventPageProps) {
  const { slug, eventSlug } = await params;
  const { tab = "overview" } = await searchParams;

  const hasPermission = await canManageEventBySlug(eventSlug);

  if (!hasPermission) {
    redirect(`/c/${slug}/events/${eventSlug}`);
  }

  const event = await getEventBySlug(eventSlug);

  if (!event) {
    redirect("/");
  }

  const community = await getOrganizationBySlug(slug);

  if (!community || event.organizationId !== community.id) {
    redirect("/");
  }

  const sponsors = await getEventSponsors(event.id);
  const eventOrganizers = await getEventOrganizers(event.id);

  const isHackathon = event.eventType === "hackathon" || event.eventType === "competition" || event.eventType === "olympiad";
  const winnerClaims = isHackathon ? await getEventWinnerClaims(event.id) : [];

  const importJobs = await getEventImportJobs(event.id);
  const notificationLogs = await getEventNotificationLogs(event.id);

  return (
    <>
      <EventManageHero slug={slug} eventSlug={eventSlug} currentTab={tab} />

      <main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
        <ManageContent
          event={event}
          community={community}
          slug={slug}
          eventSlug={eventSlug}
          tab={tab}
          sponsors={sponsors}
          eventOrganizers={eventOrganizers}
          winnerClaims={winnerClaims}
          importJobs={importJobs}
          notificationLogs={notificationLogs}
        />
      </main>
    </>
  );
}
