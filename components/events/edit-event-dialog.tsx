"use client";

import {
	Calendar,
	Globe,
	ImageIcon,
	Link as LinkIcon,
	Loader2,
	MapPin,
	Pencil,
	Sparkles,
	Trophy,
	X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
import { updateEvent } from "@/lib/actions/claims";
import type { Event } from "@/lib/db/schema";

interface EditEventDialogProps {
	event: Event;
	children?: React.ReactNode;
}

export function EditEventDialog({ event, children }: EditEventDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState(event.name);
	const [description, setDescription] = useState(event.description || "");
	const [startDate, setStartDate] = useState(
		event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
	);
	const [endDate, setEndDate] = useState(
		event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
	);
	const [registrationDeadline, setRegistrationDeadline] = useState(
		event.registrationDeadline
			? new Date(event.registrationDeadline).toISOString().slice(0, 16)
			: "",
	);
	const [format, setFormat] = useState<"virtual" | "in-person" | "hybrid">(
		event.format || "virtual",
	);
	const [city, setCity] = useState(event.city || "");
	const [prizePool, setPrizePool] = useState(event.prizePool?.toString() || "");
	const [prizeDescription, setPrizeDescription] = useState(
		event.prizeDescription || "",
	);
	const [websiteUrl, setWebsiteUrl] = useState(event.websiteUrl || "");
	const [registrationUrl, setRegistrationUrl] = useState(
		event.registrationUrl || "",
	);
	const [eventImageUrl, setEventImageUrl] = useState(event.eventImageUrl || "");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const result = await updateEvent({
			eventId: event.id,
			name,
			description: description || undefined,
			startDate: startDate ? new Date(startDate) : null,
			endDate: endDate ? new Date(endDate) : null,
			registrationDeadline: registrationDeadline
				? new Date(registrationDeadline)
				: null,
			format,
			city: city || undefined,
			prizePool: prizePool ? parseInt(prizePool, 10) : null,
			prizeDescription: prizeDescription || undefined,
			websiteUrl: websiteUrl || undefined,
			registrationUrl: registrationUrl || undefined,
			eventImageUrl: eventImageUrl || undefined,
		});

		setLoading(false);

		if (result.success) {
			setOpen(false);
		} else {
			setError(result.error || "Error al guardar los cambios");
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children || (
					<Button variant="outline" size="sm" className="gap-1.5">
						<Pencil className="h-3.5 w-3.5" />
						Editar evento
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
				<DialogHeader className="px-6 pt-6">
					<DialogTitle className="flex items-center gap-2">
						<Pencil className="h-5 w-5" />
						Editar evento
					</DialogTitle>
					<DialogDescription>
						Modifica la información de {event.name}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
					{/* Event Image Card */}
					<div className="rounded-xl border bg-card p-4 space-y-3">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<ImageIcon className="h-4 w-4" />
							Imagen del evento
						</div>

						<div className="flex flex-col sm:flex-row gap-4">
							{eventImageUrl ? (
								<div className="relative w-28 sm:w-32 aspect-square rounded-xl overflow-hidden bg-muted border shrink-0">
									<Image
										src={eventImageUrl}
										alt="Event image"
										fill
										className="object-cover"
									/>
									<button
										type="button"
										onClick={() => setEventImageUrl("")}
										className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
									>
										<X className="h-3.5 w-3.5" />
									</button>
								</div>
							) : (
								<div className="w-28 sm:w-32 aspect-square shrink-0">
									<ImageUpload
										value={eventImageUrl}
										onChange={setEventImageUrl}
										onRemove={() => setEventImageUrl("")}
										endpoint="imageUploader"
										aspectRatio="square"
									/>
								</div>
							)}

							<div className="flex-1 space-y-2">
								<label htmlFor="name" className="text-sm font-medium">
									Nombre del evento
								</label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
						</div>
					</div>

					{/* Description Card */}
					<div className="rounded-xl border bg-card p-4 space-y-3">
						<label htmlFor="description" className="text-sm font-medium">
							Descripción (Markdown)
						</label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="## Sobre el evento&#10;&#10;Descripción...&#10;&#10;## Premios&#10;&#10;- 1er lugar: $500"
							className="min-h-[120px] font-mono text-sm"
						/>
						<p className="text-xs text-muted-foreground">
							Usa ## para títulos, - para listas, **texto** para negrita
						</p>
					</div>

					{/* Dates Card */}
					<div className="rounded-xl border bg-card p-4 space-y-4">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Calendar className="h-4 w-4" />
							Fechas
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-2">
								<label htmlFor="startDate" className="text-sm font-medium">
									Inicio
								</label>
								<Input
									id="startDate"
									type="datetime-local"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="endDate" className="text-sm font-medium">
									Fin
								</label>
								<Input
									id="endDate"
									type="datetime-local"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="registrationDeadline"
								className="text-sm font-medium"
							>
								Cierre de inscripciones
							</label>
							<Input
								id="registrationDeadline"
								type="datetime-local"
								value={registrationDeadline}
								onChange={(e) => setRegistrationDeadline(e.target.value)}
							/>
						</div>
					</div>

					{/* Location Card */}
					<div className="rounded-xl border bg-card p-4 space-y-4">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<MapPin className="h-4 w-4" />
							Ubicación
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-2">
								<label htmlFor="format" className="text-sm font-medium">
									Formato
								</label>
								<Select
									value={format}
									onValueChange={(v) => setFormat(v as typeof format)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="virtual">Virtual</SelectItem>
										<SelectItem value="in-person">Presencial</SelectItem>
										<SelectItem value="hybrid">Híbrido</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<label htmlFor="city" className="text-sm font-medium">
									Ciudad
								</label>
								<Input
									id="city"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									placeholder="Lima, Arequipa..."
								/>
							</div>
						</div>
					</div>

					{/* Prizes Card */}
					<div className="rounded-xl border bg-card p-4 space-y-4">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Trophy className="h-4 w-4" />
							Premios
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-2">
								<label htmlFor="prizePool" className="text-sm font-medium">
									Premio total (USD)
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
										$
									</span>
									<Input
										id="prizePool"
										type="number"
										value={prizePool}
										onChange={(e) => setPrizePool(e.target.value)}
										placeholder="10000"
										className="pl-7"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label
									htmlFor="prizeDescription"
									className="text-sm font-medium"
								>
									Detalle de premios
								</label>
								<Input
									id="prizeDescription"
									value={prizeDescription}
									onChange={(e) => setPrizeDescription(e.target.value)}
									placeholder="1er: $5000, 2do: $3000..."
								/>
							</div>
						</div>
					</div>

					{/* URLs Card */}
					<div className="rounded-xl border bg-card p-4 space-y-4">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<LinkIcon className="h-4 w-4" />
							Enlaces
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-2">
								<label htmlFor="websiteUrl" className="text-sm font-medium">
									Sitio web
								</label>
								<div className="relative">
									<Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id="websiteUrl"
										type="url"
										value={websiteUrl}
										onChange={(e) => setWebsiteUrl(e.target.value)}
										placeholder="https://..."
										className="pl-10"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label
									htmlFor="registrationUrl"
									className="text-sm font-medium"
								>
									Inscripción
								</label>
								<div className="relative">
									<LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										id="registrationUrl"
										type="url"
										value={registrationUrl}
										onChange={(e) => setRegistrationUrl(e.target.value)}
										placeholder="https://..."
										className="pl-10"
									/>
								</div>
							</div>
						</div>
					</div>

					{error && (
						<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
							<p className="text-sm text-red-500">{error}</p>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Guardando...
								</>
							) : (
								"Guardar cambios"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
