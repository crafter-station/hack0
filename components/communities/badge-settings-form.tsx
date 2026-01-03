"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import Atropos from "atropos/react";
import {
	ImagePlus,
	Loader2,
	Lock,
	Save,
	Sparkles,
	Wand2,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeDisplay } from "@/components/community/badge-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	clearCustomTestReferenceImage,
	testBadgeStyle,
	updateCommunityBadgeSettings,
} from "@/lib/actions/badges";
import {
	CUSTOM_STYLE_ID,
	DEFAULT_STYLE_ID,
	getStylePrompts,
} from "@/lib/badge/style-presets";
import type { Organization } from "@/lib/db/schema";
import { BrandColorPicker } from "./brand-color-picker";
import { StylePresetSelector } from "./style-preset-selector";

interface BadgeSettingsFormProps {
	organization: Organization;
}

export function BadgeSettingsForm({ organization }: BadgeSettingsFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [runId, setRunId] = useState<string | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);

	const [isTesting, setIsTesting] = useState(false);

	const { run, error: runError } = useRealtimeRun(runId || "", {
		enabled: !!runId && !!accessToken,
		accessToken: accessToken || undefined,
	});

	const generatedPortraitUrl = run?.metadata?.portraitUrl as string | undefined;
	const generatedBackgroundUrl = run?.metadata?.backgroundUrl as
		| string
		| undefined;
	const generationStep = run?.metadata?.step as string | undefined;

	const isGenerating = isTesting || (runId && run?.isExecuting);

	const savedStyleIsCustom = organization.badgeAiStyle === CUSTOM_STYLE_ID;
	const [config, setConfig] = useState({
		enabled: organization.badgeEnabled ?? false,
		accentColor: organization.badgeAccentColor as string | null,
		aiStyle: organization.badgeAiStyle ?? DEFAULT_STYLE_ID,
		customPortraitPrompt: savedStyleIsCustom
			? (organization.badgeStylePrompt ?? "")
			: "",
		customBackgroundPrompt: savedStyleIsCustom
			? (organization.badgeBackgroundPrompt ?? "")
			: "",
	});

	const [styleTestImages, setStyleTestImages] = useState<
		Record<string, { portrait: string | null; background: string | null }>
	>(organization.badgeStyleTestImages ?? {});

	const [testImageUrl, setTestImageUrl] = useState<string | null>(
		organization.badgeCustomTestReferenceUrl ?? null,
	);
	const [customBackgroundImageUrl, setCustomBackgroundImageUrl] = useState<
		string | null
	>(organization.badgeCustomBackgroundImageUrl ?? null);
	const [isUploadingTestImage, setIsUploadingTestImage] = useState(false);
	const [isUploadingBackground, setIsUploadingBackground] = useState(false);

	const isCustomStyle = config.aiStyle === CUSTOM_STYLE_ID;
	const currentPrompts = isCustomStyle
		? {
				portraitPrompt: config.customPortraitPrompt,
				backgroundPrompt: config.customBackgroundPrompt,
			}
		: getStylePrompts(config.aiStyle);

	const currentStyleTestImages = styleTestImages[config.aiStyle] ?? {
		portrait: null,
		background: null,
	};

	useEffect(() => {
		if (run?.isCompleted && generatedPortraitUrl && generatedBackgroundUrl) {
			setStyleTestImages((prev) => ({
				...prev,
				[config.aiStyle]: {
					portrait: generatedPortraitUrl,
					background: generatedBackgroundUrl,
				},
			}));
			setRunId(null);
			setAccessToken(null);
			setIsTesting(false);
		}
	}, [
		run?.isCompleted,
		generatedPortraitUrl,
		generatedBackgroundUrl,
		config.aiStyle,
	]);

	useEffect(() => {
		if (runError || run?.status === "FAILED") {
			setError("Error al generar el preview");
			setRunId(null);
			setAccessToken(null);
			setIsTesting(false);
		}
	}, [runError, run?.status]);

	useEffect(() => {
		setRunId(null);
		setAccessToken(null);
		setIsTesting(false);
	}, [config.aiStyle]);

	const handleTestStyle = async () => {
		const portraitPrompt = isCustomStyle
			? config.customPortraitPrompt
			: currentPrompts.portraitPrompt;
		const backgroundPrompt = isCustomStyle
			? config.customBackgroundPrompt
			: currentPrompts.backgroundPrompt;

		if (!portraitPrompt) {
			setError("Debes completar el prompt de retrato");
			return;
		}

		setError(null);
		setIsTesting(true);

		try {
			const result = await testBadgeStyle(
				organization.id,
				config.aiStyle,
				portraitPrompt,
				backgroundPrompt || undefined,
				testImageUrl || undefined,
				customBackgroundImageUrl || undefined,
			);

			if (!result.success) {
				setError(result.error || "Error al iniciar la prueba");
				setIsTesting(false);
			} else if (result.runId && result.publicAccessToken) {
				setRunId(result.runId);
				setAccessToken(result.publicAccessToken);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al probar estilo");
			setIsTesting(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);
		setSuccess(false);

		try {
			await updateCommunityBadgeSettings(organization.id, {
				badgeEnabled: config.enabled,
				badgeAccentColor: config.accentColor,
				badgeStylePrompt: isCustomStyle ? config.customPortraitPrompt : null,
				badgeBackgroundPrompt: isCustomStyle
					? config.customBackgroundPrompt
					: null,
				badgeAiStyle: config.aiStyle,
			});

			setSuccess(true);
			router.refresh();

			setTimeout(() => setSuccess(false), 3000);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Error al guardar la configuración",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getPreviewImages = () => {
		if (currentStyleTestImages.portrait && currentStyleTestImages.background) {
			return {
				portrait: currentStyleTestImages.portrait,
				background: currentStyleTestImages.background,
				hasImages: true,
				isCustomPreview: true,
			};
		}
		if (!isCustomStyle) {
			return {
				portrait: `/badges/styles/${config.aiStyle}-portrait.png`,
				background: `/badges/styles/${config.aiStyle}-background.png`,
				hasImages: true,
				isCustomPreview: false,
			};
		}
		return {
			portrait: null,
			background: null,
			hasImages: false,
			isCustomPreview: false,
		};
	};

	const previewImages = getPreviewImages();

	const getStepLabel = (step: string | undefined) => {
		switch (step) {
			case "initializing":
				return "Iniciando...";
			case "generating_portrait":
				return "Generando retrato...";
			case "removing_background":
				return "Removiendo fondo...";
			case "generating_background":
				return "Generando fondo...";
			case "using_custom_background":
				return "Usando fondo personalizado...";
			case "uploading_to_storage":
				return "Subiendo imágenes...";
			case "saving_to_database":
				return "Guardando...";
			case "completed":
				return "¡Completado!";
			default:
				return "Procesando...";
		}
	};

	const canTest = isCustomStyle ? !!config.customPortraitPrompt : true;

	const getPlaceholders = () => {
		switch (config.aiStyle) {
			case "pixel_art":
				return {
					portrait:
						"Ej: 8-bit pixel-art portrait, retro gaming style, cute and cartoonish...",
					background:
						"Ej: Dark pixel art tech background, purple gradient, retro terminal aesthetic...",
				};
			case "cyberpunk":
				return {
					portrait:
						"Ej: Cyberpunk stylized portrait, neon cyan and magenta lighting, futuristic...",
					background:
						"Ej: Dark cyberpunk background, neon grid lines, holographic HUD elements...",
				};
			case "anime":
				return {
					portrait:
						"Ej: Anime style portrait, clean cel-shaded, big expressive eyes, modern anime aesthetic...",
					background:
						"Ej: Soft pastel gradient sky, cherry blossom petals, dreamy golden hour lighting...",
				};
			case "notion":
				return {
					portrait:
						"Ej: Minimalist black and white line art, simple clean lines, bold outlines...",
					background:
						"Ej: Simple light gray gradient, minimal clean professional aesthetic...",
				};
			case "ghibli":
				return {
					portrait:
						"Ej: Studio Ghibli style, hand-drawn animation, soft warm colors, dreamy and whimsical...",
					background:
						"Ej: Soft hand-painted clouds, golden hour sky, pastoral landscape, watercolor texture...",
				};
			default:
				return {
					portrait:
						"Ej: Oil painting portrait, classical renaissance style, dramatic chiaroscuro lighting, rich warm colors...",
					background:
						"Ej: Dramatic oil painted sky, sunset clouds, golden and crimson tones, textured brush strokes...",
				};
		}
	};

	const placeholders = getPlaceholders();

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Configuración de Badges</h3>
					<p className="text-sm text-muted-foreground">
						Configura los badges de tu comunidad
					</p>
				</div>
				<Button
					type="submit"
					disabled={isSubmitting || isGenerating}
					size="sm"
					className="gap-2"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Guardando...
						</>
					) : (
						<>
							<Save className="h-4 w-4" />
							Guardar
						</>
					)}
				</Button>
			</div>

			{error && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				</div>
			)}

			{success && (
				<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
					<p className="text-sm text-emerald-600 dark:text-emerald-400">
						Configuración guardada correctamente
					</p>
				</div>
			)}

			<div className="rounded-lg border border-border p-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="space-y-8">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-sm font-medium">
									Habilitar generación de badges
								</Label>
								<p className="text-xs text-muted-foreground">
									Permite que los miembros generen badges personalizados
								</p>
							</div>
							<Switch
								checked={config.enabled}
								onCheckedChange={(checked) =>
									setConfig((prev) => ({ ...prev, enabled: checked }))
								}
								disabled={isGenerating}
							/>
						</div>

						<div className="h-px bg-border" />

						<BrandColorPicker
							value={config.accentColor}
							onChange={(color) =>
								setConfig((prev) => ({ ...prev, accentColor: color }))
							}
							disabled={isGenerating}
						/>

						<div className="h-px bg-border" />

						<StylePresetSelector
							value={config.aiStyle}
							onChange={(styleId) =>
								setConfig((prev) => ({ ...prev, aiStyle: styleId }))
							}
							disabled={isGenerating}
						/>

						<div className="h-px bg-border" />

						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Wand2 className="h-4 w-4 text-muted-foreground" />
								<Label className="text-sm font-medium">
									Prompts del estilo
								</Label>
								{!isCustomStyle && (
									<span className="flex items-center gap-1 text-xs text-muted-foreground">
										<Lock className="h-3 w-3" />
										Bloqueado
									</span>
								)}
							</div>

							<div className="space-y-3">
								<div>
									<Label className="text-xs text-muted-foreground">
										Prompt de retrato{" "}
										{isCustomStyle && <span className="text-red-500">*</span>}
									</Label>
									<div
										className={`mt-1.5 rounded-md ${isGenerating ? "input-shimmer" : ""}`}
									>
										<Textarea
											placeholder={placeholders.portrait}
											value={
												isCustomStyle
													? config.customPortraitPrompt
													: currentPrompts.portraitPrompt
											}
											onChange={(e) =>
												setConfig((prev) => ({
													...prev,
													customPortraitPrompt: e.target.value,
												}))
											}
											className="min-h-[100px] text-sm"
											disabled={isGenerating || !isCustomStyle}
										/>
									</div>
								</div>

								<div>
									<Label className="text-xs text-muted-foreground">
										Prompt de fondo {isCustomStyle && "(opcional)"}
									</Label>
									<div
										className={`mt-1.5 rounded-md ${isGenerating ? "input-shimmer" : ""}`}
									>
										<Textarea
											placeholder={placeholders.background}
											value={
												isCustomStyle
													? config.customBackgroundPrompt
													: currentPrompts.backgroundPrompt
											}
											onChange={(e) =>
												setConfig((prev) => ({
													...prev,
													customBackgroundPrompt: e.target.value,
												}))
											}
											className="min-h-[80px] text-sm"
											disabled={
												isGenerating ||
												!isCustomStyle ||
												!!customBackgroundImageUrl
											}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<Label className="text-xs text-muted-foreground">
											Foto de prueba (opcional)
										</Label>
										<div
											className={`mt-1.5 ${isGenerating ? "opacity-50 pointer-events-none" : ""}`}
										>
											{testImageUrl ? (
												<div
													className={`relative inline-block ${isGenerating ? "input-shimmer rounded-lg" : ""}`}
												>
													<img
														src={testImageUrl}
														alt="Test"
														className="h-20 w-20 rounded-lg object-cover border border-border"
													/>
													<button
														type="button"
														onClick={async () => {
															setTestImageUrl(null);
															await clearCustomTestReferenceImage(
																organization.id,
															);
														}}
														className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
														disabled={isGenerating}
													>
														<X className="h-3 w-3" />
													</button>
												</div>
											) : (
												<label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
													<div className="h-20 w-20 rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-muted-foreground transition-colors">
														{isUploadingTestImage ? (
															<Loader2 className="h-5 w-5 animate-spin" />
														) : (
															<ImagePlus className="h-5 w-5" />
														)}
													</div>
													<input
														type="file"
														accept="image/*"
														className="hidden"
														disabled={isUploadingTestImage || isGenerating}
														onChange={async (e) => {
															const file = e.target.files?.[0];
															if (!file) return;
															setIsUploadingTestImage(true);
															try {
																const formData = new FormData();
																formData.append("file", file);
																const res = await fetch(
																	"/api/upload-test-image",
																	{
																		method: "POST",
																		body: formData,
																	},
																);
																const data = await res.json();
																if (data.url) {
																	setTestImageUrl(data.url);
																}
															} catch (err) {
																setError("Error al subir imagen");
															} finally {
																setIsUploadingTestImage(false);
															}
														}}
													/>
												</label>
											)}
										</div>
										<p className="text-[10px] text-muted-foreground mt-1">
											Usa foto de ejemplo si no provees una
										</p>
									</div>

									<div>
										<Label className="text-xs text-muted-foreground">
											Fondo personalizado (opcional)
										</Label>
										<div
											className={`mt-1.5 ${isGenerating ? "opacity-50 pointer-events-none" : ""}`}
										>
											{customBackgroundImageUrl ? (
												<div
													className={`relative inline-block ${isGenerating ? "input-shimmer rounded-lg" : ""}`}
												>
													<img
														src={customBackgroundImageUrl}
														alt="Background"
														className="h-20 w-20 rounded-lg object-cover border border-border"
													/>
													<button
														type="button"
														onClick={() => setCustomBackgroundImageUrl(null)}
														className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
														disabled={isGenerating}
													>
														<X className="h-3 w-3" />
													</button>
												</div>
											) : (
												<label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
													<div className="h-20 w-20 rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-muted-foreground transition-colors">
														{isUploadingBackground ? (
															<Loader2 className="h-5 w-5 animate-spin" />
														) : (
															<ImagePlus className="h-5 w-5" />
														)}
													</div>
													<input
														type="file"
														accept="image/*"
														className="hidden"
														disabled={isUploadingBackground || isGenerating}
														onChange={async (e) => {
															const file = e.target.files?.[0];
															if (!file) return;
															setIsUploadingBackground(true);
															try {
																const formData = new FormData();
																formData.append("file", file);
																const res = await fetch(
																	"/api/upload-test-image",
																	{
																		method: "POST",
																		body: formData,
																	},
																);
																const data = await res.json();
																if (data.url) {
																	setCustomBackgroundImageUrl(data.url);
																	if (isCustomStyle) {
																		setConfig((prev) => ({
																			...prev,
																			customBackgroundPrompt: "",
																		}));
																	}
																}
															} catch (err) {
																setError("Error al subir fondo");
															} finally {
																setIsUploadingBackground(false);
															}
														}}
													/>
												</label>
											)}
										</div>
										<p className="text-[10px] text-muted-foreground mt-1">
											Reemplaza el fondo generado por IA
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
						<div>
							<Label className="text-sm font-medium">Vista previa</Label>
							<p className="text-xs text-muted-foreground mt-0.5">
								Badge de ejemplo con tu configuración
							</p>
						</div>

						<div className="flex justify-center">
							{previewImages.hasImages ? (
								<Atropos
									key={`${config.aiStyle}-${previewImages.portrait}-${previewImages.background}`}
									className="w-full max-w-[280px]"
									activeOffset={30}
									shadowScale={1.02}
									rotateXMax={10}
									rotateYMax={10}
									shadow={true}
									highlight={true}
								>
									<BadgeDisplay
										key={`badge-${config.aiStyle}-${previewImages.portrait}`}
										generatedImageUrl={previewImages.portrait!}
										generatedBackgroundUrl={previewImages.background!}
										memberName="Miembro Ejemplo"
										memberRole="member"
										badgeNumber={1}
										communityName={
											organization.displayName || organization.name
										}
										communityLogo={organization.logoUrl}
										primaryColor={config.accentColor}
										secondaryColor={config.accentColor}
									/>
								</Atropos>
							) : isGenerating ? (
								<div className="w-full max-w-[280px] aspect-[3/4] rounded-xl border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 bg-muted/20 input-shimmer">
									<Loader2 className="h-10 w-10 text-muted-foreground/50 animate-spin" />
									<p className="text-sm text-muted-foreground text-center px-4">
										{getStepLabel(generationStep)}
									</p>
								</div>
							) : (
								<div className="w-full max-w-[280px] aspect-[3/4] rounded-xl border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 bg-muted/20">
									<Wand2 className="h-10 w-10 text-muted-foreground/50" />
									<p className="text-sm text-muted-foreground text-center px-4">
										Prueba tu estilo para ver una vista previa
									</p>
								</div>
							)}
						</div>

						<p className="text-xs text-muted-foreground text-center">
							{previewImages.isCustomPreview
								? "Mostrando preview personalizado"
								: isGenerating
									? "Generando preview..."
									: isCustomStyle
										? "Prueba tu estilo personalizado"
										: `Vista previa del estilo ${config.aiStyle.replace("_", " ")}`}
						</p>

						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleTestStyle}
							disabled={isGenerating || !canTest}
							className="w-full gap-2"
						>
							{isGenerating ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									{getStepLabel(generationStep)}
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									{testImageUrl || customBackgroundImageUrl
										? "Regenerar con mis imágenes"
										: "Probar estilo"}
								</>
							)}
						</Button>

						<p className="text-xs text-muted-foreground text-center">
							La prueba usa IA para generar un badge de ejemplo. Toma ~30
							segundos.
						</p>
					</div>
				</div>
			</div>
		</form>
	);
}
