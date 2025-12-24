"use client";

import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { setStoredGiftToken } from "@/components/gift/gift-landing-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

const GIFT_COLORS = {
	text: "#fafafa",
	textMuted: "rgba(250, 250, 250, 0.6)",
	textDim: "rgba(250, 250, 250, 0.3)",
	border: "rgba(250, 250, 250, 0.2)",
	bg: "rgba(250, 250, 250, 0.05)",
	bgHover: "rgba(250, 250, 250, 0.1)",
};

export function PhotoUpload() {
	const router = useRouter();
	const [image, setImage] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [recipientName, setRecipientName] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [showPasteHint, setShowPasteHint] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { startUpload } = useUploadThing("giftPhotoUploader", {
		onUploadProgress: (p) => setUploadProgress(p),
		onClientUploadComplete: async (res) => {
			if (res?.[0]?.url) {
				await generateCard(res[0].url);
			}
		},
		onUploadError: (error) => {
			setIsUploading(false);
			setUploadProgress(0);
			console.error("Upload error:", error);
		},
	});

	const generateCard = async (photoUrl: string) => {
		setIsGenerating(true);
		try {
			const response = await fetch("/api/gift/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					photoUrl,
					recipientName: recipientName || undefined,
				}),
			});

			if (!response.ok) throw new Error("Failed to generate");

			const { token } = await response.json();
			setStoredGiftToken(token);
			router.push(`/gift/loading/${token}`);
		} catch (error) {
			console.error("Generation error:", error);
			setIsGenerating(false);
			setIsUploading(false);
		}
	};

	const processFile = (file: File) => {
		if (!file.type.startsWith("image/")) return;

		setImageFile(file);
		const reader = new FileReader();
		reader.onload = () => {
			setImage(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handlePaste = useCallback((e: ClipboardEvent) => {
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
	}, []);

	useEffect(() => {
		document.addEventListener("paste", handlePaste);
		const timer = setTimeout(() => setShowPasteHint(true), 500);
		return () => {
			document.removeEventListener("paste", handlePaste);
			clearTimeout(timer);
		};
	}, [handlePaste]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		processFile(file);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (file) processFile(file);
	};

	const handleSubmit = async () => {
		if (!imageFile) return;
		setIsUploading(true);
		await startUpload([imageFile]);
	};

	const removeImage = () => {
		setImage(null);
		setImageFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const isLoading = isUploading || isGenerating;

	return (
		<div className="w-full max-w-md mx-auto space-y-4">
			{image ? (
				<div
					className="relative aspect-square overflow-hidden"
					style={{
						border: `1px solid ${GIFT_COLORS.border}`,
						backgroundColor: GIFT_COLORS.bg,
					}}
				>
					<img
						src={image}
						alt="Tu foto"
						className="h-full w-full object-cover"
					/>
					{!isLoading && (
						<button
							type="button"
							onClick={removeImage}
							className="absolute right-2 top-2 p-1.5 backdrop-blur-sm transition-colors"
							style={{
								backgroundColor: "rgba(10, 10, 15, 0.6)",
								color: GIFT_COLORS.textMuted,
								border: `1px solid ${GIFT_COLORS.border}`,
							}}
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
			) : (
				<label
					className={cn(
						"relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 transition-all",
					)}
					style={{
						border: `1px dashed ${GIFT_COLORS.border}`,
						backgroundColor: GIFT_COLORS.bg,
					}}
					onDragOver={(e) => e.preventDefault()}
					onDrop={handleDrop}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						onChange={handleFileChange}
						className="sr-only"
					/>
					<div className="flex flex-col items-center gap-2 text-center px-6">
						<div
							className="p-3"
							style={{ backgroundColor: GIFT_COLORS.bgHover }}
						>
							<ImagePlus
								className="h-8 w-8"
								style={{ color: GIFT_COLORS.textMuted }}
							/>
						</div>
						<div>
							<p
								className="text-sm font-medium"
								style={{ color: GIFT_COLORS.text }}
							>
								Sube tu foto
							</p>
							<p
								className="text-xs mt-0.5"
								style={{ color: GIFT_COLORS.textMuted }}
							>
								Arrastra o haz clic para seleccionar
							</p>
						</div>
						{showPasteHint && (
							<p
								className="text-[10px] animate-in fade-in duration-300"
								style={{ color: GIFT_COLORS.textDim }}
							>
								o pega con{" "}
								<kbd
									className="px-1 py-0.5 text-[10px] font-mono"
									style={{
										backgroundColor: GIFT_COLORS.bgHover,
										border: `1px solid ${GIFT_COLORS.border}`,
									}}
								>
									⌘V
								</kbd>
							</p>
						)}
					</div>
				</label>
			)}

			<div className="space-y-1.5">
				<Label
					htmlFor="name"
					className="text-xs"
					style={{ color: GIFT_COLORS.textMuted }}
				>
					Tu nombre (opcional)
				</Label>
				<Input
					id="name"
					placeholder="¿Cómo te llamas?"
					value={recipientName}
					onChange={(e) => setRecipientName(e.target.value)}
					disabled={isLoading}
					style={{
						backgroundColor: GIFT_COLORS.bg,
						borderColor: GIFT_COLORS.border,
						color: GIFT_COLORS.text,
					}}
					className="placeholder:text-[rgba(250,250,250,0.3)]"
				/>
			</div>

			<Button
				onClick={handleSubmit}
				disabled={!image || isLoading}
				className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
				size="lg"
			>
				{isLoading ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						{isGenerating
							? "Creando tu regalo..."
							: `Subiendo... ${uploadProgress}%`}
					</>
				) : (
					<>
						<Upload className="h-4 w-4" />
						Crear mi tarjeta
					</>
				)}
			</Button>
		</div>
	);
}
