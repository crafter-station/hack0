import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SubscribeForm } from "@/components/subscribe-form";

interface HeroSectionProps {
	stats: {
		totalEvents: number;
		totalPrizePool: number;
		activeEvents: number;
	};
}

export function HeroSection({ stats }: HeroSectionProps) {
	const formatPrize = (amount: number) => {
		if (amount >= 1000) {
			return `$${Math.round(amount / 1000)}K+`;
		}
		return `$${amount}`;
	};

	return (
		<section className="border-b">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-12 md:py-16">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
					<div className="space-y-4 max-w-xl">
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Ecosistema builder
						</p>
						<h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
							Activamos builders
							<br />
							<span className="text-muted-foreground">en Peru</span>
						</h1>
						<p className="text-sm text-muted-foreground">
							Hackathones, conferencias, workshops y mas. Centralizado para que
							no te pierdas nada.
						</p>
						<div className="flex items-center gap-3 pt-2">
							<SubscribeForm />
							<Link
								href="/events"
								className="inline-flex h-8 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
							>
								Ver eventos
								<ArrowRight className="h-3 w-3" />
							</Link>
						</div>
					</div>

					<div className="flex items-center gap-8">
						<div className="text-center md:text-right">
							<p className="text-3xl font-semibold tabular-nums">
								{stats.totalEvents}
							</p>
							<p className="text-[10px] text-muted-foreground uppercase tracking-wider">
								eventos
							</p>
						</div>
						<div className="text-center md:text-right">
							<p className="text-3xl font-semibold tabular-nums">
								{formatPrize(stats.totalPrizePool)}
							</p>
							<p className="text-[10px] text-muted-foreground uppercase tracking-wider">
								en premios
							</p>
						</div>
						{stats.activeEvents > 0 && (
							<div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
								</span>
								{stats.activeEvents} activos
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
