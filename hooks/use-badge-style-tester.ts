"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useCallback, useEffect, useState } from "react";
import { testBadgeStyle } from "@/lib/actions/badges";

interface UseBadgeStyleTesterOptions {
	communityId: string;
	onError?: (error: string) => void;
}

interface UseBadgeStyleTesterResult {
	isGenerating: boolean;
	generationStep: string | undefined;
	previewImages: { portrait: string | null; background: string | null };
	testStyle: (params: {
		stylePreset: string;
		portraitPrompt: string;
		backgroundPrompt?: string;
		testImageUrl?: string;
		customBackgroundImageUrl?: string;
	}) => Promise<void>;
	resetPreview: () => void;
}

export function useBadgeStyleTester({
	communityId,
	onError,
}: UseBadgeStyleTesterOptions): UseBadgeStyleTesterResult {
	const [runId, setRunId] = useState<string | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [isTesting, setIsTesting] = useState(false);
	const [previewImages, setPreviewImages] = useState<{
		portrait: string | null;
		background: string | null;
	}>({ portrait: null, background: null });

	const { run, error: runError } = useRealtimeRun(runId || "", {
		enabled: !!runId && !!accessToken,
		accessToken: accessToken || undefined,
	});

	const generatedPortraitUrl = run?.metadata?.portraitUrl as string | undefined;
	const generatedBackgroundUrl = run?.metadata?.backgroundUrl as
		| string
		| undefined;
	const generationStep = run?.metadata?.step as string | undefined;

	const isGenerating = isTesting || !!(runId && run?.isExecuting);

	useEffect(() => {
		if (run?.isCompleted && generatedPortraitUrl && generatedBackgroundUrl) {
			setPreviewImages({
				portrait: generatedPortraitUrl,
				background: generatedBackgroundUrl,
			});
			setRunId(null);
			setAccessToken(null);
			setIsTesting(false);
		}
	}, [run?.isCompleted, generatedPortraitUrl, generatedBackgroundUrl]);

	useEffect(() => {
		if (runError || run?.status === "FAILED") {
			onError?.("Error al generar el preview");
			setRunId(null);
			setAccessToken(null);
			setIsTesting(false);
		}
	}, [runError, run?.status, onError]);

	const testStyle = useCallback(
		async (params: {
			stylePreset: string;
			portraitPrompt: string;
			backgroundPrompt?: string;
			testImageUrl?: string;
			customBackgroundImageUrl?: string;
		}) => {
			if (!params.portraitPrompt) {
				onError?.("Debes completar el prompt de retrato");
				return;
			}

			setIsTesting(true);

			try {
				const result = await testBadgeStyle(
					communityId,
					params.stylePreset,
					params.portraitPrompt,
					params.backgroundPrompt,
					params.testImageUrl,
					params.customBackgroundImageUrl,
				);

				if (!result.success) {
					onError?.(result.error || "Error al iniciar la prueba");
					setIsTesting(false);
				} else if (result.runId && result.publicAccessToken) {
					setRunId(result.runId);
					setAccessToken(result.publicAccessToken);
				}
			} catch (err) {
				onError?.(
					err instanceof Error ? err.message : "Error al probar estilo",
				);
				setIsTesting(false);
			}
		},
		[communityId, onError],
	);

	const resetPreview = useCallback(() => {
		setPreviewImages({ portrait: null, background: null });
		setRunId(null);
		setAccessToken(null);
		setIsTesting(false);
	}, []);

	return {
		isGenerating,
		generationStep,
		previewImages,
		testStyle,
		resetPreview,
	};
}

export function getGenerationStepLabel(step: string | undefined): string {
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
}
