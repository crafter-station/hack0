"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { type Tag, TagInput } from "emblor";
import {
	ArrowLeft,
	Check,
	ChevronsUpDown,
	Globe,
	Link2,
	Loader2,
	Sparkles,
	Tags,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocationSelector } from "@/components/org/settings/location-selector";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	ResponsiveModal,
	ResponsiveModalClose,
	ResponsiveModalContent,
	ResponsiveModalFooter,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
	ResponsiveModalTrigger,
} from "@/components/ui/responsive-modal";
import { Textarea } from "@/components/ui/textarea";
import {
	createOrganization,
	generateSlug,
	isSlugAvailable,
	startOrgScraperDirect,
} from "@/lib/actions/organizations";
import type { OrganizerType } from "@/lib/db/schema";
import {
	getOrganizerTypeConfig,
	ORGANIZER_TYPE_LIST,
} from "@/lib/organizer-type-config";

export function OrgCreateForm() {
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
	const [type, setType] = useState<string>("community");
	const [description, setDescription] = useState("");
	const [twitterUrl, setTwitterUrl] = useState("");
	const [linkedinUrl, setLinkedinUrl] = useState("");
	const [instagramUrl, setInstagramUrl] = useState("");
	const [githubUrl, setGithubUrl] = useState("");
	const [email, setEmail] = useState("");
	const [tags, setTags] = useState<Tag[]>([]);
	const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
	const [country, setCountry] = useState<string>("");
	const [department, setDepartment] = useState("");

	const [descriptionOpen, setDescriptionOpen] = useState(false);
	const [linksOpen, setLinksOpen] = useState(false);
	const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);

	const [runId, setRunId] = useState<string | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [isScraping, setIsScraping] = useState(false);
	const [scraperError, setScraperError] = useState<string | null>(null);
	const [scrapeUrl, setScrapeUrl] = useState("");

	const { run, error: runError } = useRealtimeRun(runId || "", {
		enabled: !!runId && !!accessToken,
		accessToken: accessToken || undefined,
	});

	const extractedData = run?.metadata?.extractedData as
		| {
				name?: string;
				description?: string;
				type?: string;
				socialLinks?: {
					twitter?: string;
					linkedin?: string;
					instagram?: string;
					github?: string;
				};
		  }
		| undefined;
	const extractedLogoUrl = run?.metadata?.logoUrl as string | undefined;

	useEffect(() => {
		if (run?.isCompleted && extractedData) {
			if (extractedData.name && !name) setName(extractedData.name);
			if (extractedData.description && !description)
				setDescription(extractedData.description);
			if (extractedData.type && !type) setType(extractedData.type);
			if (extractedLogoUrl && !logoUrl) setLogoUrl(extractedLogoUrl);
			if (extractedData.socialLinks) {
				if (extractedData.socialLinks.twitter && !twitterUrl)
					setTwitterUrl(extractedData.socialLinks.twitter);
				if (extractedData.socialLinks.linkedin && !linkedinUrl)
					setLinkedinUrl(extractedData.socialLinks.linkedin);
				if (extractedData.socialLinks.instagram && !instagramUrl)
					setInstagramUrl(extractedData.socialLinks.instagram);
				if (extractedData.socialLinks.github && !githubUrl)
					setGithubUrl(extractedData.socialLinks.github);
			}
			setIsScraping(false);
			setImportOpen(false);
		}
	}, [
		run?.isCompleted,
		extractedData,
		extractedLogoUrl,
		name,
		description,
		type,
		logoUrl,
		twitterUrl,
		linkedinUrl,
		instagramUrl,
		githubUrl,
	]);

	useEffect(() => {
		if (runError || run?.status === "FAILED") {
			setScraperError("Error al extraer datos del sitio web");
			setIsScraping(false);
		}
	}, [runError, run?.status]);

	const handleScrapeWebsite = async () => {
		if (!scrapeUrl) return;
		setIsScraping(true);
		setScraperError(null);
		setImportOpen(false);

		try {
			const result = await startOrgScraperDirect(scrapeUrl);
			setRunId(result.runId);
			setAccessToken(result.publicAccessToken);
			setWebsiteUrl(scrapeUrl);
		} catch (err) {
			setScraperError(err instanceof Error ? err.message : "Error al procesar");
			setIsScraping(false);
		}
	};

	useEffect(() => {
		if (!slugManuallyEdited && name) {
			generateSlug(name).then(setSlug);
		}
	}, [name, slugManuallyEdited]);

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
				twitterUrl: twitterUrl || undefined,
				linkedinUrl: linkedinUrl || undefined,
				instagramUrl: instagramUrl || undefined,
				githubUrl: githubUrl || undefined,
				email: email || undefined,
				tags: tags.length > 0 ? tags.map((t) => t.text) : undefined,
				country: country || undefined,
				department: department || undefined,
			});
			router.push(`/c/${slug}`);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al crear la comunidad",
			);
			setIsSubmitting(false);
		}
	};

	const isImporting = isScraping || run?.isExecuting;
	const hasLinks = twitterUrl || linkedinUrl || instagramUrl || githubUrl;

	return (
		<form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4">
			{error && (
				<div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-sm text-red-600">
					{error}
				</div>
			)}

			<div className="mb-6 flex items-center justify-between">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Volver
				</Link>
				<ResponsiveModal open={importOpen} onOpenChange={setImportOpen}>
					<ResponsiveModalTrigger asChild>
						<Button type="button" variant="outline" className="gap-2">
							<Sparkles className="h-4 w-4" />
							Autocompletar
						</Button>
					</ResponsiveModalTrigger>
					<ResponsiveModalContent className="max-w-lg">
						<ResponsiveModalHeader>
							<ResponsiveModalTitle>
								Autocompletar desde sitio web
							</ResponsiveModalTitle>
						</ResponsiveModalHeader>
						<div className="p-4 space-y-4">
							<div>
								<Label className="text-sm mb-2 block">
									URL del sitio web oficial
								</Label>
								<Input
									type="url"
									value={scrapeUrl}
									onChange={(e) => setScrapeUrl(e.target.value)}
									placeholder="https://tu-comunidad.com"
									className="h-9"
								/>
								<p className="text-xs text-muted-foreground mt-2">
									Usa el sitio web oficial (.com, .org). No funciona con redes
									sociales.
								</p>
							</div>
							{scraperError && (
								<div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-sm text-red-600">
									{scraperError}
								</div>
							)}
						</div>
						<ResponsiveModalFooter>
							<ResponsiveModalClose asChild>
								<Button variant="outline">Cancelar</Button>
							</ResponsiveModalClose>
							<Button
								onClick={handleScrapeWebsite}
								disabled={!scrapeUrl || isImporting}
								className="gap-2"
							>
								{isImporting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Procesando...
									</>
								) : (
									<>
										<Sparkles className="h-4 w-4" />
										Autocompletar
									</>
								)}
							</Button>
						</ResponsiveModalFooter>
					</ResponsiveModalContent>
				</ResponsiveModal>
			</div>

			<div className="flex flex-col md:flex-row gap-6">
				<div className="w-full md:w-72 flex-shrink-0 space-y-3">
					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							Tipo de organización
						</Label>
						<Popover open={typeSelectorOpen} onOpenChange={setTypeSelectorOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									aria-expanded={typeSelectorOpen}
									className="w-full justify-between h-auto py-2.5 px-3"
									disabled={isImporting}
								>
									<div className="flex items-center gap-2.5">
										{(() => {
											const config = getOrganizerTypeConfig(type);
											const Icon = config.icon;
											return (
												<>
													<Icon className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">{config.label}</span>
												</>
											);
										})()}
									</div>
									<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-[--radix-popover-trigger-width] p-0"
								align="start"
							>
								<Command>
									<CommandInput placeholder="Buscar tipo..." />
									<CommandList>
										<CommandEmpty>No se encontró</CommandEmpty>
										<CommandGroup>
											{ORGANIZER_TYPE_LIST.map((option) => {
												const Icon = option.icon;
												return (
													<CommandItem
														key={option.value}
														value={option.value}
														onSelect={(value) => {
															setType(value);
															setTypeSelectorOpen(false);
														}}
														className="flex items-start gap-2.5 py-2.5 cursor-pointer"
													>
														<Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
														<div className="flex-1 min-w-0">
															<div className="font-medium text-sm">
																{option.label}
															</div>
															<div className="text-xs text-muted-foreground">
																{option.description}
															</div>
														</div>
														{option.value === type && (
															<Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
														)}
													</CommandItem>
												);
											})}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>

					<div
						className={`w-full aspect-square md:h-72 overflow-hidden bg-muted border border-border rounded-lg ${isImporting ? "input-shimmer" : ""}`}
					>
						{logoUrl ? (
							<div className="relative w-full h-full group">
								<img
									src={logoUrl}
									alt="Logo"
									className="w-full h-full object-cover"
								/>
								<button
									type="button"
									onClick={() => setLogoUrl("")}
									className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
									disabled={isImporting}
								>
									<span className="text-white text-xs">Cambiar</span>
								</button>
							</div>
						) : (
							<ImageUpload
								value={logoUrl}
								onChange={setLogoUrl}
								className="w-full h-full"
								aspectRatio="square"
								disabled={isImporting}
							/>
						)}
					</div>
				</div>

				<div className="flex-1 space-y-3">
					<textarea
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						placeholder="Nombre de la comunidad"
						rows={2}
						className={`w-full text-2xl font-semibold bg-transparent border-none outline-none focus:outline-none placeholder:text-muted-foreground/40 p-0 resize-none ${isImporting ? "input-shimmer" : ""}`}
						disabled={isImporting}
					/>

					<div>
						<Label
							htmlFor="slug"
							className="text-xs text-muted-foreground mb-2 block"
						>
							URL de la comunidad
						</Label>
						<ButtonGroup
							className={`w-full [&>*]:!rounded-none ${isImporting ? "input-shimmer" : ""}`}
						>
							<ButtonGroupText asChild className="!rounded-none px-2">
								<Label htmlFor="slug">hack0.dev/c/</Label>
							</ButtonGroupText>
							<InputGroup className="flex-1 !rounded-none">
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
									disabled={isImporting}
								/>
							</InputGroup>
							<ButtonGroupText className="!rounded-none px-3">
								{slugStatus === "checking" && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								{slugStatus === "available" && (
									<Check className="h-4 w-4 text-emerald-500" />
								)}
								{slugStatus === "taken" && (
									<X className="h-4 w-4 text-red-500" />
								)}
								{slugStatus === "idle" && <div className="w-4" />}
							</ButtonGroupText>
						</ButtonGroup>
						{slugStatus === "taken" && (
							<p className="text-xs text-red-500 mt-1.5">
								Esta URL ya está en uso
							</p>
						)}
					</div>

					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							Descripción
						</Label>
						<ResponsiveModal
							open={descriptionOpen}
							onOpenChange={setDescriptionOpen}
						>
							<ResponsiveModalTrigger asChild>
								<ButtonGroup
									className={`w-full [&>*]:!rounded-none cursor-pointer ${isImporting ? "input-shimmer" : ""}`}
								>
									<ButtonGroupText className="!rounded-none">
										<Globe className="h-4 w-4" />
									</ButtonGroupText>
									<button
										type="button"
										disabled={isImporting}
										className="flex-1 border shadow-xs bg-background text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
									>
										{description ? (
											<span className="line-clamp-1">{description}</span>
										) : (
											<span className="text-muted-foreground">
												Describe tu comunidad...
											</span>
										)}
									</button>
								</ButtonGroup>
							</ResponsiveModalTrigger>
							<ResponsiveModalContent className="max-w-2xl">
								<ResponsiveModalHeader>
									<ResponsiveModalTitle>
										Descripción de la comunidad
									</ResponsiveModalTitle>
								</ResponsiveModalHeader>
								<div className="p-4">
									<Textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										rows={8}
										placeholder="Describe tu comunidad..."
										className="w-full min-h-[200px]"
									/>
								</div>
								<ResponsiveModalFooter>
									<ResponsiveModalClose asChild>
										<Button>Guardar</Button>
									</ResponsiveModalClose>
								</ResponsiveModalFooter>
							</ResponsiveModalContent>
						</ResponsiveModal>
					</div>

					<div className={isImporting ? "input-shimmer" : ""}>
						<Label className="text-xs text-muted-foreground mb-2 block">
							Etiquetas (opcional)
						</Label>
						<ButtonGroup className="w-full [&>*]:!rounded-none">
							<ButtonGroupText className="!rounded-none">
								<Tags className="h-4 w-4" />
							</ButtonGroupText>
							<div className="flex-1 border shadow-xs bg-background transition-colors focus-within:border-foreground/30 py-1 px-3">
								<TagInput
									placeholder="Añadir etiqueta..."
									tags={tags}
									setTags={(newTags) => {
										setTags(newTags as Tag[]);
									}}
									activeTagIndex={activeTagIndex}
									setActiveTagIndex={setActiveTagIndex}
									styleClasses={{
										inlineTagsContainer:
											"!rounded-none !border-0 bg-transparent p-0 gap-1.5",
										input:
											"!rounded-none !border-0 !ring-0 !outline-none !shadow-none !p-0 w-full min-w-[80px] !h-7 text-sm bg-transparent focus:!ring-0 focus:!border-0 focus-visible:!ring-0 focus-visible:!border-0",
										tag: {
											body: "h-6 relative bg-muted border border-border hover:bg-muted/80 font-medium text-xs ps-2 pe-6",
											closeButton:
												"absolute -inset-y-px -end-px p-0 flex size-6 transition-colors text-muted-foreground/80 hover:text-foreground",
										},
									}}
								/>
							</div>
						</ButtonGroup>
					</div>

					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							Ubicación (opcional)
						</Label>
						<LocationSelector
							country={country}
							onCountryChange={setCountry}
							region={department}
							onRegionChange={setDepartment}
							disabled={isImporting}
						/>
					</div>

					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							Redes sociales (opcional)
						</Label>
						<ResponsiveModal open={linksOpen} onOpenChange={setLinksOpen}>
							<ResponsiveModalTrigger asChild>
								<ButtonGroup
									className={`w-full [&>*]:!rounded-none cursor-pointer ${isImporting ? "input-shimmer" : ""}`}
								>
									<ButtonGroupText className="!rounded-none">
										<Link2 className="h-4 w-4" />
									</ButtonGroupText>
									<button
										type="button"
										disabled={isImporting}
										className="flex-1 border shadow-xs bg-background text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
									>
										{hasLinks ? (
											<span className="flex flex-wrap gap-2">
												{twitterUrl && <span>Twitter</span>}
												{linkedinUrl && <span>LinkedIn</span>}
												{instagramUrl && <span>Instagram</span>}
												{githubUrl && <span>GitHub</span>}
											</span>
										) : (
											<span className="text-muted-foreground">
												Agregar redes sociales...
											</span>
										)}
									</button>
								</ButtonGroup>
							</ResponsiveModalTrigger>
							<ResponsiveModalContent className="max-w-2xl">
								<ResponsiveModalHeader>
									<ResponsiveModalTitle>Redes sociales</ResponsiveModalTitle>
								</ResponsiveModalHeader>
								<div className="p-4 space-y-4">
									<div>
										<Label className="text-sm mb-2 block">Sitio web</Label>
										<Input
											type="url"
											value={websiteUrl}
											onChange={(e) => setWebsiteUrl(e.target.value)}
											placeholder="https://..."
											className="h-9"
										/>
									</div>
									<div>
										<Label className="text-sm mb-2 block">
											Correo de contacto
										</Label>
										<Input
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="contacto@comunidad.com"
											className="h-9"
										/>
									</div>
									<div>
										<Label className="text-sm mb-2 block">Twitter</Label>
										<Input
											type="url"
											value={twitterUrl}
											onChange={(e) => setTwitterUrl(e.target.value)}
											placeholder="https://twitter.com/..."
											className="h-9"
										/>
									</div>
									<div>
										<Label className="text-sm mb-2 block">LinkedIn</Label>
										<Input
											type="url"
											value={linkedinUrl}
											onChange={(e) => setLinkedinUrl(e.target.value)}
											placeholder="https://linkedin.com/company/..."
											className="h-9"
										/>
									</div>
									<div>
										<Label className="text-sm mb-2 block">Instagram</Label>
										<Input
											type="url"
											value={instagramUrl}
											onChange={(e) => setInstagramUrl(e.target.value)}
											placeholder="https://instagram.com/..."
											className="h-9"
										/>
									</div>
									<div>
										<Label className="text-sm mb-2 block">GitHub</Label>
										<Input
											type="url"
											value={githubUrl}
											onChange={(e) => setGithubUrl(e.target.value)}
											placeholder="https://github.com/..."
											className="h-9"
										/>
									</div>
								</div>
								<ResponsiveModalFooter>
									<ResponsiveModalClose asChild>
										<Button>Guardar</Button>
									</ResponsiveModalClose>
								</ResponsiveModalFooter>
							</ResponsiveModalContent>
						</ResponsiveModal>
					</div>

					<Button
						type="submit"
						disabled={
							isSubmitting ||
							!name ||
							isImporting ||
							slugStatus === "taken" ||
							slugStatus === "checking"
						}
						className={`w-full h-10 text-sm gap-2 ${isImporting ? "input-shimmer" : ""}`}
					>
						{(isSubmitting || isImporting) && (
							<Loader2 className="h-4 w-4 animate-spin" />
						)}
						{isImporting
							? "Autocompletando..."
							: isSubmitting
								? "Creando..."
								: "Crear Comunidad"}
					</Button>
				</div>
			</div>
		</form>
	);
}
