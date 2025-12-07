import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Markdown from "react-markdown";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	ArrowUpRight,
	BadgeCheck,
	Clock,
	ExternalLink,
	Globe,
	GraduationCap,
	Sparkles,
	Calendar,
	MapPin,
	Building2,
} from "lucide-react";
import { TrophyIcon } from "@/components/icons/trophy";
import { CalendarIcon } from "@/components/icons/calendar";
import { WinnerSection } from "@/components/hackathons/winner-section";
import { OrganizerClaimSection } from "@/components/hackathons/organizer-claim-section";
import { EditEventButton } from "@/components/hackathons/edit-event-button";
import { notFound } from "next/navigation";
import { getHackathonBySlug, getChildEvents, getEventSponsors } from "@/lib/actions/hackathons";
import { SPONSOR_TIER_LABELS } from "@/lib/db/schema";
import {
	formatEventDate,
	getDomainLabel,
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
	getOrganizerTypeLabel,
	getSkillLevelLabel,
	isDateInFuture,
} from "@/lib/event-utils";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

interface HackathonPageProps {
	params: Promise<{ slug: string }>;
}

function stripMarkdown(text: string): string {
	return text
		.replace(/#{1,6}\s?/g, "")
		.replace(/\*\*([^*]+)\*\*/g, "$1")
		.replace(/\*([^*]+)\*/g, "$1")
		.replace(/-\s/g, "")
		.replace(/\n+/g, " ")
		.trim();
}

export async function generateMetadata({
	params,
}: HackathonPageProps): Promise<Metadata> {
	const { slug } = await params;
	const hackathon = await getHackathonBySlug(slug);

	if (!hackathon) {
		return {
			title: "Evento no encontrado",
		};
	}

	const title = `${hackathon.name} - ${getEventTypeLabel(hackathon.eventType)} en Perú`;
	const description = hackathon.description
		? stripMarkdown(hackathon.description).slice(0, 160)
		: `${getEventTypeLabel(hackathon.eventType)} ${hackathon.format === "virtual" ? "virtual" : `en ${hackathon.city || "Perú"}`}. ${hackathon.prizePool ? `Premio: ${hackathon.prizeCurrency === "PEN" ? "S/" : "$"}${hackathon.prizePool.toLocaleString()}` : ""}`;

	const ogImageUrl = `https://hack0.dev/api/og?slug=${hackathon.slug}`;

	return {
		title,
		description,
		keywords: [
			hackathon.name,
			getEventTypeLabel(hackathon.eventType),
			"peru",
			hackathon.city || "",
			...(hackathon.domains || []).map((d) => getDomainLabel(d)),
			"hackathon peru",
			"eventos tech peru",
		].filter(Boolean),
		openGraph: {
			title,
			description,
			type: "website",
			url: `https://hack0.dev/${hackathon.slug}`,
			images: [{ url: ogImageUrl, width: 1200, height: 630, alt: hackathon.name }],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [ogImageUrl],
		},
		alternates: {
			canonical: `https://hack0.dev/${hackathon.slug}`,
		},
	};
}

export default async function HackathonPage({ params }: HackathonPageProps) {
	const { slug } = await params;
	const hackathon = await getHackathonBySlug(slug);

	if (!hackathon) {
		notFound();
	}

	const [childEvents, eventSponsors] = await Promise.all([
		getChildEvents(hackathon.id),
		getEventSponsors(hackathon.id),
	]);

	const hasChildEvents = childEvents.length > 0;
	const hasSponsors = eventSponsors.length > 0;

	const status = getEventStatus(hackathon);
	const isEnded = status.status === "ended";
	const isOngoing = status.status === "ongoing";
	const isOpen = status.status === "open";

	const startDate = hackathon.startDate ? new Date(hackathon.startDate) : null;
	const endDate = hackathon.endDate ? new Date(hackathon.endDate) : null;
	const deadline = hackathon.registrationDeadline
		? new Date(hackathon.registrationDeadline)
		: null;

	const stripePattern = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23888' fill-opacity='0.15'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`;

	const breadcrumbJsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "Inicio",
				item: "https://hack0.dev",
			},
			{
				"@type": "ListItem",
				position: 2,
				name: hackathon.name,
				item: `https://hack0.dev/${hackathon.slug}`,
			},
		],
	};

	const eventJsonLd = {
		"@context": "https://schema.org",
		"@type": "Event",
		name: hackathon.name,
		description: hackathon.description
			? stripMarkdown(hackathon.description).slice(0, 300)
			: `${getEventTypeLabel(hackathon.eventType)} en Perú`,
		startDate: startDate?.toISOString(),
		endDate: endDate?.toISOString(),
		eventStatus: "https://schema.org/EventScheduled",
		eventAttendanceMode:
			hackathon.format === "virtual"
				? "https://schema.org/OnlineEventAttendanceMode"
				: hackathon.format === "hybrid"
					? "https://schema.org/MixedEventAttendanceMode"
					: "https://schema.org/OfflineEventAttendanceMode",
		location:
			hackathon.format === "virtual"
				? {
						"@type": "VirtualLocation",
						url: hackathon.websiteUrl || hackathon.registrationUrl,
					}
				: {
						"@type": "Place",
						name: hackathon.venue || hackathon.city || "Perú",
						address: {
							"@type": "PostalAddress",
							addressLocality: hackathon.city,
							addressRegion: hackathon.department,
							addressCountry: "PE",
						},
					},
		image: hackathon.eventImageUrl,
		url: `https://hack0.dev/${hackathon.slug}`,
		organizer: hackathon.organizerName
			? {
					"@type": "Organization",
					name: hackathon.organizerName,
					url: hackathon.organizerUrl,
				}
			: undefined,
		offers:
			hackathon.prizePool && hackathon.prizePool > 0
				? {
						"@type": "Offer",
						price: "0",
						priceCurrency: "USD",
						availability: isEnded
							? "https://schema.org/SoldOut"
							: "https://schema.org/InStock",
						url: hackathon.registrationUrl,
					}
				: undefined,
	};

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
			/>
			<SiteHeader showBackButton />

			<main className="flex-1 w-full">
				{/* Mobile Hero Image - full width square at top */}
				<div className="md:hidden relative w-full aspect-square overflow-hidden bg-muted">
					{hackathon.eventImageUrl ? (
						<Image
							src={hackathon.eventImageUrl}
							alt={hackathon.name}
							width={600}
							height={600}
							className="w-full h-full object-cover"
							priority
						/>
					) : (
						<div
							className="w-full h-full"
							style={{
								backgroundImage: stripePattern,
								backgroundSize: "40px 40px",
							}}
						/>
					)}
					{/* Edit button - mobile only, positioned on image */}
					<div className="absolute top-3 right-3">
						<EditEventButton event={hackathon} />
					</div>
				</div>

				{/* Hero Section */}
				<section className="mx-auto max-w-screen-xl px-4 py-6 md:py-12">
					<div className="grid md:grid-cols-[240px_1fr] gap-6 md:gap-8">
						{/* Event Image - hidden on mobile */}
						<div className="hidden md:block">
							<div className="aspect-square w-full rounded-2xl overflow-hidden bg-muted border border-border">
								{hackathon.eventImageUrl ? (
									<Image
										src={hackathon.eventImageUrl}
										alt={hackathon.name}
										width={240}
										height={240}
										className="w-full h-full object-cover"
									/>
								) : (
									<div
										className="w-full h-full"
										style={{
											backgroundImage: stripePattern,
											backgroundSize: "40px 40px",
										}}
									/>
								)}
							</div>
						</div>

						{/* Info Column */}
						<div className="space-y-4">
							{/* Title + Edit */}
							<div className="flex items-start justify-between gap-4">
								<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
									{hackathon.name}
								</h1>
								<div className="hidden md:block">
									<EditEventButton event={hackathon} />
								</div>
							</div>

							{/* Date with Calendar Card */}
							{startDate && (
								<div className="flex items-center gap-4">
									<div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-muted border border-border shrink-0">
										<span className="text-[10px] uppercase font-medium text-muted-foreground leading-none">
											{format(startDate, "MMM", { locale: es })}
										</span>
										<span className="text-xl font-bold leading-none mt-0.5">
											{format(startDate, "d")}
										</span>
									</div>
									<div>
										<p className="font-medium">
											{format(startDate, "EEEE, d 'de' MMMM", { locale: es })}
											{endDate && startDate.toDateString() !== endDate.toDateString() && (
												<span className="text-muted-foreground">
													{" "}– {format(endDate, "d 'de' MMMM", { locale: es })}
												</span>
											)}
										</p>
										<p className="text-sm text-muted-foreground">
											{format(startDate, "h:mm a", { locale: es })}
											{endDate && (
												<> – {format(endDate, "h:mm a", { locale: es })}</>
											)}
											{hackathon.timezone && (
												<span className="text-muted-foreground/60"> · {hackathon.timezone}</span>
											)}
										</p>
									</div>
								</div>
							)}

							{/* Location */}
							<div className="flex items-start gap-2 text-muted-foreground">
								<MapPin className="h-4 w-4 mt-0.5 shrink-0" />
								<div>
									{hackathon.venue && (
										<p className="text-foreground">{hackathon.venue}</p>
									)}
									<p className={hackathon.venue ? "text-sm" : "text-foreground"}>
										{hackathon.city}
										{hackathon.city && hackathon.department && hackathon.city !== hackathon.department && `, ${hackathon.department}`}
										{!hackathon.city && !hackathon.venue && getFormatLabel(hackathon.format, hackathon.department)}
										{(hackathon.city || hackathon.venue) && `, ${getFormatLabel(hackathon.format)}`}
									</p>
								</div>
							</div>

							{/* Status + Tags row */}
							<div className="flex flex-wrap items-center gap-2">
								<span
									className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
										isEnded
											? "bg-muted text-muted-foreground"
											: isOngoing
											? "bg-emerald-500/10 text-emerald-500"
											: isOpen
											? "bg-blue-500/10 text-blue-500"
											: "bg-amber-500/10 text-amber-500"
									}`}
								>
									<span
										className={`h-1.5 w-1.5 rounded-full ${
											isEnded
												? "bg-muted-foreground/50"
												: isOngoing
												? "bg-emerald-500 animate-pulse"
												: isOpen
												? "bg-blue-500"
												: "bg-amber-500"
										}`}
									/>
									{status.label}
								</span>

								<span className="inline-flex h-6 items-center rounded-md border border-border px-2 text-xs text-muted-foreground">
									{getEventTypeLabel(hackathon.eventType)}
								</span>

								{hackathon.skillLevel && hackathon.skillLevel !== "all" && (
									<span className="inline-flex items-center gap-1 h-6 rounded-md border border-border px-2 text-xs text-muted-foreground">
										<GraduationCap className="h-3 w-3" />
										{getSkillLevelLabel(hackathon.skillLevel)}
									</span>
								)}

								{hackathon.isJuniorFriendly && (
									<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
										<Sparkles className="h-3 w-3" />
										Junior friendly
									</span>
								)}
							</div>
						</div>
					</div>
				</section>

				{/* Main Content + Sidebar */}
				<section className="mx-auto max-w-screen-xl px-4 pb-12">
					<div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">
						{/* Main Content */}
						<div className="space-y-10 min-w-0">
							{/* Description */}
							{hackathon.description && (
								<div className="space-y-4">
									<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
										Sobre el evento
									</h2>
									<div className="space-y-4">
										<Markdown
											components={{
												h2: ({ children }) => (
													<h3 className="text-lg font-semibold text-foreground mt-6 mb-2">{children}</h3>
												),
												h3: ({ children }) => (
													<h4 className="text-base font-medium text-foreground mt-4 mb-1">{children}</h4>
												),
												p: ({ children }) => (
													<p className="text-foreground leading-relaxed">{children}</p>
												),
												ul: ({ children }) => (
													<ul className="list-disc list-inside space-y-1 text-foreground ml-1">{children}</ul>
												),
												li: ({ children }) => (
													<li className="text-foreground">{children}</li>
												),
												strong: ({ children }) => (
													<strong className="font-semibold text-foreground">{children}</strong>
												),
												a: ({ href, children }) => (
													<a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
														{children}
													</a>
												),
											}}
										>
											{hackathon.description}
										</Markdown>
									</div>
								</div>
							)}

							{/* Child events section */}
							{hasChildEvents && (
								<div className="space-y-4">
									<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
										Programa ({childEvents.length} días)
									</h2>
									<div className="space-y-3">
										{childEvents.map((child) => {
											const childStart = child.startDate ? new Date(child.startDate) : null;
											const childStatus = getEventStatus(child);
											return (
												<Link
													key={child.id}
													href={`/${child.slug}`}
													className="group block rounded-xl border p-4 transition-colors hover:bg-muted/50"
												>
													<div className="flex items-start gap-4">
														{child.dayNumber && (
															<div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
																Día {child.dayNumber}
															</div>
														)}
														<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted border border-border">
															{child.eventImageUrl ? (
																<Image
																	src={child.eventImageUrl}
																	alt={child.name}
																	fill
																	className="object-cover"
																	sizes="40px"
																/>
															) : (
																<div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
																	{child.name.charAt(0).toUpperCase()}
																</div>
															)}
														</div>
														<div className="flex-1 min-w-0">
															<h3 className="font-medium group-hover:underline underline-offset-2">
																{child.name}
															</h3>
															<div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
																{childStart && (
																	<span className="inline-flex items-center gap-1.5">
																		<Calendar className="h-3.5 w-3.5" />
																		{formatEventDate(childStart)}
																	</span>
																)}
																{child.city && (
																	<span className="inline-flex items-center gap-1.5">
																		<MapPin className="h-3.5 w-3.5" />
																		{child.city}
																	</span>
																)}
															</div>
														</div>
														<span
															className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
																childStatus.status === "ended"
																	? "bg-muted text-muted-foreground"
																	: childStatus.status === "ongoing"
																	? "bg-emerald-500/10 text-emerald-500"
																	: childStatus.status === "open"
																	? "bg-blue-500/10 text-blue-500"
																	: "bg-amber-500/10 text-amber-500"
															}`}
														>
															<span
																className={`h-1.5 w-1.5 rounded-full ${
																	childStatus.status === "ended"
																		? "bg-muted-foreground/50"
																		: childStatus.status === "ongoing"
																		? "bg-emerald-500 animate-pulse"
																		: childStatus.status === "open"
																		? "bg-blue-500"
																		: "bg-amber-500"
																}`}
															/>
															{childStatus.label}
														</span>
													</div>
												</Link>
											);
										})}
									</div>
								</div>
							)}

							{/* Sponsors section */}
							{hasSponsors && (
								<div className="space-y-4">
									<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
										Sponsors y Partners
									</h2>
									<div className="space-y-6">
										{(["platinum", "gold", "silver", "bronze", "partner", "community"] as const).map((tier) => {
											const tierSponsors = eventSponsors.filter((s) => s.tier === tier);
											if (tierSponsors.length === 0) return null;
											return (
												<div key={tier} className="space-y-3">
													<h3 className="text-xs font-medium text-muted-foreground">
														{SPONSOR_TIER_LABELS[tier]}
													</h3>
													<div className="flex flex-wrap gap-3">
														{tierSponsors.map((sponsor) => (
															<a
																key={sponsor.id}
																href={sponsor.websiteUrl || "#"}
																target="_blank"
																rel="noopener noreferrer"
																className={`group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 ${
																	tier === "platinum" || tier === "gold"
																		? "border-amber-500/30 bg-amber-500/5"
																		: ""
																}`}
															>
																{sponsor.logoUrl ? (
																	<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
																		<Image
																			src={sponsor.logoUrl}
																			alt={sponsor.name}
																			fill
																			className="object-contain p-1"
																			sizes="40px"
																		/>
																	</div>
																) : (
																	<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
																		{sponsor.name.charAt(0)}
																	</div>
																)}
																<span className="text-sm font-medium group-hover:underline underline-offset-2">
																	{sponsor.name}
																</span>
															</a>
														))}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{/* Winner section - only for ended events */}
							{isEnded && (
								<WinnerSection eventId={hackathon.id} eventName={hackathon.name} />
							)}

							{/* Claim as organizer */}
							<OrganizerClaimSection eventId={hackathon.id} eventName={hackathon.name} />
						</div>

						{/* Sidebar */}
						<aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
							{/* Organizer Card */}
							{hackathon.organizerName && (
								<div className="rounded-xl border bg-card p-4 space-y-4">
									<div className="flex items-start gap-3">
										{/* Organizer Avatar */}
										<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted border border-border flex items-center justify-center">
											<Building2 className="h-5 w-5 text-muted-foreground" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												{hackathon.organizerUrl ? (
													<a
														href={hackathon.organizerUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="font-medium hover:underline underline-offset-2"
													>
														{hackathon.organizerName}
													</a>
												) : (
													<span className="font-medium">{hackathon.organizerName}</span>
												)}
												{hackathon.isOrganizerVerified ? (
													<BadgeCheck className="h-4 w-4 fill-foreground text-background shrink-0" />
												) : (
													<span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 shrink-0">
														<span className="text-[8px] text-muted-foreground/60">?</span>
													</span>
												)}
											</div>
											<div className="flex items-center gap-2 mt-0.5">
												{hackathon.organizerType && (
													<span className="text-sm text-muted-foreground">
														{getOrganizerTypeLabel(hackathon.organizerType)}
													</span>
												)}
												{hackathon.isOrganizerVerified ? (
													<span className="text-xs text-emerald-500">Verificado</span>
												) : (
													<span className="text-xs text-muted-foreground/60">Sin verificar</span>
												)}
											</div>
										</div>
									</div>
								</div>
							)}

							{/* CTAs Card */}
							<div className="rounded-xl border bg-card p-4 space-y-3">
								{hackathon.registrationUrl && (
									<a
										href={hackathon.registrationUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-medium text-background transition-colors hover:bg-foreground/90"
									>
										<ExternalLink className="h-4 w-4" />
										Inscribirme
									</a>
								)}
								<div className="flex gap-2">
									{hackathon.websiteUrl && (
										<a
											href={hackathon.websiteUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex flex-1 h-9 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										>
											<Globe className="h-4 w-4" />
											Web
										</a>
									)}
									{hackathon.devpostUrl && (
										<a
											href={hackathon.devpostUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex flex-1 h-9 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										>
											<ArrowUpRight className="h-4 w-4" />
											Devpost
										</a>
									)}
								</div>
							</div>

							{/* Prize Card */}
							{hackathon.prizePool !== null && hackathon.prizePool > 0 && (
								<div className="rounded-xl border bg-card p-4">
									<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
										<TrophyIcon className="h-3.5 w-3.5" />
										Premio
									</div>
									<p className="font-bold text-2xl text-emerald-500">
										{hackathon.prizeCurrency === "PEN" ? "S/" : "$"}
										{hackathon.prizePool.toLocaleString()}
									</p>
									{hackathon.prizeDescription && (
										<p className="text-sm text-muted-foreground mt-1">
											{hackathon.prizeDescription}
										</p>
									)}
								</div>
							)}

							{/* Deadline Card */}
							{deadline && isDateInFuture(deadline) && (
								<div className="rounded-xl border bg-card p-4">
									<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
										<Clock className="h-3.5 w-3.5" />
										Cierre de inscripciones
									</div>
									<p className="font-medium">
										{format(deadline, "d 'de' MMMM, yyyy", { locale: es })}
									</p>
									<p className="text-sm text-muted-foreground mt-0.5">
										{format(deadline, "h:mm a", { locale: es })}
									</p>
								</div>
							)}

							{/* Date Card */}
							{startDate && (
								<div className="rounded-xl border bg-card p-4">
									<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
										<CalendarIcon className="h-3.5 w-3.5" />
										Fechas del evento
									</div>
									<p className="font-medium">
										{format(startDate, "d MMM", { locale: es })}
										{endDate && startDate.toDateString() !== endDate.toDateString() && (
											<> – {format(endDate, "d MMM yyyy", { locale: es })}</>
										)}
										{(!endDate || startDate.toDateString() === endDate.toDateString()) && (
											<>, {format(startDate, "yyyy")}</>
										)}
									</p>
								</div>
							)}

							{/* Tags */}
							{hackathon.domains && hackathon.domains.length > 0 && (
								<div className="rounded-xl border bg-card p-4">
									<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
										Categorías
									</div>
									<div className="flex flex-wrap gap-2">
										{hackathon.domains.map((domain) => (
											<span
												key={domain}
												className="inline-flex h-7 items-center rounded-lg border border-border bg-muted/50 px-2.5 text-xs text-muted-foreground"
											>
												{getDomainLabel(domain)}
											</span>
										))}
									</div>
								</div>
							)}
						</aside>
					</div>
				</section>
			</main>

			<SiteFooter />
		</div>
	);
}
