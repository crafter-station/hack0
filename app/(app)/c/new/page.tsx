import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CommunityCreateForm } from "@/components/communities/community-create-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default async function NewCommunityPage() {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />
			<main className="flex-1 w-full py-4 md:py-6 min-h-[calc(100vh-4rem)]">
				<CommunityCreateForm />
			</main>
			<SiteFooter />
		</div>
	);
}
