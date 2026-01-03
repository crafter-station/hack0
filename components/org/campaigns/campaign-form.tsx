"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
	BadgePreviewPanel,
	BrandColorPicker,
	StylePresetSelector,
	StylePromptsEditor,
} from "@/components/org/badges";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBadgeStyleTester } from "@/hooks/use-badge-style-tester";
import { createCampaign, updateCampaign } from "@/lib/actions/campaigns";
import {
	CUSTOM_STYLE_ID,
	DEFAULT_STYLE_ID,
	getStylePrompts,
} from "@/lib/badge/style-presets";
import type { BadgeCampaign, Organization } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface CampaignFormProps {
	communityId: string;
	communitySlug: string;
	community: Organization;
	campaign?: BadgeCampaign;
}

export function CampaignForm({
	communityId,
	communitySlug,
	community,
	campaign,
}: CampaignFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isEditing = !!campaign;
	const isDefault = campaign?.type === "default";

	const [formData, setFormData] = useState({
		name: campaign?.name ?? "",
		description: campaign?.description ?? "",
		type: (campaign?.type ?? "seasonal") as "seasonal" | "event",
		badgeLabel: campaign?.badgeLabel ?? "",
		badgeIcon: campaign?.badgeIcon ?? "",
		stylePreset: campaign?.stylePreset ?? DEFAULT_STYLE_ID,
		accentColor: campaign?.accentColor ?? null,
		portraitPrompt: campaign?.portraitPrompt ?? "",
		backgroundPrompt: campaign?.backgroundPrompt ?? "",
		startsAt: campaign?.startsAt ?? undefined,
		endsAt: campaign?.endsAt ?? undefined,
		maxBadges: campaign?.maxBadges ?? undefined,
	});

	const [testImageUrl, setTestImageUrl] = useState<string | null>(null);
	const [customBackgroundImageUrl, setCustomBackgroundImageUrl] = useState<
		string | null
	>(campaign?.customBackgroundImageUrl ?? null);

	const handleError = useCallback((err: string) => setError(err), []);

	const {
		isGenerating,
		generationStep,
		previewImages,
		testStyle,
		resetPreview,
	} = useBadgeStyleTester({
		communityId,
		onError: handleError,
	});

	const isCustomStyle = formData.stylePreset === CUSTOM_STYLE_ID;
	const currentPrompts = isCustomStyle
		? {
				portraitPrompt: formData.portraitPrompt,
				backgroundPrompt: formData.backgroundPrompt,
			}
		: getStylePrompts(formData.stylePreset);

	useEffect(() => {
		resetPreview();
	}, [formData.stylePreset, resetPreview]);

	const handleTestStyle = async () => {
		const portraitPrompt = isCustomStyle
			? formData.portraitPrompt
			: currentPrompts.portraitPrompt;
		const backgroundPrompt = isCustomStyle
			? formData.backgroundPrompt
			: currentPrompts.backgroundPrompt;

		await testStyle({
			stylePreset: formData.stylePreset,
			portraitPrompt,
			backgroundPrompt,
			testImageUrl: testImageUrl || undefined,
			customBackgroundImageUrl: customBackgroundImageUrl || undefined,
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			if (isEditing) {
				const result = await updateCampaign(campaign.id, {
					name: formData.name,
					description: formData.description || undefined,
					badgeLabel: formData.badgeLabel || undefined,
					badgeIcon: formData.badgeIcon || undefined,
					stylePreset: formData.stylePreset || undefined,
					accentColor: formData.accentColor || undefined,
					portraitPrompt: formData.portraitPrompt || undefined,
					backgroundPrompt: formData.backgroundPrompt || undefined,
					customBackgroundImageUrl: customBackgroundImageUrl || undefined,
					startsAt: formData.startsAt,
					endsAt: formData.endsAt,
					maxBadges: formData.maxBadges,
				});

				if (!result.success) {
					setError(result.error || "Error al actualizar la campaña");
					return;
				}
			} else {
				const result = await createCampaign(communityId, {
					name: formData.name,
					description: formData.description || undefined,
					type: formData.type,
					badgeLabel: formData.badgeLabel || undefined,
					badgeIcon: formData.badgeIcon || undefined,
					stylePreset: formData.stylePreset || undefined,
					accentColor: formData.accentColor || undefined,
					portraitPrompt: formData.portraitPrompt || undefined,
					backgroundPrompt: formData.backgroundPrompt || undefined,
					customBackgroundImageUrl: customBackgroundImageUrl || undefined,
					startsAt: formData.startsAt,
					endsAt: formData.endsAt,
					maxBadges: formData.maxBadges,
				});

				if (!result.success) {
					setError(result.error || "Error al crear la campaña");
					return;
				}
			}

			router.push(`/c/${communitySlug}/settings/campaigns`);
			router.refresh();
		} catch {
			setError("Error inesperado");
		} finally {
			setIsSubmitting(false);
		}
	};

	const canTest = isCustomStyle ? !!formData.portraitPrompt : true;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
				<div className="lg:col-span-3 space-y-6">
					<div className="rounded-lg border border-border p-6 space-y-6">
						<h4 className="font-medium">Información básica</h4>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="name">Nombre de la campaña *</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, name: e.target.value }))
									}
									placeholder="Ej: Navidad 2025"
									required
									disabled={isDefault || isGenerating}
								/>
							</div>

							{!isDefault && (
								<div className="space-y-2">
									<Label htmlFor="type">Tipo de campaña</Label>
									<Select
										value={formData.type}
										onValueChange={(value: "seasonal" | "event") =>
											setFormData((prev) => ({ ...prev, type: value }))
										}
										disabled={isEditing || isGenerating}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="seasonal">Estacional</SelectItem>
											<SelectItem value="event">Evento</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Descripción</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								placeholder="Describe brevemente esta campaña..."
								rows={2}
								disabled={isGenerating}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="badgeLabel">Etiqueta del badge</Label>
								<Input
									id="badgeLabel"
									value={formData.badgeLabel}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											badgeLabel: e.target.value,
										}))
									}
									placeholder="Ej: Navidad 2025"
									maxLength={50}
									disabled={isGenerating}
								/>
								<p className="text-xs text-muted-foreground">
									Se muestra en el badge generado
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="badgeIcon">Icono/Emoji</Label>
								<Input
									id="badgeIcon"
									value={formData.badgeIcon}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											badgeIcon: e.target.value,
										}))
									}
									placeholder="Ej: 🎄"
									maxLength={10}
									disabled={isGenerating}
								/>
							</div>
						</div>
					</div>

					{!isDefault && (
						<div className="rounded-lg border border-border p-6 space-y-6">
							<h4 className="font-medium">Período de la campaña</h4>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="space-y-2">
									<Label>Fecha de inicio</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												type="button"
												variant="outline"
												disabled={isGenerating}
												className={cn(
													"w-full justify-start text-left font-normal",
													!formData.startsAt && "text-muted-foreground",
												)}
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{formData.startsAt
													? format(formData.startsAt, "PPP", { locale: es })
													: "Seleccionar..."}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												mode="single"
												selected={formData.startsAt}
												onSelect={(date) =>
													setFormData((prev) => ({
														...prev,
														startsAt: date ?? undefined,
													}))
												}
												locale={es}
											/>
										</PopoverContent>
									</Popover>
								</div>

								<div className="space-y-2">
									<Label>Fecha de fin</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												type="button"
												variant="outline"
												disabled={isGenerating}
												className={cn(
													"w-full justify-start text-left font-normal",
													!formData.endsAt && "text-muted-foreground",
												)}
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{formData.endsAt
													? format(formData.endsAt, "PPP", { locale: es })
													: "Seleccionar..."}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												mode="single"
												selected={formData.endsAt}
												onSelect={(date) =>
													setFormData((prev) => ({
														...prev,
														endsAt: date ?? undefined,
													}))
												}
												locale={es}
											/>
										</PopoverContent>
									</Popover>
								</div>

								<div className="space-y-2">
									<Label htmlFor="maxBadges">Límite de badges</Label>
									<Input
										id="maxBadges"
										type="number"
										min={1}
										value={formData.maxBadges ?? ""}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												maxBadges: e.target.value
													? Number.parseInt(e.target.value, 10)
													: undefined,
											}))
										}
										placeholder="Sin límite"
										disabled={isGenerating}
									/>
								</div>
							</div>
						</div>
					)}

					<div className="rounded-lg border border-border p-6 space-y-6">
						<h4 className="font-medium">Estilo del badge</h4>
						<p className="text-sm text-muted-foreground -mt-4">
							Configura el estilo visual. Si se deja vacío, se usará la
							configuración de la comunidad.
						</p>

						<BrandColorPicker
							value={formData.accentColor}
							onChange={(color) =>
								setFormData((prev) => ({ ...prev, accentColor: color }))
							}
							disabled={isGenerating}
						/>

						<div className="h-px bg-border" />

						<StylePresetSelector
							value={formData.stylePreset}
							onChange={(styleId) =>
								setFormData((prev) => ({ ...prev, stylePreset: styleId }))
							}
							disabled={isGenerating}
						/>

						<div className="h-px bg-border" />

						<StylePromptsEditor
							stylePreset={formData.stylePreset}
							isCustomStyle={isCustomStyle}
							portraitPrompt={formData.portraitPrompt}
							backgroundPrompt={formData.backgroundPrompt}
							currentPresetPortraitPrompt={currentPrompts.portraitPrompt}
							currentPresetBackgroundPrompt={currentPrompts.backgroundPrompt}
							onPortraitPromptChange={(value) =>
								setFormData((prev) => ({ ...prev, portraitPrompt: value }))
							}
							onBackgroundPromptChange={(value) =>
								setFormData((prev) => ({ ...prev, backgroundPrompt: value }))
							}
							testImageUrl={testImageUrl}
							customBackgroundImageUrl={customBackgroundImageUrl}
							onTestImageChange={setTestImageUrl}
							onCustomBackgroundChange={setCustomBackgroundImageUrl}
							isGenerating={isGenerating}
							onError={handleError}
						/>
					</div>

					<div className="flex items-center justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							disabled={isSubmitting || isGenerating}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || isGenerating}
							className="gap-2"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									{isEditing ? "Guardando..." : "Creando..."}
								</>
							) : (
								<>
									<Save className="h-4 w-4" />
									{isEditing ? "Guardar cambios" : "Crear campaña"}
								</>
							)}
						</Button>
					</div>
				</div>

				<div className="lg:col-span-2">
					<BadgePreviewPanel
						previewImages={previewImages}
						stylePreset={formData.stylePreset}
						isGenerating={isGenerating}
						generationStep={generationStep}
						communityName={community.displayName || community.name}
						communityLogo={community.logoUrl}
						accentColor={formData.accentColor}
						badgeLabel={formData.badgeLabel || undefined}
						canTest={canTest}
						hasCustomImages={!!testImageUrl || !!customBackgroundImageUrl}
						onTest={handleTestStyle}
					/>
				</div>
			</div>
		</form>
	);
}
