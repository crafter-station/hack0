import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrgEventFormMinimal } from "@/components/communities/org-event-form-minimal";
import { getUserCommunityRole } from "@/lib/actions/community-members";
import { getOrganizationBySlug } from "@/lib/actions/organizations";
import { isGodMode } from "@/lib/god-mode";

interface NewEventPageProps {
	params: Promise<{ slug: string }>;
}

export default async function NewEventPage({ params }: NewEventPageProps) {
	const { slug } = await params;
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		redirect("/c/new");
	}

	// Check god mode before checking ownership
	const godMode = await isGodMode();

	if (!godMode) {
		const userRole = await getUserCommunityRole(org.id);

		if (userRole !== "owner" && userRole !== "admin") {
			redirect(`/c/${slug}`);
		}
	}

	return (
		<main className="flex-1 w-full py-4 md:py-6">
			<OrgEventFormMinimal
				communityId={org.id}
				communityName={org.displayName || org.name}
				communityLogo={org.logoUrl}
				communitySlug={slug}
			/>
		</main>
	);
}
