"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, User, ArrowRight, Sparkles } from "lucide-react";

interface PostOnboardingChoiceProps {
	personalOrgSlug: string;
	redirectUrl?: string;
}

export function PostOnboardingChoice({ personalOrgSlug, redirectUrl }: PostOnboardingChoiceProps) {
	const router = useRouter();
	const [isNavigating, setIsNavigating] = useState(false);

	const handlePersonalProfile = () => {
		setIsNavigating(true);
		router.push(redirectUrl || `/c/${personalOrgSlug}`);
		router.refresh();
	};

	const handleCreateOrganization = () => {
		setIsNavigating(true);
		router.push("/c/new");
		router.refresh();
	};

	return (
		<div className="space-y-8">
			<div className="text-center space-y-2">
				<div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-2">
					<Sparkles className="h-6 w-6 text-emerald-500" />
				</div>
				<h2 className="text-2xl font-bold tracking-tight">
					¡Cuenta creada con éxito!
				</h2>
				<p className="text-muted-foreground">
					Elige cómo quieres continuar en hack0
				</p>
			</div>

			<div className="grid gap-4">
				<button
					type="button"
					onClick={handlePersonalProfile}
					disabled={isNavigating}
					className="group relative p-6 rounded-lg border-2 border-border hover:border-foreground bg-card text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-foreground/5 transition-colors">
							<User className="h-6 w-6 text-muted-foreground" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<h3 className="font-semibold">Continuar con cuenta personal</h3>
								<span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
									Recomendado
								</span>
							</div>
							<p className="text-sm text-muted-foreground mb-3">
								Ya creamos tu perfil personal automáticamente. Comienza a explorar eventos y únete a comunidades.
							</p>
							<div className="flex items-center gap-1 text-sm font-medium text-foreground group-hover:gap-2 transition-all">
								Ir a mi perfil
								<ArrowRight className="h-4 w-4" />
							</div>
						</div>
					</div>
				</button>

				<button
					type="button"
					onClick={handleCreateOrganization}
					disabled={isNavigating}
					className="group relative p-6 rounded-lg border-2 border-border hover:border-foreground bg-card text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<div className="flex items-start gap-4">
						<div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-foreground/5 transition-colors">
							<Building2 className="h-6 w-6 text-muted-foreground" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold mb-1">Crear una organización</h3>
							<p className="text-sm text-muted-foreground mb-3">
								Configura una comunidad o empresa para organizar eventos, hackathons y conectar con tu audiencia.
							</p>
							<div className="flex items-center gap-1 text-sm font-medium text-foreground group-hover:gap-2 transition-all">
								Crear organización
								<ArrowRight className="h-4 w-4" />
							</div>
						</div>
					</div>
				</button>
			</div>

			<div className="text-center">
				<p className="text-xs text-muted-foreground">
					Podrás crear organizaciones adicionales en cualquier momento desde tu perfil
				</p>
			</div>
		</div>
	);
}
