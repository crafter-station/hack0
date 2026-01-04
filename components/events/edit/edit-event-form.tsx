"use client";

import { ImageIcon, Loader2, Pencil, Tag, Video, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateEvent } from "@/lib/actions/claims";
import type { EventSponsorWithOrg } from "@/lib/actions/events";
import type { Event } from "@/lib/db/schema";
import { EVENT_TYPE_OPTIONS, SKILL_LEVEL_OPTIONS } from "@/lib/event-utils";
import { DateRangeInput } from "./date-range-input";
import { FormatSelector } from "./format-selector";
import { LinksInput } from "./links-input";
import { LocationInput } from "./location-input";
import { PrizeInput } from "./prize-input";
import { SponsorManager } from "./sponsor-manager";

const utcToLimaDatetimeLocal = (utcDate: Date | string): string => {
	const date = new Date(utcDate);
	const limaOffset = -5 * 60;
	const localTime = date.getTime();
	const localOffset = date.getTimezoneOffset() * 60000;
	const utc = localTime + localOffset;
	const limaTime = new Date(utc + limaOffset * 60000);
	return limaTime.toISOString().slice(0, 16);
};

const limaDatetimeLocalToUTC = (datetimeLocal: string): Date => {
	const [datePart, timePart] = datetimeLocal.split("T");
	const limaDateString = `${datePart}T${timePart}:00-05:00`;
	return new Date(limaDateString);
};

interface EditEventFormProps {
	event: Event;
	sponsors: EventSponsorWithOrg[];
	onSuccess?: () => void;
}

