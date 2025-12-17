"use client";

import {
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	MapPin,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarIcon } from "@/components/icons/calendar";
import { PinIcon } from "@/components/icons/pin";
import { TrophyIcon } from "@/components/icons/trophy";
import { getChildEvents } from "@/lib/actions/events";
import type { Event } from "@/lib/db/schema";
import {
	formatEventDateRange,
	formatEventDateSmart,
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
	getSkillLevelLabel,
	isEventJuniorFriendly,
} from "@/lib/event-utils";

interface OrganizationInfo {
	slug: string;
	name: string;
	displayName: string | null;
	isVerified: boolean | null;
}

interface EventRowWithChildrenProps {
	event: Event & {
		organization: OrganizationInfo | null;
	};
	categoryConfig?: {
		showPrize?: boolean;
		showSkillLevel?: boolean;
	};
}

export function EventRowWithChildren({
	event,
	categoryConfig,
}: EventRowWithChildrenProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [childEvents, setChildEvents] = useState<Event[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasChildren, setHasChildren] = useState(false);

	// Check if this event has children on mount
	useEffect(() => {
		async function checkChildren() {
			const children = await getChildEvents(event.id);
			setHasChildren(children.length > 0);
			if (children.length > 0) {
				setChildEvents(children);
			}
		}
		checkChildren();
	}, [event.id]);

	const handleToggle = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!isExpanded && childEvents.length === 0) {
			setIsLoading(true);
			const children = await getChildEvents(event.id);
			setChildEvents(children);
			setIsLoading(false);
		}
		setIsExpanded(!isExpanded);
	};

	// Default to showing prize (competitions behavior)
	const showPrize = categoryConfig?.showPrize ?? true;
	const showSkillLevel = categoryConfig?.showSkillLevel ?? false;
	const startDate = event.startDate ? new Date(event.startDate) : null;
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const status = getEventStatus(event);

	// Visual treatment based on status
	const isEnded = status.status === "ended";
	const isOngoing = status.status === "ongoing";
	const isOpen = status.status === "open";
	const isFeatured = event.isFeatured;

	// Minimal amber stripe pattern for featured/sponsored events
	const featuredStripe = `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6L6 0' stroke='%23F59E0B' stroke-width='0.5' fill='none' opacity='0.15'/%3E%3C/svg%3E")`;

	// Dynamic grid based on category
	const gridCols = showPrize
		? "lg:grid-cols-[1fr_200px_120px_100px_130px]"
		: showSkillLevel
			? "lg:grid-cols-[1fr_200px_120px_120px_130px]"
			: "lg:grid-cols-[1fr_200px_120px_130px]";

	const eventUrl = event.organization?.slug
		? `/c/${event.organization.slug}/events/${event.slug}`
		: `/${event.slug}`;

	return (
		<div>
			{/* Parent event row */}
			<div
				className={`relative ${isFeatured ? "border-l-2 border-l-amber-500" : ""}`}
			>
				<Link
					href={eventUrl}
					className={`group relative block lg:grid ${gridCols} lg:gap-4 lg:items-center px-4 py-4 lg:px-5 transition-all overflow-hidden ${
						isEnded && !isFeatured ? "opacity-50" : ""
					}`}
				>
					{/* Banner background */}
					{event.eventImageUrl && (
						<div className="absolute inset-0 overflow-hidden pointer-events-none">
							<Image
								src={event.eventImageUrl}
								alt=""
								fill
								className="object-cover object-center opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-sm"
								sizes="100vw"
							/>
							<div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/50" />
						</div>
					)}

					{/* Hover overlay */}
					<div className="absolute inset-0 bg-transparent group-hover:bg-muted/40 transition-colors duration-200 pointer-events-none" />

					{/* Featured stripe pattern */}
					{isFeatured && (
						<div
							className="absolute inset-0 -z-10 pointer-events-none"
							style={{
								backgroundImage: featuredStripe,
								backgroundSize: "6px 6px",
							}}
						/>
					)}

					{/* Mobile Layout - Stacked */}
					<div className="lg:hidden relative z-10 space-y-2.5">
						{/* Header with thumbnail and title */}
						<div className="flex items-start gap-2.5">
							{/* Expand button for parent events with children */}
							{hasChildren && (
								<button
									onClick={handleToggle}
									className="shrink-0 p-0.5 mt-0.5 rounded hover:bg-muted transition-colors"
								>
									{isLoading ? (
										<div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
									) : isExpanded ? (
										<ChevronDown className="h-4 w-4 text-muted-foreground" />
									) : (
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									)}
								</button>
							)}
							{/* Thumbnail */}
							<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted border border-border">
								{event.eventImageUrl ? (
									<Image
										src={event.eventImageUrl}
										alt={event.name}
										fill
										className="object-cover"
										sizes="48px"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
										{event.name.charAt(0).toUpperCase()}
									</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold text-[15px] leading-tight mb-1 line-clamp-2 group-hover:underline underline-offset-2">
									{event.name}
								</h3>
								<div className="text-[11px] text-muted-foreground/70 truncate">
									{event.organization?.displayName ||
										event.organization?.name ||
										getEventTypeLabel(event.eventType)}
								</div>
							</div>
							{/* Status badge on mobile - top right */}
							<span
								className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
									isEnded
										? "bg-muted text-muted-foreground"
										: isOngoing
											? "bg-emerald-500/10 text-emerald-500"
											: isOpen
												? "bg-blue-500/10 text-blue-500"
												: "bg-amber-500/10 text-amber-500"
								}`}
							>
								<span
									className={`h-1 w-1 rounded-full ${
										isEnded
											? "bg-muted-foreground/50"
											: isOngoing
												? "bg-emerald-500 animate-pulse"
												: isOpen
													? "bg-blue-500"
													: "bg-amber-500"
									}`}
								/>
								{status.label}
							</span>
						</div>

						{/* Info row - date, location, prize */}
						<div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
							{startDate && (
								<span className="inline-flex items-center gap-1">
									<CalendarIcon className="h-3 w-3" />
									{formatEventDateSmart(startDate)}
								</span>
							)}
							<span className="inline-flex items-center gap-1">
								<PinIcon className="h-3 w-3" />
								{getFormatLabel(event.format, event.department)}
							</span>
							{showPrize && event.prizePool && event.prizePool > 0 && (
								<span className="inline-flex items-center gap-1 font-medium text-foreground">
									<TrophyIcon className="h-3 w-3 text-amber-500" />
									{event.prizeCurrency === "PEN" ? "S/" : "$"}
									{event.prizePool.toLocaleString()}
								</span>
							)}
						</div>

						{/* Badges row - bottom */}
						{(hasChildren ||
							isFeatured ||
							isEventJuniorFriendly(event.skillLevel)) && (
							<div className="flex items-center gap-1.5 flex-wrap">
								{hasChildren && (
									<span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-500">
										{childEvents.length || "3"} días
									</span>
								)}
								{isFeatured && (
									<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
										Sponsored
									</span>
								)}
								{isEventJuniorFriendly(event.skillLevel) && (
									<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
										<Sparkles className="h-2.5 w-2.5" />
										Junior
									</span>
								)}
							</div>
						)}
					</div>

					{/* Desktop Layout - Original Grid */}
					<div className="hidden lg:flex min-w-0 items-center gap-3 relative z-10">
						{/* Expand button for parent events with children */}
						{hasChildren && (
							<button
								onClick={handleToggle}
								className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
							>
								{isLoading ? (
									<div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
								) : isExpanded ? (
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								) : (
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								)}
							</button>
						)}

						{/* Thumbnail */}
						<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted border border-border">
							{event.eventImageUrl ? (
								<Image
									src={event.eventImageUrl}
									alt={event.name}
									fill
									className="object-cover"
									sizes="40px"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
									{event.name.charAt(0).toUpperCase()}
								</div>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2.5">
								<h3 className="text-base font-semibold truncate group-hover:underline underline-offset-2">
									{event.name}
								</h3>
								{hasChildren && (
									<span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-500 shrink-0">
										{childEvents.length} días
									</span>
								)}
								{isFeatured && (
									<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500 shrink-0">
										Sponsored
									</span>
								)}
								{isEventJuniorFriendly(event.skillLevel) && (
									<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500 shrink-0">
										<Sparkles className="h-2.5 w-2.5" />
										Junior
									</span>
								)}
							</div>
							<div className="flex items-center gap-1.5 mt-0.5">
								{(event.organization?.displayName || event.organization?.name) && (
									<>
										<span className="text-[13px] text-muted-foreground/90">
											{event.organization?.displayName || event.organization?.name}
										</span>
										{event.organization?.isVerified ? (
											<CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
										) : (
											<span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 shrink-0">
												<span className="text-[7px] text-muted-foreground/40">
													?
												</span>
											</span>
										)}
										<span className="text-muted-foreground/40">·</span>
									</>
								)}
								<span className="text-[11px] text-muted-foreground/50">
									{getEventTypeLabel(event.eventType)}
								</span>
							</div>
						</div>
					</div>

					{/* Date */}
					<div className="hidden lg:block text-sm text-muted-foreground relative z-10">
						{startDate ? (
							<div className="flex items-center gap-1.5">
								<CalendarIcon className="h-3.5 w-3.5" />
								<span>{formatEventDateRange(startDate, endDate)}</span>
							</div>
						) : (
							<span className="text-muted-foreground/50">—</span>
						)}
					</div>

					{/* Format */}
					<div className="hidden lg:block relative z-10">
						<span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
							<PinIcon className="h-3.5 w-3.5" />
							{getFormatLabel(event.format, event.department)}
						</span>
					</div>

					{/* Prize - only for competitions */}
					{showPrize && (
						<div className="hidden lg:block text-right relative z-10">
							{event.prizePool && event.prizePool > 0 ? (
								<span className="inline-flex items-center gap-1 text-sm font-medium">
									<TrophyIcon className="h-3.5 w-3.5 text-amber-500" />
									{event.prizeCurrency === "PEN" ? "S/" : "$"}
									{event.prizePool.toLocaleString()}
								</span>
							) : (
								<span className="text-sm text-muted-foreground/40">—</span>
							)}
						</div>
					)}

					{/* Skill Level - only for learning */}
					{showSkillLevel && (
						<div className="hidden lg:block relative z-10">
							<span className="text-sm text-muted-foreground">
								{getSkillLevelLabel(event.skillLevel)}
							</span>
						</div>
					)}

					{/* Status - Desktop only */}
					<div className="hidden lg:flex items-center justify-end relative z-10">
						<span
							className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
								isEnded
									? "bg-muted text-muted-foreground"
									: isOngoing
										? "bg-emerald-500/10 text-emerald-500"
										: isOpen
											? "bg-blue-500/10 text-blue-500"
											: "bg-amber-500/10 text-amber-500"
							}`}
						>
							<span
								className={`h-1.5 w-1.5 rounded-full ${
									isEnded
										? "bg-muted-foreground/50"
										: isOngoing
											? "bg-emerald-500 animate-pulse"
											: isOpen
												? "bg-blue-500"
												: "bg-amber-500"
								}`}
							/>
							{status.label}
						</span>
					</div>
				</Link>
			</div>

			{/* Child events (collapsible) */}
			{isExpanded && childEvents.length > 0 && (
				<div className="border-l-2 border-l-muted ml-8 bg-muted/20">
					{childEvents.map((child) => (
						<ChildEventRow key={child.id} event={child} />
					))}
				</div>
			)}
		</div>
	);
}

