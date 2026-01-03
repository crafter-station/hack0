"use client";

import { ImagePlus, Loader2, Lock, Wand2, X } from "lucide-react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StylePromptsEditorProps {
	stylePreset: string;
	isCustomStyle: boolean;
	portraitPrompt: string;
	backgroundPrompt: string;
	currentPresetPortraitPrompt: string;
	currentPresetBackgroundPrompt: string;
	onPortraitPromptChange: (value: string) => void;
	onBackgroundPromptChange: (value: string) => void;
	testImageUrl: string | null;
	customBackgroundImageUrl: string | null;
	onTestImageChange: (url: string | null) => void;
	onCustomBackgroundChange: (url: string | null) => void;
	isGenerating: boolean;
	onError?: (error: string) => void;
}

const STYLE_PLACEHOLDERS: Record<
	string,
	{ portrait: string; background: string }
> = {
	pixel_art: {
		portrait:
			"Ej: 8-bit pixel-art portrait, retro gaming style, cute and cartoonish...",
		background:
			"Ej: Dark pixel art tech background, purple gradient, retro terminal aesthetic...",
	},
	cyberpunk: {
		portrait:
			"Ej: Cyberpunk stylized portrait, neon cyan and magenta lighting, futuristic...",
		background:
			"Ej: Dark cyberpunk background, neon grid lines, holographic HUD elements...",
	},
	anime: {
		portrait:
			"Ej: Anime style portrait, clean cel-shaded, big expressive eyes, modern anime aesthetic...",
		background:
			"Ej: Soft pastel gradient sky, cherry blossom petals, dreamy golden hour lighting...",
	},
	notion: {
		portrait:
			"Ej: Minimalist black and white line art, simple clean lines, bold outlines...",
		background:
			"Ej: Simple light gray gradient, minimal clean professional aesthetic...",
	},
	ghibli: {
		portrait:
			"Ej: Studio Ghibli style, hand-drawn animation, soft warm colors, dreamy and whimsical...",
		background:
			"Ej: Soft hand-painted clouds, golden hour sky, pastoral landscape, watercolor texture...",
	},
	sticker: {
		portrait:
			"Ej: Cute sticker style, bold outlines, kawaii aesthetic, chibi proportions...",
		background:
			"Ej: Pastel gradient background, sparkles, stars, soft dreamy aesthetic...",
	},
	default: {
		portrait:
			"Ej: Oil painting portrait, classical renaissance style, dramatic chiaroscuro lighting, rich warm colors...",
		background:
			"Ej: Dramatic oil painted sky, sunset clouds, golden and crimson tones, textured brush strokes...",
	},
};

export function StylePromptsEditor({
	stylePreset,
	isCustomStyle,
	portraitPrompt,
	backgroundPrompt,
	currentPresetPortraitPrompt,
	currentPresetBackgroundPrompt,
	onPortraitPromptChange,
	onBackgroundPromptChange,
	testImageUrl,
	customBackgroundImageUrl,
	onTestImageChange,
	onCustomBackgroundChange,
	isGenerating,
	onError,
}: StylePromptsEditorProps) {
	const [isUploadingTestImage, setIsUploadingTestImage] = useState(false);
	const [isUploadingBackground, setIsUploadingBackground] = useState(false);

	const placeholders =
		STYLE_PLACEHOLDERS[stylePreset] || STYLE_PLACEHOLDERS.default;

	const handleTestImageUpload = async (file: File) => {
		setIsUploadingTestImage(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await fetch("/api/upload-test-image", {
				method: "POST",
				body: formData,
			});
			const data = await res.json();
			if (data.url) {
				onTestImageChange(data.url);
			}
		} catch {
			onError?.("Error al subir imagen");
		} finally {
			setIsUploadingTestImage(false);
		}
	};

	const handleBackgroundUpload = async (file: File) => {
		setIsUploadingBackground(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await fetch("/api/upload-test-image", {
				method: "POST",
				body: formData,
			});
			const data = await res.json();
			if (data.url) {
				onCustomBackgroundChange(data.url);
				if (isCustomStyle) {
					onBackgroundPromptChange("");
				}
			}
		} catch {
			onError?.("Error al subir fondo");
		} finally {
			setIsUploadingBackground(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Wand2 className="h-4 w-4 text-muted-foreground" />
				<Label className="text-sm font-medium">Prompts del estilo</Label>
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
								isCustomStyle ? portraitPrompt : currentPresetPortraitPrompt
							}
							onChange={(e) => onPortraitPromptChange(e.target.value)}
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
								isCustomStyle ? backgroundPrompt : currentPresetBackgroundPrompt
							}
							onChange={(e) => onBackgroundPromptChange(e.target.value)}
							className="min-h-[80px] text-sm"
							disabled={
								isGenerating || !isCustomStyle || !!customBackgroundImageUrl
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
										onClick={() => onTestImageChange(null)}
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
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) handleTestImageUpload(file);
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
										onClick={() => onCustomBackgroundChange(null)}
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
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) handleBackgroundUpload(file);
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
	);
}
