"use client";

import { Award } from "lucide-react";
import { MemberShowcaseCard } from "./member-showcase-card";

interface Badge {
	id: string;
	badgeNumber: number;
	shareToken: string;
	generatedImageUrl: string | null;
	generatedBackgroundUrl: string | null;
	campaignId: string | null;
	status: string;
}

interface Campaign {
	id: string;
	name: string;
	type: "default" | "seasonal" | "event";
}

interface MemberShowcaseGridProps {
	badges: Badge[];
	campaigns: Campaign[];
	communitySlug: string;
	activeCampaignId?: string | null;
}

export function MemberShowcaseGrid({
	badges,
	campaigns,
	communitySlug,
	activeCampaignId,
}: MemberShowcaseGridProps) {
	const completedBadges = badges.filter((b) => b.status === "completed");

	const filteredBadges = activeCampaignId
		? completedBadges.filter((b) => b.campaignId === activeCampaignId)
		: completedBadges;

	const getCampaignName = (campaignId: string | null) => {
		if (!campaignId) return null;
		const campaign = campaigns.find((c) => c.id === campaignId);
		if (!campaign) return null;
		return campaign.type === "default" ? null : campaign.name;
	};

	if (filteredBadges.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border p-12 text-center">
				<div className="flex justify-center mb-4">
					<div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
						<Award className="h-7 w-7 text-muted-foreground" />
					</div>
				</div>
				<h3 className="text-sm font-medium mb-1">
					{activeCampaignId
						? "Sin badges en esta campaña"
						: "Aún no hay badges"}
				</h3>
				<p className="text-sm text-muted-foreground">
					{activeCampaignId
						? "Sé el primero en generar tu badge para esta campaña"
						: "Los badges de los miembros aparecerán aquí"}
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
			{filteredBadges.map((badge) => (
				<MemberShowcaseCard
					key={badge.id}
					badgeId={badge.id}
					badgeNumber={badge.badgeNumber}
					shareToken={badge.shareToken}
					generatedImageUrl={badge.generatedImageUrl}
					generatedBackgroundUrl={badge.generatedBackgroundUrl}
					communitySlug={communitySlug}
					campaignName={getCampaignName(badge.campaignId)}
				/>
			))}
		</div>
	);
}
