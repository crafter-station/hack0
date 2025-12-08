"use client";

import { ImageIcon, Loader2, Pencil, Tag, Calendar, MapPin, Link as LinkIcon, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DateRangeInput } from "@/components/events/date-range-input";
import { FormatSelector } from "@/components/events/format-selector";
import { LinksInput } from "@/components/events/links-input";
import { LocationInput } from "@/components/events/location-input";
import { PrizeInput } from "@/components/events/prize-input";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "@/lib/actions/events";
import {
	EVENT_TYPE_OPTIONS,
	SKILL_LEVEL_OPTIONS,
} from "@/lib/event-utils";

interface OrgEventFormProps {
	organizationId: string;
	organizationName: string;
	organizationLogo?: string | null;
	organizationSlug: string;
}

export function OrgEventForm({
	organizationId,
	organizationName,
	organizationLogo,
	organizationSlug,
}: OrgEventFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [registrationDeadline, setRegistrationDeadline] = useState("");
	const [format, setFormat] = useState<"virtual" | "in-person" | "hybrid">("virtual");
	const [department, setDepartment] = useState("");
	const [city, setCity] = useState("");
	const [venue, setVenue] = useState("");
	const [prizePool, setPrizePool] = useState("");
	const [prizeCurrency, setPrizeCurrency] = useState<"USD" | "PEN">("USD");
	const [prizeDescription, setPrizeDescription] = useState("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [registrationUrl, setRegistrationUrl] = useState("");
	const [eventImageUrl, setEventImageUrl] = useState("");
	const [eventType, setEventType] = useState("hackathon");
	const [skillLevel, setSkillLevel] = useState("all");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const result = await createEvent({
			name,
			description: description || undefined,
			startDate: startDate || undefined,
			endDate: endDate || undefined,
			registrationDeadline: registrationDeadline || undefined,
			format,
			department: department || undefined,
			city: city || undefined,
			venue: venue || undefined,
			prizePool: prizePool ? parseInt(prizePool, 10) : undefined,
			prizeCurrency,
			prizeDescription: prizeDescription || undefined,
			websiteUrl: websiteUrl || undefined,
			registrationUrl: registrationUrl || undefined,
			eventImageUrl: eventImageUrl || undefined,
			eventType,
			skillLevel,
			organizationId,
			country: "PE",
		});

		setLoading(false);

		if (result.success) {
			router.push(`/c/${organizationSlug}`);
		} else {
			setError(result.error || "Error al crear el evento");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Organization Header */}
			<div className="rounded-lg border bg-muted/30 p-4">
				<div className="flex items-center gap-3">
					{organizationLogo ? (
						<div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border">
							<Image
								src={organizationLogo}
								alt={organizationName}
								fill
								className="object-cover"
							/>
						</div>
					) : (
						<div className="h-12 w-12 shrink-0 rounded-lg bg-muted border flex items-center justify-center text-lg font-semibold">
							{organizationName.charAt(0).toUpperCase()}
						</div>
					)}
					<div className="min-w-0">
						<p className="text-xs text-muted-foreground">Creando evento para</p>
						<p className="font-semibold truncate">{organizationName}</p>
					</div>
				</div>
			</div>

			{error && (
				<div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600">
					{error}
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
									<Select value={eventType} onValueChange={setEventType}>
										<SelectTrigger id="eventType">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{EVENT_TYPE_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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

							{(eventType === "hackathon" || eventType === "competition" || eventType === "olympiad") && (
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

					{format !== "virtual" && (
						<LocationInput
							department={department}
							city={city}
							venue={venue}
							onDepartmentChange={setDepartment}
							onCityChange={setCity}
							onVenueChange={setVenue}
						/>
					)}

					<LinksInput
						websiteUrl={websiteUrl}
						registrationUrl={registrationUrl}
						onWebsiteUrlChange={setWebsiteUrl}
						onRegistrationUrlChange={setRegistrationUrl}
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
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
					disabled={loading}
				>
					Cancelar
				</Button>
				<Button type="submit" disabled={loading} className="gap-2">
					{loading && <Loader2 className="h-4 w-4 animate-spin" />}
					Crear evento
				</Button>
			</div>
		</form>
	);
}
