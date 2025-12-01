import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ already?: string }>;
}

export default async function UnsubscribeSuccessPage({ searchParams }: PageProps) {
  const { already } = await searchParams;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <CheckCircle className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {already ? "Ya no estás suscrito" : "Te has dado de baja"}
          </h1>
          <p className="text-muted-foreground">
            {already
              ? "Tu suscripción ya estaba cancelada."
              : "Ya no recibirás notificaciones de nuevos eventos. Puedes volver a suscribirte cuando quieras."}
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
