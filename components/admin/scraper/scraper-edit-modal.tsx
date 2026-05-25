"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import {
	approveScrapedEvent,
	updateScrapedEvent,
} from "@/lib/actions/scraper-curation";
import type { Event } from "@/lib/db/schema";

interface ScraperEditModalProps {
	event: Event;
	onClose: () => void;
	onSaved: (updated: Partial<Event> & { id: string }) => void;
}

export function ScraperEditModal({
	event,
	onClose,
	onSaved,
}: ScraperEditModalProps) {
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		name: event.name ?? "",
		description: event.description ?? "",
		startDate: event.startDate
			? new Date(event.startDate).toISOString().slice(0, 10)
			: "",
		endDate: event.endDate
			? new Date(event.endDate).toISOString().slice(0, 10)
			: "",
		country: event.country ?? "",
		city: event.city ?? "",
		eventType: event.eventType ?? "hackathon",
		format: event.format ?? "virtual",
	});

	const handleSaveAndApprove = async () => {
		setLoading(true);
		const data: Parameters<typeof updateScrapedEvent>[1] = {
			name: form.name || undefined,
			description: form.description || undefined,
			country: form.country || undefined,
			city: form.city || undefined,
			eventType: form.eventType as Event["eventType"],
			format: form.format as Event["format"],
		};
		if (form.startDate) data.startDate = new Date(form.startDate);
		if (form.endDate) data.endDate = new Date(form.endDate);

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
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-background/80 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Dialog */}
			<div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b px-5 py-4">
					<h2 className="font-semibold">Editar evento</h2>
					<button
						onClick={onClose}
						className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Body */}
				<div className="space-y-4 p-5">
					<div>
						<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
							Nombre
						</label>
						<input
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
						/>
					</div>

					<div>
						<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
							Descripción
						</label>
						<textarea
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
							rows={3}
							className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30 resize-none"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
								Fecha inicio
							</label>
							<input
								type="date"
								value={form.startDate}
								onChange={(e) =>
									setForm({ ...form, startDate: e.target.value })
								}
								className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
								Fecha fin
							</label>
							<input
								type="date"
								value={form.endDate}
								onChange={(e) => setForm({ ...form, endDate: e.target.value })}
								className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
								País (ISO 2)
							</label>
							<input
								value={form.country}
								onChange={(e) =>
									setForm({
										...form,
										country: e.target.value.toUpperCase().slice(0, 2),
									})
								}
								placeholder="PE"
								maxLength={2}
								className="w-full rounded-md border bg-background px-3 py-2 text-sm uppercase outline-none focus:ring-1 focus:ring-foreground/30"
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
								Ciudad
							</label>
							<input
								value={form.city}
								onChange={(e) => setForm({ ...form, city: e.target.value })}
								className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
								Tipo
							</label>
							<select
								value={form.eventType}
								onChange={(e) =>
									setForm({
										...form,
										eventType: e.target.value as NonNullable<
											Event["eventType"]
										>,
									})
								}
								className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
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
							<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
								Formato
							</label>
							<select
								value={form.format}
								onChange={(e) =>
									setForm({
										...form,
										format: e.target.value as NonNullable<Event["format"]>,
									})
								}
								className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
							>
								<option value="virtual">Virtual</option>
								<option value="in-person">Presencial</option>
								<option value="hybrid">Híbrido</option>
							</select>
						</div>
					</div>
				</div>

				{/* Footer */}
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
						className="inline-flex items-center gap-1.5 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						<Check className="h-4 w-4" />
						{loading ? "Guardando..." : "Guardar y Aprobar"}
					</button>
				</div>
			</div>
		</div>
	);
}
