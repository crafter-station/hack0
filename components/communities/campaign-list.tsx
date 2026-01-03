"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	Calendar,
	MoreHorizontal,
	Pencil,
	Play,
	Square,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	activateCampaign,
	deleteCampaign,
	endCampaign,
} from "@/lib/actions/campaigns";
import {
	BADGE_CAMPAIGN_STATUS_LABELS,
	BADGE_CAMPAIGN_TYPE_LABELS,
	type BadgeCampaign,
} from "@/lib/db/schema";

interface CampaignListProps {
	campaigns: BadgeCampaign[];
	communitySlug: string;
}

const statusVariants: Record<
	BadgeCampaign["status"],
	"default" | "secondary" | "outline" | "destructive"
> = {
	draft: "secondary",
	active: "default",
	ended: "outline",
	archived: "destructive",
};

export function CampaignList({ campaigns, communitySlug }: CampaignListProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [loadingId, setLoadingId] = useState<string | null>(null);

	const handleActivate = async (campaignId: string) => {
		setLoadingId(campaignId);
		startTransition(async () => {
			await activateCampaign(campaignId);
			router.refresh();
			setLoadingId(null);
		});
	};

	const handleEnd = async (campaignId: string) => {
		setLoadingId(campaignId);
		startTransition(async () => {
			await endCampaign(campaignId);
			router.refresh();
			setLoadingId(null);
		});
	};

	const handleDelete = async (campaignId: string) => {
		if (
			!confirm(
				"¿Estás seguro de eliminar esta campaña? Se eliminarán todos los badges asociados.",
			)
		) {
			return;
		}
		setLoadingId(campaignId);
		startTransition(async () => {
			await deleteCampaign(campaignId);
			router.refresh();
			setLoadingId(null);
		});
	};

	return (
		<div className="rounded-lg border border-border divide-y divide-border">
			{campaigns.map((campaign) => {
				const isLoading = loadingId === campaign.id;
				const isDefault = campaign.type === "default";

				return (
					<div
						key={campaign.id}
						className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
					>
						<div className="flex items-center gap-4 min-w-0">
							<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
								{campaign.badgeIcon ? (
									<span className="text-lg">{campaign.badgeIcon}</span>
								) : (
									<Calendar className="h-4 w-4 text-muted-foreground" />
								)}
							</div>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<Link
										href={`/c/${communitySlug}/settings/campaigns/${campaign.id}`}
										className="font-medium hover:underline truncate"
									>
										{campaign.name}
									</Link>
									<Badge variant={statusVariants[campaign.status]}>
										{BADGE_CAMPAIGN_STATUS_LABELS[campaign.status]}
									</Badge>
									{isDefault && (
										<Badge variant="outline" className="text-xs">
											Principal
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
									<span>{BADGE_CAMPAIGN_TYPE_LABELS[campaign.type]}</span>
									<span>•</span>
									<span>{campaign.badgesGenerated} badges generados</span>
									{campaign.startsAt && (
										<>
											<span>•</span>
											<span>
												Inicia{" "}
												{formatDistanceToNow(campaign.startsAt, {
													addSuffix: true,
													locale: es,
												})}
											</span>
										</>
									)}
								</div>
							</div>
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									disabled={isLoading}
									className="h-8 w-8"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link
										href={`/c/${communitySlug}/settings/campaigns/${campaign.id}`}
									>
										<Pencil className="h-4 w-4 mr-2" />
										Editar
									</Link>
								</DropdownMenuItem>

								{campaign.status === "draft" && (
									<DropdownMenuItem onClick={() => handleActivate(campaign.id)}>
										<Play className="h-4 w-4 mr-2" />
										Activar
									</DropdownMenuItem>
								)}

								{campaign.status === "active" && (
									<DropdownMenuItem onClick={() => handleEnd(campaign.id)}>
										<Square className="h-4 w-4 mr-2" />
										Finalizar
									</DropdownMenuItem>
								)}

								{!isDefault && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => handleDelete(campaign.id)}
											className="text-red-600 focus:text-red-600"
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Eliminar
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			})}
		</div>
	);
}
