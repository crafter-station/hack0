"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { ArrowRight, Check, Globe, Loader2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	createOrganization,
	generateSlug,
	isSlugAvailable,
	startOrgScraperDirect,
} from "@/lib/actions/organizations";
import { ORGANIZER_TYPE_LABELS, type OrganizerType } from "@/lib/db/schema";

const ORGANIZER_TYPE_OPTIONS = Object.entries(ORGANIZER_TYPE_LABELS).map(
	([value, label]) => ({
		value,
		label,
	}),
);

export function OnboardingForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
	const [slugStatus, setSlugStatus] = useState<
		"idle" | "checking" | "available" | "taken"
	>("idle");
	const [logoUrl, setLogoUrl] = useState("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [type, setType] = useState<string>("");
	const [description, setDescription] = useState("");

	const [runId, setRunId] = useState<string | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [isScraping, setIsScraping] = useState(false);
	const [scraperError, setScraperError] = useState<string | null>(null);

	const { run, error: runError } = useRealtimeRun(runId || "", {
		enabled: !!runId && !!accessToken,
		accessToken: accessToken || undefined,
	});

	const scraperStatus = run?.metadata?.status as string | undefined;
	const extractedData = run?.metadata?.extractedData as
		| {
				name?: string;
				description?: string;
				type?: string;
				email?: string;
		  }
		| undefined;
	const extractedLogoUrl = run?.metadata?.logoUrl as string | undefined;
	const metadataError = run?.metadata?.error as string | undefined;
	const lastError = run?.metadata?.lastError as string | undefined;
	const attemptNumber = run?.attemptNumber || 0;
	const isRetrying = run?.status === "EXECUTING" && attemptNumber > 1;

	useEffect(() => {
		if (run?.isCompleted && extractedData) {
			if (extractedData.name && !name) {
				setName(extractedData.name);
			}
			if (extractedData.description && !description) {
				setDescription(extractedData.description);
			}
			if (extractedData.type && !type) {
				setType(extractedData.type);
			}
			if (extractedLogoUrl && !logoUrl) {
				setLogoUrl(extractedLogoUrl);
			}
			setIsScraping(false);
		}
	}, [
		run?.isCompleted,
		extractedData,
		extractedLogoUrl,
		name,
		description,
		type,
		logoUrl,
	]);

	useEffect(() => {
		if (runError) {
			setScraperError("Error al scrapear el sitio web");
			setIsScraping(false);
		}
	}, [runError]);

	useEffect(() => {
		if (metadataError && run?.status === "FAILED") {
			setScraperError(metadataError);
			setIsScraping(false);
		}
	}, [metadataError, run?.status]);

	useEffect(() => {
		if (scraperStatus === "error" && run?.status === "FAILED") {
			setIsScraping(false);
		}
	}, [scraperStatus, run?.status]);

	const handleScrapeWebsite = async () => {
		if (!websiteUrl) {
			setScraperError("Por favor ingresa la URL de tu sitio web");
			return;
		}

		setIsScraping(true);
		setScraperError(null);

		try {
			const result = await startOrgScraperDirect(websiteUrl);
			setRunId(result.runId);
			setAccessToken(result.publicAccessToken);
		} catch (err) {
			setScraperError(
				err instanceof Error ? err.message : "Error al scrapear el sitio web",
			);
			setIsScraping(false);
		}
	};

	// Auto-generate slug from name
	useEffect(() => {
		if (!slugManuallyEdited && name) {
			generateSlug(name).then(setSlug);
		}
	}, [name, slugManuallyEdited]);

	// Check slug availability
	useEffect(() => {
		if (!slug) {
			setSlugStatus("idle");
			return;
		}

		const timeout = setTimeout(async () => {
			setSlugStatus("checking");
			const available = await isSlugAvailable(slug);
			setSlugStatus(available ? "available" : "taken");
		}, 500);

		return () => clearTimeout(timeout);
	}, [slug]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			await createOrganization({
				name,
				slug,
				description: description || undefined,
				type: (type as OrganizerType) || undefined,
				websiteUrl: websiteUrl || undefined,
				logoUrl: logoUrl || undefined,
			});

			router.push(`/c/${slug}`);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al crear la comunidad",
			);
			setIsSubmitting(false);
		}
	};

	const canScrape = websiteUrl && !isScraping && !run?.isExecuting;
	const isScrapingActive =
		(isScraping || run?.isExecuting) && !run?.isCompleted;

	return (
		<form onSubmit={handleSubmit}>
			{/* Website scraper section */}
			<div className="mb-8 p-6 border rounded-lg bg-muted/30">
				<div className="flex items-start gap-4">
					<div className="flex-1 space-y-3">
						<div className="flex items-center gap-2">
							<Sparkles className="h-5 w-5 text-amber-500" />
							<h3 className="font-medium">Auto-rellenar desde sitio web</h3>
						</div>
						<p className="text-sm text-muted-foreground">
							Ingresa el sitio web oficial de tu comunidad y rellenaremos
							automáticamente los datos.
						</p>
						<p className="text-xs text-muted-foreground">
							💡 Usa el sitio web oficial (.com, .org, .pe). No funciona con
							redes sociales (Instagram, Facebook, Twitter).
						</p>
						<div className="flex gap-2">
							<div className="flex-1">
								<InputGroup>
									<InputGroupAddon align="inline-start">
										<Globe className="h-4 w-4" />
									</InputGroupAddon>
									<InputGroupInput
										type="url"
										placeholder="https://tu-comunidad.com"
										value={websiteUrl}
										onChange={(e) => setWebsiteUrl(e.target.value)}
										disabled={isScraping || run?.isExecuting}
										className={isScrapingActive ? "input-shimmer" : ""}
									/>
								</InputGroup>
							</div>
							<Button
								type="button"
								onClick={handleScrapeWebsite}
								disabled={!canScrape}
								size="sm"
								variant={run?.isCompleted ? "outline" : "default"}
							>
								{isScraping || run?.isExecuting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
										{isRetrying && `Reintentando (${attemptNumber}/3)...`}
										{!isRetrying &&
											scraperStatus === "extracting" &&
											"Extrayendo..."}
										{!isRetrying &&
											scraperStatus === "uploading_logo" &&
											"Subiendo logo..."}
										{!isRetrying && !scraperStatus && "Procesando..."}
									</>
								) : run?.isCompleted ? (
									<>
										<Check className="h-4 w-4 mr-2 text-emerald-500" />
										Completado
									</>
								) : (
									"Auto-rellenar"
								)}
							</Button>
						</div>
						{isRetrying && lastError && (
							<div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-sm text-amber-600 dark:text-amber-400">
								<p className="font-medium">
									Reintentando ({attemptNumber}/3)...
								</p>
								<p className="text-xs mt-1">Último error: {lastError}</p>
							</div>
						)}
						{scraperError && !isRetrying && (
							<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
								<p className="font-medium">Error al scrapear</p>
								<p className="text-xs mt-1">{scraperError}</p>
							</div>
						)}
						{run?.isCompleted && !metadataError && (
							<div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-3 text-sm text-emerald-600 dark:text-emerald-400">
								<p className="font-medium">✓ Datos extraídos exitosamente</p>
								<p className="text-xs mt-1">
									Revisa y completa los campos abajo.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Two column layout */}
			<div className="grid md:grid-cols-[1fr_180px] gap-6">
				{/* Left column - Main info */}
				<FieldGroup>
					{/* Name */}
					<Field>
						<FieldLabel htmlFor="name">Nombre de la comunidad *</FieldLabel>
						<InputGroup>
							<InputGroupInput
								id="name"
								name="name"
								placeholder="ej. GDG Lima, Universidad Nacional de Ingeniería"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								className={isScrapingActive ? "input-shimmer" : ""}
							/>
						</InputGroup>
					</Field>

					{/* Slug */}
					<Field>
						<FieldLabel htmlFor="slug">URL personalizada *</FieldLabel>
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<span className="text-muted-foreground">hack0.dev/c/</span>
							</InputGroupAddon>
							<InputGroupInput
								id="slug"
								value={slug}
								onChange={(e) => {
									setSlugManuallyEdited(true);
									setSlug(
										e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
									);
								}}
								placeholder="mi-comunidad"
								required
								className={isScrapingActive ? "input-shimmer" : ""}
							/>
							<InputGroupAddon align="inline-end">
								{slugStatus === "checking" && (
									<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
								)}
								{slugStatus === "available" && (
									<Check className="h-4 w-4 text-emerald-500" />
								)}
								{slugStatus === "taken" && (
									<X className="h-4 w-4 text-red-500" />
								)}
							</InputGroupAddon>
						</InputGroup>
						{slugStatus === "taken" && (
							<p className="text-xs text-red-500">Esta URL ya está en uso</p>
						)}
						<FieldDescription>
							⚠️ No podrás cambiar esta URL después de crear la comunidad
						</FieldDescription>
					</Field>

					{/* Type */}
					<Field>
						<FieldLabel htmlFor="type">Tipo *</FieldLabel>
						<Select name="type" value={type} onValueChange={setType} required>
							<SelectTrigger
								id="type"
								className={isScrapingActive ? "input-shimmer" : ""}
							>
								<SelectValue placeholder="Selecciona un tipo" />
							</SelectTrigger>
							<SelectContent>
								{ORGANIZER_TYPE_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>

					{/* Description */}
					<Field>
						<FieldLabel htmlFor="description">Descripción</FieldLabel>
						<InputGroup>
							<InputGroupTextarea
								id="description"
								name="description"
								placeholder="Breve descripción de tu comunidad..."
								className={`min-h-[80px] ${isScrapingActive ? "input-shimmer" : ""}`}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</InputGroup>
						<FieldDescription>
							Opcional. Aparecerá en tu perfil público.
						</FieldDescription>
					</Field>
				</FieldGroup>

				{/* Right column - Logo */}
				<Field>
					<FieldLabel>Logo</FieldLabel>
					<ImageUpload
						value={logoUrl}
						onChange={setLogoUrl}
						onRemove={() => setLogoUrl("")}
						endpoint="imageUploader"
						aspectRatio="square"
						className={isScrapingActive ? "input-shimmer" : ""}
					/>
					<FieldDescription className="text-center">
						Cuadrado, max 4MB
					</FieldDescription>
				</Field>
			</div>

			{/* Error */}
			{error && (
				<div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<p className="text-sm text-red-500">{error}</p>
				</div>
			)}

			{/* Submit */}
			<div className="flex justify-end mt-6 pt-4 border-t">
				<Button
					type="submit"
					disabled={
						isSubmitting || slugStatus === "taken" || slugStatus === "checking"
					}
					className="min-w-32"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creando...
						</>
					) : (
						<>
							Crear comunidad
							<ArrowRight className="ml-2 h-4 w-4" />
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
