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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { createOrUpdateUserPreferences } from "@/lib/actions/user-preferences";
import { Loader2, UserCircle2, MapPin, Monitor, TrendingUp, ArrowRight, ArrowLeft } from "lucide-react";
import {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperSeparator,
	StepperTrigger,
} from "@/components/ui/stepper";

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

const STEPS = [1, 2, 3];

interface InitialOnboardingFormProps {
	redirectUrl?: string;
}

export function InitialOnboardingForm({ redirectUrl }: InitialOnboardingFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentStep, setCurrentStep] = useState(1);

	const [role, setRole] = useState<"member" | "organizer" | "">("");
	const [department, setDepartment] = useState("");
	const [formatPreference, setFormatPreference] = useState<
		"virtual" | "in-person" | "hybrid" | "any"
	>("any");
	const [skillLevel, setSkillLevel] = useState<
		"beginner" | "intermediate" | "advanced" | "all"
	>("all");

	const canGoNext = () => {
		if (currentStep === 1) return !!role;
		return true;
	};

	const handleNext = () => {
		if (currentStep < STEPS.length) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleFinish = async () => {
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

			const nextUrl = redirectUrl
				? `/onboarding/redirect?redirect_url=${encodeURIComponent(redirectUrl)}`
				: "/onboarding/redirect";
			router.push(nextUrl);
			router.refresh();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al guardar preferencias",
			);
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Stepper */}
			<Stepper value={currentStep} onValueChange={setCurrentStep}>
				{STEPS.map((step) => (
					<StepperItem className="not-last:flex-1" key={step} step={step}>
						<StepperTrigger>
							<StepperIndicator />
						</StepperTrigger>
						{step < STEPS.length && <StepperSeparator />}
					</StepperItem>
				))}
			</Stepper>

			{/* Step Content */}
			<div className="min-h-[320px]">
				{currentStep === 1 && (
					<Field>
						<FieldLabel>
							<UserCircle2 className="h-4 w-4" />
							¿Cuál es tu rol principal?
						</FieldLabel>
						<div className="grid grid-cols-2 gap-3 mt-3">
							{ROLE_OPTIONS.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => setRole(option.value as "member" | "organizer")}
									className={`p-3 rounded-lg border-2 text-left transition-all ${
										role === option.value
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
						<FieldDescription className="mt-3 text-xs">
							Esto nos ayuda a personalizar tu experiencia
						</FieldDescription>
					</Field>
				)}

				{currentStep === 2 && (
					<Field>
						<FieldLabel>
							<MapPin className="h-4 w-4" />
							¿En qué departamento estás?
						</FieldLabel>
						<div className="mt-3">
							<SearchableSelect
								options={PERU_DEPARTMENTS}
								value={department}
								onValueChange={setDepartment}
								placeholder="Selecciona tu departamento"
								searchPlaceholder="Buscar departamento..."
								emptyMessage="No se encontró el departamento"
							/>
						</div>
						<FieldDescription className="mt-3 text-xs">
							Te mostraremos eventos cercanos a tu ubicación. Este paso es opcional.
						</FieldDescription>
					</Field>
				)}

				{currentStep === 3 && (
					<div className="space-y-6">
						<Field>
							<FieldLabel>
								<Monitor className="h-4 w-4" />
								¿Qué formato de eventos prefieres?
							</FieldLabel>
							<div className="grid grid-cols-2 gap-2.5 mt-3">
								{FORMAT_OPTIONS.map((option) => (
									<button
										key={option.value}
										type="button"
										onClick={() =>
											setFormatPreference(
												option.value as "virtual" | "in-person" | "hybrid" | "any",
											)
										}
										className={`p-2.5 rounded-lg border text-left transition-all ${
											formatPreference === option.value
												? "border-foreground bg-muted"
												: "border-border hover:border-muted-foreground"
										}`}
									>
										<p className="font-medium text-sm">{option.label}</p>
										<p className="text-xs text-muted-foreground line-clamp-1">
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
							<div className="grid grid-cols-2 gap-2.5 mt-3">
								{SKILL_LEVEL_OPTIONS.map((option) => (
									<button
										key={option.value}
										type="button"
										onClick={() =>
											setSkillLevel(
												option.value as "beginner" | "intermediate" | "advanced" | "all",
											)
										}
										className={`p-2.5 rounded-lg border text-left transition-all ${
											skillLevel === option.value
												? "border-foreground bg-muted"
												: "border-border hover:border-muted-foreground"
										}`}
									>
										<p className="font-medium text-sm">{option.label}</p>
										<p className="text-xs text-muted-foreground line-clamp-1">
											{option.description}
										</p>
									</button>
								))}
							</div>
						</Field>
					</div>
				)}
			</div>

			{/* Error */}
			{error && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
					{error}
				</div>
			)}

			{/* Navigation */}
			<div className="flex items-center justify-between pt-4 border-t">
				<Button
					type="button"
					variant="ghost"
					onClick={handleBack}
					disabled={currentStep === 1}
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Atrás
				</Button>

				{currentStep < STEPS.length ? (
					<Button
						type="button"
						onClick={handleNext}
						disabled={!canGoNext()}
					>
						Siguiente
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				) : (
					<Button
						type="button"
						onClick={handleFinish}
						disabled={isSubmitting || !role}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Guardando...
							</>
						) : (
							"Finalizar"
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
