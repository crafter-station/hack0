import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { BadgeSettingsForm } from "@/components/communities/badge-settings-form";
import {
	canManageOrganization,
	getOrganizationBySlug,
} from "@/lib/actions/organizations";
import { isGodMode } from "@/lib/god-mode";

interface BadgesAdminPageProps {
	params: Promise<{ slug: string }>;
}

export default async function BadgesAdminPage({ params }: BadgesAdminPageProps) {
	const { slug } = await params;
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		notFound();
	}

	const godMode = await isGodMode();
	const canManage = await canManageOrganization(org.id);

	if (!canManage && !godMode) {
		redirect(`/c/${slug}`);
	}

	return (
		<div className="max-w-2xl mx-auto py-8">
			<BadgeSettingsForm organization={org} />
		</div>
	);
}
