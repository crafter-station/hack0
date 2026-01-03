import { notFound } from "next/navigation";
import { OrgSettingsForm } from "@/components/org/settings";
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
			<OrgSettingsForm organization={org} />
		</div>
	);
}
