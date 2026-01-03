"use client";

import { readStreamableValue } from "@ai-sdk/rsc";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { extractEventFromTextAndImage } from "@/lib/actions/ai-extract";
import type { ExtractedEventData } from "@/lib/schemas/event-extraction";

interface AIExtractModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onExtract: (data: Partial<ExtractedEventData>) => void;
	onStreamStart: () => void;
	onStreamEnd: () => void;
}

export function AIExtractModal({
	open,
	onOpenChange,
	onExtract,
	onStreamStart,
	onStreamEnd,
}: AIExtractModalProps) {
	const [text, setText] = useState("");
	const [image, setImage] = useState<string | null>(null);
	const [imageName, setImageName] = useState<string | null>(null);
	const [isExtracting, setIsExtracting] = useState(false);
	const [showPasteHint, setShowPasteHint] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const _containerRef = useRef<HTMLDivElement>(null);

	const processFile = (file: File) => {
		if (!file.type.startsWith("image/")) return;

		setImageName(file.name || "Imagen pegada");
		const reader = new FileReader();
		reader.onload = () => {
			setImage(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handlePaste = (e: ClipboardEvent) => {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (const item of items) {
			if (item.type.startsWith("image/")) {
				e.preventDefault();
				const file = item.getAsFile();
				if (file) {
					processFile(file);
				}
				break;
			}
		}
	};

	useEffect(() => {
		if (open) {
			document.addEventListener("paste", handlePaste);
			const timer = setTimeout(() => setShowPasteHint(true), 500);
			return () => {
				document.removeEventListener("paste", handlePaste);
				clearTimeout(timer);
			};
		}
		setShowPasteHint(false);
	}, [open, handlePaste]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		processFile(file);
	};

	const handleExtract = async () => {
		if (!text.trim() && !image) return;

		setIsExtracting(true);
		onStreamStart();
		onOpenChange(false);

		try {
			const { object } = await extractEventFromTextAndImage(
				text,
				image || undefined,
			);

			for await (const partialObject of readStreamableValue(object)) {
				if (partialObject) {
					onExtract(partialObject);
				}
			}
		} catch (error) {
			console.error("Error extracting event:", error);
		} finally {
			setIsExtracting(false);
			onStreamEnd();
			setText("");
			setImage(null);
			setImageName(null);
		}
	};

	const removeImage = () => {
		setImage(null);
		setImageName(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const canExtract = text.trim().length > 0 || image !== null;

	return (
		<ResponsiveModal open={open} onOpenChange={onOpenChange}>
			<ResponsiveModalContent className="max-w-lg">
				<ResponsiveModalHeader>
					<ResponsiveModalTitle className="flex items-center gap-2">
						<Sparkles className="h-4 w-4" />
						Extraer con IA
					</ResponsiveModalTitle>
				</ResponsiveModalHeader>

				<div className="p-4 space-y-3">
					<div className="relative">
						<textarea
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Pega la descripción del evento, información del flyer, o cualquier texto con los detalles..."
							rows={6}
							className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
							disabled={isExtracting}
						/>
					</div>

					{image && (
						<div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
							<div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
								<img
									src={image}
									alt="Preview"
									className="h-full w-full object-cover"
								/>
							</div>
							<span className="text-sm text-muted-foreground truncate flex-1">
								{imageName}
							</span>
							<button
								type="button"
								onClick={removeImage}
								className="p-1 rounded hover:bg-muted transition-colors"
								disabled={isExtracting}
							>
								<X className="h-4 w-4 text-muted-foreground" />
							</button>
						</div>
					)}

					<div className="flex items-center justify-between pt-1">
						<div className="flex items-center gap-1">
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="hidden"
								disabled={isExtracting}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="gap-2 text-muted-foreground hover:text-foreground"
								onClick={() => fileInputRef.current?.click()}
								disabled={isExtracting}
							>
								<ImagePlus className="h-4 w-4" />
								{image ? "Cambiar" : "Imagen"}
							</Button>
							{!image && showPasteHint && (
								<span className="text-xs text-muted-foreground/60 animate-in fade-in slide-in-from-left-1 duration-300">
									o pega con{" "}
									<kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">
										⌘V
									</kbd>
								</span>
							)}
						</div>

						<Button
							onClick={handleExtract}
							disabled={!canExtract || isExtracting}
							size="sm"
							className="gap-2"
						>
							{isExtracting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Extrayendo...
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									Extraer
								</>
							)}
						</Button>
					</div>
				</div>
			</ResponsiveModalContent>
		</ResponsiveModal>
	);
}
