"use client";

import * as d3 from "d3";
import { AnimatePresence, motion, useSpring } from "framer-motion";
import { Calendar, MapPin, Trophy, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { feature } from "topojson-client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EventFilters, EventWithOrg } from "@/lib/actions/events";
import {
	formatEventDateRange,
	getEventStatus,
} from "@/lib/event-utils";
import {
	ISO_TO_MAP_ID,
	LATAM_COUNTRY_IDS,
	PERU_COUNTRY_ID,
	PERU_DEPARTMENT_COORDS,
	PERU_DEPARTMENT_NAME_MAP,
} from "@/lib/geo/peru-departments";
import worldData from "@/public/countries-110m.json";
import peruDeptData from "@/public/peru_departamental_simple.json";
import latamDotsData from "@/public/latam-dots.json";
import peruDotsData from "@/public/peru-dots.json";

interface GeoFeature {
	type: string;
	id?: string;
	geometry: any;
	properties: any;
}

const WIDTH = 1000;
const HEIGHT = 1100;

interface EventsMapViewProps {
	events: EventWithOrg[];
	total?: number;
	hasMore?: boolean;
	filters?: EventFilters;
}

const LATAM_CENTER: [number, number] = [-70, -15];
const LATAM_SCALE = 750;

// Country zoom configurations: center coordinates and scale for each country
const COUNTRY_ZOOM_CONFIG: Record<string, { center: [number, number]; scale: number }> = {
	PE: { center: [-75, -9], scale: 3145 },
	CO: { center: [-74, 4], scale: 2200 },
	AR: { center: [-64, -38], scale: 1400 },
	BR: { center: [-52, -14], scale: 900 },
	CL: { center: [-71, -35], scale: 1600 },
	MX: { center: [-102, 24], scale: 1400 },
	EC: { center: [-78.5, -1.5], scale: 4500 },
	BO: { center: [-65, -17], scale: 2800 },
	VE: { center: [-66, 7], scale: 2400 },
	UY: { center: [-56, -33], scale: 5500 },
	PY: { center: [-58, -23], scale: 3200 },
	PA: { center: [-80, 8.5], scale: 6000 },
	CR: { center: [-84, 9.7], scale: 6500 },
	GT: { center: [-90.5, 15.5], scale: 5500 },
	HN: { center: [-87, 14.5], scale: 5000 },
	NI: { center: [-85.5, 12.8], scale: 5000 },
	SV: { center: [-89, 13.8], scale: 8000 },
	CU: { center: [-79, 22], scale: 3500 },
	DO: { center: [-70, 19], scale: 6000 },
};

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

function getCountryCenter(isoCode: string): [number, number] | null {
	const centers: Record<string, [number, number]> = {
		AR: [-64.0, -34.0],
		BO: [-65.0, -17.0],
		BR: [-51.0, -14.0],
		CL: [-71.0, -35.0],
		CO: [-74.0, 4.0],
		CR: [-84.0, 10.0],
		CU: [-80.0, 22.0],
		DO: [-70.0, 19.0],
		EC: [-78.0, -2.0],
		SV: [-89.0, 14.0],
		GT: [-90.0, 15.0],
		HN: [-87.0, 15.0],
		MX: [-102.0, 24.0],
		NI: [-85.0, 13.0],
		PA: [-80.0, 9.0],
		PY: [-58.0, -23.0],
		PE: [-76.0, -10.0],
		UY: [-56.0, -33.0],
		VE: [-67.0, 8.0],
	};
	return centers[isoCode] || null;
}

interface EventLocation {
	eventId: string;
	coords: [number, number];
	name: string;
	city: string | null;
	department: string | null;
	country: string | null;
}

function EventListItem({
	event,
	isHovered,
	onHover,
	onLeave,
	listRef,
}: {
	event: EventWithOrg;
	isHovered: boolean;
	onHover: () => void;
	onLeave: () => void;
	listRef?: React.RefObject<HTMLDivElement | null>;
}) {
	const itemRef = useRef<HTMLDivElement>(null);
	const status = getEventStatus(event);
	const isEnded = status.status === "ended";
	const eventUrl = event.organization?.slug
		? `/c/${event.organization.slug}/events/${event.slug}`
		: `/${event.slug}`;

	const prize =
		event.prizePool && event.prizePool > 0
			? `${event.prizeCurrency === "PEN" ? "S/" : "$"}${event.prizePool.toLocaleString()}`
			: null;

	useEffect(() => {
		if (isHovered && itemRef.current && listRef?.current) {
			itemRef.current.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}
	}, [isHovered, listRef]);

	return (
		<motion.div
			ref={itemRef}
			data-event-item
			initial={false}
			animate={{
				backgroundColor: isHovered ? "hsl(var(--primary) / 0.08)" : "transparent",
				borderLeftColor: isHovered ? "hsl(var(--primary))" : "transparent",
				borderLeftWidth: isHovered ? 3 : 0,
			}}
			transition={{ duration: 0.08 }}
			className={`
				group relative px-4 py-3 border-b border-border/50 cursor-pointer
				${isEnded ? "opacity-50" : ""}
			`}
			onMouseEnter={onHover}
			onMouseLeave={onLeave}
		>
			<Link href={eventUrl} className="block">
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
			</Link>

			<AnimatePresence>
				{isHovered && (
					<motion.div
						initial={{ opacity: 0, scale: 0.5, x: 10 }}
						animate={{ opacity: 1, scale: 1, x: 0 }}
						exit={{ opacity: 0, scale: 0.5, x: 10 }}
						transition={{ duration: 0.1 }}
						className="absolute right-3 top-1/2 -translate-y-1/2"
					>
						<Zap className="h-4 w-4 text-primary" />
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

export function EventsMapView({
	events,
	total,
}: EventsMapViewProps) {
	const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number>(-1);
	const listRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const eventLocations = useMemo(() => {
		return events
			.filter((e) => e.department || e.country)
			.map((event) => {
				let coords: [number, number] | null = null;

				if (event.country === "PE" && event.department) {
					coords = PERU_DEPARTMENT_COORDS[event.department] || null;
				} else if (event.country) {
					coords = getCountryCenter(event.country);
				}

				if (!coords) return null;

				return {
					eventId: event.id,
					coords,
					name: event.name,
					city: event.city,
					department: event.department,
					country: event.country,
				} as EventLocation;
			})
			.filter(Boolean) as EventLocation[];
	}, [events]);

	const hoveredLocation = useMemo(
		() => eventLocations.find((loc) => loc.eventId === hoveredEventId),
		[eventLocations, hoveredEventId]
	);

	const handleEventHover = useCallback((eventId: string | null) => {
		setHoveredEventId(eventId);
		// Sync selected index when hovering
		if (eventId) {
			const index = events.findIndex((e) => e.id === eventId);
			if (index !== -1) setSelectedIndex(index);
		}
	}, [events]);

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
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [events]);

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

	// Determine which country to zoom into (if any)
	const zoomedCountry = useMemo(() => {
		if (!hoveredLocation?.country) return null;
		// For Peru, only zoom if we have department info
		if (hoveredLocation.country === "PE" && !hoveredLocation.department) return null;
		// For other countries, zoom if we have a config
		if (COUNTRY_ZOOM_CONFIG[hoveredLocation.country]) return hoveredLocation.country;
		return null;
	}, [hoveredLocation]);

	if (events.length === 0) {
		return (
			<div className="flex items-center justify-center h-[600px] text-muted-foreground">
				No se encontraron eventos con ubicación
			</div>
		);
	}

	return (
		<div 
			ref={containerRef}
			className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-3 h-[calc(100vh-200px)] min-h-[600px]"
			tabIndex={0}
		>
			<div className="border rounded-xl overflow-hidden bg-card">
				<div className="px-4 py-3 border-b bg-muted/30">
					<h3 className="font-semibold text-sm">
						{events.length} eventos
					</h3>
					<p className="text-xs text-muted-foreground">
						↑↓ para navegar • Hover para explorar
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
								onLeave={() => handleEventHover(null)}
								listRef={listRef}
							/>
						))}
					</div>
				</ScrollArea>
			</div>

			<div className="border rounded-xl overflow-hidden bg-transparent">
				<DotPatternMap
					eventLocations={eventLocations}
					hoveredEventId={hoveredEventId}
					hoveredLocation={hoveredLocation}
					onEventHover={handleEventHover}
					zoomedCountry={zoomedCountry}
				/>
			</div>
		</div>
	);
}

function DotPatternMap({
	eventLocations,
	hoveredEventId,
	hoveredLocation,
	onEventHover,
	zoomedCountry,
}: {
	eventLocations: EventLocation[];
	hoveredEventId: string | null;
	hoveredLocation: EventLocation | null | undefined;
	onEventHover: (id: string | null) => void;
	zoomedCountry: string | null;
}) {
	const countriesData = useMemo(() => {
		const countries = feature(
			worldData as any,
			(worldData as any).objects.countries
		).features;
		return countries.filter((c: any) =>
			LATAM_COUNTRY_IDS.includes(c.id)
		) as GeoFeature[];
	}, []);

	const peruDepartments = useMemo(() => {
		return feature(
			peruDeptData as any,
			(peruDeptData as any).objects.peru_departamental_simple
		).features as GeoFeature[];
	}, []);

	// Base LATAM projection
	const latamProjection = useMemo(() => {
		return d3
			.geoEquirectangular()
			.scale(LATAM_SCALE)
			.center(LATAM_CENTER)
			.translate([WIDTH / 2, HEIGHT / 2]);
	}, []);

	// Dynamic zoomed projection based on country
	const zoomedProjection = useMemo(() => {
		if (!zoomedCountry || !COUNTRY_ZOOM_CONFIG[zoomedCountry]) return null;
		const config = COUNTRY_ZOOM_CONFIG[zoomedCountry];
		return d3
			.geoEquirectangular()
			.scale(config.scale)
			.center(config.center)
			.translate([WIDTH / 2, HEIGHT / 2]);
	}, [zoomedCountry]);

	// Current active projection
	const activeProjection = zoomedProjection || latamProjection;

	const latamGeoPath = useMemo(() => d3.geoPath().projection(latamProjection), [latamProjection]);
	const zoomedGeoPath = useMemo(() => {
		if (!zoomedProjection) return null;
		return d3.geoPath().projection(zoomedProjection);
	}, [zoomedProjection]);

	// Countries with events
	const countriesWithEvents = useMemo(() => {
		return [...new Set(eventLocations.map((loc) => loc.country ? ISO_TO_MAP_ID[loc.country] : null).filter(Boolean))] as string[];
	}, [eventLocations]);

	// Departments with events (for Peru)
	const departmentsWithEvents = useMemo(() => {
		return [...new Set(eventLocations.filter((loc) => loc.department).map((loc) => loc.department))] as string[];
	}, [eventLocations]);

	// Get the zoomed country feature
	const zoomedCountryFeature = useMemo(() => {
		if (!zoomedCountry) return null;
		const mapId = ISO_TO_MAP_ID[zoomedCountry];
		return countriesData.find((c) => c.id === mapId) || null;
	}, [zoomedCountry, countriesData]);

	// Project event locations for markers using active projection
	const projectedLocations = useMemo(() => {
		return eventLocations.map((loc) => {
			const projected = activeProjection(loc.coords);
			return {
				...loc,
				x: projected ? projected[0] : 0,
				y: projected ? projected[1] : 0,
			};
		});
	}, [eventLocations, activeProjection]);

	const hoveredProjected = projectedLocations.find(
		(loc) => loc.eventId === hoveredEventId
	);

	// Department event coords for Peru view
	const departmentEventCoords = useMemo(() => {
		if (zoomedCountry !== "PE" || !zoomedProjection) return [];
		return departmentsWithEvents
			.map((dept) => {
				if (!dept) return null;
				const coords = PERU_DEPARTMENT_COORDS[dept];
				if (!coords) return null;
				const projected = zoomedProjection(coords);
				if (!projected) return null;
				return { department: dept, x: projected[0], y: projected[1] };
			})
			.filter(Boolean) as Array<{ department: string; x: number; y: number }>;
	}, [departmentsWithEvents, zoomedProjection, zoomedCountry]);

	// Reprojected dots for zoomed country view (non-Peru)
	const zoomedCountryDots = useMemo(() => {
		if (!zoomedCountry || zoomedCountry === "PE" || !zoomedProjection) return [];
		const mapId = ISO_TO_MAP_ID[zoomedCountry];
		const countryData = latamDotsData.find((c) => c.countryId === mapId);
		if (!countryData) return [];

		// Reproject dots from LATAM coords to zoomed coords
		return countryData.dots
			.map((dot) => {
				// Inverse project from LATAM screen coords to geo coords
				const geoCoords = latamProjection.invert?.([dot.x, dot.y]);
				if (!geoCoords) return null;
				// Project to zoomed coords
				const projected = zoomedProjection(geoCoords);
				if (!projected) return null;
				return { x: projected[0], y: projected[1] };
			})
			.filter(Boolean) as Array<{ x: number; y: number }>;
	}, [zoomedCountry, zoomedProjection, latamProjection]);

	// Check if we're zoomed into Peru specifically (for department view)
	const isZoomedIntoPeru = zoomedCountry === "PE";

	return (
		<div className="relative flex items-center justify-center w-full h-full">
			<svg
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				className="w-full h-full bg-transparent"
				preserveAspectRatio="xMidYMid meet"
			>
				<AnimatePresence mode="wait">
					{!zoomedCountry ? (
						<motion.g
							key="latam-view"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 1.05 }}
							transition={{ duration: 0.15, ease: "easeOut" }}
						>
							{/* LATAM dot pattern - exactly like home page */}
							{latamDotsData.map((country) => {
								const isCountryHovered = hoveredLocation?.country && ISO_TO_MAP_ID[hoveredLocation.country] === country.countryId;
								const hasEvents = countriesWithEvents.includes(country.countryId);
								const countryFeature = countriesData.find((c) => c.id === country.countryId);

								return (
									<g key={country.countryId}>
										{/* Country border */}
										{countryFeature && (
											<path
												d={latamGeoPath(countryFeature as any) || ""}
												fill="transparent"
												stroke={isCountryHovered && hasEvents ? "#888" : hasEvents ? "#666" : "#444"}
												strokeWidth={isCountryHovered && hasEvents ? 2 : hasEvents ? 1.5 : 1}
												opacity={isCountryHovered ? 0.8 : hasEvents ? 0.6 : 0.35}
												style={{ transition: "all 0.2s ease" }}
											/>
										)}

										{/* Dot pattern */}
										{country.dots.map((dot, index) => {
											const shouldAnimate = index % 5 === 0;
											const baseOpacity = isCountryHovered && hasEvents ? 0.85 : isCountryHovered ? 0.6 : hasEvents ? 0.6 : 0.35;

											if (shouldAnimate) {
												return (
													<motion.circle
														key={index}
														cx={dot.x}
														cy={dot.y}
														r={1.5}
														className="fill-foreground"
														initial={{ opacity: baseOpacity }}
														animate={{
															opacity: [baseOpacity, baseOpacity + 0.3, baseOpacity],
															scale: [1, 1.3, 1],
														}}
														transition={{
															duration: 2.5,
															repeat: Infinity,
															ease: "easeInOut",
															delay: (index % 20) * 0.1,
														}}
													/>
												);
											}

											return (
												<circle
													key={index}
													cx={dot.x}
													cy={dot.y}
													r={1.5}
													className="fill-foreground"
													opacity={baseOpacity}
													style={{ transition: "opacity 0.2s ease" }}
												/>
											);
										})}
									</g>
								);
							})}

							{/* Event markers */}
							{projectedLocations.map((loc) => {
								const isHovered = loc.eventId === hoveredEventId;
								return (
									<g
										key={loc.eventId}
										style={{ cursor: "pointer" }}
										onMouseEnter={() => onEventHover(loc.eventId)}
										onMouseLeave={() => onEventHover(null)}
									>
										<motion.circle
											cx={loc.x}
											cy={loc.y}
											r={4}
											fill="#f59e0b"
											initial={{ scale: 0, opacity: 0 }}
											animate={{
												scale: isHovered ? [1, 1.5, 1] : [1, 1.3, 1],
												opacity: [0.9, 1, 0.9],
											}}
											transition={{
												duration: isHovered ? 1 : 2,
												repeat: Infinity,
												ease: "easeInOut",
											}}
										/>
										{isHovered && (
											<motion.circle
												cx={loc.x}
												cy={loc.y}
												r={12}
												fill="transparent"
												stroke="#f59e0b"
												strokeWidth={2}
												initial={{ scale: 0.5, opacity: 0 }}
												animate={{ scale: 1, opacity: [0.8, 0] }}
												transition={{
													duration: 1,
													repeat: Infinity,
													ease: "easeOut",
												}}
											/>
										)}
									</g>
								);
							})}
						</motion.g>
					) : isZoomedIntoPeru ? (
						<motion.g
							key="peru-view"
							initial={{ opacity: 0, scale: 1.1 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ duration: 0.15, ease: "easeOut" }}
						>
							{/* Peru departments with borders */}
							{zoomedGeoPath && peruDepartments.map((dept, deptIndex) => {
								const deptName = dept.properties?.NOMBDEP || "";
								const normalizedName = PERU_DEPARTMENT_NAME_MAP[deptName] || deptName;
								const hasEvent = departmentsWithEvents.includes(normalizedName);
								const isHovered = hoveredLocation?.department === normalizedName;

								return (
									<path
										key={dept.properties?.NOMBDEP || deptIndex}
										d={zoomedGeoPath(dept as any) || ""}
										fill="transparent"
										stroke={isHovered && hasEvent ? "#888" : hasEvent ? "#666" : "#444"}
										strokeWidth={isHovered && hasEvent ? 2 : hasEvent ? 1.5 : 1}
										opacity={isHovered ? 0.8 : hasEvent ? 0.6 : 0.35}
										style={{ transition: "all 0.2s ease" }}
									/>
								);
							})}

							{/* Peru dot pattern */}
							{peruDotsData.map((dot, index) => {
								const hasEvent = departmentsWithEvents.includes(dot.dept);
								const isHovered = hoveredLocation?.department === dot.dept;
								const shouldAnimate = index % 5 === 0;
								const baseOpacity = isHovered && hasEvent ? 0.85 : isHovered ? 0.6 : hasEvent ? 0.6 : 0.35;

								if (shouldAnimate) {
									return (
										<motion.circle
											key={index}
											cx={dot.x}
											cy={dot.y}
											r={1.5}
											className="fill-foreground"
											style={{ pointerEvents: "none" }}
											initial={{ opacity: baseOpacity }}
											animate={{
												opacity: [baseOpacity, baseOpacity + 0.3, baseOpacity],
												scale: [1, 1.3, 1],
											}}
											transition={{
												duration: 2.5,
												repeat: Infinity,
												ease: "easeInOut",
												delay: (index % 20) * 0.1,
											}}
										/>
									);
								}

								return (
									<circle
										key={index}
										cx={dot.x}
										cy={dot.y}
										r={1.5}
										className="fill-foreground"
										opacity={baseOpacity}
										style={{ pointerEvents: "none", transition: "opacity 0.2s ease" }}
									/>
								);
							})}

							{/* Event location dots in Peru */}
							{departmentEventCoords.map((coord, index) => {
								const isHovered = hoveredLocation?.department === coord.department;
								return (
									<g key={coord.department}>
										<motion.circle
											cx={coord.x}
											cy={coord.y}
											r={4}
											fill="#f59e0b"
											initial={{ scale: 0, opacity: 0 }}
											animate={{
												scale: isHovered ? [1, 1.5, 1] : [1, 1.3, 1],
												opacity: [0.9, 1, 0.9],
											}}
											transition={{
												duration: isHovered ? 1 : 2,
												repeat: Infinity,
												ease: "easeInOut",
												delay: index * 0.15,
											}}
										/>
										{isHovered && (
											<motion.circle
												cx={coord.x}
												cy={coord.y}
												r={12}
												fill="transparent"
												stroke="#f59e0b"
												strokeWidth={2}
												initial={{ scale: 0.5, opacity: 0 }}
												animate={{ scale: 1, opacity: [0.8, 0] }}
												transition={{
													duration: 1,
													repeat: Infinity,
													ease: "easeOut",
												}}
											/>
										)}
									</g>
								);
							})}
						</motion.g>
					) : (
						/* Generic zoomed country view - same style as Peru */
						<motion.g
							key={`country-${zoomedCountry}`}
							initial={{ opacity: 0, scale: 1.1 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ duration: 0.15, ease: "easeOut" }}
						>
							{/* Country border - same style as Peru departments */}
							{zoomedCountryFeature && zoomedGeoPath && (
								<path
									d={zoomedGeoPath(zoomedCountryFeature as any) || ""}
									fill="transparent"
									stroke="#666"
									strokeWidth={1.5}
									opacity={0.6}
									style={{ transition: "all 0.2s ease" }}
								/>
							)}

							{/* Dot pattern - same style as Peru */}
							{zoomedCountryDots.map((dot, index) => {
								const shouldAnimate = index % 5 === 0;
								const baseOpacity = 0.6;

								if (shouldAnimate) {
									return (
										<motion.circle
											key={index}
											cx={dot.x}
											cy={dot.y}
											r={1.5}
											className="fill-foreground"
											style={{ pointerEvents: "none" }}
											initial={{ opacity: baseOpacity }}
											animate={{
												opacity: [baseOpacity, baseOpacity + 0.3, baseOpacity],
												scale: [1, 1.3, 1],
											}}
											transition={{
												duration: 2.5,
												repeat: Infinity,
												ease: "easeInOut",
												delay: (index % 20) * 0.1,
											}}
										/>
									);
								}

								return (
									<circle
										key={index}
										cx={dot.x}
										cy={dot.y}
										r={1.5}
										className="fill-foreground"
										opacity={baseOpacity}
										style={{ pointerEvents: "none", transition: "opacity 0.2s ease" }}
									/>
								);
							})}

							{/* Event markers - same style as Peru */}
							{projectedLocations
								.filter((loc) => loc.country === zoomedCountry)
								.map((loc, index) => {
									const isHovered = loc.eventId === hoveredEventId;
									return (
										<g
											key={loc.eventId}
											style={{ cursor: "pointer" }}
											onMouseEnter={() => onEventHover(loc.eventId)}
											onMouseLeave={() => onEventHover(null)}
										>
											<motion.circle
												cx={loc.x}
												cy={loc.y}
												r={4}
												fill="#f59e0b"
												initial={{ scale: 0, opacity: 0 }}
												animate={{
													scale: isHovered ? [1, 1.5, 1] : [1, 1.3, 1],
													opacity: [0.9, 1, 0.9],
												}}
												transition={{
													duration: isHovered ? 1 : 2,
													repeat: Infinity,
													ease: "easeInOut",
													delay: index * 0.15,
												}}
											/>
											{isHovered && (
												<motion.circle
													cx={loc.x}
													cy={loc.y}
													r={12}
													fill="transparent"
													stroke="#f59e0b"
													strokeWidth={2}
													initial={{ scale: 0.5, opacity: 0 }}
													animate={{ scale: 1, opacity: [0.8, 0] }}
													transition={{
														duration: 1,
														repeat: Infinity,
														ease: "easeOut",
													}}
												/>
											)}
										</g>
									);
								})}
						</motion.g>
					)}
				</AnimatePresence>

				{/* Tooltip */}
				<AnimatePresence>
					{hoveredProjected && (
						<motion.g
							initial={{ opacity: 0, y: 10, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 5, scale: 0.95 }}
							transition={{ duration: 0.1, ease: "easeOut" }}
						>
							<rect
								x={hoveredProjected.x - 90}
								y={hoveredProjected.y - 55}
								width={180}
								height={42}
								rx={8}
								fill="hsl(var(--popover))"
								stroke="hsl(var(--border))"
								strokeWidth={1}
							/>
							<text
								x={hoveredProjected.x}
								y={hoveredProjected.y - 38}
								textAnchor="middle"
								className="fill-popover-foreground"
								style={{ fontSize: "12px", fontWeight: 500 }}
							>
								{hoveredProjected.name.length > 22
									? `${hoveredProjected.name.slice(0, 22)}...`
									: hoveredProjected.name}
							</text>
							{hoveredProjected.city && (
								<text
									x={hoveredProjected.x}
									y={hoveredProjected.y - 22}
									textAnchor="middle"
									className="fill-muted-foreground"
									style={{ fontSize: "10px" }}
								>
									📍 {hoveredProjected.city}
								</text>
							)}
						</motion.g>
					)}
				</AnimatePresence>
			</svg>
		</div>
	);
}
