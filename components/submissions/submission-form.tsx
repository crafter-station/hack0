"use client";

import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	CloudUpload,
	FileIcon,
	Loader2,
	Save,
	Send,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitSubmission, updateSubmission } from "@/lib/actions/submissions";
import type {
	Submission,
	SubmissionTeamMember,
	SubmissionTemplate,
	TemplateField,
	TemplateFieldConditional,
} from "@/lib/db/schema";
import { useUploadThing } from "@/lib/uploadthing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmissionFormProps {
	eventId: string;
	template: SubmissionTemplate;
	submission?: Submission & { teamMembers: SubmissionTeamMember[] };
}

type ResponseValue = string | string[] | number | boolean;
type Responses = Record<string, ResponseValue>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function evaluateConditional(
	conditional: TemplateFieldConditional,
	responses: Responses,
): boolean {
	const fieldValue = responses[conditional.fieldId];

	switch (conditional.operator) {
		case "equals":
			return String(fieldValue ?? "") === conditional.value;
		case "notEquals":
			return String(fieldValue ?? "") !== conditional.value;
		case "contains":
			return String(fieldValue ?? "").includes(conditional.value ?? "");
		case "isEmpty":
			return (
				fieldValue === undefined ||
				fieldValue === null ||
				fieldValue === "" ||
				(Array.isArray(fieldValue) && fieldValue.length === 0)
			);
		case "isNotEmpty":
			return (
				fieldValue !== undefined &&
				fieldValue !== null &&
				fieldValue !== "" &&
				!(Array.isArray(fieldValue) && fieldValue.length === 0)
			);
		default:
			return true;
	}
}

function validateField(
	field: TemplateField,
	value: ResponseValue | undefined,
): string | null {
	if (field.required) {
		if (
			value === undefined ||
			value === null ||
			value === "" ||
			(Array.isArray(value) && value.length === 0)
		) {
			return `"${field.label}" es obligatorio`;
		}
	}

	if (value === undefined || value === null || value === "") return null;

	const v = field.validation;
	if (!v) return null;

	const strValue = String(value);

	if (v.minLength && strValue.length < v.minLength) {
		return `"${field.label}" debe tener al menos ${v.minLength} caracteres`;
	}
	if (v.maxLength && strValue.length > v.maxLength) {
		return `"${field.label}" no puede exceder ${v.maxLength} caracteres`;
	}
	if (v.min !== undefined && typeof value === "number" && value < v.min) {
		return `"${field.label}" debe ser al menos ${v.min}`;
	}
	if (v.max !== undefined && typeof value === "number" && value > v.max) {
		return `"${field.label}" no puede exceder ${v.max}`;
	}
	if (v.pattern) {
		const regex = new RegExp(v.pattern);
		if (!regex.test(strValue)) {
			return `"${field.label}" tiene un formato invalido`;
		}
	}

	return null;
}

function formatDeadline(date: Date): string {
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "long",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(date);
}

// ---------------------------------------------------------------------------
// File upload sub-component
// ---------------------------------------------------------------------------

