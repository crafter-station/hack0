"use client";

import {
	Calendar,
	Check,
	ExternalLink,
	MapPin,
	Pencil,
	Trophy,
	X,
} from "lucide-react";
import type { Event } from "@/lib/db/schema";
import {
	formatEventDateRange,
	getCountryFlag,
	getCountryName,
	getEventTypeLabel,
} from "@/lib/event-utils";

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
	websearch: "bg-teal-500/10 text-teal-600",
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

function formatPrize(amount: number | null, currency: string | null) {
	if (!amount || amount === 0) return null;
	const symbol = currency === "PEN" ? "S/" : "$";
	return `${symbol}${amount.toLocaleString()}`;
}

const MISSING_FIELDS: { key: keyof Event; label: string }[] = [
	{ key: "name", label: "nombre" },
	{ key: "startDate", label: "fecha inicio" },
	{ key: "endDate", label: "fecha fin" },
	{ key: "country", label: "país" },
	{ key: "city", label: "ciudad" },
	{ key: "eventType", label: "tipo" },
	{ key: "format", label: "formato" },
	{ key: "description", label: "desc" },
	{ key: "eventImageUrl", label: "imagen" },
	{ key: "websiteUrl", label: "URL" },
	{ key: "prizePool", label: "premio" },
];

function getMissingFields(event: Event): string[] {
	return MISSING_FIELDS.filter((f) => {
		const val = event[f.key];
		return val === null || val === undefined || val === "" || val === 0;
	}).map((f) => f.label);
}

interface PendingEventCardProps {
	event: Event;
	selected: boolean;
	onSelect: (id: string, checked: boolean) => void;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
	onEdit: (event: Event) => void;
	loading: string | null;
}

export function PendingEventCard({
	event,
	selected,
	onSelect,
	onApprove,
	onReject,
	onEdit,
	loading,
}: PendingEventCardProps) {
	const source = event.scrapeSource ?? "social";
	const sourceColor = SOURCE_COLORS[source] ?? "bg-gray-500/10 text-gray-600";
	const isLoading = loading === event.id;
	const prize = formatPrize(event.prizePool, event.prizeCurrency);
	const missing = getMissingFields(event);

	return (
		<div
			className={`group relative flex flex-col rounded-lg border bg-card overflow-hidden transition-all duration-150 hover:border-foreground/20 hover:shadow-sm ${selected ? "border-foreground/30 ring-1 ring-foreground/10" : ""}`}
		>
			{/* Image area - aspect-square like EventCard */}
			<div className="relative aspect-square w-full overflow-hidden">
				{event.eventImageUrl ? (
					<img
						src={event.eventImageUrl}
						alt={event.name}
						className="h-full w-full object-cover transition-transform group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted/80 to-muted">
						<Calendar className="h-8 w-8 text-muted-foreground/40" />
						<span className="text-xs text-muted-foreground/60 px-4 text-center line-clamp-1">
							{event.name}
						</span>
					</div>
				)}

				{/* Top-left: Checkbox + source badge */}
				<div className="absolute top-2 left-2 flex items-center gap-1.5">
					<label className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-background/80 backdrop-blur-sm border border-border/60">
						<input
							type="checkbox"
							checked={selected}
							onChange={(e) => onSelect(event.id, e.target.checked)}
							className="sr-only"
						/>
						{selected && <Check className="h-3 w-3" />}
					</label>
					<span
						className={`rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${sourceColor} bg-background/70`}
					>
						{source}
					</span>
				</div>

				{/* Top-right: Confidence */}
				<div className="absolute top-2 right-2 backdrop-blur-sm rounded-full">
					<ConfidenceDot score={event.scrapeConfidence ?? null} />
				</div>
			</div>

			{/* Content - matches EventCard layout */}
			<div className="flex flex-1 flex-col p-3 border-t space-y-2">
				<div>
					<h3 className="font-medium text-sm line-clamp-2">{event.name}</h3>
					<span className="text-xs text-muted-foreground">
						{getEventTypeLabel(event.eventType)}
					</span>
				</div>

				<div className="text-xs text-muted-foreground">
					{formatEventDateRange(
						event.startDate,
						event.endDate,
						event.timezone || undefined,
					)}
				</div>

				<div className="flex items-center justify-between gap-2 text-xs">
					<div className="flex items-center gap-2 text-muted-foreground truncate">
						{event.country && (
							<span className="flex items-center gap-0.5 shrink-0">
								{getCountryFlag(event.country)}{" "}
								{event.city || getCountryName(event.country)}
							</span>
						)}
						{!event.country && event.city && (
							<span className="flex items-center gap-0.5">
								<MapPin className="h-3 w-3" />
								{event.city}
							</span>
						)}
					</div>
					{prize && (
						<span className="flex items-center gap-1 text-emerald-500 font-medium">
							<Trophy className="h-3 w-3" />
							{prize}
						</span>
					)}
				</div>

				{/* Missing data indicators */}
				{missing.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{(missing.length <= 3 ? missing : missing.slice(0, 3)).map(
							(label) => (
								<span
									key={label}
									className="border border-dashed border-amber-500/40 text-amber-600 bg-amber-500/5 text-[10px] px-1.5 py-0.5 rounded-full"
								>
									{label}
								</span>
							),
						)}
						{missing.length > 3 && (
							<span className="border border-dashed border-amber-500/40 text-amber-600 bg-amber-500/5 text-[10px] px-1.5 py-0.5 rounded-full">
								+{missing.length - 3} más
							</span>
						)}
					</div>
				)}
			</div>

			{/* Action bar */}
			<div className="flex items-center justify-between px-3 py-2 border-t border-border/50">
				{event.websiteUrl ? (
					<a
						href={event.websiteUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						<ExternalLink className="h-3 w-3" />
						Ver
					</a>
				) : (
					<span />
				)}
				<div className="flex items-center gap-1">
					{event.approvalStatus === "pending" ? (
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
					) : (
						<span
							className={`rounded-full px-2 py-0.5 text-xs font-medium ${event.approvalStatus === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
						>
							{event.approvalStatus === "approved" ? "Aprobado" : "Rechazado"}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
