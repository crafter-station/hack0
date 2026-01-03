import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { SettingsSidebar } from "@/components/org/settings";
import {
	canManageOrganization,
	getOrganizationBySlug,
} from "@/lib/actions/organizations";
import { isGodMode } from "@/lib/god-mode";

interface SettingsLayoutProps {
	children: React.ReactNode;
	params: Promise<{ slug: string }>;
}

export default async function SettingsLayout({
	children,
	params,
}: SettingsLayoutProps) {
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
		<div className="flex flex-col md:flex-row gap-8">
			<SettingsSidebar slug={slug} />
			<div className="flex-1 min-w-0">{children}</div>
		</div>
	);
}
