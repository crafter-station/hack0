import { CheckCircle2 } from "lucide-react";
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
			{org.isVerified && (
				<div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-500/20">
					<CheckCircle2 className="h-4 w-4" />
					Comunidad verificada
				</div>
			)}

			<CommunitySettingsForm organization={org} />
		</div>
	);
}
