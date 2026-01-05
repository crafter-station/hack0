"use client";

import { readStreamableValue } from "@ai-sdk/rsc";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalFooter,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { improveEventDescription } from "@/lib/actions/improve-description";

type Mood = "professional" | "casual" | "enthusiastic";
type Length = "short" | "medium" | "long";

interface ImproveDescriptionModalProps {
	currentDescription: string;
	onImprove: (improvedText: string, forceUpdate: number) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const MOOD_OPTIONS: Array<{
	value: Mood;
	emoji: string;
	label: string;
	tooltip: string;
}> = [
	{
		value: "enthusiastic",
		emoji: "🎉",
		label: "Entusiasta",
		tooltip: "Tono entusiasta y motivador",
	},
	{
		value: "professional",
		emoji: "🏢",
		label: "Profesional",
		tooltip: "Tono formal y profesional",
	},
	{
		value: "casual",
		emoji: "🎨",
		label: "Casual",
		tooltip: "Tono creativo y original",
	},
];

const LENGTH_OPTIONS: Array<{
	value: Length;
	label: string;
	tooltip: string;
}> = [
	{ value: "short", label: "S", tooltip: "Corto (~50-70 palabras)" },
	{ value: "medium", label: "M", tooltip: "Medio (~100-130 palabras)" },
	{ value: "long", label: "L", tooltip: "Largo (~180-220 palabras)" },
];

type ModalView = "config" | "preview";

export function ImproveDescriptionModal({
	currentDescription,
	onImprove,
	open,
	onOpenChange,
}: ImproveDescriptionModalProps) {
	// Modal states
	const [currentView, setCurrentView] = useState<ModalView>("config");

	// Form states
	const [mood, setMood] = useState<Mood>("professional");
	const [length, setLength] = useState<Length>("medium");
	const [additionalInstructions, setAdditionalInstructions] = useState("");

	// Generation states
	const [isGenerating, setIsGenerating] = useState(false);
	const [improvedText, setImprovedText] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleGenerate = async () => {
		if (!currentDescription.trim()) return;

		setIsGenerating(true);
		setError(null);
		setImprovedText("");
		setCurrentView("preview");

		try {
			const { object } = await improveEventDescription({
				currentDescription,
				mood,
				length,
				additionalInstructions: additionalInstructions.trim() || undefined,
			});

			for await (const partialObject of readStreamableValue(object)) {
				if (partialObject?.improvedDescription) {
					setImprovedText(partialObject.improvedDescription);
				}
			}
		} catch (err) {
			console.error("Error improving description:", err);
			setError(
				"Ocurrió un error al mejorar la descripción. Por favor, intenta de nuevo.",
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleAccept = () => {
		if (improvedText) {
			onImprove(improvedText, Date.now());
		}
		onOpenChange(false);
		// Don't reopen parent modal - onImprove callback handles it
	};

	const handleBack = () => {
		setCurrentView("config");
	};

	const resetForm = () => {
		setMood("professional");
		setLength("medium");
		setAdditionalInstructions("");
		setImprovedText("");
		setError(null);
	};

	const handleOpenChange = (newOpen: boolean) => {
		onOpenChange(newOpen);

		if (newOpen) {
			// Reset on open - always start in config view
			setCurrentView("config");
			resetForm();
		} else {
			// Reset on close (with delay for animation)
			setTimeout(() => {
				setCurrentView("config");
				resetForm();
			}, 200);
		}
	};

	// Calcular posición del indicador para mood
	const getMoodIndicatorStyle = () => {
		const index = MOOD_OPTIONS.findIndex((opt) => opt.value === mood);
		return {
			transform: `translateX(${index * 100}%)`,
		};
	};

	// Calcular posición del indicador para length
	const getLengthIndicatorStyle = () => {
		const index = LENGTH_OPTIONS.findIndex((opt) => opt.value === length);
		return {
			transform: `translateX(${index * 100}%)`,
		};
	};

	return (
		<ResponsiveModal open={open} onOpenChange={handleOpenChange}>
			<ResponsiveModalContent
				className={
					currentView === "preview" ? "max-w-3xl h-[60vh] flex flex-col" : "max-w-md"
				}
			>
				<ResponsiveModalHeader className={currentView === "preview" ? "shrink-0" : ""}>
					<ResponsiveModalTitle className="flex items-center gap-2">
						{currentView === "preview" && (
							<button
								type="button"
								onClick={handleBack}
								className="mr-2 p-1 hover:bg-muted rounded-md transition-colors"
								aria-label="Volver"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="m15 18-6-6 6-6" />
								</svg>
							</button>
						)}
						<Sparkles className="h-5 w-5" />
						{currentView === "config"
							? "Mejorar con IA"
							: isGenerating
								? "Generando..."
								: "Descripción mejorada"}
					</ResponsiveModalTitle>
				</ResponsiveModalHeader>

				{currentView === "config" ? (
					<>
						<div className="p-4 space-y-4">
							{/* Mood and Length inline */}
							<div className="grid grid-cols-2 gap-3">
								{/* Mood Selection */}
								<div className="space-y-3">
									<label className="text-sm font-medium">Tono</label>
									<TooltipProvider>
										<div className="relative p-1 bg-muted rounded-lg h-10">
											{/* Animated indicator */}
											<div
												className="absolute inset-1 w-[calc((100%-0.5rem)/3)] bg-background border border-border rounded-md transition-transform duration-200 ease-out shadow-sm"
												style={getMoodIndicatorStyle()}
											/>
											{/* Buttons */}
											<div className="relative flex h-full">
												{MOOD_OPTIONS.map((option) => (
													<Tooltip key={option.value}>
														<TooltipTrigger asChild>
															<button
																type="button"
																onClick={() => setMood(option.value)}
																className={`flex-1 flex items-center justify-center rounded-md transition-colors ${
																	mood === option.value
																		? "text-foreground"
																		: "text-muted-foreground hover:text-foreground"
																}`}
															>
																<span className="text-lg">{option.emoji}</span>
															</button>
														</TooltipTrigger>
														<TooltipContent className="hidden sm:block">
															<p>{option.tooltip}</p>
														</TooltipContent>
													</Tooltip>
												))}
											</div>
										</div>
									</TooltipProvider>
								</div>

								{/* Length Selection */}
								<div className="space-y-3">
									<label className="text-sm font-medium">Longitud</label>
									<TooltipProvider>
										<div className="relative p-1 bg-muted rounded-lg h-10">
											{/* Animated indicator */}
											<div
												className="absolute inset-1 w-[calc((100%-0.5rem)/3)] bg-background border border-border rounded-md transition-transform duration-200 ease-out shadow-sm"
												style={getLengthIndicatorStyle()}
											/>
											{/* Buttons */}
											<div className="relative flex h-full">
												{LENGTH_OPTIONS.map((option) => (
													<Tooltip key={option.value}>
														<TooltipTrigger asChild>
															<button
																type="button"
																onClick={() => setLength(option.value)}
																className={`flex-1 rounded-md font-semibold transition-colors flex items-center justify-center ${
																	length === option.value
																		? "text-foreground"
																		: "text-muted-foreground hover:text-foreground"
																}`}
															>
																{option.label}
															</button>
														</TooltipTrigger>
														<TooltipContent className="hidden sm:block">
															<p>{option.tooltip}</p>
														</TooltipContent>
													</Tooltip>
												))}
											</div>
										</div>
									</TooltipProvider>
								</div>
							</div>

							{/* Additional Instructions */}
							<div className="space-y-3">
								<label
									htmlFor="additional-instructions"
									className="text-sm font-medium"
								>
									Instrucciones adicionales
								</label>
								<textarea
									id="additional-instructions"
									value={additionalInstructions}
									onChange={(e) => setAdditionalInstructions(e.target.value)}
									placeholder="Por ejemplo, puedes indicarle que escriba en pentámetro yámbico..."
									rows={3}
									className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
								/>
							</div>
						</div>

						<ResponsiveModalFooter>
							<Button
								onClick={handleGenerate}
								disabled={!currentDescription.trim()}
								className="w-full gap-2"
							>
								<Sparkles className="h-4 w-4" />
								Generar
							</Button>
						</ResponsiveModalFooter>
					</>
				) : (
					<>
						<div className="p-6 flex-1 min-h-0 overflow-y-auto">
							{error ? (
								<div className="flex items-center justify-center h-full">
									<p className="text-sm text-destructive text-center">{error}</p>
								</div>
							) : (
								<div className="mx-auto max-w-2xl h-full">
									<div className="rounded-lg border border-border bg-muted/30 p-6 h-full overflow-y-auto">
										<div className="prose prose-sm prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground">
											{improvedText ? (
												<Markdown>{improvedText}</Markdown>
											) : (
												<p className="text-muted-foreground italic">
													Esperando respuesta...
												</p>
											)}
										</div>
									</div>
								</div>
							)}
						</div>

						{!isGenerating && (
							<ResponsiveModalFooter className="shrink-0 flex gap-2">
								<Button variant="outline" onClick={handleBack} className="flex-1">
									Intentar de nuevo
								</Button>
								<Button
									onClick={handleAccept}
									className="flex-1"
									disabled={!improvedText || !!error}
								>
									Aceptar sugerencia
								</Button>
							</ResponsiveModalFooter>
						)}
					</>
				)}
			</ResponsiveModalContent>
		</ResponsiveModal>
	);
}
