import Link from "next/link";
import { Github } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Centralizando eventos tech para Perú.</p>
          <div className="flex items-center gap-4">
            <Link href="/submit" className="hover:text-foreground transition-colors">
              Agregar evento
            </Link>
            <a href="mailto:hey@hack0.dev" className="hover:text-foreground transition-colors">
              Contacto
            </a>
            <a
              href="https://github.com/crafter-station/hack0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
