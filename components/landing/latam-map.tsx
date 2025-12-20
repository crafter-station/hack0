"use client";

import * as d3 from "d3";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { feature } from "topojson-client";
import {
	LATAM_COUNTRY_IDS,
	LATAM_COUNTRY_NAMES,
	LIMA_COORDS,
	PERU_COUNTRY_ID,
	PERU_DEPARTMENT_COORDS,
	PERU_DEPARTMENT_NAME_MAP,
} from "@/lib/geo/peru-departments";
import worldData from "@/public/countries-110m.json";
import peruDeptData from "@/public/peru_departamental_simple.json";

interface GeoFeature {
	type: string;
	id?: string;
	geometry: any;
	properties: any;
}

interface CountryDots {
	countryId: string;
	countryName: string;
	dots: Array<{ x: number; y: number; id: string }>;
	feature: GeoFeature;
}

function generateDotsGroupedByCountry(
	geoFeatures: GeoFeature[],
	projection: d3.GeoProjection,
	dotSpacing = 0.8,
	borderInset = 0.6,
): CountryDots[] {
	const result: CountryDots[] = [];
	const minLon = -120;
	const maxLon = -30;
	const minLat = -56;
	const maxLat = 33;

	let globalIndex = 0;
	for (const geoFeature of geoFeatures) {
		const countryId = geoFeature.id || "";
		const countryName = LATAM_COUNTRY_NAMES[countryId] || countryId;
		const dots: Array<{ x: number; y: number; id: string }> = [];

		for (let lon = minLon; lon <= maxLon; lon += dotSpacing) {
			for (let lat = minLat; lat <= maxLat; lat += dotSpacing) {
				if (d3.geoContains(geoFeature as any, [lon, lat])) {
					const isNearEdge =
						!d3.geoContains(geoFeature as any, [lon + borderInset, lat]) ||
						!d3.geoContains(geoFeature as any, [lon - borderInset, lat]) ||
						!d3.geoContains(geoFeature as any, [lon, lat + borderInset]) ||
						!d3.geoContains(geoFeature as any, [lon, lat - borderInset]);

					if (!isNearEdge) {
						const coords = projection([lon, lat]);
						if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
							dots.push({
								x: coords[0],
								y: coords[1],
								id: `dot-${globalIndex++}`,
							});
						}
					}
				}
			}
		}

		result.push({ countryId, countryName, dots, feature: geoFeature });
	}

	return result;
}

function generateDotsForPeru(
	peruFeatures: GeoFeature[],
	projection: d3.GeoProjection,
	dotSpacing = 0.5,
	borderInset = 0.2,
): Array<{ x: number; y: number; id: string; department: string }> {
	const dots: Array<{ x: number; y: number; id: string; department: string }> =
		[];
	const minLon = -82;
	const maxLon = -68;
	const minLat = -19;
	const maxLat = 1;

	let index = 0;
	for (let lon = minLon; lon <= maxLon; lon += dotSpacing) {
		for (let lat = minLat; lat <= maxLat; lat += dotSpacing) {
			for (const deptFeature of peruFeatures) {
				if (d3.geoContains(deptFeature as any, [lon, lat])) {
					let isNearBorder = false;
					for (const otherDept of peruFeatures) {
						if (
							otherDept.properties?.NOMBDEP === deptFeature.properties?.NOMBDEP
						)
							continue;
						if (
							d3.geoContains(otherDept as any, [lon + borderInset, lat]) ||
							d3.geoContains(otherDept as any, [lon - borderInset, lat]) ||
							d3.geoContains(otherDept as any, [lon, lat + borderInset]) ||
							d3.geoContains(otherDept as any, [lon, lat - borderInset])
						) {
							isNearBorder = true;
							break;
						}
					}

					if (!isNearBorder) {
						const coords = projection([lon, lat]);
						if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
							const deptName = deptFeature.properties?.NOMBDEP || "";
							dots.push({
								x: coords[0],
								y: coords[1],
								id: `peru-dot-${index++}`,
								department: PERU_DEPARTMENT_NAME_MAP[deptName] || deptName,
							});
						}
					}
					break;
				}
			}
		}
	}

	return dots;
}

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

function StaticDot({
	x,
	y,
	isHovered,
}: {
	x: number;
	y: number;
	isHovered: boolean;
}) {
	return (
		<circle
			cx={x}
			cy={y}
			r={1.5}
			className="fill-foreground"
			opacity={isHovered ? 0.6 : 0.35}
			style={{ transition: "opacity 0.2s" }}
		/>
	);
}

