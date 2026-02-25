"use client";

import { Check, Loader2, MapPin, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Map as MapComponent,
	MapControls,
	MapMarker,
	MarkerContent,
	useMap,
} from "@/components/ui/map";
import {
	extractCity,
	extractDepartment,
	formatDisplayName,
	type NominatimResult,
	searchLocation,
} from "@/lib/geo/nominatim";

interface LocationInputProps {
	department: string;
	city: string;
	venue: string;
	geoLatitude: string | null;
	geoLongitude: string | null;
	onDepartmentChange: (value: string) => void;
	onCityChange: (value: string) => void;
	onVenueChange: (value: string) => void;
	onCoordinatesChange: (lat: string | null, lng: string | null) => void;
}

const LIMA_COORDS = { lat: -12.0464, lng: -77.0428 };
const DEBOUNCE_MS = 500;

function MapFlyTo({
	target,
	zoom = 16,
}: {
	target: { lat: number; lng: number } | null;
	zoom?: number;
}) {
	const { map, isLoaded } = useMap();
	const lastTargetRef = useRef<string | null>(null);

	useEffect(() => {
		if (!isLoaded || !map || !target) return;

		const targetKey = `${target.lat},${target.lng}`;
		if (lastTargetRef.current === targetKey) return;

		lastTargetRef.current = targetKey;
		map.flyTo({
			center: [target.lng, target.lat],
			zoom,
			duration: 1500,
		});
	}, [isLoaded, map, target, zoom]);

	return null;
}

