import { Calendar, CalendarDays, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EventFormatsSection() {
	return (
		<section className="border-t py-12 md:py-16 bg-muted/30">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="text-center mb-8">
					<p className="text-xs text-muted-foreground uppercase tracking-wide">
						Formatos de eventos
					</p>
					<h2 className="text-xl font-semibold mt-2">
						Ritmo constante de activación
					</h2>
				</div>

				<div className="grid md:grid-cols-3 gap-4">
					<div className="rounded-2xl border bg-background p-5">
						<div className="flex items-center gap-2 mb-3">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<Badge variant="outline" className="text-[10px]">
								Semanal
							</Badge>
						</div>
						<h3 className="font-medium">Hacker House Sessions</h3>
						<p className="text-xs text-muted-foreground mt-1">
							Build nights, pair programming, office hours. Práctica semanal sin
							fricción.
						</p>
					</div>

					<div className="rounded-2xl border bg-background p-5">
						<div className="flex items-center gap-2 mb-3">
							<CalendarDays className="h-4 w-4 text-muted-foreground" />
							<Badge variant="outline" className="text-[10px]">
								Mensual
							</Badge>
						</div>
						<h3 className="font-medium">Meetups Técnicos</h3>
						<p className="text-xs text-muted-foreground mt-1">
							Workshops, demos, talks y networking en diferentes ciudades del
							país.
						</p>
					</div>

					<div className="rounded-2xl border border-emerald-500/30 bg-background p-5">
						<div className="flex items-center gap-2 mb-3">
							<Trophy className="h-4 w-4 text-emerald-500" />
							<Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
								Trimestral
							</Badge>
						</div>
						<h3 className="font-medium">Hackatones 72h</h3>
						<p className="text-xs text-muted-foreground mt-1">
							Construcción intensa, premios, mentoría. Activar proyectos reales
							y lanzar MVPs.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
