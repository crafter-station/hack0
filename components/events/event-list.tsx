"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { EventFilters, EventWithOrg } from "@/lib/actions/events";
import { getCategoryById } from "@/lib/event-categories";
import {
	formatEventDateRange,
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
	getSkillLevelLabel,
} from "@/lib/event-utils";
import { LoadMoreButton } from "./load-more-button";

interface EventListProps {
	events: EventWithOrg[];
	total?: number;
	hasMore?: boolean;
	filters?: EventFilters;
}

type SortField = "name" | "date" | "format" | "prize" | "status";
type SortDirection = "asc" | "desc";

function getStatusColor(status: string) {
	switch (status) {
		case "ongoing":
			return "text-emerald-400";
		case "open":
			return "text-blue-400";
		case "upcoming":
			return "text-amber-400";
		default:
			return "text-muted-foreground";
	}
}

function formatPrize(amount: number | null, currency: string | null) {
	if (!amount || amount === 0) return "—";
	const symbol = currency === "PEN" ? "S/" : "$";
	return `${symbol}${amount.toLocaleString()}`;
}

export function EventList({
	events,
	total,
	hasMore = false,
	filters = {},
}: EventListProps) {
	const [sortField, setSortField] = useState<SortField>("date");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const categoryConfig = getCategoryById(filters.category || "all");
	const showPrize = categoryConfig?.showPrize ?? true;
	const showSkillLevel = categoryConfig?.showSkillLevel ?? false;

	const sortedEvents = useMemo(() => {
		const result = [...events];

		result.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "date": {
					const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
					const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
					comparison = dateA - dateB;
					break;
				}
				case "format":
					comparison = (a.format || "").localeCompare(b.format || "");
					break;
				case "prize":
					comparison = (a.prizePool || 0) - (b.prizePool || 0);
					break;
				case "status": {
					const statusOrder = { ongoing: 0, open: 1, upcoming: 2, ended: 3 };
					const statusA = getEventStatus(a).status;
					const statusB = getEventStatus(b).status;
					comparison = statusOrder[statusA] - statusOrder[statusB];
					break;
				}
			}
			return sortDirection === "asc" ? comparison : -comparison;
		});

		return result;
	}, [events, sortField, sortDirection]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field)
			return <ChevronDown className="h-2.5 w-2.5 opacity-30" />;
		return sortDirection === "asc" ? (
			<ChevronUp className="h-2.5 w-2.5" />
		) : (
			<ChevronDown className="h-2.5 w-2.5" />
		);
	};

	if (events.length === 0) {
		return (
			<div className="py-12 text-center text-xs text-muted-foreground">
				No se encontraron eventos
			</div>
		);
	}

	return (
		<div className="text-xs">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-b border-border text-left text-muted-foreground">
							<th className="pb-2 pr-4 font-medium">
								<button
									onClick={() => handleSort("name")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Evento <SortIcon field="name" />
								</button>
							</th>
							<th className="pb-2 pr-4 font-medium">
								<button
									onClick={() => handleSort("date")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Fecha <SortIcon field="date" />
								</button>
							</th>
							<th className="pb-2 pr-4 font-medium hidden md:table-cell">
								<button
									onClick={() => handleSort("format")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Formato <SortIcon field="format" />
								</button>
							</th>
							{showPrize && (
								<th className="pb-2 pr-4 font-medium text-right hidden sm:table-cell">
									<button
										onClick={() => handleSort("prize")}
										className="flex items-center gap-1 justify-end hover:text-foreground"
									>
										Premio <SortIcon field="prize" />
									</button>
								</th>
							)}
							{showSkillLevel && (
								<th className="pb-2 pr-4 font-medium hidden sm:table-cell">
									Nivel
								</th>
							)}
							<th className="pb-2 font-medium text-right">
								<button
									onClick={() => handleSort("status")}
									className="flex items-center gap-1 justify-end hover:text-foreground"
								>
									Estado <SortIcon field="status" />
								</button>
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedEvents.map((event) => {
							const status = getEventStatus(event);
							const isEnded = status.status === "ended";
							const startDate = event.startDate
								? new Date(event.startDate)
								: null;
							const endDate = event.endDate ? new Date(event.endDate) : null;

							const eventUrl = event.organization?.slug
								? `/c/${event.organization.slug}/events/${event.slug}`
								: `/${event.slug}`;

							return (
								<tr
									key={event.id}
									className={`border-b border-border/50 hover:bg-muted/30 ${isEnded ? "opacity-50" : ""}`}
								>
									<td className="py-2 pr-4">
										<Link
											href={eventUrl}
											className="group flex items-center gap-2"
										>
											<div className="relative h-6 w-6 shrink-0 overflow-hidden bg-muted">
												{event.eventImageUrl ? (
													<Image
														src={event.eventImageUrl}
														alt={event.name}
														fill
														className="object-cover"
														sizes="24px"
													/>
												) : (
													<div className="flex h-full w-full items-center justify-center text-[9px] font-medium text-muted-foreground">
														{event.name.charAt(0)}
													</div>
												)}
											</div>
											<div className="min-w-0">
												<span className="text-foreground group-hover:underline underline-offset-2 line-clamp-1">
													{event.name}
												</span>
												<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
													<span className="truncate max-w-[100px]">
														{event.organization?.displayName ||
															event.organization?.name ||
															getEventTypeLabel(event.eventType)}
													</span>
													{event.isFeatured && (
														<span className="text-amber-400">★</span>
													)}
												</div>
											</div>
										</Link>
									</td>
									<td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
										{startDate ? formatEventDateRange(startDate, endDate) : "—"}
									</td>
									<td className="py-2 pr-4 text-muted-foreground hidden md:table-cell">
										{getFormatLabel(event.format, event.department)}
									</td>
									{showPrize && (
										<td className="py-2 pr-4 text-right hidden sm:table-cell">
											<span
												className={
													event.prizePool
														? "text-emerald-400"
														: "text-muted-foreground/50"
												}
											>
												{formatPrize(event.prizePool, event.prizeCurrency)}
											</span>
										</td>
									)}
									{showSkillLevel && (
										<td className="py-2 pr-4 text-muted-foreground hidden sm:table-cell">
											{getSkillLevelLabel(event.skillLevel)}
										</td>
									)}
									<td className="py-2 text-right">
										<span
											className={`inline-flex items-center gap-1 ${getStatusColor(status.status)}`}
										>
											<span
												className={`h-1 w-1 rounded-full ${
													status.status === "ongoing"
														? "bg-emerald-400 animate-pulse"
														: status.status === "open"
															? "bg-blue-400"
															: status.status === "upcoming"
																? "bg-amber-400"
																: "bg-muted-foreground/50"
												}`}
											/>
											{status.label}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<LoadMoreButton filters={filters} initialPage={1} hasMore={hasMore} />
		</div>
	);
}
