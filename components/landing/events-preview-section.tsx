import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { EventWithOrg } from "@/lib/actions/events";
import { Badge } from "@/components/ui/badge";
import {
	formatEventDateRange,
	getEventStatus,
	getFormatLabel,
} from "@/lib/event-utils";

interface EventsPreviewSectionProps {
	events: EventWithOrg[];
}

export function EventsPreviewSection({ events }: EventsPreviewSectionProps) {
	return (
		<section className="py-12 md:py-16 font-mono">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="flex items-center justify-between mb-6">
					<div>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Proximos eventos
						</p>
						<h2 className="text-xl font-semibold mt-1">
							No te pierdas nada
						</h2>
					</div>
					<Link
						href="/events"
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Ver todos
						<ArrowRight className="h-3.5 w-3.5" />
					</Link>
				</div>

				<div className="space-y-0 border rounded-xl overflow-hidden">
					{events.map((event) => {
						const status = getEventStatus(event);
						return (
							<Link
								key={event.id}
								href={
									event.organizationId
										? `/c/${event.organization?.slug}/events/${event.slug}`
										: `/${event.slug}`
								}
								className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
							>
								<div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
									{event.eventImageUrl ? (
										<Image
											src={event.eventImageUrl}
											alt={event.name}
											width={40}
											height={40}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
											{event.name.charAt(0)}
										</div>
									)}
								</div>

								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{event.name}</p>
									<p className="text-xs text-muted-foreground truncate">
										{event.organization?.displayName ||
											event.organization?.name ||
											"Organizador"}
									</p>
								</div>

								<div className="hidden md:block text-xs text-muted-foreground">
									{formatEventDateRange(event.startDate, event.endDate)}
								</div>

								<div className="hidden sm:block">
									<Badge variant="outline" className="text-[10px]">
										{getFormatLabel(event.format)}
									</Badge>
								</div>

								<Badge
									variant="outline"
									className={`text-[10px] ${
										status.status === "ongoing"
											? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
											: status.status === "open"
												? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
												: status.status === "upcoming"
													? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
													: "text-muted-foreground"
									}`}
								>
									{status.label}
								</Badge>
							</Link>
						);
					})}
				</div>

				<div className="mt-6 text-center">
					<Link
						href="/events"
						className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
					>
						Ver todos los eventos
						<ArrowRight className="h-3.5 w-3.5" />
					</Link>
				</div>
			</div>
		</section>
	);
}
