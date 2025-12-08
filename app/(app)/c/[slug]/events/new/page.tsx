import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
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
    <main className="mx-auto max-w-5xl px-4 lg:px-8 py-6 flex-1 w-full">
        <div className="space-y-5">
          {/* Breadcrumb + Header inline */}
          <div className="space-y-3">
            <Link
              href={`/c/${slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver
            </Link>

            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold tracking-tight">
                Agregar evento
              </h1>

              {/* Verification Badge - inline on desktop */}
              {org.isVerified && (
                <div className="hidden lg:inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Verificada
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="manual" className="gap-2">
                <PenLine className="h-4 w-4" />
                Crear manual
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Importar de Luma
              </TabsTrigger>
            </TabsList>
            <TabsContent value="import" className="mt-5">
              <LumaImportForm />
            </TabsContent>
            <TabsContent value="manual" className="mt-5">
              <OrgEventForm
                organizationId={org.id}
                organizationName={org.displayName || org.name}
                organizationLogo={org.logoUrl}
                organizationSlug={slug}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
  );
}
