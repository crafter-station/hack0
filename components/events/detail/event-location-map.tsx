"use client";

import { MapPin, Navigation } from "lucide-react";
import {
	Map as MapComponent,
	MapControls,
	MapMarker,
	MarkerContent,
} from "@/components/ui/map";
import {
	LIMA_COORDS,
	PERU_DEPARTMENT_COORDS,
} from "@/lib/geo/peru-departments";

interface EventLocationMapProps {
	eventName: string;
	venue: string | null;
	city: string | null;
	department: string | null;
	country: string | null;
	geoLatitude: string | null;
	geoLongitude: string | null;
	format: "virtual" | "in-person" | "hybrid" | null;
}

function getEventCoordinates(
	geoLatitude: string | null,
	geoLongitude: string | null,
	department: string | null,
	country: string | null,
): [number, number] | null {
	if (geoLatitude && geoLongitude) {
		const lat = Number.parseFloat(geoLatitude);
		const lng = Number.parseFloat(geoLongitude);
		if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
			return [lng, lat];
		}
	}

	if (country === "PE" && department) {
		const coords = PERU_DEPARTMENT_COORDS[department];
		if (coords) return coords;
	}

	if (country === "PE") {
		return LIMA_COORDS;
	}

	return null;
}

function getGoogleMapsUrl(
	coords: [number, number],
	venue: string | null,
	city: string | null,
): string {
	const query =
		[venue, city].filter(Boolean).join(", ") || `${coords[1]},${coords[0]}`;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function EventLocationMap({
	eventName,
	venue,
	city,
	department,
	country,
	geoLatitude,
	geoLongitude,
	format,
}: EventLocationMapProps) {
	if (format === "virtual") {
		return null;
	}

	const coordinates = getEventCoordinates(
		geoLatitude,
		geoLongitude,
		department,
		country,
	);

	if (!coordinates) {
		return null;
	}

	const hasExactLocation = !!(geoLatitude && geoLongitude);
	const zoomLevel = hasExactLocation ? 15 : 10;
	const googleMapsUrl = getGoogleMapsUrl(coordinates, venue, city);

	return (
		<div className="rounded-lg border bg-card overflow-hidden">
			<div className="h-[180px] w-full relative">
				<MapComponent center={coordinates} zoom={zoomLevel}>
					<MapMarker longitude={coordinates[0]} latitude={coordinates[1]}>
						<MarkerContent>
							<div className="relative">
								<div className="size-5 rounded-full bg-primary border-2 border-background shadow-lg flex items-center justify-center">
									<MapPin className="h-3 w-3 text-primary-foreground" />
								</div>
								<div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rotate-45" />
							</div>
						</MarkerContent>
					</MapMarker>
					<MapControls position="bottom-right" showZoom />
				</MapComponent>
				<a
					href={googleMapsUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="absolute top-2 right-2 flex items-center gap-1.5 text-xs bg-background/90 backdrop-blur-sm px-2.5 py-1.5 rounded-md border shadow-sm hover:bg-background transition-colors"
				>
					<Navigation className="h-3.5 w-3.5" />
					Cómo llegar
				</a>
			</div>
			<div className="px-4 py-3 border-t">
				{venue && <p className="font-medium text-sm">{venue}</p>}
				<p className="text-xs text-muted-foreground">
					{city}
					{city && department && city !== department && `, ${department}`}
				</p>
				{!hasExactLocation && (
					<p className="text-xs text-amber-600 mt-1">Ubicación aproximada</p>
				)}
			</div>
		</div>
	);
}
