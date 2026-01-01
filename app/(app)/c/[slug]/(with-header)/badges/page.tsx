import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import {
	canManageOrganization,
	getOrganizationBySlug,
} from "@/lib/actions/organizations";
import { isGodMode } from "@/lib/god-mode";

interface BadgesPageProps {
	params: Promise<{ slug: string }>;
}

export default async function BadgesPage({ params }: BadgesPageProps) {
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
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Badges</h2>
				<p className="text-sm text-muted-foreground">
					Gestiona los badges de tu comunidad
				</p>
			</div>

			<div className="rounded-lg border border-dashed p-8 text-center">
				<p className="text-muted-foreground">
					Los badges de la comunidad aparecerán aquí
				</p>
			</div>
		</div>
	);
}
