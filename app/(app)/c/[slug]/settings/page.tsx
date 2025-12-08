import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { OrgSettingsForm } from "@/components/orgs/org-settings-form";
import { getOrganizationBySlug } from "@/lib/actions/organizations";
import { ArrowLeft, CheckCircle2, Users, Calendar, BarChart3, Settings, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

async function CommunityHero({ slug }: { slug: string }) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) return null;

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
						<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted border-2 border-border shrink-0">
							<Users className="h-10 w-10 text-muted-foreground" />
						</div>

						<div className="flex-1 space-y-3">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<Link href="/">
										<Button variant="ghost" size="sm" className="gap-2">
											<ArrowLeft className="h-4 w-4" />
											Volver
										</Button>
									</Link>
								</div>
								<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
									{community.displayName || community.name}
								</h1>
								{community.description && (
									<p className="text-lg text-muted-foreground mt-2 max-w-2xl">
										{community.description}
									</p>
								)}
							</div>
						</div>
					</div>

					<Link href={`/c/${slug}/events/new`}>
						<Button className="gap-2">
							<UserPlus className="h-4 w-4" />
							Nuevo evento
						</Button>
					</Link>
				</div>

				<nav className="flex items-center gap-1 border-b border-border -mb-px">
					<Link
						href={`/c/${slug}`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
					>
						<Calendar className="h-4 w-4" />
						Eventos
					</Link>
					<Link
						href={`/c/${slug}/members`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
					>
						<Users className="h-4 w-4" />
						Miembros
					</Link>
					<Link
						href={`/c/${slug}/analytics`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent"
					>
						<BarChart3 className="h-4 w-4" />
						Analytics
					</Link>
					<Link
						href={`/c/${slug}/settings`}
						className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-foreground text-foreground"
					>
						<Settings className="h-4 w-4" />
						Configuración
					</Link>
				</nav>
			</div>
		</div>
	);
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

  if (org.ownerUserId !== userId) {
    redirect(`/c/${slug}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <Suspense fallback={null}>
        <CommunityHero slug={slug} />
      </Suspense>

      <main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
        <div className="max-w-2xl mx-auto space-y-6">
          {org.isVerified && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
              Comunidad verificada
            </div>
          )}

          <OrgSettingsForm organization={org} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
