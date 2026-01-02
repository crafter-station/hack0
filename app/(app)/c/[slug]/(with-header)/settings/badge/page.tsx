import { notFound } from "next/navigation";
import { BadgeSettingsForm } from "@/components/communities/badge-settings-form";
import { getOrganizationBySlug } from "@/lib/actions/organizations";

interface BadgeSettingsPageProps {
	params: Promise<{ slug: string }>;
}

export default async function BadgeSettingsPage({
	params,
}: BadgeSettingsPageProps) {
	const { slug } = await params;

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold">Badge Settings</h3>
				<p className="text-sm text-muted-foreground">
					Configura los badges de tu comunidad
				</p>
			</div>

			<BadgeSettingsForm organization={org} />
		</div>
	);
}
