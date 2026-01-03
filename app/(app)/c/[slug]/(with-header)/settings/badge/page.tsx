import { notFound } from "next/navigation";
import { BadgeSettingsForm } from "@/components/org/badges";
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
			<BadgeSettingsForm organization={org} />
		</div>
	);
}
