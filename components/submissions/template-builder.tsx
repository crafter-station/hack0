"use client";

import {
	ChevronDown,
	ChevronUp,
	GripVertical,
	Loader2,
	Pencil,
	Plus,
	Save,
	Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CriteriaBuilder } from "@/components/submissions/criteria-builder";
import { TemplateFieldEditor } from "@/components/submissions/template-field-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	createSubmissionTemplate,
	updateSubmissionTemplate,
} from "@/lib/actions/submissions";
import type {
	JudgingCriterion,
	SubmissionTemplate,
	TemplateField,
} from "@/lib/db/schema";

interface TemplateBuilderProps {
	eventId: string;
	initialTemplate?: SubmissionTemplate | null;
}

const FIELD_TYPE_LABELS: Record<TemplateField["type"], string> = {
	text: "Texto",
	textarea: "Texto largo",
	url: "URL",
	email: "Email",
	number: "Numero",
	select: "Seleccion",
	multiselect: "Multi-seleccion",
	checkbox: "Casilla",
	file: "Archivo",
	richtext: "Texto enriquecido",
};

function formatDateForInput(date: Date | null | undefined): string {
	if (!date) return "";
	const d = new Date(date);
	// Format as YYYY-MM-DDTHH:mm for datetime-local input
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	const hours = String(d.getHours()).padStart(2, "0");
	const minutes = String(d.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function TemplateBuilder({
	eventId,
	initialTemplate,
}: TemplateBuilderProps) {
	const isEditing = !!initialTemplate;

	const [name, setName] = useState(initialTemplate?.name ?? "");
	const [description, setDescription] = useState(
		initialTemplate?.description ?? "",
	);
	const [submissionDeadline, setSubmissionDeadline] = useState(
		formatDateForInput(initialTemplate?.submissionDeadline),
	);
	const [editDeadline, setEditDeadline] = useState(
		formatDateForInput(initialTemplate?.editDeadline),
	);
	const [allowSoloSubmissions, setAllowSoloSubmissions] = useState(
		initialTemplate?.allowSoloSubmissions ?? true,
	);
	const [minTeamSize, setMinTeamSize] = useState(
		initialTemplate?.minTeamSize ?? 1,
	);
	const [maxTeamSize, setMaxTeamSize] = useState(
		initialTemplate?.maxTeamSize ?? 5,
	);
	const [fields, setFields] = useState<TemplateField[]>(
		initialTemplate?.fields ?? [],
	);
	const [criteria, setCriteria] = useState<JudgingCriterion[]>(
		initialTemplate?.judgingCriteria ?? [],
	);

	const [editingField, setEditingField] = useState<TemplateField | undefined>();
	const [isAddingField, setIsAddingField] = useState(false);
	const [isPending, startTransition] = useTransition();

	// -- Field management --

	const handleSaveField = (field: TemplateField) => {
		if (editingField) {
			setFields((prev) =>
				prev.map((f) => (f.id === editingField.id ? field : f)),
			);
		} else {
			setFields((prev) => [...prev, { ...field, order: prev.length }]);
		}
		setEditingField(undefined);
		setIsAddingField(false);
	};

	const handleRemoveField = (fieldId: string) => {
		setFields((prev) =>
			prev.filter((f) => f.id !== fieldId).map((f, i) => ({ ...f, order: i })),
		);
	};

	const handleMoveField = (index: number, direction: "up" | "down") => {
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= fields.length) return;

		const next = [...fields];
		const temp = next[index];
		next[index] = next[targetIndex];
		next[targetIndex] = temp;
		setFields(next.map((f, i) => ({ ...f, order: i })));
	};

	// -- Save --

	const handleSave = () => {
		if (!name.trim()) {
			toast.error("El nombre del formulario es obligatorio");
			return;
		}

		startTransition(async () => {
			const data = {
				name: name.trim(),
				description: description.trim() || undefined,
				fields,
				judgingCriteria: criteria,
				submissionDeadline: submissionDeadline
					? new Date(submissionDeadline)
					: undefined,
				editDeadline: editDeadline ? new Date(editDeadline) : undefined,
				allowSoloSubmissions,
				minTeamSize,
				maxTeamSize,
			};

			const result = isEditing
				? await updateSubmissionTemplate(initialTemplate.id, data)
				: await createSubmissionTemplate(eventId, data);

			if (result.success) {
				toast.success(
					isEditing
						? "Formulario actualizado correctamente"
						: "Formulario creado correctamente",
				);
			} else {
				toast.error(result.error ?? "Ocurrio un error");
			}
		});
	};

	return (
		<div className="space-y-6">
			{/* General info */}
			<Card>
				<CardHeader>
					<CardTitle>Informacion general</CardTitle>
					<CardDescription>
						Configura el formulario de entregas para este evento
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Nombre del formulario</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ej: Entrega de proyecto final"
						/>
					</div>
					<div className="space-y-2">
						<Label>
							Descripcion
							<span className="text-muted-foreground font-normal ml-1">
								(opcional)
							</span>
						</Label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Instrucciones generales para los participantes"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Deadlines */}
			<Card>
				<CardHeader>
					<CardTitle>Plazos</CardTitle>
					<CardDescription>
						Define las fechas limite para entregas y ediciones
					</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Fecha limite de entrega</Label>
						<Input
							type="datetime-local"
							value={submissionDeadline}
							onChange={(e) => setSubmissionDeadline(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Fecha limite de edicion</Label>
						<Input
							type="datetime-local"
							value={editDeadline}
							onChange={(e) => setEditDeadline(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Team settings */}
			<Card>
				<CardHeader>
					<CardTitle>Configuracion de equipos</CardTitle>
					<CardDescription>
						Define las reglas de participacion por equipo
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between rounded-lg border p-3">
						<div>
							<p className="text-sm font-medium">
								Permitir entregas individuales
							</p>
							<p className="text-xs text-muted-foreground">
								Los participantes pueden entregar sin equipo
							</p>
						</div>
						<Switch
							checked={allowSoloSubmissions}
							onCheckedChange={setAllowSoloSubmissions}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Min. integrantes</Label>
							<Input
								type="number"
								min={1}
								max={maxTeamSize}
								value={minTeamSize}
								onChange={(e) => setMinTeamSize(Number(e.target.value) || 1)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Max. integrantes</Label>
							<Input
								type="number"
								min={minTeamSize}
								max={20}
								value={maxTeamSize}
								onChange={(e) => setMaxTeamSize(Number(e.target.value) || 5)}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Fields */}
			<Card>
				<CardHeader>
					<CardTitle>Campos del formulario</CardTitle>
					<CardDescription>
						Define que informacion deben completar los participantes
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{fields.length === 0 && (
						<div className="rounded-lg border border-dashed p-6 text-center">
							<p className="text-sm text-muted-foreground">
								No hay campos definidos. Agrega campos para que los
								participantes puedan enviar sus proyectos.
							</p>
						</div>
					)}

					{fields.map((field, index) => (
						<div
							key={field.id}
							className="flex items-center gap-2 rounded-lg border bg-card p-3"
						>
							<div className="flex flex-col gap-0.5">
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled={index === 0}
									onClick={() => handleMoveField(index, "up")}
									className="size-6"
								>
									<ChevronUp className="size-3.5" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled={index === fields.length - 1}
									onClick={() => handleMoveField(index, "down")}
									className="size-6"
								>
									<ChevronDown className="size-3.5" />
								</Button>
							</div>

							<GripVertical className="size-4 text-muted-foreground/40 shrink-0" />

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<p className="text-sm font-medium truncate">{field.label}</p>
									{field.required && (
										<Badge variant="secondary" className="text-[10px] px-1.5">
											Obligatorio
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-2 mt-0.5">
									<span className="text-xs text-muted-foreground">
										{FIELD_TYPE_LABELS[field.type]}
									</span>
									<span className="text-xs text-muted-foreground/50">
										{field.key}
									</span>
								</div>
							</div>

							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => setEditingField(field)}
							>
								<Pencil className="size-4 text-muted-foreground" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => handleRemoveField(field.id)}
								className="text-muted-foreground hover:text-destructive"
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					))}

					<Button
						type="button"
						variant="outline"
						onClick={() => setIsAddingField(true)}
						className="w-full"
					>
						<Plus className="size-4" />
						Agregar campo
					</Button>
				</CardContent>
			</Card>

			{/* Judging criteria */}
			<Card>
				<CardHeader>
					<CardTitle>Evaluacion</CardTitle>
					<CardDescription>
						Configura los criterios que usaran los jueces
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CriteriaBuilder criteria={criteria} onChange={setCriteria} />
				</CardContent>
			</Card>

			{/* Save */}
			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={isPending}>
					{isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Save className="size-4" />
					)}
					{isEditing ? "Guardar cambios" : "Crear formulario"}
				</Button>
			</div>

			{/* Field editor dialog */}
			{(isAddingField || editingField) && (
				<TemplateFieldEditor
					field={editingField}
					existingFieldIds={fields.map((f) => f.id)}
					onSave={handleSaveField}
					onCancel={() => {
						setIsAddingField(false);
						setEditingField(undefined);
					}}
				/>
			)}
		</div>
	);
}