export function LocationInput({
	department,
	city,
	venue,
	geoLatitude,
	geoLongitude,
	onDepartmentChange,
	onCityChange,
	onVenueChange,
	onCoordinatesChange,
}: LocationInputProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [results, setResults] = useState<NominatimResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
		() => {
			if (geoLatitude && geoLongitude) {
				return { lat: parseFloat(geoLatitude), lng: parseFloat(geoLongitude) };
			}
			return LIMA_COORDS;
		},
	);
	const [markerPosition, setMarkerPosition] = useState<{
		lat: number;
		lng: number;
	} | null>(() => {
		if (geoLatitude && geoLongitude) {
			return { lat: parseFloat(geoLatitude), lng: parseFloat(geoLongitude) };
		}
		return null;
	});
	const [flyToTarget, setFlyToTarget] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const searchContainerRef = useRef<HTMLDivElement>(null);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	const handleSearch = useCallback(async (query: string) => {
		if (query.length < 3) {
			setResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const searchResults = await searchLocation(query, {
				limit: 5,
				countrycodes: "pe",
			});
			setResults(searchResults);
		} catch (error) {
			console.error("Search error:", error);
			setResults([]);
		} finally {
			setIsSearching(false);
		}
	}, []);

	const handleQueryChange = useCallback(
		(value: string) => {
			setSearchQuery(value);
			setShowResults(true);

			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			debounceRef.current = setTimeout(() => {
				handleSearch(value);
			}, DEBOUNCE_MS);
		},
		[handleSearch],
	);

	const handleSelectResult = useCallback(
		(result: NominatimResult) => {
			const lat = parseFloat(result.lat);
			const lng = parseFloat(result.lon);

			setMarkerPosition({ lat, lng });
			setMapCenter({ lat, lng });
			setFlyToTarget({ lat, lng });
			onCoordinatesChange(result.lat, result.lon);

			const extractedCity = extractCity(result.address);
			const extractedDepartment = extractDepartment(result.address);

			if (extractedDepartment && !department) {
				onDepartmentChange(extractedDepartment);
			}
			if (extractedCity && !city) {
				onCityChange(extractedCity);
			}

			const venueParts: string[] = [];
			if (result.address.road) {
				venueParts.push(result.address.road);
			}
			if (result.address.neighbourhood || result.address.suburb) {
				venueParts.push(
					result.address.neighbourhood || result.address.suburb || "",
				);
			}
			if (venueParts.length > 0 && !venue) {
				onVenueChange(venueParts.join(", "));
			}

			setSearchQuery("");
			setResults([]);
			setShowResults(false);
		},
		[
			department,
			city,
			venue,
			onDepartmentChange,
			onCityChange,
			onVenueChange,
			onCoordinatesChange,
		],
	);

	const handleMarkerDragEnd = useCallback(
		(lngLat: { lng: number; lat: number }) => {
			setMarkerPosition({ lat: lngLat.lat, lng: lngLat.lng });
			onCoordinatesChange(lngLat.lat.toString(), lngLat.lng.toString());
		},
		[onCoordinatesChange],
	);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				searchContainerRef.current &&
				!searchContainerRef.current.contains(event.target as Node)
			) {
				setShowResults(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const hasCoordinates = markerPosition !== null;
	const zoom = hasCoordinates ? 16 : 11;

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<MapPin className="h-4 w-4" />
				Ubicación
			</div>

			<div className="rounded-lg border bg-card overflow-hidden transition-colors has-[:focus]:border-primary/50 has-[:focus]:ring-1 has-[:focus]:ring-primary/20">
				<div className="p-4 space-y-4">
					<div ref={searchContainerRef} className="relative">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(e) => handleQueryChange(e.target.value)}
								onFocus={() => results.length > 0 && setShowResults(true)}
								placeholder="Buscar ubicación..."
								className="pl-9 pr-9"
							/>
							{isSearching && (
								<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
							)}
						</div>

						{showResults && results.length > 0 && (
							<div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
								<ul className="max-h-60 overflow-auto py-1">
									{results.map((result) => {
										const formatted = formatDisplayName(result);
										return (
											<li key={result.place_id}>
												<button
													type="button"
													onClick={() => handleSelectResult(result)}
													className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-start gap-2"
												>
													<MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
													<div className="min-w-0 flex-1">
														<p className="text-sm font-medium truncate">
															{formatted.name}
														</p>
														{formatted.address && (
															<p className="text-xs text-muted-foreground truncate">
																{formatted.address}
															</p>
														)}
													</div>
												</button>
											</li>
										);
									})}
								</ul>
							</div>
						)}

						{showResults &&
							searchQuery.length >= 3 &&
							!isSearching &&
							results.length === 0 && (
								<div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg p-3 text-sm text-muted-foreground">
									No se encontraron resultados
								</div>
							)}
					</div>

					<div className="h-[200px] rounded-lg overflow-hidden border">
						<MapComponent center={[mapCenter.lng, mapCenter.lat]} zoom={zoom}>
							<MapFlyTo target={flyToTarget} zoom={16} />
							{markerPosition && (
								<MapMarker
									longitude={markerPosition.lng}
									latitude={markerPosition.lat}
									draggable
									onDragEnd={handleMarkerDragEnd}
								>
									<MarkerContent>
										<div className="relative">
											<div className="h-6 w-6 rounded-full border-2 border-white bg-primary shadow-lg flex items-center justify-center">
												<MapPin className="h-3.5 w-3.5 text-primary-foreground" />
											</div>
											<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45 border-r border-b border-white" />
										</div>
									</MarkerContent>
								</MapMarker>
							)}
							<MapControls
								position="bottom-right"
								showZoom
								showLocate
								onLocate={(coords) => {
									const lat = coords.latitude;
									const lng = coords.longitude;
									setMarkerPosition({ lat, lng });
									setMapCenter({ lat, lng });
									setFlyToTarget({ lat, lng });
									onCoordinatesChange(lat.toString(), lng.toString());
								}}
							/>
						</MapComponent>
					</div>

					{hasCoordinates ? (
						<p className="text-xs text-muted-foreground flex items-center gap-1">
							<Check className="h-3 w-3 text-emerald-500" />
							Coordenadas: {markerPosition.lat.toFixed(6)},{" "}
							{markerPosition.lng.toFixed(6)}
							<span className="text-muted-foreground/60 ml-1">
								— Arrastra el pin para ajustar
							</span>
						</p>
					) : (
						<p className="text-xs text-muted-foreground">
							Busca una ubicación o usa el botón de ubicación para marcar el
							lugar del evento
						</p>
					)}
				</div>

				<div className="border-t p-4 space-y-4 bg-muted/30">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="group space-y-2">
							<label
								htmlFor="department"
								className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
							>
								Departamento
							</label>
							<Input
								id="department"
								value={department}
								onChange={(e) => onDepartmentChange(e.target.value)}
								placeholder="Lima, Arequipa..."
								className="border-0 shadow-none px-2 py-1.5 h-auto text-base font-medium focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
							/>
						</div>

						<div className="group space-y-2">
							<label
								htmlFor="city"
								className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
							>
								Ciudad / Distrito
							</label>
							<Input
								id="city"
								value={city}
								onChange={(e) => onCityChange(e.target.value)}
								placeholder="San Isidro, Miraflores..."
								className="border-0 shadow-none px-2 py-1.5 h-auto text-base font-medium focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
							/>
						</div>
					</div>

					<div className="group space-y-2">
						<label
							htmlFor="venue"
							className="text-xs text-muted-foreground uppercase tracking-wide group-has-[:focus]:text-primary transition-colors"
						>
							Lugar específico
						</label>
						<Input
							id="venue"
							value={venue}
							onChange={(e) => onVenueChange(e.target.value)}
							placeholder="Universidad del Pacífico, WeWork, Centro Cultural..."
							className="border-0 shadow-none px-2 py-1.5 h-auto text-base font-medium focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
