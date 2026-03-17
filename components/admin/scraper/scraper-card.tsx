"use client";

import { Check, ExternalLink, Pencil, Trophy, X } from "lucide-react";
import type { Event } from "@/lib/db/schema";
import { getEventTypeLabel } from "@/lib/event-utils";

function countryFlag(iso: string): string {
	if (!iso || iso.length !== 2) return "🌎";
	return iso
		.toUpperCase()
		.split("")
		.map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
		.join("");
}

const SOURCE_COLORS: Record<string, string> = {
	devpost: "bg-red-500/10 text-red-600",
	meetup: "bg-purple-500/10 text-purple-600",
	eventbrite: "bg-orange-500/10 text-orange-600",
	mlh: "bg-blue-500/10 text-blue-600",
	linkedin: "bg-sky-500/10 text-sky-600",
	perplexity: "bg-green-500/10 text-green-600",
	exa: "bg-indigo-500/10 text-indigo-600",
	haiku: "bg-amber-500/10 text-amber-600",
	universities: "bg-cyan-500/10 text-cyan-600",
	social: "bg-gray-500/10 text-gray-600",
	hackathon_com: "bg-violet-500/10 text-violet-600",
};

const SOURCE_GRADIENT: Record<string, string> = {
	devpost: "from-red-950/40 to-red-900/20",
	meetup: "from-purple-950/40 to-purple-900/20",
	eventbrite: "from-orange-950/40 to-orange-900/20",
	mlh: "from-blue-950/40 to-blue-900/20",
	linkedin: "from-sky-950/40 to-sky-900/20",
	perplexity: "from-green-950/40 to-green-900/20",
	exa: "from-indigo-950/40 to-indigo-900/20",
	haiku: "from-amber-950/40 to-amber-900/20",
	universities: "from-cyan-950/40 to-cyan-900/20",
	social: "from-gray-950/40 to-gray-900/20",
	hackathon_com: "from-violet-950/40 to-violet-900/20",
};

function ConfidenceDot({ score }: { score: number | null }) {
	if (score === null) return null;
	const color =
		score >= 70
			? "bg-emerald-500"
			: score >= 40
				? "bg-amber-500"
				: "bg-red-500";
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${score >= 70 ? "bg-emerald-500/10 text-emerald-600" : score >= 40 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"}`}
		>
			<span className={`h-1.5 w-1.5 rounded-full ${color}`} />
			{score}%
		</span>
	);
}

interface ScraperCardProps {
	event: Event;
	selected: boolean;
	onSelect: (id: string, checked: boolean) => void;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
	onEdit: (event: Event) => void;
	loading: string | null;
}

export function ScraperCard({
	event,
	selected,
	onSelect,
	onApprove,
	onReject,
	onEdit,
	loading,
}: ScraperCardProps) {
	const source = event.scrapeSource ?? "social";
	const sourceColor = SOURCE_COLORS[source] ?? "bg-gray-500/10 text-gray-600";
	const gradient = SOURCE_GRADIENT[source] ?? "from-gray-950/40 to-gray-900/20";
	const isLoading = loading === event.id;

	const domains = (event.domains ?? []).slice(0, 3);

	const formattedDate = event.startDate
		? new Date(event.startDate).toLocaleDateString("es-PE", {
				day: "numeric",
				month: "short",
				year: "numeric",
			})
		: null;

	return (
		<div
			className={`group relative flex flex-col rounded-lg border bg-card overflow-hidden transition-all duration-150 hover:border-foreground/20 hover:shadow-sm ${selected ? "border-foreground/30 ring-1 ring-foreground/10" : ""}`}
		>
			{/* Banner image / gradient */}
			<div className="relative aspect-video w-full overflow-hidden bg-muted">
				{event.eventImageUrl ? (
					<img
						src={event.eventImageUrl}
						alt={event.name}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
				)}
				{/* Overlay badges */}
				<div className="absolute inset-0 flex items-start justify-between p-2">
					<div className="flex items-center gap-1.5">
						{/* Checkbox */}
						<label className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-background/80 backdrop-blur-sm border border-border/60">
							<input
								type="checkbox"
								checked={selected}
								onChange={(e) => onSelect(event.id, e.target.checked)}
								className="sr-only"
							/>
							{selected && <Check className="h-3 w-3" />}
						</label>
						{/* Source badge */}
						<span
							className={`rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${sourceColor} bg-background/70`}
						>
							{source}
						</span>
					</div>
					{/* Confidence */}
					<div className="backdrop-blur-sm rounded-full">
						<ConfidenceDot score={event.scrapeConfidence ?? null} />
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex flex-1 flex-col gap-2 p-3">
				{/* Name + type */}
				<div className="flex items-start gap-2">
					<h3 className="flex-1 text-sm font-medium leading-snug line-clamp-2">
						{event.name}
					</h3>
					<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
						{getEventTypeLabel(event.eventType)}
					</span>
				</div>

				{/* Meta */}
				<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
					{formattedDate && <span>{formattedDate}</span>}
					{event.country && (
						<span>
							{countryFlag(event.country)} {event.country}
							{event.city ? ` · ${event.city}` : ""}
						</span>
					)}
					{event.format && <span className="capitalize">{event.format}</span>}
				</div>

				{/* Prize */}
				{event.prizePool && (
					<div className="flex items-center gap-1 text-xs text-emerald-600">
						<Trophy className="h-3 w-3" />
						<span>
							{event.prizeCurrency === "PEN" ? "S/ " : "$ "}
							{Number(event.prizePool).toLocaleString()}
						</span>
					</div>
				)}

				{/* Domains */}
				{domains.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{domains.map((d) => (
							<span
								key={d}
								className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
							>
								{d}
							</span>
						))}
						{(event.domains ?? []).length > 3 && (
							<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								+{(event.domains ?? []).length - 3}
							</span>
						)}
					</div>
				)}

				{/* Actions */}
				<div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50">
					{event.websiteUrl && (
						<a
							href={event.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							<ExternalLink className="h-3 w-3" />
							Ver
						</a>
					)}
					<div className="ml-auto flex items-center gap-1">
						{event.approvalStatus === "pending" && (
							<>
								<button
									onClick={() => onEdit(event)}
									disabled={isLoading}
									title="Editar"
									className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
								>
									<Pencil className="h-3.5 w-3.5" />
								</button>
								<button
									onClick={() => onReject(event.id)}
									disabled={isLoading}
									title="Rechazar"
									className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-500/30 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
								>
									<X className="h-3.5 w-3.5" />
								</button>
								<button
									onClick={() => onApprove(event.id)}
									disabled={isLoading}
									title="Aprobar"
									className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/30 text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
								>
									<Check className="h-3.5 w-3.5" />
								</button>
							</>
						)}
						{event.approvalStatus !== "pending" && (
							<span
								className={`rounded-full px-2 py-0.5 text-xs font-medium ${event.approvalStatus === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
							>
								{event.approvalStatus === "approved" ? "Aprobado" : "Rechazado"}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
