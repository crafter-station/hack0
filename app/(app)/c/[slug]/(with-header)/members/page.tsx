import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { GenerateBadgeCTA } from "@/components/org/badges";
import { CampaignFilterTabs } from "@/components/org/campaigns";
import {
	MemberShowcaseGrid,
	MembersManagement,
} from "@/components/org/members";
import { Separator } from "@/components/ui/separator";
import { getUserMembershipRole } from "@/lib/actions/badges";
import {
	canGenerateBadgeForCampaign,
	getActiveCampaigns,
	getCampaignById,
	getOrCreateDefaultCampaign,
} from "@/lib/actions/campaigns";
import {
	getOrganizationInvites,
	getUserCommunityRole,
} from "@/lib/actions/community-members";
import { db } from "@/lib/db";
import { communityBadges, organizations } from "@/lib/db/schema";
import { isGodMode } from "@/lib/god-mode";

interface MembersPageProps {
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

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h2 className="text-lg font-semibold">Miembros</h2>
						<p className="text-sm text-muted-foreground">
							{allBadges.filter((b) => b.status === "completed").length === 0
								? "Los badges aparecerán aquí"
								: `${allBadges.filter((b) => b.status === "completed").length} badges generados`}
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

async function AdminSection({
	slug,
	currentUserId,
}: {
	slug: string;
	currentUserId: string | null;
}) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		with: {
			members: true,
		},
	});

	if (!community) return null;

	const godMode = await isGodMode();
	const userRole = await getUserCommunityRole(community.id);
	const isOwner = currentUserId === community.ownerUserId;
	const currentMember = community.members.find(
		(m) => m.userId === currentUserId,
	);
	const isAdmin = currentMember?.role === "admin";
	const canManage = isOwner || isAdmin || godMode;

	if (!canManage) return null;

	const GHOST_ADMIN_ID = "user_36EEeOvb4zfhKhIVSfK46or5pkC";
	const isCrafterStation = slug === "crafter-station";

	const clerk = await clerkClient();
	const uniqueMemberIds = community.members
		.map((m) => m.userId)
		.filter((id) => id !== community.ownerUserId);

	let memberUserIds = [community.ownerUserId, ...uniqueMemberIds];

	if (!isCrafterStation) {
		memberUserIds = memberUserIds.filter((id) => id !== GHOST_ADMIN_ID);
	}

	const users = await Promise.all(
		memberUserIds.map(async (userId) => {
			try {
				return await clerk.users.getUser(userId);
			} catch {
				return null;
			}
		}),
	);

	const validUsers = users.filter(
		(user): user is NonNullable<typeof user> => user !== null,
	);

	const invites = await getOrganizationInvites(community.id);

	const filteredMembers = community.members.filter((m) => {
		if (m.userId === community.ownerUserId) return false;
		if (!isCrafterStation && m.userId === GHOST_ADMIN_ID) return false;
		return true;
	});

	return (
		<>
			<Separator className="my-8" />
			<div className="space-y-4">
				<h2 className="text-lg font-semibold">Gestión de miembros</h2>
				<MembersManagement
					communitySlug={slug}
					communityId={community.id}
					ownerUserId={community.ownerUserId}
					members={filteredMembers}
					invites={invites}
					users={validUsers.map((u) => ({
						id: u.id,
						firstName: u.firstName,
						lastName: u.lastName,
						emailAddresses: u.emailAddresses.map((e) => ({
							emailAddress: e.emailAddress,
						})),
						imageUrl: u.imageUrl,
					}))}
					currentUserId={currentUserId}
					isOwner={isOwner}
					isAdmin={isAdmin}
					isGodMode={godMode}
				/>
			</div>
		</>
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
}: MembersPageProps): Promise<Metadata> {
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
		title: `Miembros - ${community.displayName || community.name}`,
		description: `Miembros y badges de ${community.displayName || community.name}`,
	};
}

export default async function MembersPage({
	params,
	searchParams,
}: MembersPageProps) {
	const { slug } = await params;
	const { campaign: campaignId } = await searchParams;
	const { userId } = await auth();

	return (
		<div className="space-y-6">
			<Suspense fallback={<ShowcaseSkeleton />}>
				<MemberShowcase
					slug={slug}
					campaignId={campaignId}
					currentUserId={userId}
				/>
			</Suspense>
			<Suspense fallback={null}>
				<AdminSection slug={slug} currentUserId={userId} />
			</Suspense>
		</div>
	);
}
