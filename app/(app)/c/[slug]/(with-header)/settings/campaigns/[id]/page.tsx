import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/org/campaigns";
import { getCampaignById } from "@/lib/actions/campaigns";
import { getOrganizationBySlug } from "@/lib/actions/organizations";

interface EditCampaignPageProps {
	params: Promise<{ slug: string; id: string }>;
}

export default async function EditCampaignPage({
	params,
}: EditCampaignPageProps) {
	const { slug, id } = await params;

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		notFound();
	}

	const campaign = await getCampaignById(id);

	if (!campaign || campaign.communityId !== org.id) {
		notFound();
	}

	const isDefault = campaign.type === "default";

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold">
					{isDefault ? "Campaña Principal" : "Editar Campaña"}
				</h3>
				<p className="text-sm text-muted-foreground">
					{isDefault
						? "Configura el estilo de tu badge principal"
						: "Modifica los detalles de la campaña"}
				</p>
			</div>

			<CampaignForm
				communityId={org.id}
				communitySlug={slug}
				community={org}
				campaign={campaign}
			/>
		</div>
	);
}
