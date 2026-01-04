"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Calendar,
	Check,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Trophy,
	Users,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createOrUpdateUser } from "@/lib/actions/users";

const transitionProps = {
	type: "spring",
	stiffness: 500,
	damping: 30,
	mass: 0.5,
};

function ChipButton({
	label,
	isSelected,
	onClick,
	disabled,
}: {
	label: string;
	isSelected: boolean;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<motion.button
			onClick={onClick}
			disabled={disabled}
			layout
			initial={false}
			transition={transitionProps}
			className={`
        inline-flex items-center h-9 px-4 rounded-md text-sm font-medium
        whitespace-nowrap overflow-hidden border
        ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
		>
			<motion.div
				className="relative flex items-center"
				animate={{
					width: isSelected ? "auto" : "100%",
					paddingRight: isSelected ? "1.5rem" : "0",
				}}
				transition={{
					ease: [0.175, 0.885, 0.32, 1.275],
					duration: 0.3,
				}}
			>
				<span>{label}</span>
				<AnimatePresence>
					{isSelected && (
						<motion.span
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0, opacity: 0 }}
							transition={transitionProps}
							className="absolute right-0"
						>
							<div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
								<Check className="w-3 h-3 text-white" strokeWidth={2} />
							</div>
						</motion.span>
					)}
				</AnimatePresence>
			</motion.div>
		</motion.button>
	);
}

const roles = [
	"Desarrollador",
	"Diseñador",
	"Data Scientist",
	"DevOps",
	"Product Manager",
	"Estudiante",
	"Otro",
];
const interests = [
	"Hackathones",
	"Workshops",
	"Meetups",
	"Conferencias",
	"Networking",
	"Mentoría",
];
const experienceLevels = ["Principiante", "Intermedio", "Avanzado", "Experto"];

const stepImages = [
	"/onboarding/tech-community-hackathon-event-in-peru.jpg",
	"/onboarding/developer-interests-coding-workshop-meetup.jpg",
	"/onboarding/career-growth-experience-level-tech-professional.jpg",
];

interface OnboardingFlowProps {
	redirectUrl?: string;
}

export function OnboardingFlow({ redirectUrl }: OnboardingFlowProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
	const [selectedExperience, setSelectedExperience] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const totalSteps = 4;

	const toggleRole = (role: string) => {
		setSelectedRoles((prev) =>
			prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
		);
	};

	const toggleInterest = (interest: string) => {
		setSelectedInterests((prev) =>
			prev.includes(interest)
				? prev.filter((i) => i !== interest)
				: [...prev, interest],
		);
	};

	const handleNext = () => {
		if (currentStep < totalSteps) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleSubmit = async () => {
		setError(null);
		setIsSubmitting(true);

		try {
			// Map experience level to skill level
			const skillLevelMap: Record<
				string,
				"beginner" | "intermediate" | "advanced" | "all"
			> = {
				Principiante: "beginner",
				Intermedio: "intermediate",
				Avanzado: "advanced",
				Experto: "advanced",
			};

			await createOrUpdateUser({
				role: "member",
				skillLevel: skillLevelMap[selectedExperience] || "all",
				hasCompletedOnboarding: true,
			});

			const destination = redirectUrl || "/c/discover";
			window.location.href = destination;
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Error al guardar. Intenta de nuevo.",
			);
			setIsSubmitting(false);
		}
	};

	const canProceed = () => {
		switch (currentStep) {
			case 0:
				return true;
			case 1:
				return selectedRoles.length > 0;
			case 2:
				return selectedInterests.length > 0;
			case 3:
				return selectedExperience !== "";
			default:
				return false;
		}
	};

	// Invitation Screen (Step 0)
	if (currentStep === 0) {
		return (
			<div className="min-h-screen bg-background flex">
				{/* Left side - Content */}
				<div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
					<div className="max-w-md">
						{/* Logo */}
						<div className="mb-8">
							<div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
								<Zap className="w-6 h-6 text-primary-foreground" />
							</div>
						</div>

						{/* Invitation text */}
						<h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 text-balance">
							La comunidad <span className="text-primary">hack0</span> te está
							invitando a formar parte de algo increíble
						</h1>
						<p className="text-muted-foreground text-lg mb-8 leading-relaxed">
							Únete a la comunidad tech más grande de Perú. Eventos,
							hackathones, networking y mucho más te esperan.
						</p>

						{/* Accept button */}
						<Button onClick={handleNext} size="lg">
							Aceptar invitación
							<ChevronRight className="w-4 h-4" />
						</Button>
					</div>
				</div>

				{/* Right side - Image */}
				<div className="hidden lg:flex flex-1 bg-muted items-center justify-center p-8">
					<div className="relative w-full max-w-lg aspect-square">
						<img
							src="/onboarding/tech-community-meetup-hackathon-peru-colorful-illu.jpg"
							alt="Tech community illustration"
							className="w-full h-full object-cover rounded-3xl"
						/>
						{/* Floating badges */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="absolute -bottom-4 -left-4 bg-card p-4 rounded-2xl shadow-lg border border-border"
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
									<Users className="w-5 h-5 text-accent" />
								</div>
								<div>
									<p className="font-semibold text-foreground">+5,000</p>
									<p className="text-sm text-muted-foreground">
										Miembros activos
									</p>
								</div>
							</div>
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5 }}
							className="absolute -top-4 -right-4 bg-card p-4 rounded-2xl shadow-lg border border-border"
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
									<Calendar className="w-5 h-5 text-primary" />
								</div>
								<div>
									<p className="font-semibold text-foreground">+100</p>
									<p className="text-sm text-muted-foreground">
										Eventos al año
									</p>
								</div>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		);
	}

	// Stepper screens (Steps 1-3)
	return (
		<div className="min-h-screen bg-background flex">
			{/* Left side - Content */}
			<div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
				<div className="max-w-lg">
					{/* Stepper indicator */}
					<div className="mb-10">
						<div className="flex items-center justify-between mb-4">
							{[1, 2, 3].map((step) => (
								<div
									key={step}
									className="flex items-center flex-1 last:flex-none"
								>
									<div
										className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
											currentStep >= step
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground"
										}`}
									>
										{currentStep > step ? <Check className="w-5 h-5" /> : step}
									</div>
									{step < 3 && (
										<div
											className={`flex-1 h-1 mx-3 rounded-full transition-colors ${
												currentStep > step ? "bg-primary" : "bg-muted"
											}`}
										/>
									)}
								</div>
							))}
						</div>
						<p className="text-muted-foreground text-sm">
							Paso {currentStep} de 3
						</p>
					</div>

					<AnimatePresence mode="wait">
						<motion.div
							key={currentStep}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
						>
							{currentStep === 1 && (
								<div>
									<div className="mb-8">
										<h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
											¿Qué es hack0?
										</h1>
										<div className="bg-card border border-border rounded-2xl p-6 mb-8">
											<div className="flex items-start gap-4">
												<div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
													<Trophy className="w-6 h-6 text-primary" />
												</div>
												<div>
													<h2 className="font-semibold text-foreground mb-2">
														La plataforma que centraliza eventos tech en Perú
													</h2>
													<p className="text-muted-foreground leading-relaxed">
														Hackathones, meetups, conferencias, workshops y más.
														Somos la comunidad de los profesionales de TI, donde
														conectamos talento, ideas y oportunidades.
													</p>
												</div>
											</div>
										</div>
									</div>
									<h2 className="text-xl font-semibold text-foreground mb-4">
										¿Cuál es tu rol?
									</h2>
									<p className="text-muted-foreground mb-6">
										Selecciona todos los que apliquen
									</p>
									<motion.div
										className="flex flex-wrap gap-3"
										layout
										transition={transitionProps}
									>
										{roles.map((role) => (
											<ChipButton
												key={role}
												label={role}
												isSelected={selectedRoles.includes(role)}
												onClick={() => toggleRole(role)}
												disabled={isSubmitting}
											/>
										))}
									</motion.div>
								</div>
							)}

							{currentStep === 2 && (
								<div>
									<h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
										¿Qué te interesa?
									</h1>
									<p className="text-muted-foreground mb-8">
										Personaliza tu experiencia seleccionando tus intereses
									</p>
									<motion.div
										className="flex flex-wrap gap-3"
										layout
										transition={transitionProps}
									>
										{interests.map((interest) => (
											<ChipButton
												key={interest}
												label={interest}
												isSelected={selectedInterests.includes(interest)}
												onClick={() => toggleInterest(interest)}
												disabled={isSubmitting}
											/>
										))}
									</motion.div>
								</div>
							)}

							{currentStep === 3 && (
								<div>
									<h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
										¿Cuál es tu nivel de experiencia?
									</h1>
									<p className="text-muted-foreground mb-8">
										Esto nos ayuda a recomendarte eventos adecuados
									</p>
									<motion.div
										className="flex flex-wrap gap-3"
										layout
										transition={transitionProps}
									>
										{experienceLevels.map((level) => (
											<ChipButton
												key={level}
												label={level}
												isSelected={selectedExperience === level}
												onClick={() => setSelectedExperience(level)}
												disabled={isSubmitting}
											/>
										))}
									</motion.div>
								</div>
							)}
						</motion.div>
					</AnimatePresence>

					{error && (
						<div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
							{error}
						</div>
					)}

					{/* Navigation buttons */}
					<div className="mt-12 flex justify-between items-center">
						<Button
							variant="outline"
							onClick={handleBack}
							disabled={isSubmitting}
						>
							<ChevronLeft className="w-4 h-4" />
							Atrás
						</Button>

						{currentStep < 3 ? (
							<Button
								onClick={handleNext}
								disabled={!canProceed() || isSubmitting}
							>
								Siguiente
								<ChevronRight className="w-4 h-4" />
							</Button>
						) : (
							<Button
								onClick={handleSubmit}
								disabled={!canProceed() || isSubmitting}
							>
								{isSubmitting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Guardando...
									</>
								) : (
									<>
										Reclamar mi badge
										<Trophy className="w-4 h-4" />
									</>
								)}
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Right side - Image */}
			<div className="hidden lg:flex flex-1 bg-muted items-center justify-center p-8">
				<AnimatePresence mode="wait">
					<motion.div
						key={currentStep}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.3 }}
						className="relative w-full max-w-lg aspect-square"
					>
						<img
							src={stepImages[currentStep - 1]}
							alt={`Step ${currentStep} illustration`}
							className="w-full h-full object-cover rounded-3xl"
						/>
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
