import { Globe, Home } from "lucide-react";

export function PillarsSection() {
	return (
		<section className="border-t py-12 md:py-16">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="text-center mb-8">
					<p className="text-xs text-muted-foreground uppercase tracking-wide">
						Dos pilares
					</p>
					<h2 className="text-xl font-semibold mt-2">
						Comunidad + Espacio fisico
					</h2>
				</div>

				<div className="grid md:grid-cols-2 gap-4">
					<div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
						<div className="flex items-center gap-2 mb-4">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
								<Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
							</span>
							<span className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
								Comunidad
							</span>
						</div>
						<h3 className="text-lg font-medium">Red distribuida de builders</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Sistema distribuido de aprendizaje, conexion y lanzamiento. Opera
							bajo logica descentralizada y de alta frecuencia.
						</p>
						<ul className="mt-4 space-y-2 text-sm text-muted-foreground">
							<li className="flex items-center gap-2">
								<span className="h-1 w-1 rounded-full bg-emerald-500" />
								Eventos en todo Peru
							</li>
							<li className="flex items-center gap-2">
								<span className="h-1 w-1 rounded-full bg-emerald-500" />
								Canales digitales activos
							</li>
							<li className="flex items-center gap-2">
								<span className="h-1 w-1 rounded-full bg-emerald-500" />
								Nodos en diferentes ciudades
							</li>
						</ul>
					</div>

					<div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
						<div className="flex items-center gap-2 mb-4">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20">
								<Home className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
							</span>
							<span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
								Hacker House
							</span>
						</div>
						<h3 className="text-lg font-medium">Espacio fisico para crear</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Nucleo intensivo del ecosistema. Un espacio fisico, experimental y
							habitado donde convergen builders comprometidos.
						</p>
						<ul className="mt-4 space-y-2 text-sm text-muted-foreground">
							<li className="flex items-center gap-2">
								<span className="h-1 w-1 rounded-full bg-amber-500" />
								Coworking para builders
							</li>
							<li className="flex items-center gap-2">
								<span className="h-1 w-1 rounded-full bg-amber-500" />
								Residencias temporales
							</li>
							<li className="flex items-center gap-2">
								<span className="h-1 w-1 rounded-full bg-amber-500" />
								Demo days y networking
							</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
