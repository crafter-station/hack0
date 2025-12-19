"use client";

import { Building2, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createOrUpdateUserPreferences } from "@/lib/actions/user-preferences";

const ROLE_OPTIONS = [
	{
		value: "member",
		label: "Participante",
		description: "Quiero asistir a eventos y hackathons",
		icon: User,
	},
	{
		value: "organizer",
		label: "Organizador",
		description: "Creo eventos y dirijo comunidades",
		icon: Building2,
	},
];

interface InitialOnboardingFormProps {
	redirectUrl?: string;
}

export function InitialOnboardingForm({
	redirectUrl,
}: InitialOnboardingFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [role, setRole] = useState<"member" | "organizer" | "">("");

	const handleSubmit = async () => {
		if (!role) {
			setError("Selecciona una opción para continuar");
			return;
		}

		setError(null);
		setIsSubmitting(true);

		try {
			await createOrUpdateUserPreferences({
				role: role as "member" | "organizer",
				hasCompletedOnboarding: true,
			});

			const destination = redirectUrl || (role === "organizer" ? "/onboarding/complete" : "/c/discover");
			router.push(destination);
			router.refresh();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al guardar. Intenta de nuevo.",
			);
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{ROLE_OPTIONS.map((option) => {
					const Icon = option.icon;
					const isSelected = role === option.value;

					return (
						<button
							key={option.value}
							type="button"
							onClick={() => setRole(option.value as "member" | "organizer")}
							disabled={isSubmitting}
							className={`relative p-6 rounded-xl border-2 text-left transition-all ${
								isSelected
									? "border-foreground bg-muted ring-1 ring-foreground"
									: "border-border hover:border-muted-foreground hover:bg-muted/50"
							} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							<div className="flex flex-col gap-3">
								<div
									className={`h-12 w-12 rounded-lg flex items-center justify-center transition-colors ${
										isSelected
											? "bg-foreground text-background"
											: "bg-muted text-muted-foreground"
									}`}
								>
									<Icon className="h-6 w-6" />
								</div>
								<div>
									<p className="font-semibold text-lg">{option.label}</p>
									<p className="text-sm text-muted-foreground mt-1">
										{option.description}
									</p>
								</div>
							</div>
							{isSelected && (
								<div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-foreground" />
							)}
						</button>
					);
				})}
			</div>

			{error && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
					{error}
				</div>
			)}

			<Button
				type="button"
				onClick={handleSubmit}
				disabled={isSubmitting || !role}
				className="w-full h-12 text-base"
			>
				{isSubmitting ? (
					<>
						<Loader2 className="h-5 w-5 animate-spin mr-2" />
						Configurando tu cuenta...
					</>
				) : (
					"Continuar"
				)}
			</Button>
		</div>
	);
}
