"use client";

import * as d3 from "d3";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { EventLocation } from "@/lib/actions/events";
import {
	KNOWN_CITY_COORDS,
	LATAM_CAPITAL_COORDS,
	LATAM_COUNTRY_IDS,
	PERU_COUNTRY_ID,
	PERU_DEPARTMENT_COORDS,
	PERU_DEPARTMENT_NAME_MAP,
} from "@/lib/geo/peru-departments";
import worldData from "@/public/countries-110m.json";
import latamDotsData from "@/public/latam-dots.json";
import peruDeptData from "@/public/peru_departamental_simple.json";
import peruDotsData from "@/public/peru-dots.json";

interface GeoFeature {
	type: string;
	id?: string;
	geometry: any;
	properties: any;
}

const WIDTH = 1000;
const HEIGHT = 1100;

function EventLocationDot({
	x,
	y,
	delay = 0,
}: {
	x: number;
	y: number;
	delay?: number;
}) {
	return (
		<motion.circle
			cx={x}
			cy={y}
			r={4}
			fill="#f59e0b"
			initial={{ scale: 0, opacity: 0 }}
			animate={{
				scale: [1, 1.3, 1],
				opacity: [0.9, 1, 0.9],
			}}
			transition={{
				duration: 2,
				repeat: Number.POSITIVE_INFINITY,
				ease: "easeInOut",
				delay,
			}}
		/>
	);
}

interface LatamMapProps {
	departmentsWithEvents?: string[];
	countriesWithEvents?: string[];
	eventLocations?: EventLocation[];
}

