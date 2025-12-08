import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getAllUserOrganizations } from "@/lib/actions/organizations";
import { OrganizationSelector } from "@/components/dashboard/organization-selector";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
	title: "Comunidades - hack0",
	description: "Administra tus comunidades",
};

export default async function CommunitiesPage() {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const organizations = await getAllUserOrganizations();

	if (organizations.length === 1) {
		redirect(`/c/${organizations[0].organization.slug}`);
	}

	if (organizations.length === 0) {
		redirect("/onboarding");
	}

	return (
		<>
			<SiteHeader />
			<main className="min-h-screen py-12 px-4">
				<OrganizationSelector organizations={organizations} />
			</main>
			<SiteFooter />
		</>
	);
}
