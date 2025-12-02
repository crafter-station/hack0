import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { OrgEventForm } from "@/components/orgs/org-event-form";
import { getUserOrganization } from "@/lib/actions/organizations";
import { ArrowLeft } from "lucide-react";

export default async function NewEventPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const org = await getUserOrganization();
  if (!org) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>

        <div className="grid lg:grid-cols-[1fr_2fr] gap-12">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-28 lg:self-start space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Crear evento
            </h1>
            <p className="text-muted-foreground">
              Publica un nuevo evento como {org.name}.
            </p>
            <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
              <p>Los eventos son revisados antes de publicarse.</p>
              <p>Te notificaremos cuando esté aprobado.</p>
            </div>
          </div>

          {/* Form */}
          <div>
            <OrgEventForm organizationId={org.id} organizationName={org.name} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
