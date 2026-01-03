"use client";

import type { Tag } from "emblor";
import { Check, Copy, ExternalLink, Loader2, Save, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { Organization } from "@/lib/db/schema";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

interface BadgeConfig {
	logo: string;
	title: string;
	primaryColor: string;
	secondaryColor: string;
	accentColor: string;
	backgroundColor: string;
	textColor: string;
	styles: string[];
}

interface BadgeSettingsFormProps {
	organization: Organization;
}

export function BadgeSettingsForm({ organization }: BadgeSettingsFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [copied, setCopied] = useState(false);
	const [shortCode, setShortCode] = useState<string | null>(
		organization.shortCode ?? null,
	);
	const [isGeneratingCode, setIsGeneratingCode] = useState(false);
	const [origin, setOrigin] = useState("");

	// Set origin on client side
	useEffect(() => {
		setOrigin(window.location.origin);
	}, []);

	// Auto-generate shortCode if missing (for existing orgs)
	useEffect(() => {
		if (!shortCode && origin && !isGeneratingCode) {
			const generateCode = async () => {
				setIsGeneratingCode(true);
				try {
					const response = await fetch(
						`/api/organizations/${organization.id}/short-code`,
						{
							method: "POST",
						},
					);
					if (response.ok) {
						const data = await response.json();
						setShortCode(data.shortCode);
					}
				} catch (err) {
					console.error("Error generating short code:", err);
				} finally {
					setIsGeneratingCode(false);
				}
			};
			generateCode();
		}
	}, [shortCode, origin, organization.id, isGeneratingCode]);

	const previewUrl = shortCode ? `${origin}/b/${shortCode}` : null;

	const copyShareLink = useCallback(() => {
		if (!previewUrl) return;
		navigator.clipboard.writeText(previewUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [previewUrl]);

	const [config, setConfig] = useState<BadgeConfig>({
		logo: organization.logoUrl || "",
		title: organization.displayName || organization.name,
		primaryColor: "#ffffff",
		secondaryColor: "#333333",
		accentColor: "#666666",
		backgroundColor: "#0a0a0a",
		textColor: "#ffffff",
		styles: ["Vercelf", "Comfy", "Santa", "Wham!"],
	});

	const [styleTags, setStyleTags] = useState<Tag[]>(
		config.styles.map((s) => ({ id: s, text: s })),
	);
	const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
	const [newStyle, setNewStyle] = useState("");
	const [extractedColors, setExtractedColors] = useState<string[]>([]);

	// Logo upload
	const [isUploadingLogo, setIsUploadingLogo] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const { startUpload } = useUploadThing("imageUploader", {
		onUploadProgress: (p) => setUploadProgress(p),
		onClientUploadComplete: (res) => {
			setIsUploadingLogo(false);
			setUploadProgress(0);
			if (res?.[0]?.ufsUrl) {
				setConfig((prev) => ({ ...prev, logo: res[0].ufsUrl }));
				extractColorsFromImage(res[0].ufsUrl);
			}
		},
		onUploadError: (error) => {
			setIsUploadingLogo(false);
			setUploadProgress(0);
			console.error("Upload error:", error);
		},
	});

	const handleLogoUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			const supportedTypes = [
				"image/jpeg",
				"image/png",
				"image/webp",
				"image/svg+xml",
			];
			if (!supportedTypes.includes(file.type)) {
				alert("Solo se permiten imágenes PNG, SVG, JPG o WebP");
				return;
			}

			setIsUploadingLogo(true);
			await startUpload([file]);
		},
		[startUpload],
	);

	const extractColorsFromImage = (imageUrl: string) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0);

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const colors = extractDominantColors(imageData.data);
			setExtractedColors(colors);
		};
		img.src = imageUrl;
	};

	const extractDominantColors = (data: Uint8ClampedArray): string[] => {
		const colorCounts: { [key: string]: number } = {};

		for (let i = 0; i < data.length; i += 4) {
			const r = Math.round(data[i] / 32) * 32;
			const g = Math.round(data[i + 1] / 32) * 32;
			const b = Math.round(data[i + 2] / 32) * 32;
			const key = `rgb(${r},${g},${b})`;
			colorCounts[key] = (colorCounts[key] || 0) + 1;
		}

		return Object.entries(colorCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([color]) => color);
	};

	const rgbToHex = (rgb: string): string => {
		const match = rgb.match(/rgb\((\d+),(\d+),(\d+)\)/);
		if (!match) return rgb;
		const r = Number.parseInt(match[1]).toString(16).padStart(2, "0");
		const g = Number.parseInt(match[2]).toString(16).padStart(2, "0");
		const b = Number.parseInt(match[3]).toString(16).padStart(2, "0");
		return `#${r}${g}${b}`;
	};

	const applyExtractedColor = (color: string, target: keyof BadgeConfig) => {
		const hex = rgbToHex(color);
		setConfig((prev) => ({ ...prev, [target]: hex }));
	};

	const addStyle = () => {
		if (newStyle.trim() && !config.styles.includes(newStyle.trim())) {
			const newStyles = [...config.styles, newStyle.trim()];
			setConfig((prev) => ({ ...prev, styles: newStyles }));
			setStyleTags(newStyles.map((s) => ({ id: s, text: s })));
			setNewStyle("");
		}
	};

	const removeStyle = (style: string) => {
		const newStyles = config.styles.filter((s) => s !== style);
		setConfig((prev) => ({ ...prev, styles: newStyles }));
		setStyleTags(newStyles.map((s) => ({ id: s, text: s })));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);
		setSuccess(false);

		try {
			// TODO: Save badge configuration to database
			// await updateBadgeConfig(organization.id, config);
			setSuccess(true);
			router.refresh();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Error al guardar la configuración del badge",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const colorFields = [
		{ key: "primaryColor" as const, label: "Primario" },
		{ key: "secondaryColor" as const, label: "Secundario" },
		{ key: "accentColor" as const, label: "Acento" },
		{ key: "backgroundColor" as const, label: "Fondo" },
		{ key: "textColor" as const, label: "Texto" },
	];

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Header con título y botones */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Badge Settings</h3>
					<p className="text-sm text-muted-foreground">
						Configura los badges de tu comunidad
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="gap-2"
							>
								<Share2 className="h-4 w-4" />
								Compartir
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80" align="end">
							<div className="space-y-3">
								<div>
									<h4 className="font-medium text-sm">
										Compartir vista previa
									</h4>
									<p className="text-xs text-muted-foreground">
										Comparte este link para mostrar la vista previa del badge
									</p>
								</div>
								<div className="flex gap-2">
									<Input
										readOnly
										value={previewUrl || ""}
										placeholder={isGeneratingCode ? "Generando..." : ""}
										className="text-xs h-8 font-mono"
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-8 px-2 shrink-0"
										onClick={copyShareLink}
										disabled={!previewUrl || isGeneratingCode}
									>
										{isGeneratingCode ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : copied ? (
											<Check className="h-4 w-4 text-emerald-500" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</Button>
								</div>
								{previewUrl && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="w-full gap-2 text-xs"
										asChild
									>
										<a
											href={previewUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											<ExternalLink className="h-3 w-3" />
											Abrir en nueva pestaña
										</a>
									</Button>
								)}
							</div>
						</PopoverContent>
					</Popover>
					<Button
						type="submit"
						disabled={isSubmitting}
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

			<div className="rounded-lg border border-border p-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Left - Configuration Form */}
					<div className="space-y-6">
						{/* Logo Upload */}
						<div>
							<Label className="text-sm text-muted-foreground mb-3 block">
								Logo
							</Label>
							<label
								className={cn(
									"w-16 h-16 border border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors overflow-hidden",
									isUploadingLogo && "pointer-events-none",
								)}
							>
								<input
									type="file"
									accept="image/png,image/svg+xml,image/jpeg,image/webp"
									onChange={handleLogoUpload}
									className="sr-only"
								/>
								{isUploadingLogo ? (
									<div className="flex flex-col items-center">
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
										<span className="text-[10px] text-muted-foreground mt-1">
											{uploadProgress}%
										</span>
									</div>
								) : config.logo ? (
									<img
										src={config.logo}
										alt="Logo"
										className="max-w-full max-h-full object-contain p-1"
									/>
								) : (
									<span className="text-muted-foreground text-lg">+</span>
								)}
							</label>
							<p className="text-xs text-muted-foreground mt-2">
								512x512px, PNG/SVG
							</p>

							{extractedColors.length > 0 && (
								<div className="mt-4">
									<p className="text-xs text-muted-foreground mb-2">
										Colores extraídos:
									</p>
									<div className="flex gap-2">
										{extractedColors.map((color, index) => (
											<button
												key={index}
												type="button"
												onClick={() =>
													applyExtractedColor(color, "primaryColor")
												}
												className="w-6 h-6 rounded-md hover:ring-2 hover:ring-foreground/20 transition-all"
												style={{ backgroundColor: color }}
												title={rgbToHex(color)}
											/>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Title */}
						<div>
							<Label className="text-sm text-muted-foreground mb-3 block">
								Título
							</Label>
							<Input
								type="text"
								value={config.title}
								onChange={(e) =>
									setConfig((prev) => ({ ...prev, title: e.target.value }))
								}
								className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-muted-foreground"
							/>
						</div>

						{/* Colors */}
						<div>
							<Label className="text-sm text-muted-foreground mb-3 block">
								Colores
							</Label>
							<div className="space-y-3">
								{colorFields.map(({ key, label }) => (
									<div key={key} className="flex items-center justify-between">
										<span className="text-sm text-muted-foreground">
											{label}
										</span>
										<div className="flex items-center gap-2">
											<span className="text-xs text-muted-foreground font-mono">
												{config[key]}
											</span>
											<input
												type="color"
												value={config[key]}
												onChange={(e) =>
													setConfig((prev) => ({
														...prev,
														[key]: e.target.value,
													}))
												}
												className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
											/>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Styles */}
						<div>
							<Label className="text-sm text-muted-foreground mb-3 block">
								Estilos
							</Label>
							<div className="flex gap-2 flex-wrap mb-3">
								{config.styles.map((style) => (
									<div
										key={style}
										className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs"
									>
										<span>{style}</span>
										<button
											type="button"
											onClick={() => removeStyle(style)}
											className="text-muted-foreground hover:text-red-400 transition-colors"
										>
											×
										</button>
									</div>
								))}
							</div>
							<div className="flex gap-2">
								<Input
									type="text"
									value={newStyle}
									onChange={(e) => setNewStyle(e.target.value)}
									onKeyDown={(e) =>
										e.key === "Enter" && (e.preventDefault(), addStyle())
									}
									className="flex-1 bg-transparent border-0 border-b border-border rounded-none px-0 text-sm focus-visible:ring-0 focus-visible:border-muted-foreground"
									placeholder="Agregar estilo..."
								/>
								<button
									type="button"
									onClick={addStyle}
									className="text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									Agregar
								</button>
							</div>
						</div>
					</div>

					{/* Right - Preview */}
					<div>
						<Label className="text-sm text-muted-foreground mb-3 block">
							Vista previa
						</Label>
						<div
							className="rounded-xl p-6 min-h-[380px] flex flex-col items-center"
							style={{ backgroundColor: config.backgroundColor }}
						>
							{config.logo && (
								<img
									src={config.logo}
									alt="Logo"
									className="w-10 h-10 object-contain mb-3"
								/>
							)}

							<h1
								className="text-xl mb-4 text-center font-serif italic"
								style={{ color: config.textColor }}
							>
								{config.title}
							</h1>

							<div className="flex items-center gap-1.5 mb-6 flex-wrap justify-center">
								{config.styles.map((style, index) => (
									<button
										key={style}
										type="button"
										className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
										style={{
											backgroundColor:
												index === 0 ? config.primaryColor : "transparent",
											color:
												index === 0
													? config.backgroundColor
													: config.accentColor,
											border:
												index === 0
													? "none"
													: `1px solid ${config.accentColor}`,
										}}
									>
										{style}
									</button>
								))}
								<span
									className="text-xs ml-1 font-serif italic"
									style={{ color: config.accentColor }}
								>
									yourself.
								</span>
							</div>

							<div
								className="w-24 h-24 border border-dashed rounded-xl mb-4"
								style={{ borderColor: config.accentColor }}
							/>

							<div className="flex flex-col gap-2 w-full max-w-[160px]">
								<button
									type="button"
									className="w-full py-1.5 px-3 rounded-full text-xs font-medium"
									style={{
										backgroundColor: config.primaryColor,
										color: config.backgroundColor,
									}}
								>
									Enable Camera
								</button>
								<button
									type="button"
									className="w-full py-1.5 px-3 rounded-full text-xs font-medium border"
									style={{
										backgroundColor: "transparent",
										color: config.textColor,
										borderColor: config.accentColor,
									}}
								>
									Upload Image
								</button>
							</div>

							<footer
								className="mt-auto pt-4 text-[10px]"
								style={{ color: config.accentColor }}
							>
								Built with v0, AI SDK & Vercel AI Gateway.
							</footer>
						</div>
					</div>
				</div>
			</div>
		</form>
	);
}
