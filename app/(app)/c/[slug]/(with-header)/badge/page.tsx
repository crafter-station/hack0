import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeGenerator } from "@/components/org/badges";
import { Button } from "@/components/ui/button";
import { getUserMembershipRole } from "@/lib/actions/badges";
import {
	canGenerateBadgeForCampaign,
	getCampaignBySlug,
	getOrCreateDefaultCampaign,
} from "@/lib/actions/campaigns";
import { db } from "@/lib/db";
import { communityBadges, organizations } from "@/lib/db/schema";

interface BadgePageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ campaign?: string }>;
}

export async function generateMetadata({
	params,
}: BadgePageProps): Promise<Metadata> {
	const { slug } = await params;
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		return { title: "Comunidad no encontrada" };
	}

	return {
		title: `Genera tu badge - ${community.displayName || community.name}`,
		description: `Crea tu badge personalizado de ${community.displayName || community.name} con IA`,
	};
}

export default async function BadgePage({
	params,
	searchParams,
}: BadgePageProps) {
	const { slug } = await params;
	const { campaign: campaignSlug } = await searchParams;
	const { userId } = await auth();

	if (!userId) {
		const redirectUrl = campaignSlug
			? `/c/${slug}/badge?campaign=${campaignSlug}`
			: `/c/${slug}/badge`;
		redirect(`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
	}

	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<h1 className="text-2xl font-bold mb-2">Comunidad no encontrada</h1>
				<p className="text-muted-foreground mb-4">
					La comunidad que buscas no existe
				</p>
				<Button asChild variant="outline">
					<Link href="/c">Ver comunidades</Link>
				</Button>
			</div>
		);
	}

	if (!community.badgeEnabled) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<h1 className="text-2xl font-bold mb-2">Badges no disponibles</h1>
				<p className="text-muted-foreground mb-4">
					Esta comunidad aún no ha habilitado la generación de badges
				</p>
				<Button asChild variant="outline">
					<Link href={`/c/${slug}`}>Volver a la comunidad</Link>
				</Button>
			</div>
		);
	}

	const memberRole = await getUserMembershipRole(community.id, userId);

	if (!memberRole || memberRole === "follower") {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<h1 className="text-2xl font-bold mb-2">Acceso restringido</h1>
				<p className="text-muted-foreground mb-4">
					Solo los miembros verificados pueden generar badges.
					{memberRole === "follower"
						? " Solicita ser miembro para acceder."
						: " Únete a la comunidad primero."}
				</p>
				<Button asChild variant="outline">
					<Link href={`/c/${slug}`}>Volver a la comunidad</Link>
				</Button>
			</div>
		);
	}

	const campaign = campaignSlug
		? await getCampaignBySlug(community.id, campaignSlug)
		: await getOrCreateDefaultCampaign(community.id);

	if (!campaign) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<h1 className="text-2xl font-bold mb-2">Campaña no encontrada</h1>
				<p className="text-muted-foreground mb-4">
					La campaña que buscas no existe o ha finalizado
				</p>
				<Button asChild variant="outline">
					<Link href={`/c/${slug}`}>Volver a la comunidad</Link>
				</Button>
			</div>
		);
	}

	const eligibility = await canGenerateBadgeForCampaign(campaign.id, userId);

	if (!eligibility.allowed) {
		const [existingBadge] = await db
			.select()
			.from(communityBadges)
			.where(
				and(
					eq(communityBadges.campaignId, campaign.id),
					eq(communityBadges.userId, userId),
				),
			)
			.limit(1);

		if (existingBadge) {
			return (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<h1 className="text-2xl font-bold mb-2">Ya tienes un badge</h1>
					<p className="text-muted-foreground mb-4">
						Ya generaste tu badge para{" "}
						{campaign.type === "default"
							? "esta comunidad"
							: `"${campaign.name}"`}
					</p>
					<div className="flex gap-3">
						<Button asChild variant="outline">
							<Link href={`/c/${slug}/badge/${existingBadge.shareToken}`}>
								Ver mi badge
							</Link>
						</Button>
						<Button asChild variant="ghost">
							<Link href={`/c/${slug}`}>Volver a la comunidad</Link>
						</Button>
					</div>
				</div>
			);
		}

		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<h1 className="text-2xl font-bold mb-2">No disponible</h1>
				<p className="text-muted-foreground mb-4">
					{eligibility.reason || "No puedes generar un badge en este momento"}
				</p>
				<Button asChild variant="outline">
					<Link href={`/c/${slug}`}>Volver a la comunidad</Link>
				</Button>
			</div>
		);
	}

	const clerk = await clerkClient();
	let defaultName = "";
	try {
		const user = await clerk.users.getUser(userId);
		defaultName = user.firstName || user.username || "";
	} catch {
		// Ignore
	}

	return (
		<div className="flex flex-col items-center justify-center py-8">
			<BadgeGenerator
				communitySlug={slug}
				communityName={community.displayName || community.name}
				communityLogo={community.logoUrl}
				memberRole={memberRole}
				defaultName={defaultName}
				campaignId={campaign.id}
				campaignName={campaign.type !== "default" ? campaign.name : undefined}
			/>
		</div>
	);
}
