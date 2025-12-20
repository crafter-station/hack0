"use client";

import * as d3 from "d3";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { feature } from "topojson-client";
import {
	LATAM_COUNTRY_IDS,
	LIMA_COORDS,
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
}

export function LatamMap({ departmentsWithEvents = [], countriesWithEvents = [] }: LatamMapProps) {
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
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				className="w-full h-full bg-transparent"
				preserveAspectRatio="xMidYMid meet"
			>
				{isZoomedIntoPeru && (
					<rect
						x={0}
						y={0}
						width={WIDTH}
						height={HEIGHT}
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
							{latamDotsData.map((country) => {
								const isHovered = hoveredCountryId === country.countryId;
								const isPeru = country.countryId === PERU_COUNTRY_ID;
								const hasEvents = countriesWithEvents.includes(country.countryId);
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
									>
										{countryFeature && (
											<path
												d={geoPath(countryFeature as any) || ""}
												fill="transparent"
												stroke={isHovered && hasEvents ? "#888" : hasEvents ? "#666" : "#444"}
												strokeWidth={isHovered && hasEvents ? 2 : hasEvents ? 1.5 : 1}
												opacity={isHovered ? 0.8 : hasEvents ? 0.6 : 0.35}
												style={{ transition: "all 0.2s ease" }}
											/>
										)}

										{country.dots.map((dot, index) => {
											const shouldAnimate = index % 5 === 0;
											const baseOpacity = isHovered && hasEvents ? 0.85 : isHovered ? 0.6 : hasEvents ? 0.6 : 0.35;

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
							{peruDepartments.map((dept, deptIndex) => {
								const deptName = dept.properties?.NOMBDEP || "";
								const normalizedName = PERU_DEPARTMENT_NAME_MAP[deptName] || deptName;
								const hasEvent = departmentsWithEvents.includes(normalizedName);

								return (
									<path
										key={dept.properties?.NOMBDEP || deptIndex}
										d={peruGeoPath(dept as any) || ""}
										fill="transparent"
										stroke={hasEvent ? "#666" : "#444"}
										strokeWidth={hasEvent ? 1.5 : 1}
										opacity={hasEvent ? 0.6 : 0.35}
										style={{ transition: "all 0.2s ease" }}
									/>
								);
							})}

							{peruDotsData.map((dot, index) => {
								const hasEvent = departmentsWithEvents.includes(dot.dept);
								const shouldAnimate = index % 5 === 0;
								const baseOpacity = hasEvent ? 0.6 : 0.35;

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
