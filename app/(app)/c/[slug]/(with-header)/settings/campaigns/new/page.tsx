import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/communities/campaign-form";
import { getOrganizationBySlug } from "@/lib/actions/organizations";

interface NewCampaignPageProps {
	params: Promise<{ slug: string }>;
}

export default async function NewCampaignPage({
	params,
}: NewCampaignPageProps) {
	const { slug } = await params;

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold">Nueva Campaña</h3>
				<p className="text-sm text-muted-foreground">
					Configura los detalles de tu nueva campaña de badges
				</p>
			</div>

			<CampaignForm communityId={org.id} communitySlug={slug} community={org} />
		</div>
	);
}
