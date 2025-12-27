"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowUpRight,
	Building2,
	Calendar,
	Clock,
	ExternalLink,
	GraduationCap,
	MapPin,
	Sparkles,
	Trophy,
	Users,
	Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EventWithOrg } from "@/lib/actions/events";
import {
	formatEventDateRange,
	formatEventDateRangeWithDay,
	formatEventTime,
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
	getSkillLevelLabel,
	isEventJuniorFriendly,
} from "@/lib/event-utils";

interface EventsPreviewViewProps {
	events: EventWithOrg[];
	total?: number;
}

function getStatusColor(status: string) {
	switch (status) {
		case "ongoing":
			return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
		case "open":
			return "bg-blue-500/20 text-blue-400 border-blue-500/30";
		case "upcoming":
			return "bg-amber-500/20 text-amber-400 border-amber-500/30";
		default:
			return "bg-muted text-muted-foreground";
	}
}

function EventListItem({
	event,
	isHovered,
	onHover,
}: {
	event: EventWithOrg;
	isHovered: boolean;
	onHover: () => void;
}) {
	const itemRef = useRef<HTMLDivElement>(null);
	const status = getEventStatus(event);
	const isEnded = status.status === "ended";

	const prize =
		event.prizePool && event.prizePool > 0
			? `${event.prizeCurrency === "PEN" ? "S/" : "$"}${event.prizePool.toLocaleString()}`
			: null;

	useEffect(() => {
		if (isHovered && itemRef.current) {
			itemRef.current.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}
	}, [isHovered]);

	return (
		<div
			ref={itemRef}
			data-event-item
			className={`
				group relative px-4 py-3 cursor-pointer border-l-3
				${isEnded ? "opacity-50" : ""}
				${isHovered ? "bg-primary/8 border-l-primary" : "border-l-transparent"}
			`}
			onMouseEnter={onHover}
		>
			<div className="flex gap-3">
				<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
					{event.eventImageUrl ? (
						<Image
							src={event.eventImageUrl}
							alt={event.name}
							fill
							className="object-cover"
							sizes="48px"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
							{event.name.charAt(0)}
						</div>
					)}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between gap-2">
						<h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors duration-100">
							{event.name}
						</h4>
						{!isEnded && (
							<Badge
								variant="outline"
								className={`text-[10px] shrink-0 ${getStatusColor(status.status)}`}
							>
								{status.label}
							</Badge>
						)}
					</div>

					<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
						{event.organization?.displayName || event.organization?.name}
					</p>

					<div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							{formatEventDateRange(event.startDate, event.endDate)}
						</span>
						{event.city && (
							<span className="flex items-center gap-1">
								<MapPin className="h-3 w-3" />
								{event.city}
							</span>
						)}
						{prize && (
							<span className="flex items-center gap-1 text-emerald-500 font-medium">
								<Trophy className="h-3 w-3" />
								{prize}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function EventDetailPanel({ event }: { event: EventWithOrg }) {
	const status = getEventStatus(event);
	const isEnded = status.status === "ended";
	const isJuniorFriendly = isEventJuniorFriendly(event.skillLevel);

	const startDate = event.startDate ? new Date(event.startDate) : null;
	const endDate = event.endDate ? new Date(event.endDate) : null;

	const hasValidTime =
		startDate &&
		(startDate.getHours() !== 0 ||
			startDate.getMinutes() !== 0 ||
			(endDate && (endDate.getHours() !== 0 || endDate.getMinutes() !== 0)));

	const prize =
		event.prizePool && event.prizePool > 0
			? `${event.prizeCurrency === "PEN" ? "S/" : "$"}${event.prizePool.toLocaleString()}`
			: null;

	const eventUrl = event.shortCode ? `/e/${event.shortCode}` : `/${event.slug}`;

	return (
		<motion.div
			key={event.id}
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.15, ease: "easeOut" }}
			className="h-full flex flex-col min-h-0"
		>
			{/* Header with image */}
			<div className="relative h-48 shrink-0 overflow-hidden bg-muted">
				{event.eventImageUrl ? (
					<Image
						src={event.eventImageUrl}
						alt={event.name}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, 50vw"
						priority
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
						<span className="text-6xl font-bold text-primary/30">
							{event.name.charAt(0)}
						</span>
					</div>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

				{/* Status badge */}
				<div className="absolute top-3 right-3">
					<Badge
						variant="outline"
						className={`${getStatusColor(status.status)} backdrop-blur-sm`}
					>
						{status.label}
					</Badge>
				</div>

				{/* Junior friendly badge */}
				{isJuniorFriendly && (
					<div className="absolute top-3 left-3">
						<Badge className="bg-amber-500/90 text-white border-0 gap-1">
							<Sparkles className="h-3 w-3" />
							Para principiantes
						</Badge>
					</div>
				)}
			</div>

			{/* Content */}
			<ScrollArea className="flex-1 min-h-0">
				<div className="p-4 space-y-4">
					{/* Title & Org */}
					<div>
						<h2 className="text-xl font-bold leading-tight">{event.name}</h2>
						{event.organization && (
							<Link
								href={`/c/${event.organization.slug}`}
								className="inline-flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								<Building2 className="h-3.5 w-3.5" />
								{event.organization.displayName || event.organization.name}
								{event.organization.isVerified && (
									<Badge variant="secondary" className="text-[10px] px-1 py-0">
										Verificado
									</Badge>
								)}
							</Link>
						)}
					</div>

					{/* Quick info grid */}
					<div className="grid grid-cols-2 gap-3">
						{/* Date */}
						<div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50">
							<Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
							<div>
								<p className="text-xs text-muted-foreground">Fecha</p>
								<p className="text-sm font-medium">
									{formatEventDateRangeWithDay(event.startDate, event.endDate)}
								</p>
							</div>
						</div>

						{/* Time */}
						{hasValidTime && (
							<div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50">
								<Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
								<div>
									<p className="text-xs text-muted-foreground">Hora</p>
									<p className="text-sm font-medium">
										{formatEventTime(event.startDate)}
									</p>
								</div>
							</div>
						)}

						{/* Location */}
						{(event.city || event.format) && (
							<div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50">
								<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
								<div>
									<p className="text-xs text-muted-foreground">Ubicación</p>
									<p className="text-sm font-medium">
										{event.city || getFormatLabel(event.format)}
									</p>
									{event.format && event.city && (
										<p className="text-xs text-muted-foreground">
											{getFormatLabel(event.format)}
										</p>
									)}
								</div>
							</div>
						)}

						{/* Prize */}
						{prize && (
							<div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10">
								<Trophy className="h-4 w-4 text-emerald-500 mt-0.5" />
								<div>
									<p className="text-xs text-muted-foreground">Premios</p>
									<p className="text-sm font-bold text-emerald-500">{prize}</p>
								</div>
							</div>
						)}

						{/* Type */}
						{event.eventType && (
							<div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50">
								<Users className="h-4 w-4 text-muted-foreground mt-0.5" />
								<div>
									<p className="text-xs text-muted-foreground">Tipo</p>
									<p className="text-sm font-medium">
										{getEventTypeLabel(event.eventType)}
									</p>
								</div>
							</div>
						)}

						{/* Skill Level */}
						{event.skillLevel && (
							<div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50">
								<GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
								<div>
									<p className="text-xs text-muted-foreground">Nivel</p>
									<p className="text-sm font-medium">
										{getSkillLevelLabel(event.skillLevel)}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Description */}
					{event.description && (
						<div className="space-y-2">
							<h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Sobre el evento
							</h3>
							<div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
								<Markdown
									remarkPlugins={[remarkGfm]}
									components={{
										p: ({ children }) => (
											<p className="text-sm text-muted-foreground leading-relaxed mb-2">
												{children}
											</p>
										),
										ul: ({ children }) => (
											<ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-2">
												{children}
											</ul>
										),
										li: ({ children }) => (
											<li className="text-sm text-muted-foreground">
												{children}
											</li>
										),
										a: ({ href, children }) => (
											<a
												href={href}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:underline"
											>
												{children}
											</a>
										),
									}}
								>
									{event.description.length > 500
										? `${event.description.slice(0, 500)}...`
										: event.description}
								</Markdown>
							</div>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Footer actions */}
			<div className="shrink-0 p-4 border-t bg-muted/20 space-y-2">
				<Button asChild className="w-full gap-2">
					<Link href={eventUrl}>
						Ver detalles completos
						<ArrowUpRight className="h-4 w-4" />
					</Link>
				</Button>
				{event.registrationUrl && !isEnded && (
					<Button asChild variant="outline" className="w-full gap-2">
						<a
							href={event.registrationUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							Inscribirse
							<ExternalLink className="h-4 w-4" />
						</a>
					</Button>
				)}
			</div>
		</motion.div>
	);
}

function EmptyDetailPanel() {
	return (
		<div className="h-full flex flex-col items-center justify-center text-center p-8">
			<div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
				<Zap className="h-8 w-8 text-muted-foreground/50" />
			</div>
			<h3 className="font-medium text-muted-foreground mb-1">
				Vista previa rápida
			</h3>
			<p className="text-sm text-muted-foreground/70 max-w-[200px]">
				Hover sobre un evento para ver sus detalles aquí
			</p>
			<div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground/50">
				<kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑</kbd>
				<kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↓</kbd>
				<span>para navegar</span>
			</div>
		</div>
	);
}

export function EventsPreviewView({ events, total }: EventsPreviewViewProps) {
	const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number>(-1);
	const listRef = useRef<HTMLDivElement>(null);

	const hoveredEvent = useMemo(
		() => events.find((e) => e.id === hoveredEventId),
		[events, hoveredEventId],
	);

	const handleEventHover = useCallback(
		(eventId: string | null) => {
			setHoveredEventId(eventId);
			if (eventId) {
				const index = events.findIndex((e) => e.id === eventId);
				if (index !== -1) setSelectedIndex(index);
			}
		},
		[events],
	);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prev) => {
					const next = prev < events.length - 1 ? prev + 1 : 0;
					setHoveredEventId(events[next]?.id || null);
					return next;
				});
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prev) => {
					const next = prev > 0 ? prev - 1 : events.length - 1;
					setHoveredEventId(events[next]?.id || null);
					return next;
				});
			} else if (e.key === "Escape") {
				setSelectedIndex(-1);
				setHoveredEventId(null);
			} else if (e.key === "Enter" && hoveredEvent) {
				const eventUrl = hoveredEvent.shortCode
					? `/e/${hoveredEvent.shortCode}`
					: `/${hoveredEvent.slug}`;
				window.location.href = eventUrl;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [events, hoveredEvent]);

	// Auto-scroll to selected item
	useEffect(() => {
		if (selectedIndex >= 0 && listRef.current) {
			const items = listRef.current.querySelectorAll("[data-event-item]");
			const selectedItem = items[selectedIndex] as HTMLElement;
			if (selectedItem) {
				selectedItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
			}
		}
	}, [selectedIndex]);

	if (events.length === 0) {
		return (
			<div className="flex items-center justify-center h-[600px] text-muted-foreground">
				No se encontraron eventos
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-3 h-[calc(100vh-200px)] min-h-[600px]">
			{/* Event List */}
			<div className="border rounded-xl overflow-hidden bg-card">
				<div className="px-4 py-3 border-b bg-muted/30">
					<h3 className="font-semibold text-sm">{events.length} eventos</h3>
					<p className="text-xs text-muted-foreground">
						↑↓ navegar • Enter abrir • Esc limpiar
					</p>
				</div>
				<ScrollArea className="h-[calc(100%-60px)]" ref={listRef}>
					<div className="divide-y divide-border/50">
						{events.map((event) => (
							<EventListItem
								key={event.id}
								event={event}
								isHovered={hoveredEventId === event.id}
								onHover={() => handleEventHover(event.id)}
							/>
						))}
					</div>
				</ScrollArea>
			</div>

			{/* Detail Panel */}
			<div className="border rounded-xl overflow-hidden bg-card h-full">
				<AnimatePresence mode="wait">
					{hoveredEvent ? (
						<EventDetailPanel event={hoveredEvent} />
					) : (
						<motion.div
							key="empty"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.1 }}
							className="h-full"
						>
							<EmptyDetailPanel />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
