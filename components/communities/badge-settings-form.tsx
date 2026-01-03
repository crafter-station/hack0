"use client";

import Atropos from "atropos/react";
import { ImagePlus, Loader2, Save, Sparkles, Wand2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeDisplay } from "@/components/community/badge-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	clearCustomTestReferenceImage,
	getCustomStyleTestStatus,
	testCustomBadgeStyle,
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
	const [isTesting, setIsTesting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [config, setConfig] = useState({
		enabled: organization.badgeEnabled ?? false,
		brandColor: organization.badgePrimaryColor ?? "#3B82F6",
		aiStyle: organization.badgeAiStyle ?? DEFAULT_STYLE_ID,
		customPortraitPrompt: organization.badgeStylePrompt ?? "",
		customBackgroundPrompt: organization.badgeBackgroundPrompt ?? "",
	});

	const [customTestImages, setCustomTestImages] = useState({
		portrait: organization.badgeCustomTestPortraitUrl ?? null,
		background: organization.badgeCustomTestBackgroundUrl ?? null,
	});

	const [testImageUrl, setTestImageUrl] = useState<string | null>(
		organization.badgeCustomTestReferenceUrl ?? null,
	);
	const [isUploadingTestImage, setIsUploadingTestImage] = useState(false);

	const isCustomStyle = config.aiStyle === CUSTOM_STYLE_ID;

	useEffect(() => {
		if (isTesting) {
			const interval = setInterval(async () => {
				const status = await getCustomStyleTestStatus(organization.id);
				if (
					status?.badgeCustomTestPortraitUrl &&
					status?.badgeCustomTestBackgroundUrl
				) {
					setCustomTestImages({
						portrait: status.badgeCustomTestPortraitUrl,
						background: status.badgeCustomTestBackgroundUrl,
					});
					setIsTesting(false);
				}
			}, 3000);

			return () => clearInterval(interval);
		}
	}, [isTesting, organization.id]);

	const handleTestCustomStyle = async () => {
		if (!config.customPortraitPrompt || !config.customBackgroundPrompt) {
			setError("Debes completar ambos prompts para probar");
			return;
		}

		setIsTesting(true);
		setError(null);

		try {
			const result = await testCustomBadgeStyle(
				organization.id,
				config.customPortraitPrompt,
				config.customBackgroundPrompt,
				testImageUrl || undefined,
			);

			if (!result.success) {
				setError(result.error || "Error al iniciar la prueba");
				setIsTesting(false);
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
			let prompts: { portraitPrompt: string; backgroundPrompt: string };

			if (isCustomStyle) {
				prompts = {
					portraitPrompt: config.customPortraitPrompt,
					backgroundPrompt: config.customBackgroundPrompt,
				};
			} else {
				prompts = getStylePrompts(config.aiStyle);
			}

			await updateCommunityBadgeSettings(organization.id, {
				badgeEnabled: config.enabled,
				badgePrimaryColor: config.brandColor,
				badgeSecondaryColor: config.brandColor,
				badgeStylePrompt: prompts.portraitPrompt,
				badgeBackgroundPrompt: prompts.backgroundPrompt,
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
		if (isCustomStyle) {
			if (customTestImages.portrait && customTestImages.background) {
				return {
					portrait: customTestImages.portrait,
					background: customTestImages.background,
					hasImages: true,
				};
			}
			return {
				portrait: null,
				background: null,
				hasImages: false,
			};
		}
		return {
			portrait: `/badges/styles/${config.aiStyle}-portrait.png`,
			background: `/badges/styles/${config.aiStyle}-background.png`,
			hasImages: true,
		};
	};

	const previewImages = getPreviewImages();

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Badge Settings</h3>
					<p className="text-sm text-muted-foreground">
						Configure your community badges
					</p>
				</div>
				<Button
					type="submit"
					disabled={isSubmitting}
					size="sm"
					className="gap-2"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Saving...
						</>
					) : (
						<>
							<Save className="h-4 w-4" />
							Save
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
						Settings saved successfully
					</p>
				</div>
			)}

			<div className="rounded-lg border border-border p-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="space-y-8">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-sm font-medium">
									Enable Badge Generation
								</Label>
								<p className="text-xs text-muted-foreground">
									Allow community members to generate personalized badges
								</p>
							</div>
							<Switch
								checked={config.enabled}
								onCheckedChange={(checked) =>
									setConfig((prev) => ({ ...prev, enabled: checked }))
								}
							/>
						</div>

						<div className="h-px bg-border" />

						<BrandColorPicker
							value={config.brandColor}
							onChange={(color) =>
								setConfig((prev) => ({ ...prev, brandColor: color }))
							}
						/>

						<div className="h-px bg-border" />

						<StylePresetSelector
							value={config.aiStyle}
							onChange={(styleId) =>
								setConfig((prev) => ({ ...prev, aiStyle: styleId }))
							}
						/>

						{isCustomStyle && (
							<>
								<div className="h-px bg-border" />

								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<Wand2 className="h-4 w-4 text-muted-foreground" />
										<Label className="text-sm font-medium">
											Custom Style Prompts
										</Label>
									</div>

									<div className="space-y-3">
										<div>
											<Label className="text-xs text-muted-foreground">
												Portrait Prompt
											</Label>
											<Textarea
												placeholder="Describe how the portrait should look..."
												value={config.customPortraitPrompt}
												onChange={(e) =>
													setConfig((prev) => ({
														...prev,
														customPortraitPrompt: e.target.value,
													}))
												}
												className="mt-1.5 min-h-[100px] text-sm"
											/>
										</div>

										<div>
											<Label className="text-xs text-muted-foreground">
												Background Prompt
											</Label>
											<Textarea
												placeholder="Describe how the background should look..."
												value={config.customBackgroundPrompt}
												onChange={(e) =>
													setConfig((prev) => ({
														...prev,
														customBackgroundPrompt: e.target.value,
													}))
												}
												className="mt-1.5 min-h-[80px] text-sm"
											/>
										</div>

										<div>
											<Label className="text-xs text-muted-foreground">
												Test Image (optional)
											</Label>
											<div className="mt-1.5">
												{testImageUrl ? (
													<div className="relative inline-block">
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
															disabled={isUploadingTestImage}
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
																	setError("Error uploading image");
																} finally {
																	setIsUploadingTestImage(false);
																}
															}}
														/>
														<span className="text-xs">Upload your photo</span>
													</label>
												)}
											</div>
											<p className="text-[10px] text-muted-foreground mt-1">
												Uses sample photo if not provided
											</p>
										</div>

										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleTestCustomStyle}
											disabled={
												isTesting ||
												!config.customPortraitPrompt ||
												!config.customBackgroundPrompt
											}
											className="w-full gap-2"
										>
											{isTesting ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin" />
													Generating preview...
												</>
											) : (
												<>
													<Sparkles className="h-4 w-4" />
													Test Custom Style
												</>
											)}
										</Button>

										<p className="text-xs text-muted-foreground">
											Testing uses AI to generate a sample badge. Takes ~30
											seconds.
										</p>
									</div>
								</div>
							</>
						)}
					</div>

					<div className="space-y-3">
						<div>
							<Label className="text-sm font-medium">Preview</Label>
							<p className="text-xs text-muted-foreground mt-0.5">
								Sample badge with your settings
							</p>
						</div>

						<div className="flex justify-center">
							{previewImages.hasImages ? (
								<Atropos
									className="w-full max-w-[280px]"
									activeOffset={30}
									shadowScale={1.02}
									rotateXMax={10}
									rotateYMax={10}
									shadow={true}
									highlight={true}
								>
									<BadgeDisplay
										generatedImageUrl={previewImages.portrait!}
										generatedBackgroundUrl={previewImages.background!}
										memberName="Sample Member"
										memberRole="member"
										badgeNumber={1}
										communityName={
											organization.displayName || organization.name
										}
										communityLogo={organization.logoUrl}
										primaryColor={config.brandColor}
										secondaryColor={config.brandColor}
									/>
								</Atropos>
							) : (
								<div className="w-full max-w-[280px] aspect-[3/4] rounded-xl border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 bg-muted/20">
									<Wand2 className="h-10 w-10 text-muted-foreground/50" />
									<p className="text-sm text-muted-foreground text-center px-4">
										Test your custom style to see a preview
									</p>
								</div>
							)}
						</div>

						<p className="text-xs text-muted-foreground text-center">
							{isCustomStyle
								? customTestImages.portrait
									? "Showing your custom style preview"
									: "Test your custom style to see preview"
								: `Preview shows ${config.aiStyle.replace("_", " ")} style`}
						</p>
					</div>
				</div>
			</div>
		</form>
	);
}
