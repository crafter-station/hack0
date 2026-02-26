"use client";

import {
	AlignLeft,
	AtSign,
	CheckSquare,
	FileUp,
	Hash,
	Link,
	List,
	ListChecks,
	Plus,
	Text,
	Trash2,
	Type,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
	TemplateField,
	TemplateFieldOption,
	TemplateFieldValidation,
} from "@/lib/db/schema";

interface TemplateFieldEditorProps {
	field?: TemplateField;
	onSave: (field: TemplateField) => void;
	onCancel: () => void;
	existingFieldIds: string[];
}

const FIELD_TYPES = [
	{ value: "text", label: "Texto corto", icon: Type },
	{ value: "textarea", label: "Texto largo", icon: AlignLeft },
	{ value: "url", label: "URL", icon: Link },
	{ value: "email", label: "Email", icon: AtSign },
	{ value: "number", label: "Numero", icon: Hash },
	{ value: "select", label: "Seleccion unica", icon: List },
	{ value: "multiselect", label: "Seleccion multiple", icon: ListChecks },
	{ value: "checkbox", label: "Casilla", icon: CheckSquare },
	{ value: "file", label: "Archivo", icon: FileUp },
	{ value: "richtext", label: "Texto enriquecido", icon: Text },
] as const;

type FieldType = TemplateField["type"];

function generateKey(label: string): string {
	return label
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "");
}

function hasOptions(type: FieldType): boolean {
	return type === "select" || type === "multiselect";
}

function hasTextValidation(type: FieldType): boolean {
	return type === "text" || type === "textarea" || type === "richtext";
}

function hasNumberValidation(type: FieldType): boolean {
	return type === "number";
}

function hasFileValidation(type: FieldType): boolean {
	return type === "file";
}

