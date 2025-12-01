import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader showBackButton />

      {/* Content */}
      <main className="mx-auto max-w-screen-2xl px-4 lg:px-8 flex-1 w-full">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="max-w-md text-center">
            {/* Success icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="h-8 w-8 text-foreground" />
            </div>

            {/* Message */}
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              Evento enviado
            </h1>
            <p className="mt-2 text-muted-foreground">
              Gracias por compartir. Revisaremos tu evento y te notificaremos cuando esté publicado.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                <Home className="h-4 w-4" />
                Volver al inicio
              </Link>
              <Link
                href="/submit"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Agregar otro evento
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
