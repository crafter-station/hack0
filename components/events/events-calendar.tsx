"use client";

import {
	addMonths,
	differenceInDays,
	eachDayOfInterval,
	endOfMonth,
	format,
	getDay,
	isBefore,
	isSameDay,
	max,
	min,
	startOfDay,
	startOfMonth,
	subMonths,
} from "date-fns";
import {
	Calendar,
	ChevronLeft,
	ChevronRight,
	MapPin,
	Trophy,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EventWithOrg } from "@/lib/actions/events";
import {
	formatCalendarMonth,
	formatEventDateRange,
	getEventStatus,
	getFormatLabel,
} from "@/lib/event-utils";

const getMondayBasedDay = (date: Date) => {
	const day = getDay(date);
	return day === 0 ? 6 : day - 1;
};

const isWeekend = (date: Date) => {
	const day = getDay(date);
	return day === 0 || day === 6;
};

const isPastDay = (date: Date) => {
	return isBefore(startOfDay(date), startOfDay(new Date()));
};

interface EventsCalendarProps {
	events: EventWithOrg[];
	timeFilter?: "upcoming" | "all" | "past";
}

interface CalendarWeek {
	days: Date[];
	weekStart: Date;
	weekEnd: Date;
}

interface EventSpan {
	event: EventWithOrg;
	startCol: number;
	span: number;
	isStart: boolean;
	isEnd: boolean;
	lane: number;
}

function isEventPast(event: EventWithOrg): boolean {
	if (!event.endDate) return false;
	return new Date(event.endDate) < new Date();
}

