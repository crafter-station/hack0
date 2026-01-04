import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { GenerateBadgeCTA } from "@/components/org/badges";
import { CampaignFilterTabs } from "@/components/org/campaigns";
import { MemberShowcaseGrid } from "@/components/org/members";
import { getUserMembershipRole } from "@/lib/actions/badges";
import {
	canGenerateBadgeForCampaign,
	getActiveCampaigns,
	getCampaignById,
	getOrCreateDefaultCampaign,
} from "@/lib/actions/campaigns";
import { db } from "@/lib/db";
import { communityBadges, organizations } from "@/lib/db/schema";

interface ComunidadPageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ campaign?: string }>;
}

async function MemberShowcase({
	slug,
	campaignId,
	currentUserId,
}: {
	slug: string;
	campaignId?: string | null;
	currentUserId: string | null;
}) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		with: {
			members: true,
		},
	});

	if (!community) return null;

	const activeCampaigns = await getActiveCampaigns(community.id);

	const allBadges = await db
		.select({
			id: communityBadges.id,
			badgeNumber: communityBadges.badgeNumber,
			shareToken: communityBadges.shareToken,
			generatedImageUrl: communityBadges.generatedImageUrl,
			generatedBackgroundUrl: communityBadges.generatedBackgroundUrl,
			campaignId: communityBadges.campaignId,
			status: communityBadges.status,
			userId: communityBadges.userId,
		})
		.from(communityBadges)
		.where(eq(communityBadges.communityId, community.id));

	const selectedCampaign = campaignId
		? await getCampaignById(campaignId)
		: null;

	const defaultCampaign = await getOrCreateDefaultCampaign(community.id);

	let canGenerate = false;
	let existingBadgeToken: string | null = null;
	let activeCampaignSlug: string | null = null;

	if (currentUserId) {
		const memberRole = await getUserMembershipRole(community.id, currentUserId);
		const isMember = memberRole && memberRole !== "follower";

		if (isMember) {
			const targetCampaignId = campaignId || defaultCampaign?.id;
			if (targetCampaignId) {
				const eligibility = await canGenerateBadgeForCampaign(
					targetCampaignId,
					currentUserId,
				);
				canGenerate = eligibility.allowed;

				const userBadge = allBadges.find(
					(b) =>
						b.userId === currentUserId && b.campaignId === targetCampaignId,
				);
				if (userBadge) {
					existingBadgeToken = userBadge.shareToken;
				}

				if (campaignId && selectedCampaign) {
					activeCampaignSlug = selectedCampaign.slug;
				}
			}
		}
	}

	const campaignsForFilter = activeCampaigns.map((c) => ({
		id: c.id,
		name: c.name,
		slug: c.slug,
		type: c.type,
		badgeIcon: c.badgeIcon,
	}));

	const campaignsForGrid = activeCampaigns.map((c) => ({
		id: c.id,
		name: c.name,
		type: c.type,
	}));

	const completedCount = allBadges.filter(
		(b) => b.status === "completed",
	).length;

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h2 className="text-lg font-semibold">Comunidad</h2>
						<p className="text-sm text-muted-foreground">
							{completedCount === 0
								? "Los badges aparecerán aquí"
								: `${completedCount} badges generados`}
						</p>
					</div>
					<CampaignFilterTabs
						campaigns={campaignsForFilter}
						activeCampaignId={campaignId}
					/>
				</div>

				<GenerateBadgeCTA
					communitySlug={slug}
					campaignSlug={activeCampaignSlug}
					campaignName={
						selectedCampaign?.type !== "default" ? selectedCampaign?.name : null
					}
					existingBadgeToken={existingBadgeToken}
					canGenerate={canGenerate}
					badgeEnabled={community.badgeEnabled ?? false}
					isAuthenticated={!!currentUserId}
				/>
			</div>

			<MemberShowcaseGrid
				badges={allBadges}
				campaigns={campaignsForGrid}
				communitySlug={slug}
				activeCampaignId={campaignId}
			/>
		</div>
	);
}

function ShowcaseSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<div className="h-5 bg-muted rounded w-24 animate-pulse" />
					<div className="h-4 bg-muted rounded w-32 animate-pulse" />
				</div>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
				{Array.from({ length: 10 }).map((_, i) => (
					<div
						key={i}
						className="aspect-square rounded-xl bg-muted animate-pulse"
					/>
				))}
			</div>
		</div>
	);
}

export async function generateMetadata({
	params,
}: ComunidadPageProps): Promise<Metadata> {
	const { slug } = await params;
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		return {
			title: "Comunidad no encontrada",
		};
	}

	return {
		title: `Comunidad - ${community.displayName || community.name}`,
		description: `Miembros y badges de ${community.displayName || community.name}`,
	};
}

export default async function ComunidadPage({
	params,
	searchParams,
}: ComunidadPageProps) {
	const { slug } = await params;
	const { campaign: campaignId } = await searchParams;
	const { userId } = await auth();

	return (
		<Suspense fallback={<ShowcaseSkeleton />}>
			<MemberShowcase
				slug={slug}
				campaignId={campaignId}
				currentUserId={userId}
			/>
		</Suspense>
	);
}
