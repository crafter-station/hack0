import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Users, XCircle } from "lucide-react";
import { validateInviteToken, acceptInvite } from "@/lib/actions/community-members";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { COMMUNITY_ROLE_LABELS } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { communityMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AcceptInviteButton } from "@/components/communities/accept-invite-button";

interface InvitePageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ accepted?: string; error?: string }>;
}

async function InviteContent({ token }: { token: string }) {
  const { userId } = await auth();

  const validation = await validateInviteToken(token);

  if (!validation.valid || !validation.invite) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="rounded-lg border bg-card p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Invitación inválida</h1>
            <p className="text-muted-foreground">
              {validation.error || "Esta invitación no es válida o ha expirado."}
            </p>
          </div>
          <Button asChild>
            <a href="/">Volver al inicio</a>
          </Button>
        </div>
      </div>
    );
  }

  const { invite } = validation;

  if (!userId) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="rounded-lg border bg-card p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {invite.community.logoUrl ? (
                <img
                  src={invite.community.logoUrl}
                  alt={invite.community.displayName || invite.community.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                Invitación a {invite.community.displayName || invite.community.name}
              </h1>
              {invite.community.description && (
                <p className="text-sm text-muted-foreground">
                  {invite.community.description}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Rol que recibirás:</p>
            <p className="text-lg font-semibold">
              {COMMUNITY_ROLE_LABELS[invite.roleGranted]}
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <a href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`}>
                Iniciar sesión
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={`/sign-up?redirect_url=${encodeURIComponent(`/invite/${token}`)}`}>
                Crear cuenta
              </a>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Necesitas una cuenta para aceptar esta invitación.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is the owner
  const isOwner = invite.community.ownerUserId === userId;

  // Check if user is already a member
  const existingMembership = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.communityId, invite.communityId),
      eq(communityMembers.userId, userId!)
    ),
  });

  // If already a member or owner, show success state
  if (isOwner || existingMembership) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="rounded-lg border bg-card p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {invite.community.logoUrl ? (
                <img
                  src={invite.community.logoUrl}
                  alt={invite.community.displayName || invite.community.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Ya eres miembro</h1>
              <p className="text-sm text-muted-foreground">
                Ya formas parte de {invite.community.displayName || invite.community.name} como {isOwner ? "Owner" : COMMUNITY_ROLE_LABELS[existingMembership!.role]}.
              </p>
            </div>
          </div>

          <Button asChild className="w-full">
            <a href={`/c/${invite.community.slug}`}>
              Ir a la comunidad
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="rounded-lg border bg-card p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {invite.community.logoUrl ? (
              <img
                src={invite.community.logoUrl}
                alt={invite.community.displayName || invite.community.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              Invitación a {invite.community.displayName || invite.community.name}
            </h1>
            {invite.community.description && (
              <p className="text-sm text-muted-foreground">
                {invite.community.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Rol que recibirás:</p>
            <p className="text-lg font-semibold">
              {COMMUNITY_ROLE_LABELS[invite.roleGranted]}
            </p>
          </div>

          <form action={async () => {
            "use server";
            const result = await acceptInvite(token);

            if (result.success && result.community) {
              redirect(`/c/${result.community.slug}/members?accepted=true`);
            } else {
              redirect(`/invite/${token}?error=${encodeURIComponent(result.error || "Error desconocido")}`);
            }
          }}>
            <AcceptInviteButton />
          </form>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Al unirte, aceptas ser parte de esta comunidad y seguir sus normas.
        </p>
      </div>
    </div>
  );
}

function InviteSkeleton() {
  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="rounded-lg border bg-card p-8 space-y-6 animate-pulse">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        </div>
        <div className="h-24 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  );
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { token } = await params;
  const { error } = await searchParams;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 py-8">
          <div className="max-w-md mx-auto">
            <div className="rounded-lg border bg-card p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Error</h1>
                <p className="text-muted-foreground">{decodeURIComponent(error)}</p>
              </div>
              <Button asChild>
                <a href={`/invite/${token}`}>Intentar de nuevo</a>
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 py-8">
        <Suspense fallback={<InviteSkeleton />}>
          <InviteContent token={token} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
