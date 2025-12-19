"use client";

import {
	CheckCircle2,
	ChevronDown,
	ChevronRight,
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

	const gridCols = showPrize
		? "lg:grid-cols-[1fr_140px_100px_80px_100px]"
		: showSkillLevel
			? "lg:grid-cols-[1fr_140px_100px_100px_100px]"
			: "lg:grid-cols-[1fr_140px_100px_100px]";

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
					className={`group relative block lg:grid ${gridCols} lg:gap-3 lg:items-center px-3 py-2 transition-all overflow-hidden ${
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

					<div className="lg:hidden relative z-10 space-y-1.5">
						<div className="flex items-start gap-2">
							{hasChildren && (
								<button
									onClick={handleToggle}
									className="shrink-0 p-0.5 mt-0.5 hover:bg-muted transition-colors"
								>
									{isLoading ? (
										<div className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
									) : isExpanded ? (
										<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
									) : (
										<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
									)}
								</button>
							)}
							<div className="relative h-9 w-9 shrink-0 overflow-hidden bg-muted border border-border/50">
								{event.eventImageUrl ? (
									<Image
										src={event.eventImageUrl}
										alt={event.name}
										fill
										className="object-cover"
										sizes="36px"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
										{event.name.charAt(0).toUpperCase()}
									</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-medium text-xs leading-tight line-clamp-2 group-hover:underline underline-offset-2">
									{event.name}
								</h3>
								<div className="text-[10px] text-muted-foreground truncate">
									{event.organization?.displayName ||
										event.organization?.name ||
										getEventTypeLabel(event.eventType)}
								</div>
							</div>
							<span
								className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium ${
									isEnded
										? "text-muted-foreground"
										: isOngoing
											? "text-emerald-400"
											: isOpen
												? "text-blue-400"
												: "text-amber-400"
								}`}
							>
								<span
									className={`h-1 w-1 rounded-full ${
										isEnded
											? "bg-muted-foreground/50"
											: isOngoing
												? "bg-emerald-400 animate-pulse"
												: isOpen
													? "bg-blue-400"
													: "bg-amber-400"
									}`}
								/>
								{status.label}
							</span>
						</div>

						<div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
							{startDate && (
								<span className="inline-flex items-center gap-1">
									<CalendarIcon className="h-2.5 w-2.5" />
									{formatEventDateSmart(startDate)}
								</span>
							)}
							<span className="inline-flex items-center gap-1">
								<PinIcon className="h-2.5 w-2.5" />
								{getFormatLabel(event.format, event.department)}
							</span>
							{showPrize && event.prizePool && event.prizePool > 0 && (
								<span className="inline-flex items-center gap-1 font-medium text-foreground">
									<TrophyIcon className="h-2.5 w-2.5 text-amber-400" />
									{event.prizeCurrency === "PEN" ? "S/" : "$"}
									{event.prizePool.toLocaleString()}
								</span>
							)}
							{hasChildren && (
								<span className="text-blue-400">
									{childEvents.length || "3"} días
								</span>
							)}
							{isFeatured && <span className="text-amber-400">Sponsored</span>}
							{isEventJuniorFriendly(event.skillLevel) && (
								<span className="inline-flex items-center gap-0.5 text-amber-400">
									<Sparkles className="h-2.5 w-2.5" />
									Junior
								</span>
							)}
						</div>
					</div>

					<div className="hidden lg:flex min-w-0 items-center gap-2 relative z-10">
						{hasChildren && (
							<button
								onClick={handleToggle}
								className="shrink-0 p-0.5 hover:bg-muted transition-colors"
							>
								{isLoading ? (
									<div className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
								) : isExpanded ? (
									<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
								) : (
									<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
								)}
							</button>
						)}

						<div className="relative h-7 w-7 shrink-0 overflow-hidden bg-muted border border-border/50">
							{event.eventImageUrl ? (
								<Image
									src={event.eventImageUrl}
									alt={event.name}
									fill
									className="object-cover"
									sizes="28px"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
									{event.name.charAt(0).toUpperCase()}
								</div>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<h3 className="text-xs font-medium truncate group-hover:underline underline-offset-2">
									{event.name}
								</h3>
								{hasChildren && (
									<span className="text-[9px] font-medium text-blue-400 shrink-0">
										{childEvents.length}d
									</span>
								)}
								{isFeatured && (
									<span className="text-[9px] font-medium text-amber-400 shrink-0">
										★
									</span>
								)}
								{isEventJuniorFriendly(event.skillLevel) && (
									<span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-400 shrink-0">
										<Sparkles className="h-2 w-2" />
									</span>
								)}
							</div>
							<div className="flex items-center gap-1">
								{(event.organization?.displayName ||
									event.organization?.name) && (
									<>
										<span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
											{event.organization?.displayName ||
												event.organization?.name}
										</span>
										{event.organization?.isVerified && (
											<CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
										)}
										<span className="text-muted-foreground/40">·</span>
									</>
								)}
								<span className="text-[10px] text-muted-foreground/50">
									{getEventTypeLabel(event.eventType)}
								</span>
							</div>
						</div>
					</div>

					<div className="hidden lg:block text-xs text-muted-foreground relative z-10">
						{startDate ? (
							<span>{formatEventDateRange(startDate, endDate)}</span>
						) : (
							<span className="text-muted-foreground/40">—</span>
						)}
					</div>

					<div className="hidden lg:block relative z-10">
						<span className="text-xs text-muted-foreground">
							{getFormatLabel(event.format, event.department)}
						</span>
					</div>

					{showPrize && (
						<div className="hidden lg:block text-right relative z-10">
							{event.prizePool && event.prizePool > 0 ? (
								<span className="text-xs font-medium text-emerald-400">
									{event.prizeCurrency === "PEN" ? "S/" : "$"}
									{event.prizePool.toLocaleString()}
								</span>
							) : (
								<span className="text-xs text-muted-foreground/40">—</span>
							)}
						</div>
					)}

					{showSkillLevel && (
						<div className="hidden lg:block relative z-10">
							<span className="text-xs text-muted-foreground">
								{getSkillLevelLabel(event.skillLevel)}
							</span>
						</div>
					)}

					<div className="hidden lg:flex items-center justify-end relative z-10">
						<span
							className={`inline-flex items-center gap-1 text-[10px] font-medium ${
								isEnded
									? "text-muted-foreground"
									: isOngoing
										? "text-emerald-400"
										: isOpen
											? "text-blue-400"
											: "text-amber-400"
							}`}
						>
							<span
								className={`h-1 w-1 rounded-full ${
									isEnded
										? "bg-muted-foreground/50"
										: isOngoing
											? "bg-emerald-400 animate-pulse"
											: isOpen
												? "bg-blue-400"
												: "bg-amber-400"
								}`}
							/>
							{status.label}
						</span>
					</div>
				</Link>
			</div>

			{isExpanded && childEvents.length > 0 && (
				<div className="border-l border-l-border/50 ml-6 bg-muted/10">
					{childEvents.map((child) => (
						<ChildEventRow key={child.id} event={child} />
					))}
				</div>
			)}
		</div>
	);
}

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
			className={`group flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-muted/30 ${
				isEnded ? "opacity-50" : ""
			}`}
		>
			{event.dayNumber && (
				<span className="shrink-0 inline-flex h-5 w-5 items-center justify-center bg-muted text-[10px] font-medium">
					{event.dayNumber}
				</span>
			)}

			<div className="relative h-5 w-5 shrink-0 overflow-hidden bg-muted border border-border/50">
				{event.eventImageUrl ? (
					<Image
						src={event.eventImageUrl}
						alt={event.name}
						fill
						className="object-cover"
						sizes="20px"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-[8px] font-medium text-muted-foreground">
						{event.name.charAt(0).toUpperCase()}
					</div>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<h4 className="text-[11px] font-medium truncate group-hover:underline underline-offset-2">
					{event.name}
				</h4>
				{event.city && (
					<span className="text-[10px] text-muted-foreground/70">
						{event.city}
					</span>
				)}
			</div>

			<span className="text-[10px] text-muted-foreground">
				{startDate && formatEventDateSmart(startDate)}
			</span>

			<span
				className={`inline-flex items-center gap-1 text-[9px] font-medium ${
					isEnded
						? "text-muted-foreground"
						: isOngoing
							? "text-emerald-400"
							: isOpen
								? "text-blue-400"
								: "text-amber-400"
				}`}
			>
				<span
					className={`h-1 w-1 rounded-full ${
						isEnded
							? "bg-muted-foreground/50"
							: isOngoing
								? "bg-emerald-400 animate-pulse"
								: isOpen
									? "bg-blue-400"
									: "bg-amber-400"
					}`}
				/>
				{status.label}
			</span>
		</Link>
	);
}
