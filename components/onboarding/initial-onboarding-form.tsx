"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createOrUpdateUserPreferences } from "@/lib/actions/user-preferences";
import { Loader2, UserCircle2, MapPin, Monitor, TrendingUp } from "lucide-react";

const PERU_DEPARTMENTS = [
	{ value: "Lima", label: "Lima" },
	{ value: "Arequipa", label: "Arequipa" },
	{ value: "Cusco", label: "Cusco" },
	{ value: "La Libertad", label: "La Libertad" },
	{ value: "Piura", label: "Piura" },
	{ value: "Lambayeque", label: "Lambayeque" },
	{ value: "Junín", label: "Junín" },
	{ value: "Ica", label: "Ica" },
	{ value: "Puno", label: "Puno" },
	{ value: "Cajamarca", label: "Cajamarca" },
	{ value: "Ancash", label: "Ancash" },
	{ value: "Huánuco", label: "Huánuco" },
	{ value: "San Martín", label: "San Martín" },
	{ value: "Loreto", label: "Loreto" },
	{ value: "Ucayali", label: "Ucayali" },
	{ value: "Madre de Dios", label: "Madre de Dios" },
	{ value: "Ayacucho", label: "Ayacucho" },
	{ value: "Apurímac", label: "Apurímac" },
	{ value: "Huancavelica", label: "Huancavelica" },
	{ value: "Tacna", label: "Tacna" },
	{ value: "Moquegua", label: "Moquegua" },
	{ value: "Pasco", label: "Pasco" },
	{ value: "Tumbes", label: "Tumbes" },
	{ value: "Amazonas", label: "Amazonas" },
	{ value: "Callao", label: "Callao" },
];

const ROLE_OPTIONS = [
	{
		value: "member",
		label: "Participante",
		description: "Asisto a eventos y hackathons",
	},
	{
		value: "organizer",
		label: "Organizador",
		description: "Dirijo una comunidad o creo eventos",
	},
];

const FORMAT_OPTIONS = [
	{
		value: "virtual",
		label: "Virtual",
		description: "Prefiero eventos online",
	},
	{
		value: "in-person",
		label: "Presencial",
		description: "Prefiero eventos en persona",
	},
	{
		value: "hybrid",
		label: "Híbrido",
		description: "Ambos formatos me interesan",
	},
	{
		value: "any",
		label: "Sin preferencia",
		description: "Me adapto a cualquier formato",
	},
];

const SKILL_LEVEL_OPTIONS = [
	{
		value: "beginner",
		label: "Principiante",
		description: "Estoy empezando en tech",
	},
	{
		value: "intermediate",
		label: "Intermedio",
		description: "Tengo experiencia básica",
	},
	{
		value: "advanced",
		label: "Avanzado",
		description: "Tengo experiencia significativa",
	},
	{
		value: "all",
		label: "Todos los niveles",
		description: "Me interesan eventos de cualquier nivel",
	},
];

export function InitialOnboardingForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [role, setRole] = useState<"member" | "organizer" | "">("");
	const [department, setDepartment] = useState("");
	const [formatPreference, setFormatPreference] = useState<
		"virtual" | "in-person" | "hybrid" | "any"
	>("any");
	const [skillLevel, setSkillLevel] = useState<
		"beginner" | "intermediate" | "advanced" | "all"
	>("all");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		if (!role) {
			setError("Por favor selecciona tu rol");
			setIsSubmitting(false);
			return;
		}

		try {
			await createOrUpdateUserPreferences({
				role: role as "member" | "organizer",
				department: department || undefined,
				formatPreference,
				skillLevel,
				hasCompletedOnboarding: true,
			});

			router.push("/onboarding/redirect");
			router.refresh();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al guardar preferencias",
			);
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			<FieldGroup>
				<Field>
					<FieldLabel>
						<UserCircle2 className="h-4 w-4" />
						¿Cuál es tu rol principal?
					</FieldLabel>
					<div className="grid gap-3">
						{ROLE_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => setRole(option.value as "member" | "organizer")}
								className={`p-4 rounded-lg border-2 text-left transition-all ${
									role === option.value
										? "border-foreground bg-muted"
										: "border-border hover:border-muted-foreground"
								}`}
							>
								<p className="font-medium">{option.label}</p>
								<p className="text-sm text-muted-foreground">
									{option.description}
								</p>
							</button>
						))}
					</div>
					<FieldDescription>
						Esto nos ayuda a personalizar tu experiencia
					</FieldDescription>
				</Field>

				<Field>
					<FieldLabel>
						<MapPin className="h-4 w-4" />
						¿En qué departamento estás? (opcional)
					</FieldLabel>
					<Select value={department} onValueChange={setDepartment}>
						<SelectTrigger>
							<SelectValue placeholder="Selecciona tu departamento" />
						</SelectTrigger>
						<SelectContent>
							{PERU_DEPARTMENTS.map((dept) => (
								<SelectItem key={dept.value} value={dept.value}>
									{dept.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FieldDescription>
						Te mostraremos eventos cercanos a tu ubicación
					</FieldDescription>
				</Field>

				<Field>
					<FieldLabel>
						<Monitor className="h-4 w-4" />
						¿Qué formato de eventos prefieres?
					</FieldLabel>
					<div className="grid sm:grid-cols-2 gap-3">
						{FORMAT_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() =>
									setFormatPreference(
										option.value as "virtual" | "in-person" | "hybrid" | "any",
									)
								}
								className={`p-3 rounded-lg border text-left transition-all ${
									formatPreference === option.value
										? "border-foreground bg-muted"
										: "border-border hover:border-muted-foreground"
								}`}
							>
								<p className="font-medium text-sm">{option.label}</p>
								<p className="text-xs text-muted-foreground">
									{option.description}
								</p>
							</button>
						))}
					</div>
				</Field>

				<Field>
					<FieldLabel>
						<TrendingUp className="h-4 w-4" />
						¿Cuál es tu nivel de experiencia?
					</FieldLabel>
					<div className="grid sm:grid-cols-2 gap-3">
						{SKILL_LEVEL_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() =>
									setSkillLevel(
										option.value as "beginner" | "intermediate" | "advanced" | "all",
									)
								}
								className={`p-3 rounded-lg border text-left transition-all ${
									skillLevel === option.value
										? "border-foreground bg-muted"
										: "border-border hover:border-muted-foreground"
								}`}
							>
								<p className="font-medium text-sm">{option.label}</p>
								<p className="text-xs text-muted-foreground">
									{option.description}
								</p>
							</button>
						))}
					</div>
				</Field>
			</FieldGroup>

			{error && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
					{error}
				</div>
			)}

			<div className="flex justify-end">
				<Button type="submit" disabled={isSubmitting || !role} size="lg">
					{isSubmitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Guardando...
						</>
					) : (
						"Continuar"
					)}
				</Button>
			</div>
		</form>
	);
}
