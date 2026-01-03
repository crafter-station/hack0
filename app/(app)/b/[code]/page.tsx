import { and, eq, isNotNull } from "drizzle-orm";
import { Award, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	getActiveCampaigns,
	getOrCreateDefaultCampaign,
} from "@/lib/actions/campaigns";
import { db } from "@/lib/db";
import { BADGE_CAMPAIGN_TYPE_LABELS, organizations } from "@/lib/db/schema";

interface BadgePreviewPageProps {
	params: Promise<{ code: string }>;
}

async function getOrganizationByShortCode(code: string) {
	return db.query.organizations.findFirst({
		where: and(
			isNotNull(organizations.shortCode),
			eq(organizations.shortCode, code),
		),
	});
}

export async function generateMetadata({
	params,
}: BadgePreviewPageProps): Promise<Metadata> {
	const { code } = await params;
	const community = await getOrganizationByShortCode(code);

	if (!community) {
		return { title: "Badge no encontrado" };
	}

	return {
		title: `Genera tu Badge - ${community.displayName || community.name}`,
		description: `Crea tu badge personalizado de ${community.displayName || community.name} con IA`,
	};
}

export default async function BadgePreviewPage({
	params,
}: BadgePreviewPageProps) {
	const { code } = await params;

	const community = await getOrganizationByShortCode(code);

	if (!community) {
		notFound();
	}

	if (!community.badgeEnabled) {
		redirect(`/c/${community.slug}`);
	}

	const activeCampaigns = await getActiveCampaigns(community.id);

	const defaultCampaign = await getOrCreateDefaultCampaign(community.id);
	const hasOnlyDefault =
		activeCampaigns.length === 0 ||
		(activeCampaigns.length === 1 && activeCampaigns[0].type === "default");

	if (hasOnlyDefault) {
		redirect(`/c/${community.slug}/badge`);
	}

	return (
		<main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
			<div className="w-full max-w-lg space-y-8">
				<div className="text-center space-y-4">
					{community.logoUrl && (
						<Image
							src={community.logoUrl}
							alt={community.name}
							width={64}
							height={64}
							className="mx-auto rounded-xl"
						/>
					)}
					<div>
						<h1 className="text-2xl font-bold">
							{community.displayName || community.name}
						</h1>
						<p className="text-muted-foreground mt-1">
							Elige una campaña para generar tu badge
						</p>
					</div>
				</div>

				<div className="space-y-3">
					{activeCampaigns.map((campaign) => {
						const isDefault = campaign.type === "default";
						const href = isDefault
							? `/c/${community.slug}/badge`
							: `/c/${community.slug}/badge?campaign=${campaign.slug}`;

						return (
							<Link
								key={campaign.id}
								href={href}
								className="block rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors group"
							>
								<div className="flex items-center gap-4">
									<div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted group-hover:bg-background transition-colors">
										{campaign.badgeIcon ? (
											<span className="text-2xl">{campaign.badgeIcon}</span>
										) : isDefault ? (
											<Award className="h-5 w-5 text-muted-foreground" />
										) : (
											<Sparkles className="h-5 w-5 text-muted-foreground" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-medium">{campaign.name}</span>
											{!isDefault && (
												<Badge variant="secondary" className="text-xs">
													{BADGE_CAMPAIGN_TYPE_LABELS[campaign.type]}
												</Badge>
											)}
										</div>
										{campaign.description && (
											<p className="text-sm text-muted-foreground truncate mt-0.5">
												{campaign.description}
											</p>
										)}
									</div>
									<div className="shrink-0">
										<Button size="sm" variant="ghost">
											Generar
										</Button>
									</div>
								</div>
							</Link>
						);
					})}
				</div>

				<div className="text-center pt-4">
					<Button asChild variant="outline" size="sm">
						<Link href={`/c/${community.slug}`}>Ver comunidad</Link>
					</Button>
				</div>
			</div>
		</main>
	);
}
