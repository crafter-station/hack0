import type { Metadata } from "next";
import {
	ArrowUpRight,
	BadgeCheck,
	Clock,
	ExternalLink,
	Globe,
	GraduationCap,
	Sparkles,
} from "lucide-react";
import { TrophyIcon } from "@/components/icons/trophy";
import { PinIcon } from "@/components/icons/pin";
import { CalendarIcon } from "@/components/icons/calendar";
import { WinnerSection } from "@/components/hackathons/winner-section";
import { OrganizerClaimSection } from "@/components/hackathons/organizer-claim-section";
import { EditEventButton } from "@/components/hackathons/edit-event-button";
import { notFound } from "next/navigation";
import { getHackathonBySlug } from "@/lib/actions/hackathons";
import {
	formatEventDate,
	formatRelativeDate,
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
	const description =
		hackathon.description?.slice(0, 160) ||
		`${getEventTypeLabel(hackathon.eventType)} ${hackathon.format === "virtual" ? "virtual" : `en ${hackathon.city || "Perú"}`}. ${hackathon.prizePool ? `Premio: $${hackathon.prizePool.toLocaleString()}` : ""}`;

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
			images: hackathon.bannerUrl
				? [{ url: hackathon.bannerUrl, width: 1200, height: 630 }]
				: [{ url: "https://hack0.dev/og.png", width: 1200, height: 630 }],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: hackathon.bannerUrl ? [hackathon.bannerUrl] : ["https://hack0.dev/og.png"],
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

	const status = getEventStatus(hackathon);
	const isEnded = status.status === "ended";
	const isOngoing = status.status === "ongoing";
	const isOpen = status.status === "open";
	const isUpcoming = status.status === "upcoming";

	const startDate = hackathon.startDate ? new Date(hackathon.startDate) : null;
	const endDate = hackathon.endDate ? new Date(hackathon.endDate) : null;
	const deadline = hackathon.registrationDeadline
		? new Date(hackathon.registrationDeadline)
		: null;

	// Diagonal stripe pattern for the banner (Stripe-inspired)
	const stripePattern = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23888' fill-opacity='0.15'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`;

	// JSON-LD structured data for the event
	const eventJsonLd = {
		"@context": "https://schema.org",
		"@type": "Event",
		name: hackathon.name,
		description: hackathon.description || `${getEventTypeLabel(hackathon.eventType)} en Perú`,
		startDate: startDate?.toISOString(),
		endDate: endDate?.toISOString(),
		eventStatus: isEnded
			? "https://schema.org/EventCancelled"
			: "https://schema.org/EventScheduled",
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
						name: hackathon.city || "Perú",
						address: {
							"@type": "PostalAddress",
							addressLocality: hackathon.city,
							addressCountry: "PE",
						},
					},
		image: hackathon.bannerUrl || hackathon.logoUrl,
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
				dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
			/>
			<SiteHeader showBackButton />

			{/* Banner */}
			<div className="relative h-32 md:h-40 overflow-hidden">
				{hackathon.bannerUrl ? (
					<img
						src={hackathon.bannerUrl}
						alt=""
						className="absolute inset-0 w-full h-full object-cover"
					/>
				) : (
					<div
						className="absolute inset-0 bg-muted"
						style={{
							backgroundImage: stripePattern,
							backgroundSize: "40px 40px",
						}}
					/>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
			</div>

			<main className="mx-auto max-w-screen-2xl px-4 lg:px-8 -mt-16 relative z-10 pb-8 flex-1 w-full">
				<div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-16">
					{/* Main content */}
					<div className="space-y-8">
						{/* Header */}
						<header className="space-y-6">
							{/* Logo + Title row */}
							<div className="flex items-start gap-5">
								{hackathon.logoUrl ? (
									<img
										src={hackathon.logoUrl}
										alt=""
										className="h-16 w-16 rounded-2xl object-cover border-2 border-background shadow-lg"
									/>
								) : (
									<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-2xl font-semibold text-muted-foreground border-2 border-background shadow-lg">
										{hackathon.name.charAt(0).toUpperCase()}
									</div>
								)}
								<div className="flex-1 min-w-0 space-y-2">
									<div className="flex items-start justify-between gap-4">
										<h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
											{hackathon.name}
										</h1>
										<EditEventButton event={hackathon} />
									</div>
									{/* Organizer info */}
									{hackathon.organizerName && (
										<div className="flex items-center gap-3">
											<span className="text-muted-foreground">
												{hackathon.organizerUrl ? (
													<a
														href={hackathon.organizerUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="hover:underline"
													>
														{hackathon.organizerName}
													</a>
												) : (
													hackathon.organizerName
												)}
											</span>
											{hackathon.isOrganizerVerified ? (
												<span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
													<BadgeCheck className="h-3 w-3" />
													Verificado
												</span>
											) : (
												<span className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/30 px-2 py-0.5 text-xs text-muted-foreground/60">
													Sin verificar
												</span>
											)}
											{hackathon.organizerType && (
												<span className="text-sm text-muted-foreground/60">
													{getOrganizerTypeLabel(hackathon.organizerType)}
												</span>
											)}
										</div>
									)}
								</div>
							</div>

							{/* Status + Meta row */}
							<div className="flex flex-wrap items-center gap-3">
								{/* Status badge - prominent */}
								<span
									className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
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
										className={`h-2 w-2 rounded-full ${
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

								<span className="text-muted-foreground/30">|</span>

								{/* Event type */}
								<span className="text-sm text-muted-foreground">
									{getEventTypeLabel(hackathon.eventType)}
								</span>

								{/* Location */}
								<span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
									<PinIcon className="h-3.5 w-3.5" />
									{getFormatLabel(hackathon.format)}
									{hackathon.city && ` · ${hackathon.city}`}
								</span>

								{/* Skill level */}
								{hackathon.skillLevel && hackathon.skillLevel !== "all" && (
									<span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
										<GraduationCap className="h-3.5 w-3.5" />
										{getSkillLevelLabel(hackathon.skillLevel)}
									</span>
								)}

								{/* Junior friendly */}
								{hackathon.isJuniorFriendly && (
									<span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
										<Sparkles className="h-3.5 w-3.5" />
										Junior friendly
									</span>
								)}
							</div>

							{/* Domain tags */}
							{hackathon.domains && hackathon.domains.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{hackathon.domains.map((domain) => (
										<span
											key={domain}
											className="inline-flex h-7 items-center rounded-md border border-border bg-muted/30 px-2.5 text-xs text-muted-foreground"
										>
											{getDomainLabel(domain)}
										</span>
									))}
								</div>
							)}
						</header>

						{/* Description */}
						{hackathon.description && (
							<div className="space-y-3 border-t pt-6">
								<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
									Descripción
								</h2>
								<p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
									{hackathon.description}
								</p>
							</div>
						)}

						{/* Winner section - only for ended events */}
						{isEnded && (
							<WinnerSection eventId={hackathon.id} eventName={hackathon.name} />
						)}

						{/* Claim as organizer - inline */}
						<OrganizerClaimSection eventId={hackathon.id} eventName={hackathon.name} />
					</div>

					{/* Sidebar */}
					<aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
						{/* Primary CTA */}
						<div className="rounded-lg border bg-muted/30 p-4 space-y-3">
							{hackathon.registrationUrl && (
								<a
									href={hackathon.registrationUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex w-full h-10 items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background transition-colors hover:bg-foreground/90"
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
										className="flex flex-1 h-9 items-center justify-center gap-2 rounded-md border border-border text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
										className="flex flex-1 h-9 items-center justify-center gap-2 rounded-md border border-border text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									>
										<ArrowUpRight className="h-4 w-4" />
										Devpost
									</a>
								)}
							</div>
						</div>

						{/* Event details card */}
						<div className="rounded-lg border divide-y">
							{/* Dates */}
							{startDate && (
								<div className="p-4">
									<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
										<CalendarIcon className="h-3.5 w-3.5" />
										Fechas
									</div>
									<p className="font-medium">
										{formatEventDate(startDate)}
										{endDate && <> – {formatEventDate(endDate)}</>}
									</p>
									{isDateInFuture(startDate) && (
										<p className="text-sm text-muted-foreground mt-0.5">
											Comienza {formatRelativeDate(startDate)}
										</p>
									)}
									{hackathon.timezone && (
										<p className="text-xs text-muted-foreground/70 mt-1">
											{hackathon.timezone}
										</p>
									)}
								</div>
							)}

							{/* Deadline */}
							{deadline && (
								<div className="p-4">
									<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
										<Clock className="h-3.5 w-3.5" />
										Cierre de inscripciones
									</div>
									<p className="font-medium">{formatEventDate(deadline)}</p>
									{isDateInFuture(deadline) && (
										<p className="text-sm text-muted-foreground mt-0.5">
											{formatRelativeDate(deadline)}
										</p>
									)}
								</div>
							)}

							{/* Prize */}
							{hackathon.prizePool !== null && hackathon.prizePool > 0 && (
								<div className="p-4">
									<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
										<TrophyIcon className="h-3.5 w-3.5" />
										Premio
									</div>
									<p className="font-semibold text-lg text-emerald-500">
										${hackathon.prizePool.toLocaleString()}
									</p>
									{hackathon.prizeDescription && (
										<p className="text-sm text-muted-foreground mt-0.5">
											{hackathon.prizeDescription}
										</p>
									)}
								</div>
							)}

							{/* Location */}
							<div className="p-4">
								<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
									<PinIcon className="h-3.5 w-3.5" />
									Ubicación
								</div>
								<p className="font-medium">
									{hackathon.city || getFormatLabel(hackathon.format)}
								</p>
								{hackathon.city && (
									<p className="text-sm text-muted-foreground mt-0.5">
										{getFormatLabel(hackathon.format)}
									</p>
								)}
							</div>
						</div>
					</aside>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
