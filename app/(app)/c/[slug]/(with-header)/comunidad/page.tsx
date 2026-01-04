import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BadgeSection } from "@/components/org/badges";
import { getUserMembershipRole } from "@/lib/actions/badges";
import {
	canGenerateBadgeForCampaign,
	getActiveCampaigns,
	getOrCreateDefaultCampaign,
} from "@/lib/actions/campaigns";
import { db } from "@/lib/db";
import { communityBadges, organizations } from "@/lib/db/schema";

interface ComunidadPageProps {
	params: Promise<{ slug: string }>;
}

interface Badge {
	id: string;
	badgeNumber: number;
	shareToken: string;
	generatedImageUrl: string | null;
	generatedBackgroundUrl: string | null;
	campaignId: string | null;
	status: "pending" | "completed" | "failed" | "generating" | null;
	userId: string;
}

interface SectionData {
	campaignId: string;
	title: string;
	slug: string;
	icon: string | null;
	isDefault: boolean;
	badges: Badge[];
	canGenerate: boolean;
	existingBadgeToken: string | null;
}

async function MemberShowcase({
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

	const defaultCampaign = await getOrCreateDefaultCampaign(community.id);
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

	let memberRole: string | null = null;
	let isMember = false;

	if (currentUserId) {
		memberRole = await getUserMembershipRole(community.id, currentUserId);
		isMember = !!memberRole && memberRole !== "follower";
	}

	const sections: SectionData[] = [];

	if (defaultCampaign) {
		const defaultBadges = allBadges.filter(
			(b) => b.campaignId === defaultCampaign.id,
		);
		const userDefaultBadge = defaultBadges.find(
			(b) => b.userId === currentUserId,
		);

		let canGenerateDefault = false;
		if (currentUserId && isMember) {
			const eligibility = await canGenerateBadgeForCampaign(
				defaultCampaign.id,
				currentUserId,
			);
			canGenerateDefault = eligibility.allowed;
		}

		sections.push({
			campaignId: defaultCampaign.id,
			title: "Miembros",
			slug: defaultCampaign.slug,
			icon: null,
			isDefault: true,
			badges: defaultBadges,
			canGenerate: canGenerateDefault,
			existingBadgeToken: userDefaultBadge?.shareToken || null,
		});
	}

	const nonDefaultCampaigns = activeCampaigns.filter(
		(c) => c.type !== "default",
	);

	for (const campaign of nonDefaultCampaigns) {
		const campaignBadges = allBadges.filter(
			(b) => b.campaignId === campaign.id,
		);
		const userCampaignBadge = campaignBadges.find(
			(b) => b.userId === currentUserId,
		);

		let canGenerateCampaign = false;
		if (currentUserId && isMember) {
			const eligibility = await canGenerateBadgeForCampaign(
				campaign.id,
				currentUserId,
			);
			canGenerateCampaign = eligibility.allowed;
		}

		sections.push({
			campaignId: campaign.id,
			title: campaign.name,
			slug: campaign.slug,
			icon: campaign.badgeIcon,
			isDefault: false,
			badges: campaignBadges,
			canGenerate: canGenerateCampaign,
			existingBadgeToken: userCampaignBadge?.shareToken || null,
		});
	}

	const totalBadges = allBadges.filter((b) => b.status === "completed").length;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Comunidad</h2>
				<p className="text-sm text-muted-foreground">
					{totalBadges === 0
						? "Los badges aparecerán aquí"
						: `${totalBadges} badges generados`}
				</p>
			</div>

			<div className="space-y-4">
				{sections.map((section) => (
					<BadgeSection
						key={section.campaignId}
						title={section.title}
						icon={section.icon}
						badges={section.badges}
						isDefault={section.isDefault}
						defaultExpanded={section.isDefault}
						communitySlug={slug}
						campaignSlug={section.isDefault ? null : section.slug}
						canGenerate={section.canGenerate}
						existingBadgeToken={section.existingBadgeToken}
						isAuthenticated={!!currentUserId}
						badgeEnabled={community.badgeEnabled ?? false}
					/>
				))}
			</div>

			{sections.length === 0 && (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<p className="text-muted-foreground">
						No hay campañas de badges activas
					</p>
				</div>
			)}
		</div>
	);
}

function ShowcaseSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<div className="h-5 bg-muted rounded w-24 animate-pulse" />
				<div className="h-4 bg-muted rounded w-32 animate-pulse" />
			</div>
			<div className="space-y-4">
				<div className="rounded-lg border p-4">
					<div className="flex items-center gap-3">
						<div className="h-4 w-4 bg-muted rounded animate-pulse" />
						<div className="h-5 bg-muted rounded w-32 animate-pulse" />
					</div>
				</div>
				<div className="rounded-lg border p-4">
					<div className="flex items-center gap-3">
						<div className="h-4 w-4 bg-muted rounded animate-pulse" />
						<div className="h-5 bg-muted rounded w-40 animate-pulse" />
					</div>
				</div>
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

export default async function ComunidadPage({ params }: ComunidadPageProps) {
	const { slug } = await params;
	const { userId } = await auth();

	return (
		<Suspense fallback={<ShowcaseSkeleton />}>
			<MemberShowcase slug={slug} currentUserId={userId} />
		</Suspense>
	);
}
