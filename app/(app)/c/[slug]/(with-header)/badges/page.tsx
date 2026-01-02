import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeDisplay } from "@/components/community/badge-display";
import { Button } from "@/components/ui/button";
import { getCommunityBadges } from "@/lib/actions/badges";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

interface BadgesGalleryPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: BadgesGalleryPageProps): Promise<Metadata> {
	const { slug } = await params;
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		return { title: "Comunidad no encontrada" };
	}

	return {
		title: `Badges - ${community.displayName || community.name}`,
		description: `Galería de badges de ${community.displayName || community.name}`,
	};
}

export default async function BadgesGalleryPage({
	params,
}: BadgesGalleryPageProps) {
	const { slug } = await params;

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

	const badges = await getCommunityBadges(slug, 100);

	if (badges.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<h1 className="text-2xl font-bold mb-2">Sin badges aún</h1>
				<p className="text-muted-foreground mb-4">
					Sé el primero en generar un badge para esta comunidad
				</p>
				{community.badgeEnabled && (
					<Button asChild>
						<Link href={`/c/${slug}/badge`}>Generar mi badge</Link>
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Badges de la comunidad</h1>
					<p className="text-muted-foreground text-sm">
						{badges.length} badge{badges.length !== 1 ? "s" : ""} generado
						{badges.length !== 1 ? "s" : ""}
					</p>
				</div>
				{community.badgeEnabled && (
					<Button asChild>
						<Link href={`/c/${slug}/badge`}>Generar mi badge</Link>
					</Button>
				)}
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
				{badges.map((badge) => (
					<Link
						key={badge.id}
						href={`/c/${slug}/badge/${badge.shareToken}`}
						className="group"
					>
						<div className="relative aspect-[3/4] rounded-lg overflow-hidden border bg-muted/30 transition-all group-hover:ring-2 ring-primary">
							{badge.generatedImageUrl ? (
								<BadgeDisplay
									generatedImageUrl={badge.generatedImageUrl}
									generatedBackgroundUrl={badge.generatedBackgroundUrl || undefined}
									memberName={badge.memberName || undefined}
									memberRole={badge.memberRole}
									badgeNumber={badge.badgeNumber}
									communityName={community.displayName || community.name}
									communityLogo={community.logoUrl}
									primaryColor={community.badgePrimaryColor}
									secondaryColor={community.badgeSecondaryColor}
									className="h-full w-full"
								/>
							) : (
								<div className="h-full w-full flex items-center justify-center">
									<span className="text-xs text-muted-foreground">
										Generando...
									</span>
								</div>
							)}
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