function AnimatedDot({
	x,
	y,
	delay,
	isHovered,
}: {
	x: number;
	y: number;
	delay: number;
	isHovered: boolean;
}) {
	return (
		<motion.circle
			cx={x}
			cy={y}
			r={1.5}
			className="fill-foreground"
			initial={{ scale: 1, opacity: 0.5 }}
			animate={{
				scale: [1, 1.4, 1],
				opacity: isHovered ? [0.5, 0.8, 0.5] : [0.35, 0.6, 0.35],
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
}

export function LatamMap({ departmentsWithEvents = [] }: LatamMapProps) {
	const width = 1000;
	const height = 1100;

	const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
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
			.translate([width / 2, height / 2]);
	}, []);

	const peruProjection = useMemo(() => {
		return d3
			.geoEquirectangular()
			.scale(3145)
			.center([-75, -9])
			.translate([width / 2, height / 2]);
	}, []);

	const countryDotsData = useMemo(() => {
		if (countriesData.length === 0) return [];
		return generateDotsGroupedByCountry(countriesData, projection, 0.8, 0.3);
	}, [countriesData, projection]);

	const peruDots = useMemo(() => {
		if (peruDepartments.length === 0) return [];
		return generateDotsForPeru(peruDepartments, peruProjection, 0.22);
	}, [peruDepartments, peruProjection]);

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

	const limaProjectedCoords = useMemo(() => {
		const coords = projection(LIMA_COORDS);
		return coords ? { x: coords[0], y: coords[1] } : null;
	}, [projection]);

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
				viewBox={`0 0 ${width} ${height}`}
				className="w-full h-full bg-transparent"
				preserveAspectRatio="xMidYMid meet"
			>
				{isZoomedIntoPeru && (
					<rect
						x={0}
						y={0}
						width={width}
						height={height}
						fill="transparent"
						onClick={handleBackClick}
						style={{ cursor: "zoom-out" }}
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
							{countryDotsData.map((country) => {
								const isHovered = hoveredCountryId === country.countryId;
								const isPeru = country.countryId === PERU_COUNTRY_ID;

								return (
									<g
										key={country.countryId}
										onMouseEnter={() => setHoveredCountryId(country.countryId)}
										onMouseLeave={() => setHoveredCountryId(null)}
										onClick={() => handleCountryClick(country.countryId)}
										style={{ cursor: isPeru ? "pointer" : "default" }}
									>
										<path
											d={geoPath(country.feature as any) || ""}
											fill="transparent"
											className="stroke-foreground"
											strokeWidth={1}
											opacity={0.4}
										/>

										{country.dots.map((dot, index) => {
											if (index % 4 === 0) {
												return (
													<AnimatedDot
														key={dot.id}
														x={dot.x}
														y={dot.y}
														delay={(index % 15) * 0.12}
														isHovered={isHovered}
													/>
												);
											}
											return (
												<StaticDot
													key={dot.id}
													x={dot.x}
													y={dot.y}
													isHovered={isHovered}
												/>
											);
										})}
									</g>
								);
							})}

							{limaProjectedCoords && (
								<EventLocationDot
									x={limaProjectedCoords.x}
									y={limaProjectedCoords.y}
								/>
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
							{peruDepartments.map((dept, deptIndex) => (
								<path
									key={dept.properties?.NOMBDEP || deptIndex}
									d={peruGeoPath(dept as any) || ""}
									fill="transparent"
									className="stroke-foreground"
									strokeWidth={1}
									opacity={0.4}
								/>
							))}

							{peruDots.map((dot, index) => {
								const hasEvent = departmentsWithEvents.includes(dot.department);
								if (index % 3 === 0) {
									return (
										<AnimatedDot
											key={dot.id}
											x={dot.x}
											y={dot.y}
											delay={(index % 20) * 0.1}
											isHovered={hasEvent}
										/>
									);
								}
								return (
									<StaticDot
										key={dot.id}
										x={dot.x}
										y={dot.y}
										isHovered={hasEvent}
									/>
								);
							})}

							{departmentEventCoords.map((coord, index) => (
								<EventLocationDot
									key={coord.department}
									x={coord.x}
									y={coord.y}
									delay={index * 0.15}
								/>
							))}
						</motion.g>
					)}
				</AnimatePresence>
			</svg>
		</div>
	);
}

export default LatamMap;
