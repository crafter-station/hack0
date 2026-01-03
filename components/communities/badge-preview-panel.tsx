"use client";

import Atropos from "atropos/react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { BadgeDisplay } from "@/components/community/badge-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getGenerationStepLabel } from "@/hooks/use-badge-style-tester";

interface BadgePreviewPanelProps {
	previewImages: { portrait: string | null; background: string | null };
	stylePreset: string;
	isGenerating: boolean;
	generationStep?: string;
	communityName: string;
	communityLogo?: string | null;
	accentColor?: string | null;
	badgeLabel?: string;
	canTest: boolean;
	hasCustomImages?: boolean;
	onTest: () => void;
}

export function BadgePreviewPanel({
	previewImages,
	stylePreset,
	isGenerating,
	generationStep,
	communityName,
	communityLogo,
	accentColor,
	badgeLabel,
	canTest,
	hasCustomImages,
	onTest,
}: BadgePreviewPanelProps) {
	const hasPreview = previewImages.portrait && previewImages.background;
	const hasStaticPreview =
		!hasPreview && stylePreset && stylePreset !== "custom";

	const getPreviewImages = () => {
		if (hasPreview) {
			return {
				portrait: previewImages.portrait!,
				background: previewImages.background!,
				isCustomPreview: true,
			};
		}
		if (hasStaticPreview) {
			return {
				portrait: `/badges/styles/${stylePreset}-portrait.png`,
				background: `/badges/styles/${stylePreset}-background.png`,
				isCustomPreview: false,
			};
		}
		return null;
	};

	const preview = getPreviewImages();
	const isCustomStyle = stylePreset === "custom";

	return (
		<div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
			<div>
				<Label className="text-sm font-medium">Vista previa</Label>
				<p className="text-xs text-muted-foreground mt-0.5">
					Badge de ejemplo con tu configuración
				</p>
			</div>

			<div className="flex justify-center">
				{preview ? (
					<Atropos
						key={`${stylePreset}-${preview.portrait}-${preview.background}`}
						className="w-full max-w-[280px]"
						activeOffset={30}
						shadowScale={1.02}
						rotateXMax={10}
						rotateYMax={10}
						shadow={true}
						highlight={true}
					>
						<BadgeDisplay
							key={`badge-${stylePreset}-${preview.portrait}`}
							generatedImageUrl={preview.portrait}
							generatedBackgroundUrl={preview.background}
							memberName="Miembro Ejemplo"
							memberRole="member"
							badgeNumber={1}
							communityName={communityName}
							communityLogo={communityLogo}
							primaryColor={accentColor}
							secondaryColor={accentColor}
							badgeLabel={badgeLabel}
						/>
					</Atropos>
				) : isGenerating ? (
					<div className="w-full max-w-[280px] aspect-[3/4] rounded-xl border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 bg-muted/20 input-shimmer">
						<Loader2 className="h-10 w-10 text-muted-foreground/50 animate-spin" />
						<p className="text-sm text-muted-foreground text-center px-4">
							{getGenerationStepLabel(generationStep)}
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
				{preview?.isCustomPreview
					? "Mostrando preview personalizado"
					: isGenerating
						? "Generando preview..."
						: isCustomStyle
							? "Prueba tu estilo personalizado"
							: `Vista previa del estilo ${stylePreset?.replace("_", " ") || "default"}`}
			</p>

			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={onTest}
				disabled={isGenerating || !canTest}
				className="w-full gap-2"
			>
				{isGenerating ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						{getGenerationStepLabel(generationStep)}
					</>
				) : (
					<>
						<Sparkles className="h-4 w-4" />
						{hasCustomImages ? "Regenerar con mis imágenes" : "Probar estilo"}
					</>
				)}
			</Button>

			<p className="text-xs text-muted-foreground text-center">
				La prueba usa IA para generar un badge de ejemplo. Toma ~30 segundos.
			</p>
		</div>
	);
}
