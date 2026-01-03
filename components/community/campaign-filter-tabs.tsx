"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Campaign {
	id: string;
	name: string;
	slug: string;
	type: "default" | "seasonal" | "event";
	badgeIcon?: string | null;
}

interface CampaignFilterTabsProps {
	campaigns: Campaign[];
	activeCampaignId?: string | null;
}

export function CampaignFilterTabs({
	campaigns,
	activeCampaignId,
}: CampaignFilterTabsProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const handleSelect = (campaignId: string | null) => {
		const params = new URLSearchParams(searchParams.toString());
		if (campaignId) {
			params.set("campaign", campaignId);
		} else {
			params.delete("campaign");
		}
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	if (campaigns.length <= 1) {
		return null;
	}

	return (
		<div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
			<button
				type="button"
				onClick={() => handleSelect(null)}
				className={cn(
					"shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
					!activeCampaignId
						? "bg-foreground text-background"
						: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
				)}
			>
				Todos
			</button>
			{campaigns.map((campaign) => (
				<button
					key={campaign.id}
					type="button"
					onClick={() => handleSelect(campaign.id)}
					className={cn(
						"shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
						activeCampaignId === campaign.id
							? "bg-foreground text-background"
							: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
					)}
				>
					{campaign.badgeIcon && <span>{campaign.badgeIcon}</span>}
					{campaign.type === "default" ? "General" : campaign.name}
				</button>
			))}
		</div>
	);
}
