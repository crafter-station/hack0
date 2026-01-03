"use client";

import { Check, Copy, Link as LinkIcon, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBadgeStyleTester } from "@/hooks/use-badge-style-tester";
import {
	clearCustomTestReferenceImage,
	updateCommunityBadgeSettings,
} from "@/lib/actions/badges";
import {
	CUSTOM_STYLE_ID,
	DEFAULT_STYLE_ID,
	getStylePrompts,
} from "@/lib/badge/style-presets";
import type { Organization } from "@/lib/db/schema";
import { BadgePreviewPanel } from "./badge-preview-panel";
import { BrandColorPicker } from "./brand-color-picker";
import { StylePresetSelector } from "./style-preset-selector";
import { StylePromptsEditor } from "./style-prompts-editor";

interface BadgeSettingsFormProps {
	organization: Organization;
}

export function BadgeSettingsForm({ organization }: BadgeSettingsFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [copied, setCopied] = useState(false);

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

	const [testImageUrl, setTestImageUrl] = useState<string | null>(
		organization.badgeCustomTestReferenceUrl ?? null,
	);
	const [customBackgroundImageUrl, setCustomBackgroundImageUrl] = useState<
		string | null
	>(organization.badgeCustomBackgroundImageUrl ?? null);

	const handleError = useCallback((err: string) => setError(err), []);

	const {
		isGenerating,
		generationStep,
		previewImages: generatedImages,
		testStyle,
		resetPreview,
	} = useBadgeStyleTester({
		communityId: organization.id,
		onError: handleError,
	});

	useEffect(() => {
		resetPreview();
	}, [config.aiStyle, resetPreview]);

	const shareableUrl = organization.shortCode
		? `${typeof window !== "undefined" ? window.location.origin : "https://hack0.dev"}/b/${organization.shortCode}`
		: null;

	const copyToClipboard = async () => {
		if (!shareableUrl) return;
		await navigator.clipboard.writeText(shareableUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const isCustomStyle = config.aiStyle === CUSTOM_STYLE_ID;
	const currentPrompts = isCustomStyle
		? {
				portraitPrompt: config.customPortraitPrompt,
				backgroundPrompt: config.customBackgroundPrompt,
			}
		: getStylePrompts(config.aiStyle);

	const handleTestStyle = async () => {
		const portraitPrompt = isCustomStyle
			? config.customPortraitPrompt
			: currentPrompts.portraitPrompt;
		const backgroundPrompt = isCustomStyle
			? config.customBackgroundPrompt
			: currentPrompts.backgroundPrompt;

		await testStyle({
			stylePreset: config.aiStyle,
			portraitPrompt,
			backgroundPrompt,
			testImageUrl: testImageUrl || undefined,
			customBackgroundImageUrl: customBackgroundImageUrl || undefined,
		});
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
		if (generatedImages.portrait && generatedImages.background) {
			return generatedImages;
		}
		return { portrait: null, background: null };
	};

	const canTest = isCustomStyle ? !!config.customPortraitPrompt : true;

	const handleTestImageChange = async (url: string | null) => {
		setTestImageUrl(url);
		if (url === null) {
			await clearCustomTestReferenceImage(organization.id);
		}
	};

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

			{shareableUrl && (
				<div className="rounded-lg border border-border p-4">
					<div className="flex items-center gap-2 mb-2">
						<LinkIcon className="h-4 w-4 text-muted-foreground" />
						<Label className="text-sm font-medium">URL Compartible</Label>
					</div>
					<p className="text-xs text-muted-foreground mb-3">
						Comparte este enlace para que los miembros generen su badge
					</p>
					<div className="flex items-center gap-2">
						<div className="flex-1 flex items-center rounded-md border bg-muted/50 px-3 py-2">
							<code className="text-sm flex-1 truncate">{shareableUrl}</code>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={copyToClipboard}
							className="gap-2 shrink-0"
						>
							{copied ? (
								<>
									<Check className="h-4 w-4 text-emerald-500" />
									Copiado
								</>
							) : (
								<>
									<Copy className="h-4 w-4" />
									Copiar
								</>
							)}
						</Button>
					</div>
					<div className="mt-3 flex items-center gap-2">
						<Link
							href={`/c/${organization.slug}/settings/campaigns`}
							className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
						>
							Gestionar campañas →
						</Link>
					</div>
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

						<StylePromptsEditor
							stylePreset={config.aiStyle}
							isCustomStyle={isCustomStyle}
							portraitPrompt={config.customPortraitPrompt}
							backgroundPrompt={config.customBackgroundPrompt}
							currentPresetPortraitPrompt={currentPrompts.portraitPrompt}
							currentPresetBackgroundPrompt={currentPrompts.backgroundPrompt}
							onPortraitPromptChange={(value) =>
								setConfig((prev) => ({ ...prev, customPortraitPrompt: value }))
							}
							onBackgroundPromptChange={(value) =>
								setConfig((prev) => ({
									...prev,
									customBackgroundPrompt: value,
								}))
							}
							testImageUrl={testImageUrl}
							customBackgroundImageUrl={customBackgroundImageUrl}
							onTestImageChange={handleTestImageChange}
							onCustomBackgroundChange={setCustomBackgroundImageUrl}
							isGenerating={isGenerating}
							onError={handleError}
						/>
					</div>

					<BadgePreviewPanel
						previewImages={getPreviewImages()}
						stylePreset={config.aiStyle}
						isGenerating={isGenerating}
						generationStep={generationStep}
						communityName={organization.displayName || organization.name}
						communityLogo={organization.logoUrl}
						accentColor={config.accentColor}
						canTest={canTest}
						hasCustomImages={!!testImageUrl || !!customBackgroundImageUrl}
						onTest={handleTestStyle}
					/>
				</div>
			</div>
		</form>
	);
}
