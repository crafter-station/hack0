"use client";

import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/badge/defaults";

interface BadgeGeneratorProps {
	communitySlug: string;
	communityName: string;
	communityLogo?: string | null;
	memberRole: string;
	defaultName?: string;
}

export function BadgeGenerator({
	communitySlug,
	communityName,
	communityLogo,
	memberRole,
	defaultName = "",
}: BadgeGeneratorProps) {
	const router = useRouter();
	const [image, setImage] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [memberName, setMemberName] = useState(defaultName);
	const [isUploading, setIsUploading] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [showPasteHint, setShowPasteHint] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { startUpload } = useUploadThing("giftPhotoUploader", {
		onUploadProgress: (p) => setUploadProgress(p),
		onClientUploadComplete: async (res) => {
			if (res?.[0]?.url) {
				await generateBadge(res[0].url);
			}
		},
		onUploadError: (err) => {
			setIsUploading(false);
			setUploadProgress(0);
			setError(err.message || "Error al subir la imagen");
		},
	});

	const generateBadge = async (photoUrl: string) => {
		setIsGenerating(true);
		setError(null);
		try {
			const response = await fetch("/api/badge/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					communitySlug,
					photoUrl,
					memberName: memberName || undefined,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Error al generar el badge");
			}

			router.push(`/c/${communitySlug}/badge/loading/${data.token}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al generar el badge");
			setIsGenerating(false);
			setIsUploading(false);
		}
	};

	const processFile = (file: File) => {
		if (!file.type.startsWith("image/")) return;
		setImageFile(file);
		setError(null);
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
		if (!imageFile || !memberName.trim()) return;
		setIsUploading(true);
		setError(null);
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
	const roleLabel = ROLE_LABELS[memberRole] || memberRole;

	return (
		<div className="w-full max-w-md mx-auto space-y-6">
			<div className="text-center space-y-2">
				<div className="flex items-center justify-center gap-3 mb-4">
					{communityLogo && (
						<img
							src={communityLogo}
							alt={communityName}
							className="h-10 w-10 rounded-lg object-cover"
						/>
					)}
					<span className="text-lg font-semibold">{communityName}</span>
				</div>
				<h1 className="text-2xl font-bold tracking-tight">
					Genera tu badge
				</h1>
				<p className="text-sm text-muted-foreground">
					Sube tu foto y la transformaremos con IA en un badge único de la comunidad
				</p>
				<div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
					<span>Tu rol:</span>
					<span className="font-medium text-foreground">{roleLabel}</span>
				</div>
			</div>

			{image ? (
				<div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30">
					<img
						src={image}
						alt="Tu foto"
						className="h-full w-full object-cover"
					/>
					{!isLoading && (
						<button
							type="button"
							onClick={removeImage}
							className="absolute right-2 top-2 p-1.5 rounded-md backdrop-blur-sm bg-background/80 border text-muted-foreground hover:text-foreground transition-colors"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
			) : (
				<label
					className={cn(
						"relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50",
					)}
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
						<div className="p-3 rounded-lg bg-muted">
							<ImagePlus className="h-8 w-8 text-muted-foreground" />
						</div>
						<div>
							<p className="text-sm font-medium">Sube tu foto</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								Arrastra o haz clic para seleccionar
							</p>
						</div>
						{showPasteHint && (
							<p className="text-[10px] text-muted-foreground/60 animate-in fade-in duration-300">
								o pega con{" "}
								<kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted border rounded">
									⌘V
								</kbd>
							</p>
						)}
					</div>
				</label>
			)}

			<div className="space-y-1.5">
				<Label htmlFor="name" className="text-xs text-muted-foreground">
					Tu nombre (aparecerá en el badge)
				</Label>
				<Input
					id="name"
					placeholder="¿Cómo te llamas?"
					value={memberName}
					onChange={(e) => setMemberName(e.target.value)}
					disabled={isLoading}
					required
				/>
			</div>

			{error && (
				<div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
					{error}
				</div>
			)}

			<Button
				onClick={handleSubmit}
				disabled={!image || !memberName.trim() || isLoading}
				className="w-full gap-2"
				size="lg"
			>
				{isLoading ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						{isGenerating
							? "Generando badge..."
							: `Subiendo... ${uploadProgress}%`}
					</>
				) : (
					<>
						<Sparkles className="h-4 w-4" />
						Generar mi badge
					</>
				)}
			</Button>
		</div>
	);
}
