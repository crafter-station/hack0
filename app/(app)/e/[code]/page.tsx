import { auth } from "@clerk/nextjs/server";
import {
	AlertCircle,
	ArrowUpRight,
	Bell,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	ExternalLink,
	Globe,
	GraduationCap,
	MapPin,
	Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { ClaimHostButton } from "@/components/events/claim-host-button";
import { EventCountdown } from "@/components/events/event-countdown";
import { ManageEventButton } from "@/components/events/manage-event-button";
import { WinnerSection } from "@/components/events/winner-section";
import { CalendarIcon } from "@/components/icons/calendar";
import { TrophyIcon } from "@/components/icons/trophy";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEventCohost } from "@/lib/actions/cohost-invites";
import {
	getChildEvents,
	getEventByShortCode,
	getEventLumaHosts,
	getEventSponsors,
} from "@/lib/actions/events";
import { SPONSOR_TIER_LABELS } from "@/lib/db/schema";
import {
	formatEventDate,
	formatEventDateFull,
	formatEventDay,
	formatEventMonth,
	formatEventTime,
	getDomainLabel,
	getEventStatus,
	getEventTypeLabel,
	getFormatLabel,
	getOrganizerTypeLabel,
	getSkillLevelLabel,
	isDateInFuture,
	isEventJuniorFriendly,
	PERU_TIMEZONE,
} from "@/lib/event-utils";
import { isGodMode } from "@/lib/god-mode";
import remarkGfm from "remark-gfm";

interface EventPageProps {
	params: Promise<{ code: string }>;
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

function getInitials(name: string): string {
	const words = name.split(/\s+/).filter(Boolean);
	if (words.length === 1) {
		return words[0].slice(0, 2).toUpperCase();
	}
	return words
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase();
}

export async function generateMetadata({
	params,
}: EventPageProps): Promise<Metadata> {
	const { code } = await params;
	const result = await getEventByShortCode(code, true);

	if (!result) {
		return {
			title: "Evento no encontrado",
		};
	}

	const hackathon = result;
	const community = result.organization;

	const title = `${hackathon.name} - ${getEventTypeLabel(hackathon.eventType)} en Perú`;
	const description = hackathon.description
		? stripMarkdown(hackathon.description).slice(0, 160)
		: `${getEventTypeLabel(hackathon.eventType)} ${hackathon.format === "virtual" ? "virtual" : `en ${hackathon.city || "Perú"}`}. ${hackathon.prizePool ? `Premio: ${hackathon.prizeCurrency === "PEN" ? "S/" : "$"}${hackathon.prizePool.toLocaleString()}` : ""}`;

	const ogImageUrl = `https://hack0.dev/api/og?code=${code}`;

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
			url: `https://hack0.dev/e/${code}`,
			images: [
				{ url: ogImageUrl, width: 1200, height: 630, alt: hackathon.name },
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [ogImageUrl],
		},
		alternates: {
			canonical: `https://hack0.dev/e/${code}`,
		},
	};
}

