"use client";

import {
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	format,
	isSameDay,
	isSameMonth,
	startOfMonth,
	subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, Trophy } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Event } from "@/lib/db/schema";
import {
	formatCalendarMonth,
	formatEventDateKey,
	formatEventDateRange,
	getEventStatus,
	getFormatLabel,
} from "@/lib/event-utils";

interface EventsCalendarProps {
	events: Event[];
}

interface CalendarDay {
	date: Date;
	events: Event[];
	isCurrentMonth: boolean;
}

export function EventsCalendar({ events }: EventsCalendarProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date());

	// Filter events that have dates
	const eventsWithDates = events.filter((event) => event.startDate);

	const eventsByDate = new Map<string, Event[]>();
	eventsWithDates.forEach((event) => {
		const dateKey = formatEventDateKey(event.startDate);
		if (dateKey) {
			if (!eventsByDate.has(dateKey)) {
				eventsByDate.set(dateKey, []);
			}
			eventsByDate.get(dateKey)!.push(event);
		}
	});

	// Generate calendar days
	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

	// Add padding days from previous/next month
	const startPadding = monthStart.getDay();
	const endPadding = 6 - monthEnd.getDay();

	const allDays: CalendarDay[] = [];

	// Previous month padding
	for (let i = startPadding - 1; i >= 0; i--) {
		const date = new Date(monthStart);
		date.setDate(date.getDate() - (i + 1));
		allDays.push({
			date,
			events: [],
			isCurrentMonth: false,
		});
	}

	// Current month days
	calendarDays.forEach((date) => {
		const dateKey = format(date, "yyyy-MM-dd");
		allDays.push({
			date,
			events: eventsByDate.get(dateKey) || [],
			isCurrentMonth: true,
		});
	});

	// Next month padding
	for (let i = 1; i <= endPadding; i++) {
		const date = new Date(monthEnd);
		date.setDate(date.getDate() + i);
		allDays.push({
			date,
			events: [],
			isCurrentMonth: false,
		});
	}

	const navigateMonth = (direction: "prev" | "next") => {
		setCurrentMonth((prev) =>
			direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1),
		);
	};

	const getStatusColor = (event: Event) => {
		const status = getEventStatus(event);
		switch (status.type) {
			case "ongoing":
				return "bg-emerald-500";
			case "open":
				return "bg-blue-500";
			case "upcoming":
				return "bg-amber-500";
			default:
				return "bg-muted";
		}
	};

	return (
		<div className="space-y-6">
			{/* Calendar Header */}
			<div className="flex items-center justify-between">
				<Button
					variant="outline"
					size="sm"
					onClick={() => navigateMonth("prev")}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>

				<h2 className="text-xl font-semibold">
					{formatCalendarMonth(currentMonth)}
				</h2>

				<Button
					variant="outline"
					size="sm"
					onClick={() => navigateMonth("next")}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			{/* Calendar Grid */}
			<Card>
				<CardContent className="p-0">
					{/* Weekday headers */}
					<div className="grid grid-cols-7 border-b">
						{["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
							<div
								key={day}
								className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
							>
								{day}
							</div>
						))}
					</div>

					{/* Calendar days */}
					<div className="grid grid-cols-7">
						{allDays.map((day, index) => (
							<div
								key={index}
								className={`
									min-h-[100px] p-2 border-r border-b last:border-r-0
									${day.isCurrentMonth ? "bg-background" : "bg-muted/30"}
									${isSameDay(day.date, new Date()) ? "ring-2 ring-ring" : ""}
								`}
							>
								<div className="space-y-1">
									<div
										className={`
										text-sm font-medium
										${day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"}
										${isSameDay(day.date, new Date()) ? "text-ring" : ""}
									`}
									>
										{format(day.date, "d")}
									</div>

									{/* Events for this day */}
									<div className="space-y-1">
										{day.events.slice(0, 3).map((event) => (
											<div
												key={event.id}
												className="group cursor-pointer"
												onClick={() => window.open(`/${event.slug}`, "_blank")}
											>
												<div className="flex items-center gap-1">
													<div
														className={`w-1.5 h-1.5 rounded-full ${getStatusColor(event)}`}
													/>
													<span className="text-xs truncate hover:text-foreground transition-colors">
														{event.name}
													</span>
												</div>
											</div>
										))}

										{day.events.length > 3 && (
											<div className="text-xs text-muted-foreground">
												+{day.events.length - 3} más
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Events List */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">
					Eventos de {formatCalendarMonth(currentMonth, "MMMM")}
				</h3>

				{eventsWithDates.length === 0 ? (
					<Card>
						<CardContent className="p-6 text-center text-muted-foreground">
							No hay eventos programados para este mes.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{eventsWithDates
							.filter((event) =>
								isSameMonth(new Date(event.startDate!), currentMonth),
							)
							.map((event) => {
								const status = getEventStatus(event);
								return (
									<Card
										key={event.id}
										className="group cursor-pointer hover:shadow-md transition-shadow"
										onClick={() => window.open(`/${event.slug}`, "_blank")}
									>
										<CardContent className="p-4">
											<div className="space-y-3">
												{/* Header */}
												<div className="flex items-start justify-between gap-2">
													<h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
														{event.name}
													</h4>
													<Badge variant="secondary" className="shrink-0">
														{status.label}
													</Badge>
												</div>

												{/* Date */}
												<div className="text-sm text-muted-foreground">
													{formatEventDateRange(event.startDate, event.endDate)}
												</div>

												{/* Details */}
												<div className="flex items-center gap-4 text-xs text-muted-foreground">
													{event.format && (
														<span>{getFormatLabel(event.format)}</span>
													)}
													{event.prizePool && (
														<span className="flex items-center gap-1">
															<Trophy className="h-3 w-3" />$
															{event.prizePool.toLocaleString()}
														</span>
													)}
												</div>

												{/* Location */}
												{event.city && (
													<div className="flex items-center gap-1 text-xs text-muted-foreground">
														<MapPin className="h-3 w-3" />
														{event.city}
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								);
							})}
					</div>
				)}
			</div>
		</div>
	);
}
