"use client";

import { ExternalLink, MapPin } from "lucide-react";
import {
	Map,
	MapMarker,
	MarkerContent,
	MarkerPopup,
	MapControls,
} from "@/components/ui/map";
import {
	PERU_DEPARTMENT_COORDS,
	LIMA_COORDS,
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
	country: string | null
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
	city: string | null
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
		country
	);

	if (!coordinates) {
		return null;
	}

	const hasExactLocation = !!(geoLatitude && geoLongitude);
	const zoomLevel = hasExactLocation ? 15 : 10;
	const googleMapsUrl = getGoogleMapsUrl(coordinates, venue, city);

	return (
		<div className="rounded-lg border bg-card overflow-hidden">
			<div className="px-5 py-4 border-b">
				<div className="flex items-center gap-2">
					<MapPin className="h-4 w-4 text-muted-foreground" />
					<h3 className="text-sm font-semibold">Ubicación</h3>
				</div>
			</div>
			<div className="h-[200px] w-full">
				<Map center={coordinates} zoom={zoomLevel}>
					<MapMarker longitude={coordinates[0]} latitude={coordinates[1]}>
						<MarkerContent>
							<div className="size-4 rounded-full bg-primary border-2 border-background shadow-lg" />
						</MarkerContent>
						<MarkerPopup className="w-56 p-0">
							<div className="space-y-2">
								<p className="font-medium text-sm line-clamp-2">{eventName}</p>
								{venue && (
									<p className="text-xs text-muted-foreground">{venue}</p>
								)}
								<p className="text-xs text-muted-foreground">
									{city}
									{city && department && city !== department && `, ${department}`}
								</p>
								<a
									href={googleMapsUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-1.5 text-xs text-primary hover:underline"
								>
									<ExternalLink className="h-3 w-3" />
									Ver en Google Maps
								</a>
							</div>
						</MarkerPopup>
					</MapMarker>
					<MapControls position="bottom-right" showZoom />
				</Map>
			</div>
			{!hasExactLocation && (
				<div className="px-5 py-2 border-t bg-muted/30">
					<p className="text-xs text-muted-foreground">
						Ubicación aproximada ({department || city})
					</p>
				</div>
			)}
		</div>
	);
}
