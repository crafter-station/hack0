import { Github } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
	return (
		<footer className="border-t border-border/50">
			<div className="mx-auto max-w-screen-xl px-4 py-6">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
						<div className="flex flex-col gap-2">
							<Link href="/" className="flex items-center">
								<span className="text-sm font-semibold tracking-tight">hack0</span>
								<span className="text-sm text-muted-foreground">.dev</span>
							</Link>
							<p className="text-xs text-muted-foreground">
								Mapeando el ecosistema tech de LATAM 🌎
							</p>
						</div>

						<div className="flex flex-wrap gap-x-8 gap-y-4 text-xs">
							<div className="flex flex-col gap-2">
								<span className="font-medium text-foreground">Explorar</span>
								<nav className="flex flex-col gap-1.5 text-muted-foreground">
									<Link href="/events" className="hover:text-foreground transition-colors">
										Eventos
									</Link>
									<Link href="/c/discover" className="hover:text-foreground transition-colors">
										Comunidades
									</Link>
								</nav>
							</div>

							<div className="flex flex-col gap-2">
								<span className="font-medium text-foreground">Recursos</span>
								<nav className="flex flex-col gap-1.5 text-muted-foreground">
									<Link href="/roadmap" className="hover:text-foreground transition-colors">
										Roadmap
									</Link>
									<a href="mailto:hey@hack0.dev" className="hover:text-foreground transition-colors">
										Contacto
									</a>
									<a href="/feed.xml" className="hover:text-foreground transition-colors">
										RSS Feed
									</a>
								</nav>
							</div>

							<div className="flex flex-col gap-2">
								<span className="font-medium text-foreground">Social</span>
								<nav className="flex flex-col gap-1.5 text-muted-foreground">
									<a
										href="https://github.com/crafter-station/hack0"
										target="_blank"
										rel="noopener noreferrer"
										className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
									>
										<Github className="h-3 w-3" />
										GitHub
									</a>
								</nav>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
						<p>© {new Date().getFullYear()} hack0.dev</p>
						<p>Hecho con ❤️ en Perú</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
