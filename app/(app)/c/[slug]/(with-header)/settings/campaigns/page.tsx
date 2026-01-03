import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignList } from "@/components/communities/campaign-list";
import { Button } from "@/components/ui/button";
import { getCampaignsForCommunity } from "@/lib/actions/campaigns";
import { getOrganizationBySlug } from "@/lib/actions/organizations";

interface CampaignsPageProps {
	params: Promise<{ slug: string }>;
}

export default async function CampaignsPage({ params }: CampaignsPageProps) {
	const { slug } = await params;

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		notFound();
	}

	const campaigns = await getCampaignsForCommunity(org.id);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Campañas de Badges</h3>
					<p className="text-sm text-muted-foreground">
						Crea campañas estacionales o por evento para generar badges únicos
					</p>
				</div>
				<Button asChild size="sm" className="gap-2">
					<Link href={`/c/${slug}/settings/campaigns/new`}>
						<Plus className="h-4 w-4" />
						Nueva campaña
					</Link>
				</Button>
			</div>

			{campaigns.length === 0 ? (
				<div className="rounded-lg border border-dashed border-border p-12 text-center">
					<Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
					<h4 className="text-sm font-medium mb-1">Sin campañas</h4>
					<p className="text-sm text-muted-foreground mb-4">
						Crea tu primera campaña para habilitar badges con estilos únicos
					</p>
					<Button asChild variant="outline" size="sm">
						<Link href={`/c/${slug}/settings/campaigns/new`}>
							Crear campaña
						</Link>
					</Button>
				</div>
			) : (
				<CampaignList campaigns={campaigns} communitySlug={slug} />
			)}
		</div>
	);
}
