"use client";

import { type Tag, TagInput } from "emblor";
import {
	Check,
	ChevronsUpDown,
	Globe,
	Link2,
	Loader2,
	Mail,
	Save,
	Tags,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LocationSelector } from "@/components/communities/location-selector";
import { GithubLogo } from "@/components/logos/github";
import { InstagramLogo } from "@/components/logos/instagram";
import { LinkedinLogo } from "@/components/logos/linkedin";
import { TwitterLogo } from "@/components/logos/twitter";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { ImageUpload } from "@/components/ui/image-upload";
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
	ResponsiveModalDescription,
	ResponsiveModalFooter,
	ResponsiveModalHeader,
	ResponsiveModalInset,
	ResponsiveModalTitle,
	ResponsiveModalTrigger,
} from "@/components/ui/responsive-modal";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganizationById } from "@/lib/actions/organizations";
import type { Organization } from "@/lib/db/schema";
import {
	getOrganizerTypeConfig,
	ORGANIZER_TYPE_LIST,
} from "@/lib/organizer-type-config";

interface CommunitySettingsFormProps {
	organization: Organization;
}

export function CommunitySettingsForm({
	organization,
}: CommunitySettingsFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [name, setName] = useState(organization.name);
	const [description, setDescription] = useState(
		organization.description || "",
	);
	const [type, setType] = useState(organization.type || "community");
	const [logoUrl, setLogoUrl] = useState(organization.logoUrl || "");
	const [coverUrl, setCoverUrl] = useState(organization.coverUrl || "");
	const [websiteUrl, setWebsiteUrl] = useState(organization.websiteUrl || "");
	const [country, setCountry] = useState(organization.country || "");
	const [department, setDepartment] = useState(organization.department || "");
	const [twitterUrl, setTwitterUrl] = useState(organization.twitterUrl || "");
	const [linkedinUrl, setLinkedinUrl] = useState(
		organization.linkedinUrl || "",
	);
	const [instagramUrl, setInstagramUrl] = useState(
		organization.instagramUrl || "",
	);
	const [githubUrl, setGithubUrl] = useState(organization.githubUrl || "");
	const [email, setEmail] = useState(organization.email || "");
	const [tags, setTags] = useState<Tag[]>(
		(organization.tags || []).map((t) => ({ id: t, text: t })),
	);
	const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

	const nameTextareaRef = useRef<HTMLTextAreaElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: name is needed to recalculate height on text change
	useEffect(() => {
		const textarea = nameTextareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${textarea.scrollHeight}px`;
		}
	}, [name]);

	const [descriptionOpen, setDescriptionOpen] = useState(false);
	const [linksOpen, setLinksOpen] = useState(false);
	const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);
		setSuccess(false);

		try {
			await updateOrganizationById(organization.id, {
				name,
				description: description || undefined,
				type: type as any,
				websiteUrl: websiteUrl || undefined,
				logoUrl: logoUrl || undefined,
				coverUrl: coverUrl || undefined,
				country: country || undefined,
				department: department || undefined,
				twitterUrl: twitterUrl || undefined,
				linkedinUrl: linkedinUrl || undefined,
				instagramUrl: instagramUrl || undefined,
				githubUrl: githubUrl || undefined,
				email: email || undefined,
				tags: tags.length > 0 ? tags.map((t) => t.text) : undefined,
			});

			setSuccess(true);
			router.refresh();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al actualizar la comunidad",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const hasLinks =
		websiteUrl ||
		email ||
		twitterUrl ||
		linkedinUrl ||
		instagramUrl ||
		githubUrl;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				</div>
			)}

			{success && (
				<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
					<p className="text-sm text-emerald-600 dark:text-emerald-400">
						✓ Comunidad actualizada correctamente
					</p>
				</div>
			)}

			<div>
				<Label className="text-xs text-muted-foreground mb-2 block">
					Imagen de portada
				</Label>
				<div className="relative aspect-[3/1] md:aspect-[4/1] rounded-xl overflow-hidden border border-border bg-muted">
					{coverUrl ? (
						<div className="relative w-full h-full group">
							<img
								src={coverUrl}
								alt="Cover"
								className="w-full h-full object-cover"
							/>
							<button
								type="button"
								onClick={() => setCoverUrl("")}
								className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
							>
								<span className="text-white text-sm">Cambiar portada</span>
							</button>
						</div>
					) : (
						<ImageUpload
							value={coverUrl}
							onChange={setCoverUrl}
							className="w-full h-full"
							aspectRatio="banner"
						/>
					)}
				</div>
			</div>

			<div className="flex flex-col md:flex-row gap-6">
				<div className="w-full md:w-56 flex-shrink-0 space-y-3">
					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							Tipo de organización
						</Label>
						<Popover open={typeSelectorOpen} onOpenChange={setTypeSelectorOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									className="w-full justify-between h-auto py-2.5 px-3"
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
									<CommandList>
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

					<div className="w-full aspect-square overflow-hidden bg-muted border border-border rounded-lg">
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
							/>
						)}
					</div>
				</div>

				<div className="flex-1 space-y-3">
					<textarea
						ref={nameTextareaRef}
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						placeholder="Nombre de la comunidad"
						rows={1}
						className="w-full text-2xl font-semibold bg-transparent border-none outline-none focus:outline-none placeholder:text-muted-foreground/40 p-0 resize-none overflow-hidden"
					/>

					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							URL de la comunidad
						</Label>
						<ButtonGroup className="w-full [&>*]:!rounded-none">
							<ButtonGroupText asChild className="!rounded-none px-2">
								<Label>hack0.dev/c/</Label>
							</ButtonGroupText>
							<InputGroup className="flex-1 !rounded-none">
								<InputGroupInput
									value={organization.slug}
									disabled
									className="bg-muted"
								/>
							</InputGroup>
						</ButtonGroup>
						<p className="text-xs text-muted-foreground mt-1">
							El slug no se puede cambiar
						</p>
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
								<ButtonGroup className="w-full [&>*]:!rounded-none cursor-pointer">
									<ButtonGroupText className="!rounded-none">
										<Globe className="h-4 w-4" />
									</ButtonGroupText>
									<button
										type="button"
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
							<ResponsiveModalContent className="max-w-lg">
								<ResponsiveModalHeader>
									<ResponsiveModalTitle>Descripción</ResponsiveModalTitle>
									<ResponsiveModalDescription>
										Escribe una descripción que ayude a los visitantes a
										entender de qué trata tu comunidad.
									</ResponsiveModalDescription>
								</ResponsiveModalHeader>
								<ResponsiveModalInset>
									<Textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										rows={6}
										placeholder="Describe tu comunidad..."
										className="w-full min-h-[150px] resize-none"
									/>
								</ResponsiveModalInset>
								<ResponsiveModalFooter>
									<ResponsiveModalClose asChild>
										<Button variant="outline">Cancelar</Button>
									</ResponsiveModalClose>
									<ResponsiveModalClose asChild>
										<Button>Guardar</Button>
									</ResponsiveModalClose>
								</ResponsiveModalFooter>
							</ResponsiveModalContent>
						</ResponsiveModal>
					</div>

					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							Etiquetas
						</Label>
						<ButtonGroup className="w-full [&>*]:!rounded-none">
							<ButtonGroupText className="!rounded-none">
								<Tags className="h-4 w-4" />
							</ButtonGroupText>
							<div className="flex-1 border shadow-xs bg-background transition-colors focus-within:border-foreground/30 py-1 px-3">
								<TagInput
									placeholder="Añadir etiqueta..."
									tags={tags}
									setTags={(newTags) => setTags(newTags as Tag[])}
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
							Ubicación
						</Label>
						<LocationSelector
							country={country}
							onCountryChange={setCountry}
							region={department}
							onRegionChange={setDepartment}
						/>
					</div>

					<div>
						<Label className="text-xs text-muted-foreground mb-2 block">
							Redes sociales
						</Label>
						<ResponsiveModal open={linksOpen} onOpenChange={setLinksOpen}>
							<ResponsiveModalTrigger asChild>
								<ButtonGroup className="w-full [&>*]:!rounded-none cursor-pointer">
									<ButtonGroupText className="!rounded-none">
										<Link2 className="h-4 w-4" />
									</ButtonGroupText>
									<button
										type="button"
										className="flex-1 border shadow-xs bg-background text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
									>
										{hasLinks ? (
											<span className="flex items-center gap-3 text-foreground">
												{websiteUrl && <Globe className="h-4 w-4" />}
												{email && <Mail className="h-4 w-4" />}
												{twitterUrl && <TwitterLogo className="h-4 w-4" />}
												{linkedinUrl && (
													<LinkedinLogo
														className="h-4 w-4"
														mode="currentColor"
													/>
												)}
												{instagramUrl && (
													<InstagramLogo
														className="h-4 w-4"
														mode="currentColor"
													/>
												)}
												{githubUrl && (
													<GithubLogo className="h-4 w-4" mode="currentColor" />
												)}
											</span>
										) : (
											<span className="text-muted-foreground">
												Agregar redes sociales...
											</span>
										)}
									</button>
								</ButtonGroup>
							</ResponsiveModalTrigger>
							<ResponsiveModalContent className="max-w-lg">
								<ResponsiveModalHeader>
									<ResponsiveModalTitle>Redes sociales</ResponsiveModalTitle>
									<ResponsiveModalDescription>
										Agrega los enlaces a tus redes sociales para que tu
										comunidad pueda encontrarte.
									</ResponsiveModalDescription>
								</ResponsiveModalHeader>
								<ResponsiveModalInset>
									<div className="space-y-4">
										<div className="space-y-2">
											<Label className="text-sm">Sitio web</Label>
											<ButtonGroup className="w-full [&>*]:!rounded-none">
												<ButtonGroupText className="!rounded-none">
													<Globe className="h-4 w-4" />
												</ButtonGroupText>
												<InputGroup className="flex-1 !rounded-none">
													<InputGroupInput
														type="url"
														value={websiteUrl}
														onChange={(e) => setWebsiteUrl(e.target.value)}
														placeholder="https://..."
													/>
												</InputGroup>
											</ButtonGroup>
										</div>
										<div className="space-y-2">
											<Label className="text-sm">Correo de contacto</Label>
											<ButtonGroup className="w-full [&>*]:!rounded-none">
												<ButtonGroupText className="!rounded-none">
													<Mail className="h-4 w-4" />
												</ButtonGroupText>
												<InputGroup className="flex-1 !rounded-none">
													<InputGroupInput
														type="email"
														value={email}
														onChange={(e) => setEmail(e.target.value)}
														placeholder="contacto@comunidad.com"
													/>
												</InputGroup>
											</ButtonGroup>
										</div>
										<div className="space-y-2">
											<Label className="text-sm">Twitter / X</Label>
											<ButtonGroup className="w-full [&>*]:!rounded-none">
												<ButtonGroupText className="!rounded-none text-foreground">
													<TwitterLogo className="h-4 w-4" />
												</ButtonGroupText>
												<InputGroup className="flex-1 !rounded-none">
													<InputGroupInput
														type="url"
														value={twitterUrl}
														onChange={(e) => setTwitterUrl(e.target.value)}
														placeholder="https://x.com/..."
													/>
												</InputGroup>
											</ButtonGroup>
										</div>
										<div className="space-y-2">
											<Label className="text-sm">LinkedIn</Label>
											<ButtonGroup className="w-full [&>*]:!rounded-none">
												<ButtonGroupText className="!rounded-none text-foreground">
													<LinkedinLogo
														className="h-4 w-4"
														mode="currentColor"
													/>
												</ButtonGroupText>
												<InputGroup className="flex-1 !rounded-none">
													<InputGroupInput
														type="url"
														value={linkedinUrl}
														onChange={(e) => setLinkedinUrl(e.target.value)}
														placeholder="https://linkedin.com/company/..."
													/>
												</InputGroup>
											</ButtonGroup>
										</div>
										<div className="space-y-2">
											<Label className="text-sm">Instagram</Label>
											<ButtonGroup className="w-full [&>*]:!rounded-none">
												<ButtonGroupText className="!rounded-none text-foreground">
													<InstagramLogo
														className="h-4 w-4"
														mode="currentColor"
													/>
												</ButtonGroupText>
												<InputGroup className="flex-1 !rounded-none">
													<InputGroupInput
														type="url"
														value={instagramUrl}
														onChange={(e) => setInstagramUrl(e.target.value)}
														placeholder="https://instagram.com/..."
													/>
												</InputGroup>
											</ButtonGroup>
										</div>
										<div className="space-y-2">
											<Label className="text-sm">GitHub</Label>
											<ButtonGroup className="w-full [&>*]:!rounded-none">
												<ButtonGroupText className="!rounded-none text-foreground">
													<GithubLogo className="h-4 w-4" mode="currentColor" />
												</ButtonGroupText>
												<InputGroup className="flex-1 !rounded-none">
													<InputGroupInput
														type="url"
														value={githubUrl}
														onChange={(e) => setGithubUrl(e.target.value)}
														placeholder="https://github.com/..."
													/>
												</InputGroup>
											</ButtonGroup>
										</div>
									</div>
								</ResponsiveModalInset>
								<ResponsiveModalFooter>
									<ResponsiveModalClose asChild>
										<Button variant="outline">Cancelar</Button>
									</ResponsiveModalClose>
									<ResponsiveModalClose asChild>
										<Button>Guardar</Button>
									</ResponsiveModalClose>
								</ResponsiveModalFooter>
							</ResponsiveModalContent>
						</ResponsiveModal>
					</div>

					<Button
						type="submit"
						disabled={isSubmitting || !name}
						className="w-full h-10 text-sm gap-2"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Guardando...
							</>
						) : (
							<>
								<Save className="h-4 w-4" />
								Guardar cambios
							</>
						)}
					</Button>
				</div>
			</div>
		</form>
	);
}
