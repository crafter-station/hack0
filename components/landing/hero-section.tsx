import { Calendar, Globe, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { LumaIcon } from "@/components/icons/luma";
import { Badge } from "@/components/ui/badge";
import type { EventLocation } from "@/lib/actions/events";
import { getCountryFlag } from "@/lib/event-utils";
import { ISO_TO_MAP_ID } from "@/lib/geo/peru-departments";
import { LatamMap } from "./latam-map";

interface HeroSectionProps {
	stats: {
		totalEvents: number;
		totalPrizePool: number;
		activeEvents: number;
	};
	departmentsWithEvents?: string[];
	countriesWithEvents?: string[];
	eventLocations?: EventLocation[];
}

function formatPrizePool(amount: number): string {
	if (amount >= 1000000) {
		return `$${(amount / 1000000).toFixed(1)}M`;
	}
	if (amount >= 1000) {
		return `$${(amount / 1000).toFixed(0)}K`;
	}
	return `$${amount}`;
}

export function HeroSection({
	stats,
	departmentsWithEvents = [],
	countriesWithEvents = [],
	eventLocations = [],
}: HeroSectionProps) {
	return (
		<section className="border-b py-12 lg:py-16">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
					{/* Left side - Content */}
					<div className="text-center lg:text-left space-y-6">
						{stats.activeEvents > 0 && (
							<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
								</span>
								{stats.activeEvents} evento{stats.activeEvents > 1 ? "s" : ""}{" "}
								en vivo ahora
							</div>
						)}

						<div>
							<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
								Descubre eventos tech
								<br />
								<span className="text-muted-foreground">
									en toda Latinoamérica
								</span>
							</h1>
						</div>

						<p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
							La plataforma que conecta desarrolladores, diseñadores y builders
							con hackathones, conferencias y meetups tech. Encuentra tu próximo
							desafío o publica eventos de tu comunidad.
						</p>

						{/* Stats row */}
						{stats.totalEvents > 0 && (
							<div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6">
								<div className="flex items-center gap-2">
									<div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
										<Calendar className="h-4 w-4 text-blue-500" />
									</div>
									<div className="text-left">
										<div className="text-xl font-bold">{stats.totalEvents}</div>
										<div className="text-xs text-muted-foreground">eventos</div>
									</div>
								</div>

								{stats.totalPrizePool > 0 && (
									<div className="flex items-center gap-2">
										<div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
											<Trophy className="h-4 w-4 text-emerald-500" />
										</div>
										<div className="text-left">
											<div className="text-xl font-bold">
												{formatPrizePool(stats.totalPrizePool)}
											</div>
											<div className="text-xs text-muted-foreground">
												en premios
											</div>
										</div>
									</div>
								)}

								<div className="flex items-center gap-2">
									<div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
										<Globe className="h-4 w-4 text-violet-500" />
									</div>
									<div className="text-left">
										<div className="text-xl font-bold">
											{countriesWithEvents.length > 0
												? countriesWithEvents
														.map((c) => getCountryFlag(c))
														.join(" ")
												: getCountryFlag("PE")}
										</div>
										<div className="text-xs text-muted-foreground">
											{countriesWithEvents.length > 1
												? `${countriesWithEvents.length} países`
												: "1 país"}
										</div>
									</div>
								</div>
							</div>
						)}

						<div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 pt-2">
							<Link
								href="/events"
								className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90 shadow-sm"
							>
								<Calendar className="h-4 w-4" />
								Ver eventos disponibles
							</Link>
							<a
								href="https://lu.ma/hack0"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
							>
								<LumaIcon className="h-4 w-4" />
								Publicar evento gratis
							</a>
						</div>

						<div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-muted-foreground pt-2">
							<Badge
								variant="outline"
								className="border-dashed font-normal text-muted-foreground"
							>
								<TrendingUp className="h-3 w-3 mr-1" />
								Creciendo en LATAM
							</Badge>
							<span>·</span>
							<Link
								href="/roadmap#latam"
								className="underline underline-offset-4 hover:text-foreground transition-colors"
							>
								Ver países activos
							</Link>
						</div>
					</div>

					{/* Right side - Map */}
					<div className="hidden lg:block h-[550px] xl:h-[600px]">
						<LatamMap
							departmentsWithEvents={departmentsWithEvents}
							countriesWithEvents={countriesWithEvents
								.map((c) => ISO_TO_MAP_ID[c])
								.filter(Boolean)}
							eventLocations={eventLocations}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
