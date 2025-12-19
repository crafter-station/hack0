import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { OrgSettingsForm } from "@/components/communities/org-settings-form";
import {
  LumaCalendarConnect,
  LumaCalendarsList,
} from "@/components/communities/luma-calendar-connect";
import { getOrganizationBySlug, canManageOrganization } from "@/lib/actions/organizations";
import { getOrgLumaCalendars } from "@/lib/actions/luma-calendars";
import { isGodMode } from "@/lib/god-mode";
import { CheckCircle2 } from "lucide-react";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const org = await getOrganizationBySlug(slug);

  if (!org) {
    notFound();
  }

  const godMode = await isGodMode();
  const canManage = await canManageOrganization(org.id);

  if (!canManage && !godMode) {
    redirect(`/c/${slug}`);
  }

  const lumaCalendars = await getOrgLumaCalendars(org.id);

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      {org.isVerified && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4" />
          Comunidad verificada
        </div>
      )}

      <OrgSettingsForm organization={org} />

      <div className="space-y-4">
        <h2 className="text-base font-medium">Integraciones</h2>
        <LumaCalendarsList calendars={lumaCalendars} organizationId={org.id} />
        <LumaCalendarConnect organizationId={org.id} />
      </div>
    </div>
  );
}