export function EditEventForm({
	event,
	sponsors,
	onSuccess,
}: EditEventFormProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [name, setName] = useState(event.name);
	const [description, setDescription] = useState(event.description || "");
	const [startDate, setStartDate] = useState(
		event.startDate ? utcToLimaDatetimeLocal(event.startDate) : "",
	);
	const [endDate, setEndDate] = useState(
		event.endDate ? utcToLimaDatetimeLocal(event.endDate) : "",
	);
	const [registrationDeadline, setRegistrationDeadline] = useState(
		event.registrationDeadline
			? utcToLimaDatetimeLocal(event.registrationDeadline)
			: "",
	);
	const [format, setFormat] = useState<"virtual" | "in-person" | "hybrid">(
		event.format || "virtual",
	);
	const [department, setDepartment] = useState(event.department || "");
	const [city, setCity] = useState(event.city || "");
	const [venue, setVenue] = useState(event.venue || "");
	const [geoLatitude, setGeoLatitude] = useState<string | null>(
		event.geoLatitude || null,
	);
	const [geoLongitude, setGeoLongitude] = useState<string | null>(
		event.geoLongitude || null,
	);
	const [meetingUrl, setMeetingUrl] = useState(event.meetingUrl || "");
	const [prizePool, setPrizePool] = useState(event.prizePool?.toString() || "");
	const [prizeCurrency, setPrizeCurrency] = useState<"USD" | "PEN">(
		event.prizeCurrency || "USD",
	);
	const [prizeDescription, setPrizeDescription] = useState(
		event.prizeDescription || "",
	);
	const [websiteUrl, setWebsiteUrl] = useState(event.websiteUrl || "");
	const [registrationUrl, setRegistrationUrl] = useState(
		event.registrationUrl || "",
	);
	const [eventImageUrl, setEventImageUrl] = useState(event.eventImageUrl || "");
	const [eventType, setEventType] = useState<string>(
		event.eventType || "hackathon",
	);
	const [skillLevel, setSkillLevel] = useState<string>(
		event.skillLevel || "all",
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		setLoading(true);

		const result = await updateEvent({
			eventId: event.id,
			name,
			description: description || undefined,
			startDate: startDate ? limaDatetimeLocalToUTC(startDate) : null,
			endDate: endDate ? limaDatetimeLocalToUTC(endDate) : null,
			registrationDeadline: registrationDeadline
				? limaDatetimeLocalToUTC(registrationDeadline)
				: null,
			format,
			department: department || undefined,
			city: city || undefined,
			venue: venue || undefined,
			timezone: "America/Lima",
			geoLatitude: geoLatitude || null,
			geoLongitude: geoLongitude || null,
			meetingUrl: meetingUrl || null,
			prizePool: prizePool ? parseInt(prizePool, 10) : null,
			prizeCurrency,
			prizeDescription: prizeDescription || undefined,
			websiteUrl: websiteUrl || undefined,
			registrationUrl: registrationUrl || undefined,
			eventImageUrl: eventImageUrl || undefined,
			eventType,
			skillLevel,
		});

		setLoading(false);

		if (result.success) {
			setSuccess(true);
			onSuccess?.();
		} else {
			setError(result.error || "Error al guardar los cambios");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{error && (
				<div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600">
					{error}
				</div>
			)}

			{success && (
				<div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600">
					✓ Cambios guardados exitosamente
				</div>
			)}

			<div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
				<FieldGroup className="gap-8">
					<Field>
						<FieldLabel htmlFor="name">
							<Pencil className="h-4 w-4" />
							Nombre del evento
						</FieldLabel>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							placeholder="Ej: HackLima 2024"
							className="text-base"
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor="description">
							<Pencil className="h-4 w-4" />
							Descripción
						</FieldLabel>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
							placeholder="Describe tu evento..."
							className="resize-none"
						/>
						<FieldDescription>
							Información general sobre el evento
						</FieldDescription>
					</Field>

					<div className="space-y-3">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Tag className="h-4 w-4" />
							Clasificación
						</div>

						<div className="rounded-lg border bg-card p-6 space-y-4">
							<div className="grid sm:grid-cols-2 gap-4">
								<Field>
									<FieldLabel htmlFor="eventType">Tipo de evento</FieldLabel>
									<SearchableSelect
										options={EVENT_TYPE_OPTIONS}
										value={eventType}
										onValueChange={setEventType}
										placeholder="Seleccionar tipo..."
										searchPlaceholder="Buscar tipo de evento..."
										emptyMessage="No se encontró ningún tipo"
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="skillLevel">Nivel requerido</FieldLabel>
									<Select value={skillLevel} onValueChange={setSkillLevel}>
										<SelectTrigger id="skillLevel">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{SKILL_LEVEL_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							</div>

							{eventType === "hackathon" && (
								<PrizeInput
									prizePool={prizePool}
									prizeCurrency={prizeCurrency}
									prizeDescription={prizeDescription}
									onPrizePoolChange={setPrizePool}
									onPrizeCurrencyChange={setPrizeCurrency}
									onPrizeDescriptionChange={setPrizeDescription}
								/>
							)}
						</div>
					</div>

					<DateRangeInput
						startDate={startDate}
						endDate={endDate}
						registrationDeadline={registrationDeadline}
						onStartDateChange={setStartDate}
						onEndDateChange={setEndDate}
						onRegistrationDeadlineChange={setRegistrationDeadline}
					/>

					<FormatSelector value={format} onChange={setFormat} />

					{(format === "virtual" || format === "hybrid") && (
						<div className="space-y-3">
							<div className="flex items-center gap-2 text-sm font-medium">
								<Video className="h-4 w-4" />
								Link de la reunión
							</div>
							<div className="rounded-lg border bg-card p-4 space-y-3">
								<Input
									value={meetingUrl}
									onChange={(e) => setMeetingUrl(e.target.value)}
									placeholder="https://zoom.us/j/... o https://meet.google.com/..."
									type="url"
								/>
								<p className="text-xs text-muted-foreground">
									Link de Zoom, Google Meet, Teams, etc.
								</p>
							</div>
						</div>
					)}

					{format !== "virtual" && (
						<LocationInput
							department={department}
							city={city}
							venue={venue}
							geoLatitude={geoLatitude}
							geoLongitude={geoLongitude}
							onDepartmentChange={setDepartment}
							onCityChange={setCity}
							onVenueChange={setVenue}
							onCoordinatesChange={(lat, lng) => {
								setGeoLatitude(lat);
								setGeoLongitude(lng);
							}}
						/>
					)}

					<LinksInput
						websiteUrl={websiteUrl}
						registrationUrl={registrationUrl}
						onWebsiteUrlChange={setWebsiteUrl}
						onRegistrationUrlChange={setRegistrationUrl}
					/>

					<SponsorManager
						eventId={event.id}
						sponsors={sponsors}
						onUpdate={onSuccess}
					/>
				</FieldGroup>

				<div className="lg:sticky lg:top-18 h-fit space-y-4">
					<Field>
						<FieldLabel>
							<ImageIcon className="h-4 w-4" />
							Imagen del evento
						</FieldLabel>
						{eventImageUrl ? (
							<div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted border">
								<Image
									src={eventImageUrl}
									alt="Event image"
									fill
									className="object-cover"
								/>
								<button
									type="button"
									onClick={() => setEventImageUrl("")}
									className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/90 backdrop-blur-sm border hover:bg-background transition-colors shadow-sm"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						) : (
							<div className="w-full aspect-square rounded-xl bg-muted border flex flex-col items-center justify-center gap-4">
								<ImageIcon className="h-12 w-12 text-muted-foreground/40" />
								<div className="flex flex-col items-center gap-2">
									<ImageUpload
										value={eventImageUrl}
										onChange={setEventImageUrl}
										label="Cargar imagen"
									/>
								</div>
							</div>
						)}
						<FieldDescription>Recomendado: 1200x1200px (1:1)</FieldDescription>
					</Field>
				</div>
			</div>

			<div className="flex gap-3 justify-end sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
				<Button type="submit" disabled={loading} className="gap-2">
					{loading && <Loader2 className="h-4 w-4 animate-spin" />}
					Guardar cambios
				</Button>
			</div>
		</form>
	);
}
