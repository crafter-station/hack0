import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getAllUserOrganizations } from "@/lib/actions/organizations";
import { OrganizationSelector } from "@/components/dashboard/organization-selector";

export const metadata = {
  title: "Dashboard - hack0",
  description: "Administra tus comunidades",
};

export default async function DashboardPage() {
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
    <div className="py-8 px-4">
      <OrganizationSelector organizations={organizations} />
    </div>
  );
}
