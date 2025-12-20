import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { LatamMap } from "./latam-map";

interface HeroSectionProps {
	stats: {
		totalEvents: number;
		totalPrizePool: number;
		activeEvents: number;
	};
	departmentsWithEvents?: string[];
}

export function HeroSection({ stats, departmentsWithEvents = [] }: HeroSectionProps) {
	return (
		<section className="border-b">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">
					{/* Left side - Content */}
					<div className="text-center lg:text-left">
						{stats.activeEvents > 0 && (
							<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400 mb-6">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
								</span>
								{stats.activeEvents} evento{stats.activeEvents > 1 ? "s" : ""}{" "}
								en vivo
							</div>
						)}

						<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
							Mapeando el ecosistema
							<br />
							<span className="text-muted-foreground">tech de LATAM</span>
						</h1>

						<p className="text-muted-foreground mt-4 text-base max-w-lg mx-auto lg:mx-0">
							Damos visibilidad a comunidades y eventos tech. Hackathones,
							conferencias, workshops, meetups. Todo en un solo lugar.
						</p>

						<p className="text-sm text-muted-foreground mt-4">
							Empezando por{" "}
							<span className="text-foreground font-medium">Perú 🇵🇪</span> -{" "}
							<Link
								href="/roadmap#latam"
								className="underline underline-offset-4 hover:text-foreground transition-colors"
							>
								próximamente más países
							</Link>
						</p>

						<div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mt-6">
							<Link
								href="/events"
								className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
							>
								<Calendar className="h-4 w-4" />
								Explorar eventos
							</Link>
							<Link
								href="/onboarding"
								className="inline-flex h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Publicar mis eventos
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</div>

					{/* Right side - Map */}
					<div className="hidden lg:block h-[550px] xl:h-[600px]">
						<LatamMap departmentsWithEvents={departmentsWithEvents} />
					</div>
				</div>
			</div>
		</section>
	);
}
