import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { OnboardingForm } from "@/components/orgs/onboarding-form";
import { getUserOrganization } from "@/lib/actions/organizations";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // If user already has an org, redirect to dashboard
  const existingOrg = await getUserOrganization();
  if (existingOrg) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader showBackButton />

      <main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-12 flex-1 w-full">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-28 lg:self-start space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Configura tu organización
            </h1>
            <p className="text-muted-foreground">
              Crea tu perfil de organización para empezar a publicar eventos en
              hack0.
            </p>
            <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
              <p>Solo toma 2 minutos.</p>
              <p>Podrás editar estos datos después.</p>
            </div>
          </div>

          {/* Form */}
          <div>
            <OnboardingForm />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
