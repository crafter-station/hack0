import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { OrgEventForm } from "@/components/orgs/org-event-form";
import { LumaImportForm } from "@/components/orgs/luma-import-form";
import { getOrganizationBySlug } from "@/lib/actions/organizations";
import { ArrowLeft, Sparkles, PenLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewEventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewEventPage({ params }: NewEventPageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const org = await getOrganizationBySlug(slug);

  if (!org) {
    redirect("/onboarding");
  }

  if (org.ownerUserId !== userId) {
    redirect(`/c/${slug}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
        <Link
          href={`/c/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="grid lg:grid-cols-[1fr_2fr] gap-12">
          <div className="lg:sticky lg:top-28 lg:self-start space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Agregar evento
            </h1>
            <p className="text-muted-foreground">
              Publica un evento como {org.displayName || org.name}.
            </p>
            {org.isVerified ? (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2 pt-4 border-t">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Comunidad verificada. Tus eventos se publican al instante.
              </div>
            ) : (
              <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
                <p>Los eventos son revisados antes de publicarse.</p>
                <p>Te notificaremos cuando esté aprobado.</p>
              </div>
            )}
          </div>

          <div>
            <Tabs defaultValue="import" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="import" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Importar de Luma
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <PenLine className="h-4 w-4" />
                  Crear manual
                </TabsTrigger>
              </TabsList>
              <TabsContent value="import">
                <LumaImportForm />
              </TabsContent>
              <TabsContent value="manual">
                <OrgEventForm organizationId={org.id} organizationName={org.displayName || org.name} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
