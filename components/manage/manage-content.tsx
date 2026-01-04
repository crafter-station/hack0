"use client";

import { Database, ExternalLink, Globe, Trophy } from "lucide-react";
import { CohostSelector, HostAssignment } from "@/components/events/edit";
import { OverviewTab } from "@/components/manage/overview/overview-tab";
import { OrgEventFormMinimal } from "@/components/org/creation/org-event-form-minimal";
import type { EventSponsorWithOrg } from "@/lib/actions/events";
import type {
	Event,
	EventHostOrganization,
	ImportJob,
	NotificationLog,
	Organization,
	WinnerClaim,
} from "@/lib/db/schema";
import { formatEventDateTime } from "@/lib/event-utils";

interface EventHostWithUser {
	id: string;
	name: string;
	avatarUrl: string | null;
	source: "luma" | "manual";
	userId: string | null;
}

interface ManageContentProps {
	event: Event;
	community: Organization;
	slug: string;
	eventSlug: string;
	tab: string;
	sponsors: EventSponsorWithOrg[];
	cohosts: (EventHostOrganization & { organization: Organization })[];
	eventHosts: EventHostWithUser[];
	winnerClaims: WinnerClaim[];
	importJobs: ImportJob[];
	notificationLogs: NotificationLog[];
}

export function ManageContent({
	event,
	community,
	slug,
	eventSlug,
	tab,
	sponsors,
	cohosts,
	eventHosts,
	winnerClaims,
	importJobs,
	notificationLogs,
}: ManageContentProps) {
	if (tab === "overview") {
		return (
			<OverviewTab event={event} community={community} sponsors={sponsors} />
		);
	}

	if (tab === "edit") {
		return (
			<OrgEventFormMinimal
				mode="edit"
				event={event}
				sponsors={sponsors}
				communityId={community.id}
				communityName={community.displayName || community.name}
				communityLogo={community.logoUrl}
				communitySlug={community.slug}
				currentOrg={community}
			/>
		);
	}

	if (tab === "team") {
		const transformedCohosts = cohosts.map((cohost) => ({
			id: cohost.id,
			organizationId: cohost.organizationId,
			organizationName:
				cohost.organization.displayName || cohost.organization.name,
			organizationSlug: cohost.organization.slug,
			organizationLogoUrl: cohost.organization.logoUrl,
			status: cohost.status,
			isPrimary: cohost.isPrimary,
		}));

		return (
			<div className="space-y-8">
				<HostAssignment eventId={event.id} initialHosts={eventHosts} />
				<CohostSelector
					eventId={event.id}
					organizationId={community.id}
					currentUserId={community.ownerUserId}
					existingCohosts={transformedCohosts}
				/>
			</div>
		);
	}

	if (tab === "winners") {
		const pendingWinnerClaims = winnerClaims.filter(
			(c) => c.status === "pending",
		);
		const approvedWinnerClaims = winnerClaims.filter(
			(c) => c.status === "approved",
		);
		const _rejectedWinnerClaims = winnerClaims.filter(
			(c) => c.status === "rejected",
		);

		return (
			<div className="space-y-6">
				{/* Winner Claims */}
				<div className="rounded-lg border bg-card">
					<div className="px-5 py-4 border-b">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Trophy className="h-4 w-4 text-muted-foreground" />
								<h3 className="text-sm font-semibold">
									Winner Claims ({winnerClaims.length})
								</h3>
							</div>
							<div className="flex items-center gap-2 text-xs">
								<span className="text-amber-600">
									{pendingWinnerClaims.length} pendiente(s)
								</span>
								<span className="text-muted-foreground">·</span>
								<span className="text-emerald-600">
									{approvedWinnerClaims.length} aprobado(s)
								</span>
							</div>
						</div>
					</div>
					<div className="p-6">
						{winnerClaims.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								No hay claims de ganadores todavía
							</p>
						) : (
							<div className="space-y-3">
								{winnerClaims.map((claim) => (
									<div
										key={claim.id}
										className="rounded-lg border p-4 space-y-2"
									>
										<div className="flex items-start justify-between">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="text-lg">
														{claim.position === 1
															? "🥇"
															: claim.position === 2
																? "🥈"
																: "🥉"}
													</span>
													<p className="text-sm font-medium">
														{claim.teamName ||
															claim.projectName ||
															`Posición ${claim.position}`}
													</p>
												</div>
												{claim.projectName && claim.teamName && (
													<p className="text-xs text-muted-foreground">
														Proyecto: {claim.projectName}
													</p>
												)}
												{claim.projectUrl && (
													<a
														href={claim.projectUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
													>
														<ExternalLink className="h-3 w-3" />
														Ver proyecto
													</a>
												)}
											</div>
											<div
												className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
													claim.status === "approved"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
														: claim.status === "pending"
															? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
															: "bg-red-500/10 text-red-700 dark:text-red-400"
												}`}
											>
												{claim.status === "approved"
													? "Aprobado"
													: claim.status === "pending"
														? "Pendiente"
														: "Rechazado"}
											</div>
										</div>
										<a
											href={claim.proofUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
										>
											<ExternalLink className="h-3 w-3" />
											Ver prueba
										</a>
										{claim.proofDescription && (
											<p className="text-xs text-muted-foreground">
												{claim.proofDescription}
											</p>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (tab === "analytics") {
		return (
			<div className="space-y-6">
				{/* Import Jobs */}
				<div className="rounded-lg border bg-card">
					<div className="px-5 py-4 border-b">
						<div className="flex items-center gap-2">
							<Database className="h-4 w-4 text-muted-foreground" />
							<h3 className="text-sm font-semibold">
								Import Jobs ({importJobs.length})
							</h3>
						</div>
					</div>
					<div className="p-6">
						{importJobs.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								Este evento fue creado manualmente (no importado)
							</p>
						) : (
							<div className="space-y-3">
								{importJobs.map((job) => (
									<div key={job.id} className="rounded-lg border p-4 space-y-2">
										<div className="flex items-start justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">{job.sourceType}</p>
												<a
													href={job.sourceUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
												>
													<ExternalLink className="h-3 w-3" />
													{job.sourceUrl}
												</a>
												{job.createdAt && (
													<p className="text-xs text-muted-foreground">
														{formatEventDateTime(
															new Date(job.createdAt),
															"d MMM yyyy, HH:mm",
														)}
													</p>
												)}
											</div>
											<div
												className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
													job.status === "completed"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
														: job.status === "processing"
															? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
															: job.status === "failed"
																? "bg-red-500/10 text-red-700 dark:text-red-400"
																: "bg-amber-500/10 text-amber-700 dark:text-amber-400"
												}`}
											>
												{job.status}
											</div>
										</div>
										{job.errorMessage && (
											<p className="text-xs text-red-600">{job.errorMessage}</p>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Notification Logs */}
				<div className="rounded-lg border bg-card">
					<div className="px-5 py-4 border-b">
						<div className="flex items-center gap-2">
							<Globe className="h-4 w-4 text-muted-foreground" />
							<h3 className="text-sm font-semibold">
								Notificaciones Enviadas ({notificationLogs.length})
							</h3>
						</div>
					</div>
					<div className="p-6">
						{notificationLogs.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								No se han enviado notificaciones para este evento todavía
							</p>
						) : (
							<div className="space-y-3">
								{notificationLogs.map((log) => (
									<div key={log.id} className="rounded-lg border p-4 space-y-2">
										<div className="flex items-start justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">{log.subject}</p>
												{log.sentAt && (
													<p className="text-xs text-muted-foreground">
														{formatEventDateTime(
															new Date(log.sentAt),
															"d MMM yyyy, HH:mm",
														)}
													</p>
												)}
											</div>
											<div
												className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
													log.status === "sent"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
														: log.status === "failed"
															? "bg-red-500/10 text-red-700 dark:text-red-400"
															: "bg-amber-500/10 text-amber-700 dark:text-amber-400"
												}`}
											>
												{log.status}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	return null;
}