function FileUploadField({
	field,
	value,
	onChange,
}: {
	field: TemplateField;
	value: string | undefined;
	onChange: (url: string) => void;
}) {
	const [uploading, setUploading] = useState(false);

	const { startUpload } = useUploadThing("submissionFileUploader", {
		onClientUploadComplete: (res) => {
			if (res?.[0]) {
				onChange(res[0].ufsUrl);
				toast.success("Archivo subido correctamente");
			}
			setUploading(false);
		},
		onUploadError: (error) => {
			toast.error(`Error al subir archivo: ${error.message}`);
			setUploading(false);
		},
	});

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			if (
				field.validation?.maxFileSize &&
				file.size > field.validation.maxFileSize
			) {
				toast.error(
					`El archivo excede el tamanio maximo de ${Math.round(field.validation.maxFileSize / 1024 / 1024)}MB`,
				);
				return;
			}

			setUploading(true);
			await startUpload([file]);
		},
		[field.validation?.maxFileSize, startUpload],
	);

	if (value) {
		return (
			<div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
				<FileIcon className="size-4 text-muted-foreground" />
				<a
					href={value}
					target="_blank"
					rel="noopener noreferrer"
					className="flex-1 truncate text-sm text-blue-500 underline underline-offset-2"
				>
					{value.split("/").pop()}
				</a>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="size-6 p-0"
					onClick={() => onChange("")}
				>
					<X className="size-3.5" />
				</Button>
			</div>
		);
	}

	return (
		<label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed p-6 text-center transition-colors hover:bg-muted/30">
			{uploading ? (
				<>
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
					<span className="text-sm text-muted-foreground">Subiendo...</span>
				</>
			) : (
				<>
					<CloudUpload className="size-6 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">
						Haz clic o arrastra un archivo
					</span>
					{field.validation?.accept && (
						<span className="text-xs text-muted-foreground/70">
							Formatos: {field.validation.accept}
						</span>
					)}
				</>
			)}
			<input
				type="file"
				className="sr-only"
				accept={field.validation?.accept}
				onChange={handleFileChange}
				disabled={uploading}
			/>
		</label>
	);
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function SubmissionForm({
	eventId,
	template,
	submission,
}: SubmissionFormProps) {
	const router = useRouter();
	const [isSaving, startSaveTransition] = useTransition();
	const [isSubmitting, startSubmitTransition] = useTransition();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const [projectName, setProjectName] = useState(submission?.projectName ?? "");
	const [shortDescription, setShortDescription] = useState(
		submission?.shortDescription ?? "",
	);
	const [responses, setResponses] = useState<Responses>(
		(submission?.responses as Responses) ?? {},
	);

	const sortedFields = useMemo(
		() => [...(template.fields ?? [])].sort((a, b) => a.order - b.order),
		[template.fields],
	);

	const visibleFields = useMemo(
		() =>
			sortedFields.filter((field) => {
				if (!field.conditional) return true;
				return evaluateConditional(field.conditional, responses);
			}),
		[sortedFields, responses],
	);

	const setResponse = useCallback((fieldId: string, value: ResponseValue) => {
		setResponses((prev) => ({ ...prev, [fieldId]: value }));
		setErrors((prev) => {
			const next = { ...prev };
			delete next[fieldId];
			return next;
		});
	}, []);

	const deadlinePassed =
		template.submissionDeadline &&
		new Date() > template.submissionDeadline &&
		!template.allowLateSubmissions;

	const isAlreadySubmitted =
		submission?.status !== undefined && submission.status !== "draft";

	// ----- Save draft -----
	const handleSaveDraft = () => {
		if (!submission) return;

		startSaveTransition(async () => {
			const result = await updateSubmission(submission.id, {
				projectName,
				shortDescription,
				responses,
			});

			if (result.success) {
				toast.success("Borrador guardado");
				router.refresh();
			} else {
				toast.error(result.error ?? "Error al guardar");
			}
		});
	};

	// ----- Submit -----
	const handleSubmit = () => {
		if (!submission) return;

		// Validate all visible required fields
		const newErrors: Record<string, string> = {};

		if (!projectName.trim()) {
			newErrors.__projectName = "El nombre del proyecto es obligatorio";
		}

		for (const field of visibleFields) {
			const error = validateField(field, responses[field.id]);
			if (error) {
				newErrors[field.id] = error;
			}
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			toast.error("Corrige los errores antes de enviar");
			return;
		}

		setConfirmOpen(true);
	};

	const confirmSubmit = () => {
		if (!submission) return;
		setConfirmOpen(false);

		startSubmitTransition(async () => {
			// Save latest data first
			const saveResult = await updateSubmission(submission.id, {
				projectName,
				shortDescription,
				responses,
			});

			if (!saveResult.success) {
				toast.error(saveResult.error ?? "Error al guardar");
				return;
			}

			const result = await submitSubmission(submission.id);

			if (result.success) {
				toast.success("Proyecto enviado exitosamente");
				router.refresh();
			} else {
				toast.error(result.error ?? "Error al enviar");
			}
		});
	};

	// ----- Render field -----
	const renderField = (field: TemplateField) => {
		const fieldError = errors[field.id];
		const value = responses[field.id];

		switch (field.type) {
			case "text":
				return (
					<Input
						placeholder={field.placeholder}
						value={(value as string) ?? ""}
						onChange={(e) => setResponse(field.id, e.target.value)}
						maxLength={field.validation?.maxLength}
						aria-invalid={!!fieldError}
						disabled={isAlreadySubmitted}
					/>
				);

			case "textarea":
			case "richtext":
				return (
					<Textarea
						placeholder={field.placeholder}
						value={(value as string) ?? ""}
						onChange={(e) => setResponse(field.id, e.target.value)}
						maxLength={field.validation?.maxLength}
						rows={field.type === "richtext" ? 8 : 4}
						aria-invalid={!!fieldError}
						disabled={isAlreadySubmitted}
					/>
				);

			case "url":
				return (
					<Input
						type="url"
						placeholder={field.placeholder ?? "https://..."}
						value={(value as string) ?? ""}
						onChange={(e) => setResponse(field.id, e.target.value)}
						aria-invalid={!!fieldError}
						disabled={isAlreadySubmitted}
					/>
				);

			case "email":
				return (
					<Input
						type="email"
						placeholder={field.placeholder ?? "correo@ejemplo.com"}
						value={(value as string) ?? ""}
						onChange={(e) => setResponse(field.id, e.target.value)}
						aria-invalid={!!fieldError}
						disabled={isAlreadySubmitted}
					/>
				);

			case "number":
				return (
					<Input
						type="number"
						placeholder={field.placeholder}
						value={(value as number) ?? ""}
						onChange={(e) =>
							setResponse(
								field.id,
								e.target.value === "" ? "" : Number(e.target.value),
							)
						}
						min={field.validation?.min}
						max={field.validation?.max}
						aria-invalid={!!fieldError}
						disabled={isAlreadySubmitted}
					/>
				);

			case "select":
				return (
					<Select
						value={(value as string) ?? ""}
						onValueChange={(v) => setResponse(field.id, v)}
						disabled={isAlreadySubmitted}
					>
						<SelectTrigger className="w-full" aria-invalid={!!fieldError}>
							<SelectValue
								placeholder={field.placeholder ?? "Seleccionar..."}
							/>
						</SelectTrigger>
						<SelectContent>
							{field.options?.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);

			case "multiselect":
				return (
					<div className="flex flex-col gap-2">
						{field.options?.map((opt) => {
							const selected = Array.isArray(value) ? value : [];
							const checked = selected.includes(opt.value);
							return (
								<label
									key={opt.value}
									className="flex items-center gap-2 text-sm"
								>
									<Checkbox
										checked={checked}
										onCheckedChange={(c) => {
											const newVal = c
												? [...selected, opt.value]
												: selected.filter((v) => v !== opt.value);
											setResponse(field.id, newVal);
										}}
										disabled={isAlreadySubmitted}
									/>
									{opt.label}
								</label>
							);
						})}
					</div>
				);

			case "checkbox":
				return (
					<label className="flex items-center gap-2 text-sm">
						<Checkbox
							checked={(value as boolean) ?? false}
							onCheckedChange={(c) => setResponse(field.id, !!c)}
							disabled={isAlreadySubmitted}
						/>
						{field.placeholder ?? field.label}
					</label>
				);

			case "file":
				return (
					<FileUploadField
						field={field}
						value={(value as string) ?? undefined}
						onChange={(url) => setResponse(field.id, url)}
					/>
				);

			default:
				return null;
		}
	};

	return (
		<div className="flex flex-col gap-8">
			{/* Deadline info */}
			{template.submissionDeadline && (
				<div
					className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${
						deadlinePassed
							? "border-destructive/30 bg-destructive/5 text-destructive"
							: "border-border bg-muted/30 text-muted-foreground"
					}`}
				>
					<Calendar className="size-4 shrink-0" />
					<span>
						{deadlinePassed
							? "El plazo de entregas ha finalizado"
							: `Fecha limite: ${formatDeadline(template.submissionDeadline)}`}
					</span>
				</div>
			)}

			{/* Submitted banner */}
			{isAlreadySubmitted && (
				<div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600">
					<CheckCircle2 className="size-4 shrink-0" />
					<span>
						Este proyecto ya fue enviado. Los campos no son editables.
					</span>
				</div>
			)}

			{/* Core fields */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<Label htmlFor="projectName">
						Nombre del proyecto <span className="text-destructive">*</span>
					</Label>
					<Input
						id="projectName"
						placeholder="Mi proyecto increible"
						value={projectName}
						onChange={(e) => {
							setProjectName(e.target.value);
							setErrors((prev) => {
								const next = { ...prev };
								delete next.__projectName;
								return next;
							});
						}}
						aria-invalid={!!errors.__projectName}
						disabled={isAlreadySubmitted}
					/>
					{errors.__projectName && (
						<p className="flex items-center gap-1 text-xs text-destructive">
							<AlertCircle className="size-3" />
							{errors.__projectName}
						</p>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="shortDescription">Descripcion corta</Label>
					<Textarea
						id="shortDescription"
						placeholder="Describe tu proyecto en una o dos oraciones"
						value={shortDescription}
						onChange={(e) => setShortDescription(e.target.value)}
						rows={3}
						disabled={isAlreadySubmitted}
					/>
				</div>
			</div>

			{/* Dynamic fields */}
			{visibleFields.length > 0 && (
				<div className="flex flex-col gap-6">
					{visibleFields.map((field) => (
						<div key={field.id} className="flex flex-col gap-2">
							<Label htmlFor={field.id}>
								{field.label}
								{field.required && <span className="text-destructive"> *</span>}
							</Label>
							{field.description && (
								<p className="text-xs text-muted-foreground">
									{field.description}
								</p>
							)}
							{renderField(field)}
							{errors[field.id] && (
								<p className="flex items-center gap-1 text-xs text-destructive">
									<AlertCircle className="size-3" />
									{errors[field.id]}
								</p>
							)}
						</div>
					))}
				</div>
			)}

			{/* Actions */}
			{!isAlreadySubmitted && submission && (
				<div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={handleSaveDraft}
						disabled={isSaving || isSubmitting || deadlinePassed}
					>
						{isSaving ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Save className="size-4" />
						)}
						Guardar borrador
					</Button>

					<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
						<DialogTrigger asChild>
							<Button
								type="button"
								onClick={handleSubmit}
								disabled={isSaving || isSubmitting || !!deadlinePassed}
							>
								{isSubmitting ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Send className="size-4" />
								)}
								Enviar proyecto
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Confirmar envio</DialogTitle>
								<DialogDescription>
									Una vez enviado, no podras modificar los campos principales.
									Asegurate de que toda la informacion sea correcta.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button variant="outline" onClick={() => setConfirmOpen(false)}>
									Cancelar
								</Button>
								<Button onClick={confirmSubmit} disabled={isSubmitting}>
									{isSubmitting ? (
										<Loader2 className="size-4 animate-spin" />
									) : (
										<Send className="size-4" />
									)}
									Confirmar envio
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			)}
		</div>
	);
}
