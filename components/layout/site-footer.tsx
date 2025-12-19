import { Github, Rss } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>Centralizando eventos tech para Perú.</p>
          <div className="flex items-center gap-3">
            <a href="mailto:hey@hack0.dev" className="hover:text-foreground transition-colors">
              Contacto
            </a>
            <a
              href="/feed.xml"
              className="hover:text-foreground transition-colors"
              title="RSS Feed"
            >
              <Rss className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://github.com/crafter-station/hack0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