export function LatamMap({
	departmentsWithEvents = [],
	countriesWithEvents = [],
	eventLocations = [],
}: LatamMapProps) {
	const router = useRouter();
	const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
	const [hoveredDepartment, setHoveredDepartment] = useState<string | null>(
		null,
	);
	const [zoomedCountryId, setZoomedCountryId] = useState<string | null>(null);

	const countriesData = useMemo(() => {
		const countries = feature(
			worldData as any,
			(worldData as any).objects.countries,
		).features;
		return countries.filter((c: any) =>
			LATAM_COUNTRY_IDS.includes(c.id),
		) as GeoFeature[];
	}, []);

	const peruDepartments = useMemo(() => {
		return feature(
			peruDeptData as any,
			(peruDeptData as any).objects.peru_departamental_simple,
		).features as GeoFeature[];
	}, []);

	const projection = useMemo(() => {
		return d3
			.geoEquirectangular()
			.scale(750)
			.center([-70, -15])
			.translate([WIDTH / 2, HEIGHT / 2]);
	}, []);

	const peruProjection = useMemo(() => {
		return d3
			.geoEquirectangular()
			.scale(3145)
			.center([-75, -9])
			.translate([WIDTH / 2, HEIGHT / 2]);
	}, []);

	const geoPath = useMemo(() => {
		return d3.geoPath().projection(projection);
	}, [projection]);

	const peruGeoPath = useMemo(() => {
		return d3.geoPath().projection(peruProjection);
	}, [peruProjection]);

	const handleCountryClick = useCallback((countryId: string) => {
		if (countryId === PERU_COUNTRY_ID) {
			setZoomedCountryId(countryId);
			setHoveredCountryId(null);
		}
	}, []);

	const handleBackClick = useCallback(() => {
		setZoomedCountryId(null);
	}, []);

	const eventMarkerCoords = useMemo(() => {
		const seen = new Set<string>();
		const markers: Array<{ x: number; y: number; key: string }> = [];

		for (const loc of eventLocations) {
			let coords: [number, number] | null = null;

			if (loc.lat && loc.lon) {
				coords = [loc.lon, loc.lat];
			} else if (loc.city) {
				const cityKey = `${loc.city.toLowerCase()}-${loc.country}`;
				coords = KNOWN_CITY_COORDS[cityKey] || null;
			}

			if (!coords) {
				coords = LATAM_CAPITAL_COORDS[loc.country] || null;
			}

			if (!coords) continue;

			const dedupKey = `${coords[0].toFixed(2)},${coords[1].toFixed(2)}`;
			if (seen.has(dedupKey)) continue;
			seen.add(dedupKey);

			const projected = projection(coords);
			if (!projected) continue;

			markers.push({ x: projected[0], y: projected[1], key: dedupKey });
		}

		return markers;
	}, [eventLocations, projection]);

	const departmentEventCoords = useMemo(() => {
		return departmentsWithEvents
			.map((dept) => {
				const coords = PERU_DEPARTMENT_COORDS[dept];
				if (!coords) return null;
				const projected = peruProjection(coords);
				if (!projected) return null;
				return { department: dept, x: projected[0], y: projected[1] };
			})
			.filter(Boolean) as Array<{ department: string; x: number; y: number }>;
	}, [departmentsWithEvents, peruProjection]);

	const isZoomedIntoPeru = zoomedCountryId === PERU_COUNTRY_ID;

	return (
		<div className="relative flex items-center justify-center w-full h-full">
			<svg
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				className="w-full h-full bg-transparent"
				preserveAspectRatio="xMidYMid meet"
				role="img"
				aria-label={
					isZoomedIntoPeru
						? "Mapa interactivo de Perú mostrando departamentos con eventos tech"
						: "Mapa interactivo de Latinoamérica mostrando países con eventos tech"
				}
			>
				<title>
					{isZoomedIntoPeru
						? "Mapa de Perú con departamentos destacados que tienen eventos tecnológicos"
						: "Mapa de Latinoamérica con países destacados que tienen eventos tecnológicos"}
				</title>
				{isZoomedIntoPeru && (
					<rect
						x={0}
						y={0}
						width={WIDTH}
						height={HEIGHT}
						fill="transparent"
						onClick={handleBackClick}
						style={{ cursor: "zoom-out" }}
						aria-label="Hacer clic para volver al mapa de Latinoamérica"
					/>
				)}

				<AnimatePresence mode="wait">
					{!isZoomedIntoPeru ? (
						<motion.g
							key="latam-view"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.4 }}
						>
							{latamDotsData.map((country) => {
								const isHovered = hoveredCountryId === country.countryId;
								const isPeru = country.countryId === PERU_COUNTRY_ID;
								const hasEvents = countriesWithEvents.includes(
									country.countryId,
								);
								const countryFeature = countriesData.find(
									(c) => c.id === country.countryId,
								);

								return (
									<g
										key={country.countryId}
										onMouseEnter={() => setHoveredCountryId(country.countryId)}
										onMouseLeave={() => setHoveredCountryId(null)}
										onClick={() => handleCountryClick(country.countryId)}
										style={{ cursor: isPeru ? "pointer" : "default" }}
										aria-label={
											isPeru
												? "Hacer clic para ampliar mapa de Perú"
												: hasEvents
													? `País con eventos tecnológicos`
													: undefined
										}
									>
										{countryFeature && (
											<path
												d={geoPath(countryFeature as any) || ""}
												fill="transparent"
												className={
													hasEvents
														? "stroke-foreground/40"
														: "stroke-foreground/10"
												}
												strokeWidth={
													isHovered && hasEvents ? 2 : hasEvents ? 1.5 : 0.5
												}
												opacity={isHovered ? 1 : hasEvents ? 0.85 : 0.3}
												style={{ transition: "all 0.2s ease" }}
											/>
										)}

										{country.dots.map((dot, index) => {
											const shouldAnimate = index % 5 === 0;
											const baseOpacity =
												isHovered && hasEvents
													? 0.9
													: isHovered
														? 0.5
														: hasEvents
															? 0.75
															: 0.25;

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
															opacity: [
																baseOpacity,
																baseOpacity + 0.3,
																baseOpacity,
															],
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

							{eventMarkerCoords.length > 0 && (
								<g>
									{eventMarkerCoords.map((marker, index) => (
										<EventLocationDot
											key={marker.key}
											x={marker.x}
											y={marker.y}
											delay={index * 0.2}
										/>
									))}
								</g>
							)}
						</motion.g>
					) : (
						<motion.g
							key="peru-view"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.4 }}
							onClick={(e) => e.stopPropagation()}
						>
							{peruDepartments.map((dept, deptIndex) => {
								const deptName = dept.properties?.NOMBDEP || "";
								const normalizedName =
									PERU_DEPARTMENT_NAME_MAP[deptName] || deptName;
								const hasEvent = departmentsWithEvents.includes(normalizedName);
								const isHovered = hoveredDepartment === normalizedName;

								return (
									<path
										key={dept.properties?.NOMBDEP || deptIndex}
										d={peruGeoPath(dept as any) || ""}
										fill="transparent"
										className={
											hasEvent ? "stroke-foreground/40" : "stroke-foreground/10"
										}
										strokeWidth={
											isHovered && hasEvent ? 2 : hasEvent ? 1.5 : 0.5
										}
										opacity={isHovered ? 1 : hasEvent ? 0.85 : 0.3}
										style={{
											cursor: hasEvent ? "pointer" : "default",
											transition: "all 0.2s ease",
										}}
										onMouseEnter={() => setHoveredDepartment(normalizedName)}
										onMouseLeave={() => setHoveredDepartment(null)}
										onClick={() => {
											if (hasEvent) {
												router.push(
													`/events?department=${encodeURIComponent(normalizedName)}`,
												);
											}
										}}
										aria-label={
											hasEvent
												? `${normalizedName}: departamento con eventos. Hacer clic para ver eventos`
												: undefined
										}
									/>
								);
							})}

							{peruDotsData.map((dot, index) => {
								const hasEvent = departmentsWithEvents.includes(dot.dept);
								const isHovered = hoveredDepartment === dot.dept;
								const shouldAnimate = index % 5 === 0;
								const baseOpacity =
									isHovered && hasEvent
										? 0.9
										: isHovered
											? 0.5
											: hasEvent
												? 0.75
												: 0.25;

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
										style={{
											pointerEvents: "none",
											transition: "opacity 0.2s ease",
										}}
									/>
								);
							})}

							<g>
								{departmentEventCoords.map((coord, index) => (
									<EventLocationDot
										key={coord.department}
										x={coord.x}
										y={coord.y}
										delay={index * 0.15}
									/>
								))}
							</g>
						</motion.g>
					)}
				</AnimatePresence>
			</svg>
		</div>
	);
}

export default LatamMap;
