"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
	ArrowLeft,
	Building2,
	Check,
	ChevronsUpDown,
	DollarSign,
	FileText,
	Globe,
	Link2,
	Loader2,
	MapPin,
	Sparkles,
	User,
	Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import Markdown from "react-markdown";
import { LumaIcon } from "@/components/icons/luma";
import { Button } from "@/components/ui/button";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "@/lib/actions/events";
import { startLumaImport } from "@/lib/actions/import";
import type { Organization } from "@/lib/db/schema";
import {
	EVENT_TYPE_LIST,
	getEventTypeConfig,
	hasEventOptions,
} from "@/lib/event-type-config";
import { SKILL_LEVEL_OPTIONS } from "@/lib/event-utils";
import type { ExtractedEventData } from "@/lib/schemas/event-extraction";
import { AIExtractModal } from "./ai-extract-modal";

interface OrganizationWithRole {
	organization: Organization;
	role: "owner" | "admin" | "member" | "follower" | null;
}

interface OrgEventFormMinimalProps {
	communityId: string;
	communityName: string;
	communityLogo?: string | null;
	communitySlug: string;
	currentOrg?: Organization;
	availableOrganizations?: OrganizationWithRole[];
}

interface ExtractedData {
	name?: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	city?: string;
	venue?: string;
	format?: string;
	eventImageUrl?: string;
	organizerName?: string;
	websiteUrl?: string;
	registrationUrl?: string;
	eventType?: string;
	country?: string;
	step?: string;
	error?: string;
}

