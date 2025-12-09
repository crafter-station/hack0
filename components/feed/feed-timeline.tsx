"use client";

import { useMemo } from "react";
import type { FeedEvent } from "@/lib/actions/feed";
import { FeedEventCard } from "./feed-event-card";

interface FeedTimelineProps {
	events: FeedEvent[];
}

interface GroupedEvents {
	date: Date;
	label: string;
	dayLabel: string;
	events: FeedEvent[];
	isToday: boolean;
	isTomorrow: boolean;
}

function groupEventsByDate(events: FeedEvent[]): GroupedEvents[] {
	const groups = new Map<string, FeedEvent[]>();
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	// Group events by start date
	for (const event of events) {
		if (!event.startDate) continue;

		const eventDate = new Date(event.startDate);
		eventDate.setHours(0, 0, 0, 0);
		const key = eventDate.toISOString();

		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key)!.push(event);
	}

	// Convert to array and add labels
	const result: GroupedEvents[] = [];
	const monthNames = [
		"Ene", "Feb", "Mar", "Abr", "May", "Jun",
		"Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
	];
	const dayNames = [
		"Domingo", "Lunes", "Martes", "Miércoles",
		"Jueves", "Viernes", "Sábado"
	];

	for (const [key, events] of groups) {
		const date = new Date(key);
		const isToday = date.getTime() === today.getTime();
		const isTomorrow = date.getTime() === tomorrow.getTime();

		let label: string;
		if (isToday) {
			label = "Hoy";
		} else if (isTomorrow) {
			label = "Mañana";
		} else {
			const month = monthNames[date.getMonth()];
			const day = date.getDate();
			label = `${month} ${day}`;
		}

		result.push({
			date,
			label,
			dayLabel: dayNames[date.getDay()],
			events,
			isToday,
			isTomorrow,
		});
	}

	// Sort by date
	result.sort((a, b) => a.date.getTime() - b.date.getTime());

	return result;
}

export function FeedTimeline({ events }: FeedTimelineProps) {
	const groups = useMemo(() => groupEventsByDate(events), [events]);

	if (groups.length === 0) {
		return null;
	}

	return (
		<div className="space-y-6">
			{groups.map((group) => (
				<div key={group.date.toISOString()} className="relative">
					{/* Timeline dot and line */}
					<div className="absolute left-0 top-1.5 bottom-0 flex flex-col items-center">
						<div className={`
							h-2 w-2 rounded-full border-2 border-background shrink-0
							${group.isToday || group.isTomorrow ? "bg-emerald-500" : "bg-muted-foreground/40"}
						`} />
						<div className="w-px flex-1 bg-border mt-1.5" />
					</div>

					{/* Date header */}
					<div className="pl-5 mb-3">
						<div className="flex items-baseline gap-2">
							<h2 className={`
								text-base font-semibold
								${group.isToday || group.isTomorrow ? "text-foreground" : "text-foreground"}
							`}>
								{group.label}
							</h2>
							<span className="text-xs text-muted-foreground">
								{group.dayLabel}
							</span>
						</div>
					</div>

					{/* Events for this date */}
					<div className="pl-5 space-y-2">
						{group.events.map((event) => (
							<FeedEventCard key={event.id} event={event} />
						))}
					</div>
				</div>
			))}
		</div>
	);
}