export default async function EventPage({ params }: EventPageProps) {
	const { code } = await params;
	const { userId } = await auth();
	const result = await getEventByShortCode(code, true);

	if (!result) {
		notFound();
	}

	const hackathon = result;
	const community = result.organization;

	const godMode = await isGodMode();
	const isOwner = userId && community?.ownerUserId === userId;
	const canViewPending = godMode || isOwner;

	if (!hackathon.isApproved && !canViewPending) {
		notFound();
	}

	const [childEvents, eventSponsors, cohosts, lumaHosts] = await Promise.all([
		getChildEvents(hackathon.id),
		getEventSponsors(hackathon.id),
		getEventCohost(hackathon.id),
		getEventLumaHosts(hackathon.id, userId),
	]);

	const hasChildEvents = childEvents.length > 0;
	const hasSponsors = eventSponsors.length > 0;
	const approvedCohosts = cohosts.filter(
		(c) => c.status === "approved" && !c.isPrimary,
	);
	const hasCohosts = approvedCohosts.length > 0;
	const hasLumaHosts = lumaHosts.length > 0;

	const status = getEventStatus(hackathon);
	const isEnded = status.status === "ended";
	const isOngoing = status.status === "ongoing";
	const isOpen = status.status === "open";
	const isJuniorFriendly = isEventJuniorFriendly(hackathon.skillLevel);

	const startDate = hackathon.startDate ? new Date(hackathon.startDate) : null;
	const endDate = hackathon.endDate ? new Date(hackathon.endDate) : null;
	const deadline = hackathon.registrationDeadline
		? new Date(hackathon.registrationDeadline)
		: null;

	const hasValidTime =
		startDate &&
		(startDate.getHours() !== 0 ||
			startDate.getMinutes() !== 0 ||
			(endDate && (endDate.getHours() !== 0 || endDate.getMinutes() !== 0)));

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
			...(community
				? [
						{
							"@type": "ListItem",
							position: 2,
							name: community.displayName || community.name,
							item: `https://hack0.dev/c/${community.slug}`,
						},
					]
				: []),
			{
				"@type": "ListItem",
				position: community ? 3 : 2,
				name: hackathon.name,
				item: `https://hack0.dev/e/${code}`,
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
		url: `https://hack0.dev/e/${code}`,
		organizer: community
			? {
					"@type": "Organization",
					name: community.displayName || community.name,
					url: community.websiteUrl,
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
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
			/>

			<main className="flex-1 w-full">
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
					<div className="absolute top-3 right-3">
						<ManageEventButton event={hackathon} communitySlug={community?.slug} />
					</div>
				</div>

				<section className="mx-auto max-w-screen-xl px-4 py-4 md:py-6">
					<div className="grid md:grid-cols-[240px_1fr] gap-4 md:gap-6">
						<div className="hidden md:block">
							<div className="aspect-square w-full overflow-hidden bg-muted border border-border">
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

						<div className="space-y-3">
							<div className="flex items-start justify-between gap-4">
								<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
									{hackathon.name}
								</h1>
								<div className="hidden md:block">
									<ManageEventButton event={hackathon} communitySlug={community?.slug} />
								</div>
							</div>

							{!hackathon.isApproved && (
								<div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
									<div className="flex items-start gap-3">
										<AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
										<div className="flex-1 space-y-1">
											<h3 className="font-medium text-amber-900 dark:text-amber-100">
												Evento pendiente de aprobación
											</h3>
											<p className="text-sm text-amber-800/80 dark:text-amber-200/80">
												Este evento está en revisión y será visible públicamente
												una vez aprobado. Solo tú puedes verlo mientras tanto.
											</p>
										</div>
									</div>
								</div>
							)}

							{startDate && (
								<div className="flex items-center gap-4">
									<div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-muted border border-border shrink-0">
										<span className="text-[10px] uppercase font-medium text-muted-foreground leading-none">
											{formatEventMonth(startDate)}
										</span>
										<span className="text-xl font-bold leading-none mt-0.5">
											{formatEventDay(startDate)}
										</span>
									</div>
									<div>
										<p className="font-medium">
											{formatEventDateFull(startDate)}
											{endDate &&
												startDate.toDateString() !== endDate.toDateString() && (
													<span className="text-muted-foreground">
														{" "}
														– {formatEventDate(endDate, "d 'de' MMMM")}
													</span>
												)}
										</p>
										{hasValidTime ? (
											<p className="text-sm text-muted-foreground">
												{formatEventTime(startDate)}
												{endDate && <> – {formatEventTime(endDate)}</>}
												<span className="text-muted-foreground/60">
													{" "}
													· {PERU_TIMEZONE}
												</span>
											</p>
										) : (
											<p className="text-sm text-muted-foreground">
												Evento de día completo
											</p>
										)}
									</div>
								</div>
							)}

							<div className="space-y-3">
								<div className="flex items-start gap-2 text-muted-foreground">
									<MapPin className="h-4 w-4 mt-0.5 shrink-0" />
									<div>
										{hackathon.venue && (
											<p className="text-foreground">{hackathon.venue}</p>
										)}
										<p
											className={
												hackathon.venue ? "text-sm" : "text-foreground"
											}
										>
											{hackathon.city}
											{hackathon.city &&
												hackathon.department &&
												hackathon.city !== hackathon.department &&
												`, ${hackathon.department}`}
											{!hackathon.city &&
												!hackathon.venue &&
												getFormatLabel(hackathon.format, hackathon.department)}
											{(hackathon.city || hackathon.venue) &&
												`, ${getFormatLabel(hackathon.format)}`}
										</p>
									</div>
								</div>

								<EventCountdown
									event={{
										startDate,
										endDate,
										registrationDeadline: deadline,
										status: status.status,
									}}
									variant="hero"
								/>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<span
									className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isEnded
										? "bg-muted text-muted-foreground"
										: isOngoing
											? "bg-emerald-500/10 text-emerald-500"
											: isOpen
												? "bg-blue-500/10 text-blue-500"
												: "bg-amber-500/10 text-amber-500"
										}`}
								>
									<span
										className={`h-1.5 w-1.5 rounded-full ${isEnded
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

								{isJuniorFriendly && (
									<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
										<Sparkles className="h-3 w-3" />
										Ideal para estudiantes
									</span>
								)}

								{hackathon.skillLevel && !isJuniorFriendly && (
									<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
										<GraduationCap className="h-3 w-3" />
										{getSkillLevelLabel(hackathon.skillLevel)}
									</span>
								)}

								{hackathon.domains &&
									hackathon.domains.length > 0 &&
									hackathon.domains.slice(0, 3).map((domain) => (
										<span
											key={domain}
											className="inline-flex h-6 items-center rounded-md border border-border px-2 text-xs text-muted-foreground"
										>
											{getDomainLabel(domain)}
										</span>
									))}
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-screen-xl px-4 pb-8">
					<div className="grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
						<div className="space-y-8 min-w-0">
							{hackathon.description && (
								<div className="space-y-4">
									<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
										Sobre el evento
									</h2>
									<div className="space-y-4">
										<Markdown
											remarkPlugins={[remarkGfm]}
											components={{
												h2: ({ children }) => (
													<h3 className="text-lg font-semibold text-foreground mt-6 mb-2">
														{children}
													</h3>
												),
												h3: ({ children }) => (
													<h4 className="text-base font-medium text-foreground mt-4 mb-1">
														{children}
													</h4>
												),
												p: ({ children }) => (
													<p className="text-foreground leading-relaxed">
														{children}
													</p>
												),
												ul: ({ children }) => (
													<ul className="list-disc list-inside space-y-1 text-foreground ml-1">
														{children}
													</ul>
												),
												li: ({ children }) => (
													<li className="text-foreground">{children}</li>
												),
												strong: ({ children }) => (
													<strong className="font-semibold text-foreground">
														{children}
													</strong>
												),
												a: ({ href, children }) => (
													<a
														href={href}
														target="_blank"
														rel="noopener noreferrer"
														className="text-blue-400 hover:underline"
													>
														{children}
													</a>
												),
												table: ({ children }) => (
													<div className="overflow-x-auto">
														<table className="min-w-full border border-border border-collapse text-sm">
															{children}
														</table>
													</div>
												),
												thead: ({ children }) => (
													<thead className="bg-muted text-foreground">
														{children}
													</thead>
												),
												tbody: ({ children }) => (
													<tbody className="text-foreground">{children}</tbody>
												),
												tr: ({ children }) => (
													<tr className="border-b border-border last:border-b-0">
														{children}
													</tr>
												),
												th: ({ children }) => (
													<th className="px-3 py-2 text-left font-semibold align-top">
														{children}
													</th>
												),
												td: ({ children }) => (
													<td className="px-3 py-2 align-top">{children}</td>
												),
											}}
										>
											{hackathon.description}
										</Markdown>
									</div>
								</div>
							)}

							{hasChildEvents && (
								<div className="space-y-4">
									<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
										Programa ({childEvents.length} días)
									</h2>
									<div className="space-y-3">
										{childEvents.map((child) => {
											const childStart = child.startDate
												? new Date(child.startDate)
												: null;
											const childStatus = getEventStatus(child);
											return (
												<Link
													key={child.id}
													href={`/e/${child.shortCode}`}
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
															className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${childStatus.status === "ended"
																? "bg-muted text-muted-foreground"
																: childStatus.status === "ongoing"
																	? "bg-emerald-500/10 text-emerald-500"
																	: childStatus.status === "open"
																		? "bg-blue-500/10 text-blue-500"
																		: "bg-amber-500/10 text-amber-500"
																}`}
														>
															<span
																className={`h-1.5 w-1.5 rounded-full ${childStatus.status === "ended"
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

							{hasSponsors && (
								<div className="space-y-4">
									<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
										Sponsors y Partners
									</h2>
									<div className="space-y-6">
										{(
											[
												"platinum",
												"gold",
												"silver",
												"bronze",
												"partner",
												"community",
											] as const
										).map((tier) => {
											const tierSponsors = eventSponsors.filter(
												(s) => s.tier === tier,
											);
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
																href={sponsor.organization.websiteUrl || "#"}
																target="_blank"
																rel="noopener noreferrer"
																className={`group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 ${tier === "platinum" || tier === "gold"
																	? "border-amber-500/30 bg-amber-500/5"
																	: ""
																	}`}
															>
																<Avatar className="h-10 w-10 rounded-lg">
																	<AvatarImage
																		src={sponsor.organization.logoUrl || undefined}
																		alt={sponsor.organization.name}
																		className="object-contain bg-white"
																	/>
																	<AvatarFallback className="rounded-lg text-sm font-medium">
																		{getInitials(sponsor.organization.name)}
																	</AvatarFallback>
																</Avatar>
																<span className="text-sm font-medium group-hover:underline underline-offset-2">
																	{sponsor.organization.name}
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

							{isEnded && (
								<WinnerSection
									eventId={hackathon.id}
									eventName={hackathon.name}
								/>
							)}
						</div>

						<aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
							{community && (
								<div className="rounded-lg border bg-card">
									<div className="px-5 py-4 border-b">
										<h3 className="text-sm font-semibold">
											Organizado por
											{hasCohosts && ` (${approvedCohosts.length + 1})`}
										</h3>
									</div>
									<div className="p-5 space-y-4">
										<div>
											<div className="flex items-center gap-3 mb-3">
												{community.logoUrl ? (
													<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white border">
														<Image
															src={community.logoUrl}
															alt={community.displayName || community.name}
															fill
															className="object-contain"
															sizes="40px"
														/>
													</div>
												) : (
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border">
														<Building2 className="h-5 w-5 text-muted-foreground" />
													</div>
												)}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 flex-wrap">
														<Link
															href={`/c/${community.slug}`}
															className="text-sm font-medium hover:underline underline-offset-2 truncate"
														>
															{community.displayName || community.name}
														</Link>
														{community.isVerified && (
															<CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
														)}
													</div>
													<div className="flex items-center gap-2 mt-0.5">
														{community.type && (
															<p className="text-xs text-muted-foreground">
																{getOrganizerTypeLabel(community.type)}
															</p>
														)}
														<span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
															Principal
														</span>
													</div>
												</div>
											</div>
											<Link
												href={`/c/${community.slug}`}
												className="flex w-full h-9 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
											>
												<Building2 className="h-4 w-4" />
												Ver comunidad
											</Link>
										</div>

										{hasCohosts && (
											<div className="space-y-3 pt-4 border-t">
												<p className="text-xs font-medium text-muted-foreground">
													Co-organizadores
												</p>
												{approvedCohosts.map((cohost) => (
													<div
														key={cohost.id}
														className="flex items-center gap-3"
													>
														{cohost.organization.logoUrl ? (
															<div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white border">
																<Image
																	src={cohost.organization.logoUrl}
																	alt={
																		cohost.organization.displayName ||
																		cohost.organization.name
																	}
																	fill
																	className="object-contain"
																	sizes="32px"
																/>
															</div>
														) : (
															<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border">
																<Building2 className="h-4 w-4 text-muted-foreground" />
															</div>
														)}
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 flex-wrap">
																<Link
																	href={`/c/${cohost.organization.slug}`}
																	className="text-sm font-medium hover:underline underline-offset-2 truncate"
																>
																	{cohost.organization.displayName ||
																		cohost.organization.name}
																</Link>
																{cohost.organization.isVerified && (
																	<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
																)}
															</div>
															{cohost.organization.type && (
																<p className="text-xs text-muted-foreground">
																	{getOrganizerTypeLabel(
																		cohost.organization.type,
																	)}
																</p>
															)}
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							)}

							{!community && hasLumaHosts && (
								<div className="rounded-lg border bg-card">
									<div className="px-5 py-4 border-b">
										<h3 className="text-sm font-semibold">
											Hosts ({lumaHosts.length})
										</h3>
									</div>
									<div className="p-5 space-y-3">
										{lumaHosts.map((host) => (
											<div key={host.id} className="flex items-center gap-3">
												<Avatar className="h-10 w-10 border">
													<AvatarImage src={host.avatarUrl || undefined} />
													<AvatarFallback className="text-sm font-medium">
														{getInitials(host.name || "?")}
													</AvatarFallback>
												</Avatar>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<p className="text-sm font-medium truncate">
															{host.name}
														</p>
														{host.isClaimed && (
															<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
														)}
													</div>
													{host.isPrimary && (
														<span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
															Principal
														</span>
													)}
												</div>
												{userId && !host.isClaimed && (
													<ClaimHostButton
														lumaHostApiId={host.lumaHostApiId}
														hostName={host.name || "Host"}
													/>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							<div className="rounded-lg border bg-card">
								<div className="px-5 py-4 border-b">
									<h3 className="text-sm font-semibold">Acciones</h3>
								</div>
								<div className="p-5 space-y-3">
									{hackathon.registrationUrl && (
										<>
											<a
												href={hackathon.registrationUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-medium text-background transition-colors hover:bg-foreground/90"
											>
												<ExternalLink className="h-4 w-4" />
												Inscribirme
											</a>
											{(isOpen || status.status === "upcoming") && deadline && (
												<div className="text-center space-y-1">
													<p className="text-xs text-muted-foreground">
														{isOpen
															? "Registro abierto hasta"
															: "Registro abre"}
													</p>
													<p className="text-xs font-medium">
														{formatEventDate(deadline, "d 'de' MMMM, yyyy")}
													</p>
												</div>
											)}
										</>
									)}

									<button className="flex w-full h-9 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
										<Bell className="h-4 w-4" />
										Seguir evento
									</button>

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
							</div>

							{hackathon.prizePool !== null && hackathon.prizePool > 0 && (
								<div className="rounded-lg border bg-card overflow-hidden">
									<div className="px-5 py-4 border-b bg-emerald-500/5">
										<div className="flex items-center gap-2">
											<TrophyIcon className="h-4 w-4 text-emerald-500" />
											<h3 className="text-sm font-semibold">Premio Total</h3>
										</div>
									</div>
									<div className="p-5">
										<p className="font-bold text-3xl text-emerald-500 mb-3">
											{hackathon.prizeCurrency === "PEN" ? "S/" : "$"}
											{hackathon.prizePool.toLocaleString()}
										</p>
										{hackathon.prizeDescription && (
											<div className="space-y-2 pt-3 border-t">
												<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
													Distribución
												</p>
												<Markdown
													remarkPlugins={[remarkGfm]}
													components={{
														p: ({ children }) => (
															<p className="text-sm text-foreground leading-relaxed">
																{children}
															</p>
														),
														ul: ({ children }) => (
															<ul className="space-y-1 text-sm">
																{children}
															</ul>
														),
														li: ({ children }) => (
															<li className="text-foreground flex items-start gap-1">
																<span className="text-muted-foreground">•</span>
																<span>{children}</span>
															</li>
														),
														strong: ({ children }) => (
															<strong className="font-semibold text-foreground">
																{children}
															</strong>
														),
													}}
												>
													{hackathon.prizeDescription}
												</Markdown>
											</div>
										)}
									</div>
								</div>
							)}

							{deadline && isDateInFuture(deadline) && (
								<div className="rounded-lg border bg-card">
									<div className="px-5 py-4 border-b">
										<div className="flex items-center gap-2">
											<Clock className="h-4 w-4 text-muted-foreground" />
											<h3 className="text-sm font-semibold">
												Cierre de inscripciones
											</h3>
										</div>
									</div>
									<div className="p-5">
										<p className="text-sm font-medium">
											{formatEventDate(deadline, "d 'de' MMMM, yyyy")}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{formatEventTime(deadline)}
										</p>
									</div>
								</div>
							)}

							{startDate && (
								<div className="rounded-lg border bg-card">
									<div className="px-5 py-4 border-b">
										<div className="flex items-center gap-2">
											<CalendarIcon className="h-4 w-4 text-muted-foreground" />
											<h3 className="text-sm font-semibold">
												Fechas del evento
											</h3>
										</div>
									</div>
									<div className="p-5">
										<p className="text-sm font-medium">
											{formatEventDate(startDate, "d MMM")}
											{endDate &&
												startDate.toDateString() !== endDate.toDateString() && (
													<> – {formatEventDate(endDate, "d MMM yyyy")}</>
												)}
											{(!endDate ||
												startDate.toDateString() ===
												endDate.toDateString()) && (
													<>, {formatEventDate(startDate, "yyyy")}</>
												)}
										</p>
									</div>
								</div>
							)}
						</aside>
					</div>
				</section>
			</main>
		</>
	);
}
