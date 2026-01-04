import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrgSettingsForm } from "@/components/org/settings";
import { getOrganizationBySlug } from "@/lib/actions/organizations";

interface SettingsPageProps {
	params: Promise<{ slug: string }>;
}

function SettingsSkeleton() {
	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<div className="h-6 bg-muted rounded w-32 animate-pulse" />
				<div className="space-y-3">
					<div className="h-10 bg-muted rounded animate-pulse" />
					<div className="h-10 bg-muted rounded animate-pulse" />
					<div className="h-24 bg-muted rounded animate-pulse" />
				</div>
			</div>
		</div>
	);
}

async function SettingsContent({ slug }: { slug: string }) {
	const org = await getOrganizationBySlug(slug);

	if (!org) {
		notFound();
	}

	return <OrgSettingsForm organization={org} />;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
	const { slug } = await params;

	return (
		<div className="space-y-8">
			<Suspense fallback={<SettingsSkeleton />}>
				<SettingsContent slug={slug} />
			</Suspense>
		</div>
	);
}
