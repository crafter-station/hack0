"use client";

import { Award, Loader2, Palette, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganizationById } from "@/lib/actions/organizations";
import {
	DEFAULT_BADGE_STYLE_PROMPT,
	DEFAULT_BADGE_BACKGROUND_PROMPT,
} from "@/lib/badge/defaults";
import type { Organization } from "@/lib/db/schema";

interface BadgeSettingsFormProps {
	organization: Organization;
}

export function BadgeSettingsForm({ organization }: BadgeSettingsFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [badgeEnabled, setBadgeEnabled] = useState(
		organization.badgeEnabled ?? false,
	);
	const [badgeStylePrompt, setBadgeStylePrompt] = useState(
		organization.badgeStylePrompt || "",
	);
	const [badgeBackgroundPrompt, setBadgeBackgroundPrompt] = useState(
		organization.badgeBackgroundPrompt || "",
	);
	const [badgePrimaryColor, setBadgePrimaryColor] = useState(
		organization.badgePrimaryColor || "#10b981",
	);
	const [badgeSecondaryColor, setBadgeSecondaryColor] = useState(
		organization.badgeSecondaryColor || "#059669",
	);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);
		setSuccess(false);

		try {
			await updateOrganizationById(organization.id, {
				badgeEnabled,
				badgeStylePrompt: badgeStylePrompt || null,
				badgeBackgroundPrompt: badgeBackgroundPrompt || null,
				badgePrimaryColor: badgePrimaryColor || null,
				badgeSecondaryColor: badgeSecondaryColor || null,
			});

			setSuccess(true);
			router.refresh();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Error al actualizar configuración de badges",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="flex items-center gap-3 pb-4 border-b border-border/50">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
					<Award className="h-5 w-5" />
				</div>
				<div>
					<h2 className="text-lg font-semibold">Badges de Miembros</h2>
					<p className="text-sm text-muted-foreground">
						Permite que los miembros generen badges personalizados con IA
					</p>
				</div>
			</div>

			{error && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				</div>
			)}

			{success && (
				<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
					<p className="text-sm text-emerald-600 dark:text-emerald-400">
						Configuración de badges actualizada
					</p>
				</div>
			)}

			<div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
				<div className="space-y-0.5">
					<Label className="text-sm font-medium">Habilitar badges</Label>
					<p className="text-xs text-muted-foreground">
						Los miembros podrán generar badges desde la página de la comunidad
					</p>
				</div>
				<Switch checked={badgeEnabled} onCheckedChange={setBadgeEnabled} />
			</div>

			{badgeEnabled && (
				<>
					<div className="space-y-4">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Sparkles className="h-4 w-4 text-amber-500" />
							Prompts de IA (opcional)
						</div>

						<div className="space-y-2">
							<Label className="text-xs text-muted-foreground">
								Estilo del retrato
							</Label>
							<Textarea
								value={badgeStylePrompt}
								onChange={(e) => setBadgeStylePrompt(e.target.value)}
								placeholder={DEFAULT_BADGE_STYLE_PROMPT}
								rows={3}
								className="text-sm resize-none"
							/>
							<p className="text-xs text-muted-foreground">
								Describe el estilo artístico para transformar las fotos de los
								miembros
							</p>
						</div>

						<div className="space-y-2">
							<Label className="text-xs text-muted-foreground">
								Fondo del badge
							</Label>
							<Textarea
								value={badgeBackgroundPrompt}
								onChange={(e) => setBadgeBackgroundPrompt(e.target.value)}
								placeholder={DEFAULT_BADGE_BACKGROUND_PROMPT}
								rows={3}
								className="text-sm resize-none"
							/>
							<p className="text-xs text-muted-foreground">
								Describe el fondo que se generará detrás del retrato
							</p>
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Palette className="h-4 w-4 text-blue-500" />
							Colores del badge
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground">
									Color primario
								</Label>
								<div className="flex items-center gap-2">
									<input
										type="color"
										value={badgePrimaryColor}
										onChange={(e) => setBadgePrimaryColor(e.target.value)}
										className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
									/>
									<input
										type="text"
										value={badgePrimaryColor}
										onChange={(e) => setBadgePrimaryColor(e.target.value)}
										className="h-10 flex-1 rounded border border-border bg-transparent px-3 text-sm font-mono uppercase"
										maxLength={7}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground">
									Color secundario
								</Label>
								<div className="flex items-center gap-2">
									<input
										type="color"
										value={badgeSecondaryColor}
										onChange={(e) => setBadgeSecondaryColor(e.target.value)}
										className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
									/>
									<input
										type="text"
										value={badgeSecondaryColor}
										onChange={(e) => setBadgeSecondaryColor(e.target.value)}
										className="h-10 flex-1 rounded border border-border bg-transparent px-3 text-sm font-mono uppercase"
										maxLength={7}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-lg border border-dashed border-border/50 p-4">
						<div className="flex items-center gap-3">
							<div
								className="h-16 w-16 rounded-lg"
								style={{
									background: `linear-gradient(135deg, ${badgePrimaryColor}, ${badgeSecondaryColor})`,
								}}
							/>
							<div className="flex-1 space-y-1">
								<p className="text-sm font-medium">Vista previa de colores</p>
								<p className="text-xs text-muted-foreground">
									Estos colores se usarán en el borde y detalles del badge
								</p>
							</div>
						</div>
					</div>
				</>
			)}

			<Button
				type="submit"
				disabled={isSubmitting}
				className="w-full h-10 text-sm gap-2"
			>
				{isSubmitting ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Guardando...
					</>
				) : (
					<>
						<Save className="h-4 w-4" />
						Guardar configuración de badges
					</>
				)}
			</Button>
		</form>
	);
}