export function OrgEventFormMinimal({
	communityId,
	communityName,
	communitySlug,
	currentOrg,
	availableOrganizations,
}: OrgEventFormMinimalProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [descriptionOpen, setDescriptionOpen] = useState(false);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [startDate, setStartDate] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endDate, setEndDate] = useState("");
	const [endTime, setEndTime] = useState("");
	const [format, setFormat] = useState<"virtual" | "in-person" | "hybrid">(
		"in-person",
	);
	const [department, setDepartment] = useState("");
	const [city, setCity] = useState("");
	const [venue, setVenue] = useState("");
	const [prizePool, setPrizePool] = useState("");
	const [prizeCurrency, setPrizeCurrency] = useState<"USD" | "PEN">("USD");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [registrationUrl, setRegistrationUrl] = useState("");
	const [eventImageUrl, setEventImageUrl] = useState("");
	const [eventType, setEventType] = useState("hackathon");
	const [skillLevel, setSkillLevel] = useState("all");
	const [linksOpen, setLinksOpen] = useState(false);
	const [locationOpen, setLocationOpen] = useState(false);
	const [optionsOpen, setOptionsOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [lumaImportOpen, setLumaImportOpen] = useState(false);
	const [aiExtractOpen, setAiExtractOpen] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [lumaUrl, setLumaUrl] = useState("");
	const [importState, setImportState] = useState<{
		runId: string;
		accessToken: string;
	} | null>(null);
	const [isPending, startTransition] = useTransition();
	const [orgSelectorOpen, setOrgSelectorOpen] = useState(false);
	const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
	const [publishToLuma, setPublishToLuma] = useState(true);
	const [importedFromLuma, setImportedFromLuma] = useState<string | null>(null);

	const creatableOrgs = useMemo(() => {
		const orgs: Array<{ organization: Organization; role: string }> = [];

		if (currentOrg) {
			orgs.push({ organization: currentOrg, role: "owner" });
		}

		if (availableOrganizations) {
			for (const orgWithRole of availableOrganizations) {
				if (orgWithRole.role === "owner" || orgWithRole.role === "admin") {
					if (
						!orgs.some((o) => o.organization.id === orgWithRole.organization.id)
					) {
						orgs.push(orgWithRole);
					}
				}
			}
		}

		return orgs;
	}, [currentOrg, availableOrganizations]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const result = await createEvent({
			name,
			description: description || undefined,
			startDate: startDate ? `${startDate}T${startTime || "00:00"}` : undefined,
			endDate: endDate ? `${endDate}T${endTime || "23:59"}` : undefined,
			format,
			department: department || undefined,
			city: city || undefined,
			venue: venue || undefined,
			timezone: "America/Lima",
			prizePool: prizePool ? parseInt(prizePool, 10) : undefined,
			prizeCurrency,
			websiteUrl: websiteUrl || undefined,
			registrationUrl: registrationUrl || undefined,
			eventImageUrl: eventImageUrl || undefined,
			eventType,
			skillLevel,
			organizationId: communityId,
			country: "PE",
			publishToLuma,
		});

		setLoading(false);

		if (result.success && result.event?.shortCode) {
			router.push(`/e/${result.event.shortCode}`);
		} else {
			setError(result.error || "Error al crear el evento");
		}
	};

	// Use realtime run hook when we have import state
	const { run } = useRealtimeRun<ExtractedData>(importState?.runId || "", {
		accessToken: importState?.accessToken || "",
		enabled: !!importState,
	});

	const metadata = (run?.metadata || {}) as ExtractedData;
	const step = metadata.step;

	// Populate form when extraction is completed
	useEffect(() => {
		if (step === "completed" && metadata.name) {
			// Parse dates to get date and time separately
			const parseDateTime = (dateString?: string) => {
				if (!dateString) return { date: "", time: "" };
				try {
					const date = new Date(dateString);
					const dateStr = date.toISOString().split("T")[0];
					const timeStr = date.toTimeString().slice(0, 5);
					return { date: dateStr, time: timeStr };
				} catch {
					return { date: "", time: "" };
				}
			};

			const start = parseDateTime(metadata.startDate);
			const end = parseDateTime(metadata.endDate);

			// Populate all form fields
			setName(metadata.name);
			if (metadata.description) setDescription(metadata.description);
			if (start.date) setStartDate(start.date);
			if (start.time) setStartTime(start.time);
			if (end.date) setEndDate(end.date);
			if (end.time) setEndTime(end.time);
			if (metadata.venue) setVenue(metadata.venue);
			if (metadata.city) setCity(metadata.city);
			if (metadata.format) setFormat(metadata.format as any);
			if (metadata.eventType) setEventType(metadata.eventType);
			if (metadata.websiteUrl) setWebsiteUrl(metadata.websiteUrl);
			if (metadata.registrationUrl)
				setRegistrationUrl(metadata.registrationUrl);
			if (metadata.eventImageUrl) setEventImageUrl(metadata.eventImageUrl);

			setImportedFromLuma(lumaUrl);
			setPublishToLuma(false);

			setIsImporting(false);
			setImportState(null);
			setLumaUrl("");
		}
	}, [step, metadata]);

	// Handle import errors
	useEffect(() => {
		if (step === "error" && metadata.error) {
			setError(metadata.error);
			setIsImporting(false);
			setImportState(null);
		}
	}, [step, metadata.error]);

	const handleImportFromLuma = () => {
		if (!lumaUrl) return;

		setLumaImportOpen(false);
		setIsImporting(true);

		startTransition(async () => {
			const result = await startLumaImport(lumaUrl, false, communityId);

			if (!result.success) {
				setError(result.error || "Error al iniciar la importación");
				setIsImporting(false);
				return;
			}

			if (result.runId && result.publicAccessToken) {
				setImportState({
					runId: result.runId,
					accessToken: result.publicAccessToken,
				});
			}
		});
	};

	const handleAIExtract = (data: Partial<ExtractedEventData>) => {
		const parseDateTime = (dateString?: string) => {
			if (!dateString) return { date: "", time: "" };
			try {
				const date = new Date(dateString);
				const dateStr = date.toISOString().split("T")[0];
				const timeStr = date.toTimeString().slice(0, 5);
				return { date: dateStr, time: timeStr };
			} catch {
				return { date: "", time: "" };
			}
		};

		if (data.name) setName(data.name);
		if (data.description) setDescription(data.description);

		const start = parseDateTime(data.startDate);
		const end = parseDateTime(data.endDate);

		if (start.date) setStartDate(start.date);
		if (start.time) setStartTime(start.time);
		if (end.date) setEndDate(end.date);
		if (end.time) setEndTime(end.time);

		if (data.venue) setVenue(data.venue);
		if (data.city) setCity(data.city);
		if (data.format) setFormat(data.format);
		if (data.eventType) setEventType(data.eventType);
		if (data.websiteUrl) setWebsiteUrl(data.websiteUrl);
		if (data.registrationUrl) setRegistrationUrl(data.registrationUrl);
		if (data.prizePool) setPrizePool(data.prizePool.toString());
		if (data.prizeCurrency) setPrizeCurrency(data.prizeCurrency);
		if (data.skillLevel) setSkillLevel(data.skillLevel);
	};

	const handleAIStreamStart = () => {
		setIsImporting(true);
	};

	const handleAIStreamEnd = () => {
		setIsImporting(false);
	};

	return (
		<form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4">
			{error && (
				<div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-sm text-red-600">
					{error}
				</div>
			)}

			{/* Header with Back and Import */}
			<div className="mb-6 flex items-center justify-between">
				<Link
					href={`/c/${communitySlug}`}
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
							<ResponsiveModalTitle>Autocompletar</ResponsiveModalTitle>
						</ResponsiveModalHeader>
						<div className="p-4 space-y-3">
							<button
								type="button"
								className="w-full p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
								onClick={() => {
									setImportOpen(false);
									setLumaImportOpen(true);
								}}
							>
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center">
										<LumaIcon className="h-5 w-5 text-background" />
									</div>
									<div>
										<div className="font-medium">Desde Luma</div>
										<div className="text-sm text-muted-foreground">
											Pega el link del evento en lu.ma
										</div>
									</div>
								</div>
							</button>
							<button
								type="button"
								className="w-full p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
								onClick={() => {
									setImportOpen(false);
									setAiExtractOpen(true);
								}}
							>
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
										<Wand2 className="h-5 w-5 text-violet-500" />
									</div>
									<div>
										<div className="font-medium">Desde texto o imagen</div>
										<div className="text-sm text-muted-foreground">
											Pega descripción o sube el flyer
										</div>
									</div>
								</div>
							</button>
						</div>
					</ResponsiveModalContent>
				</ResponsiveModal>

				{/* Luma Import Modal */}
				<ResponsiveModal open={lumaImportOpen} onOpenChange={setLumaImportOpen}>
					<ResponsiveModalContent className="max-w-lg">
						<ResponsiveModalHeader>
							<ResponsiveModalTitle>Desde Luma</ResponsiveModalTitle>
						</ResponsiveModalHeader>
						<div className="p-4 space-y-4">
							<div>
								<Label className="text-sm mb-2 block">
									URL del evento en Luma
								</Label>
								<Input
									type="url"
									value={lumaUrl}
									onChange={(e) => setLumaUrl(e.target.value)}
									placeholder="https://lu.ma/..."
									className="h-9"
								/>
								<p className="text-xs text-muted-foreground mt-2">
									Pega el link del evento de lu.ma que quieres importar
								</p>
							</div>
						</div>
						<ResponsiveModalFooter>
							<ResponsiveModalClose asChild>
								<Button variant="outline" disabled={isPending}>
									Cancelar
								</Button>
							</ResponsiveModalClose>
							<Button
								onClick={handleImportFromLuma}
								disabled={!lumaUrl || isPending}
								className="gap-2"
							>
								{isPending ? (
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

				{/* AI Extract Modal */}
				<AIExtractModal
					open={aiExtractOpen}
					onOpenChange={setAiExtractOpen}
					onExtract={handleAIExtract}
					onStreamStart={handleAIStreamStart}
					onStreamEnd={handleAIStreamEnd}
				/>
			</div>

			<div className="flex flex-col md:flex-row gap-6">
				{/* Left Column - Org Selector + Image */}
				<div className="w-full md:w-72 flex-shrink-0 space-y-3">
					{/* Org Selector */}
					{creatableOrgs.length > 0 && (
						<div>
							<Label className="text-xs text-muted-foreground mb-2 block">
								Publicar en
							</Label>
							<Popover open={orgSelectorOpen} onOpenChange={setOrgSelectorOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={orgSelectorOpen}
										className="w-full justify-between h-auto py-2"
									>
										<div className="flex items-center gap-2">
											{currentOrg?.logoUrl ? (
												<img
													src={currentOrg.logoUrl}
													alt={currentOrg.displayName || currentOrg.name}
													className="h-6 w-6 rounded-md object-cover"
												/>
											) : currentOrg?.isPersonalOrg ? (
												<div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
													<User className="h-3.5 w-3.5 text-muted-foreground" />
												</div>
											) : (
												<div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
													<Building2 className="h-3.5 w-3.5 text-muted-foreground" />
												</div>
											)}
											<span className="truncate">
												{currentOrg?.displayName ||
													currentOrg?.name ||
													communityName}
											</span>
										</div>
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-[--radix-popover-trigger-width] p-0"
									align="start"
								>
									<Command>
										<CommandInput placeholder="Buscar comunidad..." />
										<CommandList>
											<CommandEmpty>No se encontraron comunidades</CommandEmpty>
											<CommandGroup>
												{creatableOrgs.map(({ organization }) => (
													<CommandItem
														key={organization.id}
														value={organization.slug}
														onSelect={(value) => {
															setOrgSelectorOpen(false);
															if (value !== communitySlug) {
																router.push(`/c/${value}/events/new`);
															}
														}}
														className="flex items-center gap-2 py-2"
													>
														{organization.logoUrl ? (
															<img
																src={organization.logoUrl}
																alt={
																	organization.displayName || organization.name
																}
																className="h-6 w-6 rounded-md object-cover"
															/>
														) : organization.isPersonalOrg ? (
															<div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
																<User className="h-3.5 w-3.5 text-muted-foreground" />
															</div>
														) : (
															<div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
																<Building2 className="h-3.5 w-3.5 text-muted-foreground" />
															</div>
														)}
														<div className="flex-1 min-w-0">
															<div className="truncate font-medium">
																{organization.displayName || organization.name}
															</div>
															<div className="text-xs text-muted-foreground truncate">
																{organization.isPersonalOrg
																	? "Tu perfil"
																	: `@${organization.slug}`}
															</div>
														</div>
														{organization.slug === communitySlug && (
															<Check className="h-4 w-4 shrink-0" />
														)}
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
					)}

					{/* Event Type Selector */}
					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							Tipo de evento
						</Label>
						<Popover open={typeSelectorOpen} onOpenChange={setTypeSelectorOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									aria-expanded={typeSelectorOpen}
									className={`w-full justify-between h-auto py-2 ${isImporting ? "input-shimmer" : ""}`}
									disabled={isImporting}
								>
									<div className="flex items-center gap-2">
										{(() => {
											const config = getEventTypeConfig(eventType);
											const Icon = config.icon;
											return (
												<>
													<div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
														<Icon className="h-3.5 w-3.5 text-muted-foreground" />
													</div>
													<span className="truncate">{config.label}</span>
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
											{EVENT_TYPE_LIST.map((type) => {
												const Icon = type.icon;
												return (
													<CommandItem
														key={type.value}
														value={type.value}
														onSelect={(value) => {
															setEventType(value);
															setTypeSelectorOpen(false);
														}}
														className="flex items-center gap-2 py-2"
													>
														<div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
															<Icon className="h-3.5 w-3.5 text-muted-foreground" />
														</div>
														<div className="flex-1 min-w-0">
															<div className="truncate font-medium">
																{type.label}
															</div>
															<div className="text-xs text-muted-foreground truncate">
																{type.description}
															</div>
														</div>
														{type.value === eventType && (
															<Check className="h-4 w-4 shrink-0" />
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

					{/* Image Upload */}
					<div
						className={`w-full aspect-square md:h-72 overflow-hidden bg-muted border border-border rounded-lg ${isImporting ? "input-shimmer" : ""}`}
					>
						{eventImageUrl ? (
							<div className="relative w-full h-full group">
								<img
									src={eventImageUrl}
									alt="Event"
									className="w-full h-full object-cover"
								/>
								<button
									type="button"
									onClick={() => setEventImageUrl("")}
									className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
									disabled={isImporting}
								>
									<span className="text-white text-xs">Cambiar</span>
								</button>
							</div>
						) : (
							<ImageUpload
								value={eventImageUrl}
								onChange={setEventImageUrl}
								className="w-full h-full"
								aspectRatio="square"
								disabled={isImporting}
							/>
						)}
					</div>
				</div>

				{/* Right Column - Form */}
				<div className="flex-1 space-y-3">
					{/* Title */}
					<textarea
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						placeholder="Nombre del evento"
						rows={2}
						className={`w-full text-2xl font-semibold bg-transparent border-none outline-none focus:outline-none placeholder:text-muted-foreground/40 p-0 resize-none ${isImporting ? "input-shimmer" : ""}`}
						disabled={isImporting}
					/>

					{/* Dates & Time */}
					<div className="border border-border rounded-lg overflow-hidden">
						{/* Start */}
						<div className="p-3 flex items-center gap-3">
							<div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
							<Label className="text-sm text-muted-foreground w-12">
								Inicio
							</Label>
							<Input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className={`h-8 text-sm flex-1 ${isImporting ? "input-shimmer" : ""}`}
								disabled={isImporting}
							/>
							<Input
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								className={`h-8 text-sm w-24 ${isImporting ? "input-shimmer" : ""}`}
								disabled={isImporting}
							/>
						</div>

						<div className="border-t border-border" />

						{/* End */}
						<div className="p-3 flex items-center gap-3">
							<div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
							<Label className="text-sm text-muted-foreground w-12">Fin</Label>
							<Input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className={`h-8 text-sm flex-1 ${isImporting ? "input-shimmer" : ""}`}
								disabled={isImporting}
							/>
							<Input
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								className={`h-8 text-sm w-24 ${isImporting ? "input-shimmer" : ""}`}
								disabled={isImporting}
							/>
						</div>
					</div>

					{/* Description Button */}
					<ResponsiveModal
						open={descriptionOpen}
						onOpenChange={setDescriptionOpen}
					>
						<ResponsiveModalTrigger asChild>
							<button
								type="button"
								className={`w-full border border-border rounded-lg p-3 text-left flex items-start gap-2 hover:bg-muted/50 transition-colors ${isImporting ? "input-shimmer" : ""}`}
								disabled={isImporting}
							>
								<FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
								<div className="flex-1 min-w-0">
									<div className="text-xs text-muted-foreground mb-1">
										Event Description
									</div>
									{description ? (
										<div className="text-sm line-clamp-2 prose prose-sm max-w-none">
											<Markdown
												components={{
													h2: ({ children }) => (
														<span className="font-semibold">{children}</span>
													),
													h3: ({ children }) => (
														<span className="font-medium">{children}</span>
													),
													p: ({ children }) => <span>{children}</span>,
													ul: ({ children }) => <span>{children}</span>,
													li: ({ children }) => <span>• {children}</span>,
													strong: ({ children }) => <strong>{children}</strong>,
													a: ({ children }) => <span>{children}</span>,
												}}
											>
												{description}
											</Markdown>
										</div>
									) : (
										<div className="text-sm text-muted-foreground">
											Describe tu evento...
										</div>
									)}
								</div>
							</button>
						</ResponsiveModalTrigger>
						<ResponsiveModalContent className="max-w-2xl max-h-[80vh]">
							<ResponsiveModalHeader>
								<ResponsiveModalTitle>
									Descripción del evento
								</ResponsiveModalTitle>
							</ResponsiveModalHeader>
							<div className="p-4">
								<Textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={12}
									placeholder="Describe tu evento... Puedes usar Markdown."
									className="w-full min-h-[300px]"
								/>
							</div>
							<ResponsiveModalFooter>
								<ResponsiveModalClose asChild>
									<Button>Guardar</Button>
								</ResponsiveModalClose>
							</ResponsiveModalFooter>
						</ResponsiveModalContent>
					</ResponsiveModal>

					{/* Location Button */}
					<ResponsiveModal open={locationOpen} onOpenChange={setLocationOpen}>
						<ResponsiveModalTrigger asChild>
							<button
								type="button"
								className={`w-full border border-border rounded-lg p-3 text-left flex items-start gap-2 hover:bg-muted/50 transition-colors ${isImporting ? "input-shimmer" : ""}`}
								disabled={isImporting}
							>
								<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
								<div className="flex-1">
									<div className="text-xs text-muted-foreground mb-1">
										Ubicación
									</div>
									<div className="text-sm">
										{format === "in-person"
											? venue || city || "Presencial"
											: format === "virtual"
												? "Virtual"
												: "Híbrido"}
									</div>
								</div>
							</button>
						</ResponsiveModalTrigger>
						<ResponsiveModalContent className="max-w-2xl">
							<ResponsiveModalHeader>
								<ResponsiveModalTitle>
									Ubicación del evento
								</ResponsiveModalTitle>
							</ResponsiveModalHeader>
							<div className="p-4 space-y-4">
								<div>
									<Label className="text-sm mb-2 block">Formato</Label>
									<div className="flex gap-2">
										{["in-person", "virtual", "hybrid"].map((f) => (
											<button
												key={f}
												type="button"
												onClick={() => setFormat(f as any)}
												className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
													format === f
														? "bg-foreground text-background"
														: "bg-muted hover:bg-muted/80"
												}`}
											>
												{f === "in-person"
													? "Presencial"
													: f === "virtual"
														? "Virtual"
														: "Híbrido"}
											</button>
										))}
									</div>
								</div>

								{format !== "virtual" && (
									<div className="space-y-3">
										<div>
											<Label className="text-sm mb-2 block">
												Lugar o link virtual
											</Label>
											<Input
												type="text"
												value={venue}
												onChange={(e) => setVenue(e.target.value)}
												placeholder="Ej: Universidad Nacional, Zoom link, etc."
												className="h-9"
											/>
										</div>
										<div className="grid grid-cols-2 gap-3">
											<div>
												<Label className="text-sm mb-2 block">Ciudad</Label>
												<Input
													type="text"
													value={city}
													onChange={(e) => setCity(e.target.value)}
													placeholder="Lima"
													className="h-9"
												/>
											</div>
											<div>
												<Label className="text-sm mb-2 block">Región</Label>
												<Input
													type="text"
													value={department}
													onChange={(e) => setDepartment(e.target.value)}
													placeholder="Lima"
													className="h-9"
												/>
											</div>
										</div>
									</div>
								)}
							</div>
							<ResponsiveModalFooter>
								<ResponsiveModalClose asChild>
									<Button>Guardar</Button>
								</ResponsiveModalClose>
							</ResponsiveModalFooter>
						</ResponsiveModalContent>
					</ResponsiveModal>

					{/* Event Options Button - Only show if type has options */}
					{hasEventOptions(eventType) && (
						<ResponsiveModal open={optionsOpen} onOpenChange={setOptionsOpen}>
							<ResponsiveModalTrigger asChild>
								<button
									type="button"
									className={`w-full border border-border rounded-lg p-3 text-left flex items-start gap-2 hover:bg-muted/50 transition-colors ${isImporting ? "input-shimmer" : ""}`}
									disabled={isImporting}
								>
									<DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
									<div className="flex-1">
										<div className="text-xs text-muted-foreground mb-1">
											Opciones adicionales
										</div>
										<div className="text-sm">
											{(() => {
												const config = getEventTypeConfig(eventType);
												const parts: string[] = [];
												if (config.showSkillLevel) {
													parts.push(
														SKILL_LEVEL_OPTIONS.find(
															(opt) => opt.value === skillLevel,
														)?.label || "Todos los niveles",
													);
												}
												if (config.showPrize && prizePool) {
													parts.push(
														`${prizeCurrency === "PEN" ? "S/" : "$"}${prizePool}`,
													);
												} else if (config.showPrize) {
													parts.push("Sin premio definido");
												}
												return parts.join(" • ") || "Configurar";
											})()}
										</div>
									</div>
								</button>
							</ResponsiveModalTrigger>
							<ResponsiveModalContent className="max-w-lg">
								<ResponsiveModalHeader>
									<ResponsiveModalTitle>
										Opciones adicionales
									</ResponsiveModalTitle>
								</ResponsiveModalHeader>
								<div className="p-4 space-y-4">
									{/* Skill Level - only for training types */}
									{getEventTypeConfig(eventType).showSkillLevel && (
										<div>
											<Label className="text-sm mb-2 block">
												Nivel de habilidad
											</Label>
											<SearchableSelect
												options={SKILL_LEVEL_OPTIONS}
												value={skillLevel}
												onValueChange={setSkillLevel}
												placeholder="Seleccionar nivel"
												searchPlaceholder="Buscar nivel..."
												emptyMessage="No se encontró"
												className="h-9"
											/>
										</div>
									)}

									{/* Prize - only for competition types */}
									{getEventTypeConfig(eventType).showPrize && (
										<div>
											<Label className="text-sm mb-2 flex items-center gap-1.5">
												<DollarSign className="h-4 w-4" />
												Premio
											</Label>
											<div className="flex gap-2">
												<SearchableSelect
													options={[
														{
															value: "USD",
															label: "USD",
															description: "Dólares",
														},
														{
															value: "PEN",
															label: "PEN",
															description: "Soles",
														},
													]}
													value={prizeCurrency}
													onValueChange={(val) =>
														setPrizeCurrency(val as "USD" | "PEN")
													}
													placeholder="USD"
													searchPlaceholder="Buscar..."
													emptyMessage="No se encontró"
													className="h-9 w-24"
												/>
												<Input
													type="number"
													value={prizePool}
													onChange={(e) => setPrizePool(e.target.value)}
													placeholder="0"
													className="flex-1 h-9"
												/>
											</div>
										</div>
									)}
								</div>
								<ResponsiveModalFooter>
									<ResponsiveModalClose asChild>
										<Button>Guardar</Button>
									</ResponsiveModalClose>
								</ResponsiveModalFooter>
							</ResponsiveModalContent>
						</ResponsiveModal>
					)}

					{/* Links Button */}
					<ResponsiveModal open={linksOpen} onOpenChange={setLinksOpen}>
						<ResponsiveModalTrigger asChild>
							{websiteUrl || registrationUrl ? (
								<button
									type="button"
									className={`w-full border border-border rounded-lg p-3 text-left flex items-start gap-2 hover:bg-muted/50 transition-colors ${isImporting ? "input-shimmer" : ""}`}
									disabled={isImporting}
								>
									<Link2 className="h-4 w-4 text-muted-foreground mt-0.5" />
									<div className="flex-1 min-w-0">
										<div className="text-xs text-muted-foreground mb-1">
											Enlaces
										</div>
										<div className="text-sm grid grid-cols-2 gap-x-3">
											{websiteUrl && (
												<div className="flex items-center gap-1.5 min-w-0">
													<Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
													<span className="truncate">
														{websiteUrl.replace(/^https?:\/\//, "")}
													</span>
												</div>
											)}
											{registrationUrl && (
												<div className="flex items-center gap-1.5 min-w-0">
													<Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
													<span className="truncate">
														{registrationUrl.replace(/^https?:\/\//, "")}
													</span>
												</div>
											)}
										</div>
									</div>
								</button>
							) : (
								<Button
									type="button"
									variant="outline"
									className={`w-full justify-start text-muted-foreground gap-2 h-9 ${isImporting ? "input-shimmer" : ""}`}
									disabled={isImporting}
								>
									<Link2 className="h-4 w-4" />
									Agregar enlaces (opcional)
								</Button>
							)}
						</ResponsiveModalTrigger>
						<ResponsiveModalContent className="max-w-2xl">
							<ResponsiveModalHeader>
								<ResponsiveModalTitle>Enlaces del evento</ResponsiveModalTitle>
							</ResponsiveModalHeader>
							<div className="p-4 space-y-4">
								<div>
									<Label className="text-sm flex items-center gap-1.5 mb-2">
										<Globe className="h-3.5 w-3.5" />
										Sitio web
									</Label>
									<Input
										type="url"
										value={websiteUrl}
										onChange={(e) => setWebsiteUrl(e.target.value)}
										placeholder="https://..."
										className="h-9"
									/>
								</div>
								<div>
									<Label className="text-sm flex items-center gap-1.5 mb-2">
										<Link2 className="h-3.5 w-3.5" />
										Registro
									</Label>
									<Input
										type="url"
										value={registrationUrl}
										onChange={(e) => setRegistrationUrl(e.target.value)}
										placeholder="https://..."
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

					{/* Luma Integration */}
					{importedFromLuma ? (
						<div className="flex items-center justify-between py-3 px-3 border border-border rounded-lg bg-muted/30">
							<div className="flex items-center gap-3">
								<LumaIcon className="h-5 w-5" />
								<div>
									<div className="text-sm font-medium flex items-center gap-1.5">
										Vinculado a Luma
									</div>
									<div className="text-xs text-muted-foreground truncate max-w-[180px]">
										{importedFromLuma.replace("https://", "")}
									</div>
								</div>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-xs text-muted-foreground hover:text-foreground"
								onClick={() => {
									setImportedFromLuma(null);
									setPublishToLuma(true);
								}}
							>
								Desvincular
							</Button>
						</div>
					) : (
						<div className="flex items-center justify-between py-3 px-3 border border-border rounded-lg">
							<div className="flex items-center gap-3">
								<LumaIcon className="h-5 w-5" />
								<div>
									<div className="text-sm font-medium">Publicar en Luma</div>
									<div className="text-xs text-muted-foreground">
										Se creará también en lu.ma/hack0
									</div>
								</div>
							</div>
							<Switch
								checked={publishToLuma}
								onCheckedChange={setPublishToLuma}
								disabled={isImporting}
							/>
						</div>
					)}

					{/* Submit */}
					<Button
						type="submit"
						disabled={loading || !name || isImporting}
						className={`w-full h-10 text-sm gap-2 ${isImporting ? "input-shimmer" : ""}`}
					>
						{(loading || isImporting) && (
							<Loader2 className="h-4 w-4 animate-spin" />
						)}
						{isImporting ? "Autocompletando..." : "Crear Evento"}
					</Button>
				</div>
			</div>
		</form>
	);
}
