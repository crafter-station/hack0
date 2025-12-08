import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserOrganization } from "@/lib/actions/organizations";

export default async function DashboardRedirect() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const organization = await getUserOrganization();

  if (organization) {
    redirect(`/c/${organization.slug}`);
  }

  redirect("/onboarding");
}