export function EventsCalendar({
	events,
	timeFilter = "upcoming",
}: EventsCalendarProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date());

	const eventsWithDates = useMemo(() => {
		const withDates = events.filter((event) => event.startDate);
		if (timeFilter === "upcoming") {
			return withDates.filter((e) => !isEventPast(e));
		}
		if (timeFilter === "past") {
			return withDates.filter((e) => isEventPast(e));
		}
		return withDates;
	}, [events, timeFilter]);

	const { weeks } = useMemo(() => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(currentMonth);
		const calendarDays = eachDayOfInterval({
			start: monthStart,
			end: monthEnd,
		});

		const startPadding = getMondayBasedDay(monthStart);
		const endPadding = 6 - getMondayBasedDay(monthEnd);

		const allDays: Date[] = [];

		for (let i = startPadding - 1; i >= 0; i--) {
			const date = new Date(monthStart);
			date.setDate(date.getDate() - (i + 1));
			allDays.push(date);
		}

		for (const date of calendarDays) {
			allDays.push(date);
		}

		for (let i = 1; i <= endPadding; i++) {
			const date = new Date(monthEnd);
			date.setDate(date.getDate() + i);
			allDays.push(date);
		}

		const weeks: CalendarWeek[] = [];
		for (let i = 0; i < allDays.length; i += 7) {
			const weekDays = allDays.slice(i, i + 7);
			weeks.push({
				days: weekDays,
				weekStart: weekDays[0],
				weekEnd: weekDays[6],
			});
		}

		return { weeks, allDays };
	}, [currentMonth]);

	const isMultiDayEvent = (event: EventWithOrg) => {
		if (!event.startDate || !event.endDate) return false;
		return !isSameDay(new Date(event.startDate), new Date(event.endDate));
	};

	const getEventSpansForWeek = (week: CalendarWeek): EventSpan[] => {
		const spans: EventSpan[] = [];

		eventsWithDates.forEach((event) => {
			if (!event.startDate) return;

			const eventStart = startOfDay(new Date(event.startDate));
			const eventEnd = event.endDate
				? startOfDay(new Date(event.endDate))
				: eventStart;

			if (!isMultiDayEvent(event)) return;

			const weekStart = startOfDay(week.weekStart);
			const weekEnd = startOfDay(week.weekEnd);

			if (isBefore(eventEnd, weekStart) || isBefore(weekEnd, eventStart)) {
				return;
			}

			const visibleStart = max([eventStart, weekStart]);
			const visibleEnd = min([eventEnd, weekEnd]);

			const startCol = differenceInDays(visibleStart, weekStart);
			const span = differenceInDays(visibleEnd, visibleStart) + 1;

			spans.push({
				event,
				startCol,
				span,
				isStart: isSameDay(visibleStart, eventStart),
				isEnd: isSameDay(visibleEnd, eventEnd),
				lane: 0,
			});
		});

		spans.sort((a, b) => {
			if (a.startCol !== b.startCol) return a.startCol - b.startCol;
			return b.span - a.span;
		});

		const lanes: number[][] = [];
		spans.forEach((span) => {
			let assignedLane = 0;
			for (let i = 0; i < lanes.length; i++) {
				const laneOccupied = lanes[i].some(
					(col) => col >= span.startCol && col < span.startCol + span.span,
				);
				if (!laneOccupied) {
					assignedLane = i;
					break;
				}
				assignedLane = i + 1;
			}

			if (!lanes[assignedLane]) lanes[assignedLane] = [];
			for (let col = span.startCol; col < span.startCol + span.span; col++) {
				lanes[assignedLane].push(col);
			}
			span.lane = assignedLane;
		});

		return spans;
	};

	const getSingleDayEventsForDay = (date: Date) => {
		return eventsWithDates.filter((event) => {
			if (!event.startDate) return false;
			const eventStart = startOfDay(new Date(event.startDate));
			if (!isSameDay(eventStart, startOfDay(date))) return false;
			return !isMultiDayEvent(event);
		});
	};

	const navigateMonth = (direction: "prev" | "next") => {
		setCurrentMonth((prev) =>
			direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1),
		);
	};

	const getStatusStyles = (event: EventWithOrg) => {
		const { status } = getEventStatus(event);
		switch (status) {
			case "ongoing":
				return {
					bg: "bg-emerald-500/20",
					border: "border-l-emerald-500",
					text: "text-emerald-700 dark:text-emerald-400",
					bar: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
				};
			case "open":
				return {
					bg: "bg-blue-500/20",
					border: "border-l-blue-500",
					text: "text-blue-700 dark:text-blue-400",
					bar: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
				};
			case "upcoming":
				return {
					bg: "bg-amber-500/20",
					border: "border-l-amber-500",
					text: "text-amber-700 dark:text-amber-400",
					bar: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
				};
			default:
				return {
					bg: "bg-muted",
					border: "border-l-muted-foreground/50",
					text: "text-muted-foreground",
					bar: "bg-muted text-muted-foreground",
				};
		}
	};

	const monthStart = startOfMonth(currentMonth);

	const [tooltip, setTooltip] = useState<{
		event: EventWithOrg;
		x: number;
		y: number;
	} | null>(null);
	const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const showTooltip = useCallback(
		(event: EventWithOrg, e: React.MouseEvent) => {
			if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
			tooltipTimeoutRef.current = setTimeout(() => {
				setTooltip({ event, x: e.clientX, y: e.clientY });
			}, 200);
		},
		[],
	);

	const hideTooltip = useCallback(() => {
		if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
		tooltipTimeoutRef.current = setTimeout(() => {
			setTooltip(null);
		}, 100);
	}, []);

	const updateTooltipPosition = useCallback(
		(e: React.MouseEvent) => {
			if (tooltip) {
				setTooltip((prev) =>
					prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
				);
			}
		},
		[tooltip],
	);

	const EventTooltipContent = ({ event }: { event: EventWithOrg }) => {
		const { status, label } = getEventStatus(event);
		return (
			<div className="flex h-32 w-64 bg-popover text-popover-foreground rounded-md border shadow-md overflow-hidden">
				<div className="w-32 h-32 shrink-0 bg-muted">
					{event.eventImageUrl ? (
						<img
							src={event.eventImageUrl}
							alt={event.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
							<Calendar className="w-8 h-8 text-muted-foreground/50" />
						</div>
					)}
				</div>
				<div className="w-32 h-32 p-2.5 flex flex-col justify-between overflow-hidden">
					<div className="space-y-0.5">
						<h4 className="font-medium text-xs line-clamp-2 leading-tight">
							{event.name}
						</h4>
						<span
							className={`text-[10px] ${status === "ongoing" ? "text-emerald-600" : status === "open" ? "text-blue-600" : "text-muted-foreground"}`}
						>
							{label}
						</span>
					</div>
					<div className="space-y-0.5 text-[10px] text-muted-foreground">
						<div className="flex items-center gap-1">
							<Calendar className="w-2.5 h-2.5 shrink-0" />
							<span className="truncate">
								{formatEventDateRange(event.startDate, event.endDate)}
							</span>
						</div>
						{event.city && (
							<div className="flex items-center gap-1">
								<MapPin className="w-2.5 h-2.5 shrink-0" />
								<span className="truncate">{event.city}</span>
							</div>
						)}
						{event.prizePool ? (
							<div className="flex items-center gap-1 text-emerald-600">
								<Trophy className="w-2.5 h-2.5 shrink-0" />$
								{event.prizePool.toLocaleString()}
							</div>
						) : (
							event.format && (
								<div className="truncate">{getFormatLabel(event.format)}</div>
							)
						)}
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-4">
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

			<Card className="py-0 overflow-hidden">
				<CardContent className="p-0">
					<div className="grid grid-cols-7 border-b">
						{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
							(day, index) => (
								<div
									key={day}
									className={`p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0 ${index >= 5 ? "bg-muted/50" : ""}`}
								>
									{day}
								</div>
							),
						)}
					</div>

					{weeks.map((week, weekIndex) => {
						const eventSpans = getEventSpansForWeek(week);
						const maxLanes =
							eventSpans.length > 0
								? Math.max(...eventSpans.map((s) => s.lane)) + 1
								: 0;
						const isLastWeek = weekIndex === weeks.length - 1;

						return (
							<div key={weekIndex} className="relative">
								{maxLanes > 0 && (
									<div
										className="grid grid-cols-7 border-b"
										style={{ minHeight: `${maxLanes * 24}px` }}
									>
										{week.days.map((date, dayIndex) => {
											const isWeekendDay = isWeekend(date);
											const isCurrentMonth = isSameDay(
												startOfMonth(date),
												monthStart,
											);
											return (
												<div
													key={dayIndex}
													className={`border-r last:border-r-0 ${isCurrentMonth ? (isWeekendDay ? "bg-muted/50" : "bg-background") : "bg-muted/30"}`}
												/>
											);
										})}

										{eventSpans.map((span, spanIndex) => {
											const styles = getStatusStyles(span.event);
											const isPast = isPastDay(new Date(span.event.startDate!));
											return (
												<div
													key={`${span.event.id}-${spanIndex}`}
													className={`
														absolute cursor-pointer text-xs font-medium px-1.5 py-0.5 truncate
														${styles.bar}
														rounded-l-sm border-l-2 ${styles.border}
														${span.isEnd ? "rounded-r-sm" : ""}
														${isPast ? "opacity-50" : ""}
													`}
													style={{
														left: `calc(${(span.startCol / 7) * 100}% + 2px)`,
														width: `calc(${(span.span / 7) * 100}% - 4px)`,
														top: `${span.lane * 24 + 2}px`,
														height: "20px",
													}}
													onClick={() =>
														span.event.shortCode &&
														window.open(`/e/${span.event.shortCode}`, "_blank")
													}
													onMouseEnter={(e) => showTooltip(span.event, e)}
													onMouseLeave={hideTooltip}
													onMouseMove={updateTooltipPosition}
												>
													{span.event.name}
												</div>
											);
										})}
									</div>
								)}

								<div className="grid grid-cols-7">
									{week.days.map((date, dayIndex) => {
										const isToday = isSameDay(date, new Date());
										const isWeekendDay = isWeekend(date);
										const isPast = isPastDay(date);
										const isCurrentMonth = isSameDay(
											startOfMonth(date),
											monthStart,
										);
										const singleDayEvents = getSingleDayEventsForDay(date);

										return (
											<div
												key={dayIndex}
												className={`
													min-h-[80px] p-2 border-r last:border-r-0
													${!isLastWeek ? "border-b" : ""}
													${isCurrentMonth ? (isWeekendDay ? "bg-muted/50" : "bg-background") : "bg-muted/30"}
												`}
											>
												<div className="space-y-1">
													<div className="flex items-center">
														<span
															className={`
																text-sm font-medium inline-flex items-center justify-center
																${isToday ? "bg-destructive text-destructive-foreground w-6 h-6 rounded-md" : ""}
																${!isToday && isCurrentMonth ? "text-foreground" : ""}
																${!isToday && !isCurrentMonth ? "text-muted-foreground" : ""}
															`}
														>
															{format(date, "d")}
														</span>
													</div>

													<div className="space-y-0.5">
														{singleDayEvents.slice(0, 2).map((event) => {
															const styles = getStatusStyles(event);
															return (
																<div
																	key={event.id}
																	className={`
																		cursor-pointer rounded-sm border-l-2 px-1 py-0.5 transition-opacity
																		${styles.bg} ${styles.border} ${styles.text}
																		${isPast ? "opacity-50" : ""}
																	`}
																	onClick={() =>
																		event.shortCode &&
																		window.open(
																			`/e/${event.shortCode}`,
																			"_blank",
																		)
																	}
																	onMouseEnter={(e) => showTooltip(event, e)}
																	onMouseLeave={hideTooltip}
																	onMouseMove={updateTooltipPosition}
																>
																	<span className="text-[10px] truncate block font-medium">
																		{event.name}
																	</span>
																</div>
															);
														})}

														{singleDayEvents.length > 2 && (
															<div
																className={`text-[10px] text-muted-foreground ${isPast ? "opacity-50" : ""}`}
															>
																+{singleDayEvents.length - 2} más
															</div>
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</CardContent>
			</Card>

			{tooltip &&
				typeof document !== "undefined" &&
				createPortal(
					<div
						className="fixed z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
						style={{
							left: tooltip.x + 12,
							top: tooltip.y + 12,
						}}
					>
						<EventTooltipContent event={tooltip.event} />
					</div>,
					document.body,
				)}
		</div>
	);
}