// Simplified row for child events
function ChildEventRow({
	event,
}: {
	event: Event & { organization?: { slug: string } | null };
}) {
	const startDate = event.startDate ? new Date(event.startDate) : null;
	const status = getEventStatus(event);
	const isEnded = status.status === "ended";
	const isOngoing = status.status === "ongoing";
	const isOpen = status.status === "open";

	const childEventUrl = event.organization?.slug
		? `/c/${event.organization.slug}/events/${event.slug}`
		: `/${event.slug}`;

	return (
		<Link
			href={childEventUrl}
			className={`group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50 ${
				isEnded ? "opacity-60" : ""
			}`}
		>
			{/* Day number badge */}
			{event.dayNumber && (
				<span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
					{event.dayNumber}
				</span>
			)}

			{/* Thumbnail */}
			<div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted border border-border">
				{event.eventImageUrl ? (
					<Image
						src={event.eventImageUrl}
						alt={event.name}
						fill
						className="object-cover"
						sizes="32px"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
						{event.name.charAt(0).toUpperCase()}
					</div>
				)}
			</div>

			{/* Name */}
			<div className="min-w-0 flex-1">
				<h4 className="text-sm font-medium truncate group-hover:underline underline-offset-2">
					{event.name}
				</h4>
				{event.city && (
					<div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
						<MapPin className="h-3 w-3" />
						{event.city}
					</div>
				)}
			</div>

			{/* Date */}
			<div className="text-sm text-muted-foreground">
				{startDate && (
					<div className="flex items-center gap-1.5">
						<CalendarIcon className="h-3.5 w-3.5" />
						<span>{formatEventDateSmart(startDate)}</span>
					</div>
				)}
			</div>

			{/* Status */}
			<span
				className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
					isEnded
						? "bg-muted text-muted-foreground"
						: isOngoing
							? "bg-emerald-500/10 text-emerald-500"
							: isOpen
								? "bg-blue-500/10 text-blue-500"
								: "bg-amber-500/10 text-amber-500"
				}`}
			>
				<span
					className={`h-1.5 w-1.5 rounded-full ${
						isEnded
							? "bg-muted-foreground/50"
							: isOngoing
								? "bg-emerald-500 animate-pulse"
								: isOpen
									? "bg-blue-500"
									: "bg-amber-500"
					}`}
				/>
				{status.label}
			</span>
		</Link>
	);
}
