"use client";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
	value?: string;
	onChange: (url: string) => void;
	onRemove?: () => void;
	endpoint?: "imageUploader" | "bannerUploader";
	className?: string;
	aspectRatio?: "square" | "video" | "banner" | "3/1";
	disabled?: boolean;
	label?: string;
}

export function ImageUpload({
	value,
	onChange,
	onRemove,
	endpoint = "imageUploader",
	className,
	aspectRatio = "square",
}: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState(0);

	const { startUpload } = useUploadThing(endpoint, {
		onUploadProgress: (p) => setProgress(p),
		onClientUploadComplete: (res) => {
			setIsUploading(false);
			setProgress(0);
			if (res?.[0]?.ufsUrl) {
				onChange(res[0].ufsUrl);
			}
		},
		onUploadError: (error) => {
			setIsUploading(false);
			setProgress(0);
			console.error("Upload error:", error);
		},
	});

	const handleFileSelect = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			setIsUploading(true);
			await startUpload([file]);
		},
		[startUpload],
	);

	const aspectClasses = {
		square: "aspect-square",
		video: "aspect-video",
		banner: "aspect-[4/1]",
		"3/1": "aspect-[3/1]",
	};

	if (value) {
		return (
			<div
				className={cn(
					"relative overflow-hidden rounded-lg border border-border bg-muted",
					aspectClasses[aspectRatio],
					className,
				)}
			>
				<img
					src={value}
					alt="Uploaded"
					className="h-full w-full object-cover"
				/>
				{onRemove && (
					<button
						type="button"
						onClick={onRemove}
						className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>
		);
	}

	return (
		<label
			className={cn(
				"relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 transition-colors hover:bg-muted hover:border-muted-foreground/50",
				aspectClasses[aspectRatio],
				isUploading && "pointer-events-none",
				className,
			)}
		>
			<input
				type="file"
				accept="image/*"
				onChange={handleFileSelect}
				className="sr-only"
			/>
			{isUploading ? (
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					<p className="text-xs text-muted-foreground">{progress}%</p>
				</div>
			) : (
				<>
					<ImageIcon className="h-8 w-8 text-muted-foreground" />
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Upload className="h-3.5 w-3.5" />
						Subir imagen
					</div>
					<p className="text-xs text-muted-foreground">
						{endpoint === "bannerUploader" ? "Max 8MB" : "Max 4MB"}
					</p>
				</>
			)}
		</label>
	);
}
