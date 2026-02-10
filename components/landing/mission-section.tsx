import { Rocket, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MissionSection() {
	return (
		<section className="border-t py-12 md:py-16">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="text-center mb-8">
					<p className="text-xs text-muted-foreground uppercase tracking-wide">
						Nuestra misión
					</p>
					<h2 className="text-xl font-semibold mt-2">
						Dos caminos, un objetivo
					</h2>
				</div>

				<div className="grid md:grid-cols-2 gap-4">
					<div className="rounded-2xl border p-6 relative overflow-hidden">
						<div
							className="absolute inset-0 opacity-[0.02]"
							style={{
								backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
								backgroundSize: "24px 24px",
							}}
						/>
						<div className="relative">
							<div className="flex items-center gap-2 mb-4">
								<Rocket className="h-4 w-4 text-emerald-500" />
								<Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
									Maximalista
								</Badge>
							</div>
							<h3 className="text-lg font-medium">
								Acelerar el primer unicornio peruano
							</h3>
							<p className="text-sm text-muted-foreground mt-2">
								Si logramos activar a miles de nuevos builders en el país,
								podríamos acelerar el surgimiento del primer unicornio peruano y
								fomentar un ecosistema tecnológico autosuficiente desde abajo
								hacia arriba.
							</p>
						</div>
					</div>

					<div className="rounded-2xl border p-6 bg-muted/30">
						<div className="flex items-center gap-2 mb-4">
							<Target className="h-4 w-4 text-muted-foreground" />
							<Badge variant="outline">Realista</Badge>
						</div>
						<h3 className="text-lg font-medium">
							Mejores oportunidades para jóvenes
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Brindar a jóvenes las herramientas y la comunidad para aprender
							rápido, lanzar productos y conseguir mejores oportunidades
							laborales, freelance o de emprendimiento desde Perú o hacia el
							mundo.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