export function TemplateFieldEditor({
	field,
	onSave,
	onCancel,
	existingFieldIds,
}: TemplateFieldEditorProps) {
	const isEditing = !!field;

	const [type, setType] = useState<FieldType>(field?.type ?? "text");
	const [label, setLabel] = useState(field?.label ?? "");
	const [key, setKey] = useState(field?.key ?? "");
	const [description, setDescription] = useState(field?.description ?? "");
	const [placeholder, setPlaceholder] = useState(field?.placeholder ?? "");
	const [required, setRequired] = useState(field?.required ?? false);
	const [validation, setValidation] = useState<TemplateFieldValidation>(
		field?.validation ?? {},
	);
	const [options, setOptions] = useState<TemplateFieldOption[]>(
		field?.options ?? [],
	);
	const [keyManuallyEdited, setKeyManuallyEdited] = useState(isEditing);

	useEffect(() => {
		if (!keyManuallyEdited && label) {
			setKey(generateKey(label));
		}
	}, [label, keyManuallyEdited]);

	const handleSave = () => {
		if (!label.trim() || !key.trim()) return;

		const newField: TemplateField = {
			id: field?.id ?? nanoid(),
			key: key.trim(),
			type,
			label: label.trim(),
			description: description.trim() || undefined,
			placeholder: placeholder.trim() || undefined,
			required,
			order: field?.order ?? 0,
			validation: Object.keys(validation).length > 0 ? validation : undefined,
			options: hasOptions(type) && options.length > 0 ? options : undefined,
		};

		onSave(newField);
	};

	const addOption = () => {
		setOptions([...options, { label: "", value: "" }]);
	};

	const updateOption = (
		index: number,
		update: Partial<TemplateFieldOption>,
	) => {
		setOptions(
			options.map((opt, i) => (i === index ? { ...opt, ...update } : opt)),
		);
	};

	const removeOption = (index: number) => {
		setOptions(options.filter((_, i) => i !== index));
	};

	const updateValidation = (update: Partial<TemplateFieldValidation>) => {
		setValidation((prev) => {
			const next = { ...prev, ...update };
			// Clean undefined values
			for (const k of Object.keys(next) as (keyof TemplateFieldValidation)[]) {
				if (next[k] === undefined || next[k] === null || next[k] === "") {
					delete next[k];
				}
			}
			return next;
		});
	};

	const isValid =
		label.trim().length > 0 &&
		key.trim().length > 0 &&
		(!hasOptions(type) ||
			options.every((o) => o.label.trim() && o.value.trim()));

	return (
		<Dialog open onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Editar campo" : "Agregar campo"}
					</DialogTitle>
				</DialogHeader>

				<DialogBody>
					{/* Field type */}
					<div className="space-y-2">
						<Label>Tipo de campo</Label>
						<Select value={type} onValueChange={(v) => setType(v as FieldType)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{FIELD_TYPES.map((ft) => (
									<SelectItem key={ft.value} value={ft.value}>
										<ft.icon className="size-4 text-muted-foreground" />
										{ft.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Label */}
					<div className="space-y-2">
						<Label>Etiqueta</Label>
						<Input
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="Ej: Enlace al repositorio"
						/>
					</div>

					{/* Key */}
					<div className="space-y-2">
						<Label>
							Clave
							<span className="text-muted-foreground font-normal ml-1">
								(identificador interno)
							</span>
						</Label>
						<Input
							value={key}
							onChange={(e) => {
								setKey(e.target.value);
								setKeyManuallyEdited(true);
							}}
							placeholder="enlace_repositorio"
							className="font-mono text-sm"
						/>
					</div>

					{/* Description */}
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
							placeholder="Instrucciones para los participantes"
							className="min-h-12"
						/>
					</div>

					{/* Placeholder */}
					{type !== "checkbox" && type !== "file" && (
						<div className="space-y-2">
							<Label>
								Placeholder
								<span className="text-muted-foreground font-normal ml-1">
									(opcional)
								</span>
							</Label>
							<Input
								value={placeholder}
								onChange={(e) => setPlaceholder(e.target.value)}
								placeholder="Texto de ejemplo"
							/>
						</div>
					)}

					{/* Required toggle */}
					<div className="flex items-center justify-between rounded-lg border p-3">
						<div>
							<p className="text-sm font-medium">Obligatorio</p>
							<p className="text-xs text-muted-foreground">
								Los participantes deben completar este campo
							</p>
						</div>
						<Switch checked={required} onCheckedChange={setRequired} />
					</div>

					{/* Options for select/multiselect */}
					{hasOptions(type) && (
						<div className="space-y-3">
							<Label>Opciones</Label>
							{options.map((option, index) => (
								<div key={index} className="flex items-center gap-2">
									<Input
										value={option.label}
										onChange={(e) => {
											const newLabel = e.target.value;
											updateOption(index, {
												label: newLabel,
												value:
													option.value === generateKey(option.label)
														? generateKey(newLabel)
														: option.value,
											});
										}}
										placeholder="Etiqueta"
										className="flex-1"
									/>
									<Input
										value={option.value}
										onChange={(e) =>
											updateOption(index, { value: e.target.value })
										}
										placeholder="Valor"
										className="flex-1 font-mono text-sm"
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeOption(index)}
									>
										<Trash2 className="size-4 text-muted-foreground" />
									</Button>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addOption}
								className="w-full"
							>
								<Plus className="size-4" />
								Agregar opcion
							</Button>
						</div>
					)}

					{/* Validation: text */}
					{hasTextValidation(type) && (
						<div className="space-y-3">
							<Label>Validacion</Label>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground font-normal">
										Min. caracteres
									</Label>
									<Input
										type="number"
										min={0}
										value={validation.minLength ?? ""}
										onChange={(e) =>
											updateValidation({
												minLength: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										placeholder="0"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground font-normal">
										Max. caracteres
									</Label>
									<Input
										type="number"
										min={0}
										value={validation.maxLength ?? ""}
										onChange={(e) =>
											updateValidation({
												maxLength: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										placeholder="Sin limite"
									/>
								</div>
							</div>
						</div>
					)}

					{/* Validation: number */}
					{hasNumberValidation(type) && (
						<div className="space-y-3">
							<Label>Validacion</Label>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground font-normal">
										Valor minimo
									</Label>
									<Input
										type="number"
										value={validation.min ?? ""}
										onChange={(e) =>
											updateValidation({
												min: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										placeholder="Sin limite"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground font-normal">
										Valor maximo
									</Label>
									<Input
										type="number"
										value={validation.max ?? ""}
										onChange={(e) =>
											updateValidation({
												max: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										placeholder="Sin limite"
									/>
								</div>
							</div>
						</div>
					)}

					{/* Validation: file */}
					{hasFileValidation(type) && (
						<div className="space-y-3">
							<Label>Validacion</Label>
							<div className="space-y-3">
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground font-normal">
										Tipos aceptados
									</Label>
									<Input
										value={validation.accept ?? ""}
										onChange={(e) =>
											updateValidation({
												accept: e.target.value || undefined,
											})
										}
										placeholder=".pdf,.zip,.png,.jpg"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground font-normal">
										Tamano maximo (MB)
									</Label>
									<Input
										type="number"
										min={0}
										value={
											validation.maxFileSize
												? validation.maxFileSize / (1024 * 1024)
												: ""
										}
										onChange={(e) =>
											updateValidation({
												maxFileSize: e.target.value
													? Number(e.target.value) * 1024 * 1024
													: undefined,
											})
										}
										placeholder="10"
									/>
								</div>
							</div>
						</div>
					)}
				</DialogBody>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancelar
					</Button>
					<Button type="button" onClick={handleSave} disabled={!isValid}>
						{isEditing ? "Guardar cambios" : "Agregar campo"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
