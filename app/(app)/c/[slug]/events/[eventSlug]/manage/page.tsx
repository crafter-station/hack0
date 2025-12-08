import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Edit3, LayoutDashboard } from "lucide-react";
import { canManageEventBySlug } from "@/lib/actions/permissions";
import { getOrganizationBySlug } from "@/lib/actions/organizations";
import { getEventBySlug } from "@/lib/actions/events";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
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

  const stripePattern = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23888' fill-opacity='0.15'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`;

  const tabs = [
    { id: "overview", label: "Vista general", icon: LayoutDashboard },
    { id: "edit", label: "Editar", icon: Edit3 },
  ];

  return (
    <div className="relative border-b">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted border-2 border-border shrink-0 overflow-hidden">
              {event.eventImageUrl ? (
                <Image
                  src={event.eventImageUrl}
                  alt={event.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: stripePattern,
                    backgroundSize: "40px 40px",
                  }}
                />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Link href={`/c/${slug}/events/${eventSlug}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Volver
                    </Button>
                  </Link>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {event.name}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Gestión del evento
                </p>
              </div>
            </div>
          </div>

          <Link href={`/c/${slug}/events/${eventSlug}`} target="_blank">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Ver página del evento</span>
              <span className="sm:inline hidden">Ver</span>
            </Button>
          </Link>
        </div>

        <nav className="flex items-center gap-1 border-b border-border -mb-px overflow-x-auto">
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <EventManageHero slug={slug} eventSlug={eventSlug} currentTab={tab} />

      <main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
        <ManageContent
          event={event}
          community={community}
          slug={slug}
          eventSlug={eventSlug}
          tab={tab}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
