"use client";

import { Calendar, Check, ExternalLink, MapPin, X } from "lucide-react";
import { useState } from "react";
import { approveEvent, rejectEvent } from "@/lib/actions/events";
import type { Event } from "@/lib/db/schema";
import {
	formatEventDate,
	getEventTypeLabel,
	getFormatLabel,
} from "@/lib/event-utils";

interface PendingEventsListProps {
	events: Event[];
}

type FilterType = "all" | "pending" | "approved" | "rejected";

export function PendingEventsList({
	events: initialEvents,
}: PendingEventsListProps) {
	const [events, setEvents] = useState(initialEvents);
	const [filter, setFilter] = useState<FilterType>("pending");
	const [loading, setLoading] = useState<string | null>(null);

	const handleApprove = async (eventId: string) => {
		setLoading(eventId);
		const result = await approveEvent(eventId);
		if (result.success) {
			setEvents(
				events.map((e) =>
					e.id === eventId
						? { ...e, isApproved: true, approvalStatus: "approved" as const }
						: e,
				),
			);
		}
		setLoading(null);
	};

	const handleReject = async (eventId: string) => {
		if (!confirm("¿Estás seguro de rechazar este evento?")) {
			return;
		}
		setLoading(eventId);
		const result = await rejectEvent(eventId);
		if (result.success) {
			setEvents(
				events.map((e) =>
					e.id === eventId
						? { ...e, isApproved: false, approvalStatus: "rejected" as const }
						: e,
				),
			);
		}
		setLoading(null);
	};

	const filteredEvents = events.filter((event) => {
		if (filter === "all") return true;
		return event.approvalStatus === filter;
	});

	const pendingCount = events.filter(
		(e) => e.approvalStatus === "pending",
	).length;

	return (
		<div className="rounded-lg border">
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<Calendar className="h-4 w-4 text-muted-foreground" />
					<h2 className="font-medium">Eventos Enviados</h2>
					{pendingCount > 0 && (
						<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-xs font-medium text-amber-500">
							{pendingCount}
						</span>
					)}
				</div>

				{/* Filter tabs */}
				<div className="flex gap-1 rounded-lg bg-muted p-1">
					{(["pending", "approved", "rejected", "all"] as const).map((f) => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
								filter === f
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{f === "pending"
								? "Pendientes"
								: f === "approved"
									? "Aprobados"
									: f === "rejected"
										? "Rechazados"
										: "Todos"}
						</button>
					))}
				</div>
			</div>

			{/* List */}
			<div className="divide-y">
				{filteredEvents.length === 0 ? (
					<div className="px-4 py-8 text-center text-sm text-muted-foreground">
						No hay eventos{" "}
						{filter === "pending"
							? "pendientes"
							: filter === "approved"
								? "aprobados"
								: filter === "rejected"
									? "rechazados"
									: ""}
					</div>
				) : (
					filteredEvents.map((event) => (
						<div key={event.id} className="p-4">
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<h3 className="font-medium truncate">{event.name}</h3>
										<span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
											{getEventTypeLabel(event.eventType)}
										</span>
									</div>

									<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
										{event.startDate && (
											<span className="flex items-center gap-1">
												<Calendar className="h-3.5 w-3.5" />
												{formatEventDate(new Date(event.startDate))}
											</span>
										)}
										<span className="flex items-center gap-1">
											<MapPin className="h-3.5 w-3.5" />
											{getFormatLabel(event.format, event.department)}{" "}
											{event.city && `· ${event.city}`}
										</span>
									</div>

									{event.description && (
										<p className="text-sm text-muted-foreground line-clamp-2 mb-2">
											{event.description}
										</p>
									)}

									<div className="flex items-center gap-2">
										<a
											href={event.websiteUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-blue-500 hover:underline flex items-center gap-1"
										>
											<ExternalLink className="h-3 w-3" />
											{event.websiteUrl}
										</a>
									</div>
								</div>

								<div className="flex items-center gap-2 flex-shrink-0">
									{/* Status badge */}
									<span
										className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
											event.approvalStatus === "pending"
												? "bg-amber-500/10 text-amber-500"
												: event.approvalStatus === "approved"
													? "bg-emerald-500/10 text-emerald-500"
													: "bg-red-500/10 text-red-500"
										}`}
									>
										{event.approvalStatus === "pending"
											? "Pendiente"
											: event.approvalStatus === "approved"
												? "Aprobado"
												: "Rechazado"}
									</span>

									{event.approvalStatus === "pending" && (
										<>
											<button
												onClick={() => handleApprove(event.id)}
												disabled={loading === event.id}
												className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/30 text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
											>
												<Check className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleReject(event.id)}
												disabled={loading === event.id}
												className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-500/30 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
											>
												<X className="h-4 w-4" />
											</button>
										</>
									)}
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
