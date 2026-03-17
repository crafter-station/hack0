"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import {
	approveScrapedEvent,
	updateScrapedEvent,
} from "@/lib/actions/scraper-curation";
import type { Event } from "@/lib/db/schema";

interface PendingEditModalProps {
	event: Event;
	onClose: () => void;
	onSaved: (updated: Partial<Event> & { id: string }) => void;
}

function toDateStr(d: Date | string | null | undefined): string {
	if (!d) return "";
	return new Date(d).toISOString().slice(0, 10);
}

const inputClass =
	"w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30";
const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";
const sectionClass =
	"text-[10px] font-medium uppercase tracking-wider text-muted-foreground pt-2 pb-1";

export function PendingEditModal({
	event,
	onClose,
	onSaved,
}: PendingEditModalProps) {
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		name: event.name ?? "",
		description: event.description ?? "",
		startDate: toDateStr(event.startDate),
		endDate: toDateStr(event.endDate),
		registrationDeadline: toDateStr(event.registrationDeadline),
		country: event.country ?? "",
		city: event.city ?? "",
		venue: event.venue ?? "",
		eventType: event.eventType ?? "hackathon",
		format: event.format ?? "virtual",
		skillLevel: event.skillLevel ?? "all",
		scope: event.scope ?? "latam",
		websiteUrl: event.websiteUrl ?? "",
		registrationUrl: event.registrationUrl ?? "",
		eventImageUrl: event.eventImageUrl ?? "",
		prizePool: event.prizePool?.toString() ?? "",
		prizeCurrency: event.prizeCurrency ?? "USD",
		prizeDescription: event.prizeDescription ?? "",
	});

	const set = (key: string, value: string) =>
		setForm((f) => ({ ...f, [key]: value }));

	const handleSaveAndApprove = async () => {
		setLoading(true);
		const data: Parameters<typeof updateScrapedEvent>[1] = {
			name: form.name || undefined,
			description: form.description || undefined,
			country: form.country || undefined,
			city: form.city || undefined,
			venue: form.venue || undefined,
			eventType: form.eventType as Event["eventType"],
			format: form.format as Event["format"],
			skillLevel: form.skillLevel as Event["skillLevel"],
			scope: form.scope as Event["scope"],
			websiteUrl: form.websiteUrl || undefined,
			registrationUrl: form.registrationUrl || undefined,
			eventImageUrl: form.eventImageUrl || undefined,
			prizePool: form.prizePool ? parseInt(form.prizePool, 10) : undefined,
			prizeCurrency: form.prizeCurrency as Event["prizeCurrency"],
			prizeDescription: form.prizeDescription || undefined,
		};
		if (form.startDate) data.startDate = new Date(form.startDate);
		if (form.endDate) data.endDate = new Date(form.endDate);
		if (form.registrationDeadline)
			data.registrationDeadline = new Date(form.registrationDeadline);

		const updateResult = await updateScrapedEvent(event.id, data);
		if (updateResult.success) {
			await approveScrapedEvent(event.id);
			onSaved({
				id: event.id,
				...data,
				isApproved: true,
				approvalStatus: "approved",
			});
		}
		setLoading(false);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-background/80 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative z-10 w-full max-w-2xl rounded-xl border bg-card shadow-xl">
				<div className="flex items-center justify-between border-b px-5 py-4">
					<h2 className="font-semibold">Editar evento</h2>
					<button
						onClick={onClose}
						className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="max-h-[70vh] overflow-y-auto space-y-4 p-5">
					{/* Básico */}
					<p className={sectionClass}>Básico</p>
					<div>
						<label className={labelClass}>Nombre</label>
						<input
							value={form.name}
							onChange={(e) => set("name", e.target.value)}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>Descripción</label>
						<textarea
							value={form.description}
							onChange={(e) => set("description", e.target.value)}
							rows={3}
							className={`${inputClass} resize-none`}
						/>
					</div>

					{/* Fechas */}
					<p className={sectionClass}>Fechas</p>
					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className={labelClass}>Fecha inicio</label>
							<input
								type="date"
								value={form.startDate}
								onChange={(e) => set("startDate", e.target.value)}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>Fecha fin</label>
							<input
								type="date"
								value={form.endDate}
								onChange={(e) => set("endDate", e.target.value)}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>Deadline registro</label>
							<input
								type="date"
								value={form.registrationDeadline}
								onChange={(e) => set("registrationDeadline", e.target.value)}
								className={inputClass}
							/>
						</div>
					</div>

					{/* Ubicación */}
					<p className={sectionClass}>Ubicación</p>
					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className={labelClass}>País (ISO 2)</label>
							<input
								value={form.country}
								onChange={(e) =>
									set("country", e.target.value.toUpperCase().slice(0, 2))
								}
								placeholder="PE"
								maxLength={2}
								className={`${inputClass} uppercase`}
							/>
						</div>
						<div>
							<label className={labelClass}>Ciudad</label>
							<input
								value={form.city}
								onChange={(e) => set("city", e.target.value)}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>Venue</label>
							<input
								value={form.venue}
								onChange={(e) => set("venue", e.target.value)}
								className={inputClass}
							/>
						</div>
					</div>

					{/* Clasificación */}
					<p className={sectionClass}>Clasificación</p>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={labelClass}>Tipo</label>
							<select
								value={form.eventType}
								onChange={(e) => set("eventType", e.target.value)}
								className={inputClass}
							>
								{[
									"hackathon",
									"conference",
									"seminar",
									"research_fair",
									"workshop",
									"bootcamp",
									"summer_school",
									"course",
									"certification",
									"meetup",
									"networking",
									"olympiad",
									"competition",
									"robotics",
									"accelerator",
									"incubator",
									"fellowship",
									"call_for_papers",
								].map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className={labelClass}>Formato</label>
							<select
								value={form.format}
								onChange={(e) => set("format", e.target.value)}
								className={inputClass}
							>
								<option value="virtual">Virtual</option>
								<option value="in-person">Presencial</option>
								<option value="hybrid">Híbrido</option>
							</select>
						</div>
						<div>
							<label className={labelClass}>Nivel</label>
							<select
								value={form.skillLevel}
								onChange={(e) => set("skillLevel", e.target.value)}
								className={inputClass}
							>
								<option value="all">Todos</option>
								<option value="beginner">Beginner</option>
								<option value="intermediate">Intermediate</option>
								<option value="advanced">Advanced</option>
							</select>
						</div>
						<div>
							<label className={labelClass}>Scope</label>
							<select
								value={form.scope}
								onChange={(e) => set("scope", e.target.value)}
								className={inputClass}
							>
								<option value="latam">LATAM</option>
								<option value="global_latam_eligible">Global</option>
							</select>
						</div>
					</div>

					{/* Links */}
					<p className={sectionClass}>Links</p>
					<div className="space-y-3">
						<div>
							<label className={labelClass}>Website URL</label>
							<input
								type="url"
								value={form.websiteUrl}
								onChange={(e) => set("websiteUrl", e.target.value)}
								placeholder="https://..."
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>Registration URL</label>
							<input
								type="url"
								value={form.registrationUrl}
								onChange={(e) => set("registrationUrl", e.target.value)}
								placeholder="https://..."
								className={inputClass}
							/>
						</div>
					</div>

					{/* Media */}
					<p className={sectionClass}>Media</p>
					<div>
						<label className={labelClass}>Image URL</label>
						<input
							type="url"
							value={form.eventImageUrl}
							onChange={(e) => set("eventImageUrl", e.target.value)}
							placeholder="https://..."
							className={inputClass}
						/>
						{form.eventImageUrl && (
							<img
								src={form.eventImageUrl}
								alt="Preview"
								className="mt-2 h-20 w-auto rounded-md border object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).style.display = "none";
								}}
							/>
						)}
					</div>

					{/* Premios */}
					<p className={sectionClass}>Premios</p>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={labelClass}>Prize pool</label>
							<input
								type="number"
								value={form.prizePool}
								onChange={(e) => set("prizePool", e.target.value)}
								placeholder="0"
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>Moneda</label>
							<select
								value={form.prizeCurrency}
								onChange={(e) => set("prizeCurrency", e.target.value)}
								className={inputClass}
							>
								<option value="USD">USD</option>
								<option value="PEN">PEN</option>
							</select>
						</div>
					</div>
					<div>
						<label className={labelClass}>Prize description</label>
						<textarea
							value={form.prizeDescription}
							onChange={(e) => set("prizeDescription", e.target.value)}
							rows={2}
							className={`${inputClass} resize-none`}
						/>
					</div>
				</div>
				<div className="flex items-center justify-end gap-2 border-t px-5 py-4">
					<button
						onClick={onClose}
						disabled={loading}
						className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						onClick={handleSaveAndApprove}
						disabled={loading}
						className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						<Check className="h-4 w-4" />
						{loading ? "Guardando..." : "Guardar y Aprobar"}
					</button>
				</div>
			</div>
		</div>
	);
}
