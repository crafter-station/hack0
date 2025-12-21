import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateTypeSelector } from "@/components/communities/create-type-selector";
import { getUserCommunityRole } from "@/lib/actions/community-members";
import { getOrganizationBySlug } from "@/lib/actions/organizations";
import { isGodMode } from "@/lib/god-mode";

interface NewPageProps {
	params: Promise<{ slug: string }>;
}

export default async function NewPage({ params }: NewPageProps) {
	const { slug } = await params;
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		redirect("/c/new");
	}

	const godMode = await isGodMode();

	if (!godMode) {
		const userRole = await getUserCommunityRole(org.id);

		if (userRole !== "owner" && userRole !== "admin") {
			redirect(`/c/${slug}`);
		}
	}

	return (
		<main className="flex-1 w-full py-8 md:py-12">
			<div className="mx-auto max-w-3xl px-4">
				<div className="text-center mb-10">
					<h1 className="text-2xl font-semibold tracking-tight mb-2">
						¿Qué quieres crear?
					</h1>
					<p className="text-muted-foreground">
						Selecciona el tipo de evento que deseas publicar
					</p>
				</div>

				<CreateTypeSelector
					communitySlug={slug}
					communityName={org.displayName || org.name}
				/>
			</div>
		</main>
	);
}
