import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { acceptCommunityInvite } from "@/lib/actions/communities";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { userId } = await auth();
  const { token } = await params;

  if (!userId) {
    redirect(`/sign-in?redirect_url=/invite/${token}`);
  }

  const result = await acceptCommunityInvite(token);

  if (!result.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Invitación inválida</h1>
            <p className="text-muted-foreground mt-2">{result.error}</p>
          </div>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { community, alreadyMember } = result;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {alreadyMember ? "Ya eres miembro" : "¡Bienvenido!"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {alreadyMember
              ? `Ya eres miembro de ${community.name}`
              : `Te has unido a ${community.name} exitosamente`}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href={`/communities/${community.slug}`}>
            <Button className="w-full">Ver comunidad</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Explorar eventos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
