import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { OrgSettingsForm } from "@/components/orgs/org-settings-form";
import { getOrganizationBySlug, canManageOrganization } from "@/lib/actions/organizations";
import { isAdmin } from "@/lib/actions/claims";
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

  const isAdminUser = await isAdmin();
  const canManage = await canManageOrganization(org.id);

  if (!canManage && !isAdminUser) {
    redirect(`/c/${slug}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {org.isVerified && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4" />
          Comunidad verificada
        </div>
      )}

      <OrgSettingsForm organization={org} />
    </div>
  );
}
