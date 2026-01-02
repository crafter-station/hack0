import { notFound } from "next/navigation";
import { CommunitySettingsForm } from "@/components/communities/community-settings-form";
import { getOrganizationBySlug } from "@/lib/actions/organizations";

interface SettingsPageProps {
	params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
	const { slug } = await params;

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		notFound();
	}

	return (
		<div className="space-y-8">
			<CommunitySettingsForm organization={org} />
		</div>
	);
}
