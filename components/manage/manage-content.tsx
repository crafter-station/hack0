"use client";

import { Database, ExternalLink } from "lucide-react";
import { CohostSelector, HostAssignment } from "@/components/events/edit";
import { OverviewTab } from "@/components/manage/overview/overview-tab";
import { OrgEventFormMinimal } from "@/components/org/creation/org-event-form-minimal";
import type { EventSponsorWithOrg } from "@/lib/actions/events";
import type {
	Event,
	EventHostOrganization,
	ImportJob,
	Organization,
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
	tab: string;
	sponsors: EventSponsorWithOrg[];
	cohosts: (EventHostOrganization & { organization: Organization })[];
	eventHosts: EventHostWithUser[];
	importJobs: ImportJob[];
}

export function ManageContent({
	event,
	community,
	tab,
	sponsors,
	cohosts,
	eventHosts,
	importJobs,
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
			status: cohost.status ?? "pending",
			isPrimary: cohost.isPrimary ?? false,
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

	if (tab === "analytics") {
		return (
			<div className="space-y-6">
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
								Este evento fue creado manualmente o por Luma sync directo
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
													className="text-xs text-brand-grid hover:underline inline-flex items-center gap-1"
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
														? "bg-brand-green/10 text-brand-green dark:text-brand-green"
														: job.status === "processing"
															? "bg-brand-grid/10 text-brand-grid dark:text-brand-grid"
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
			</div>
		);
	}

	return null;
}
