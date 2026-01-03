import { auth } from "@clerk/nextjs/server";
import { Award, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeGalleryCard } from "@/components/org/badges";
import { Button } from "@/components/ui/button";
import {
	canGenerateBadge,
	getCommunityBadges,
	getUserBadgeForCommunity,
} from "@/lib/actions/badges";
import { getOrganizationBySlug } from "@/lib/actions/organizations";

interface BadgesPageProps {
	params: Promise<{ slug: string }>;
}

export default async function BadgesPage({ params }: BadgesPageProps) {
	const { slug } = await params;
	const { userId } = await auth();

	const org = await getOrganizationBySlug(slug);

	if (!org) {
		notFound();
	}

	const badges = await getCommunityBadges(slug, 100);
	const userBadge = userId
		? await getUserBadgeForCommunity(org.id, userId)
		: null;
	const canGenerate = userId
		? await canGenerateBadge(org.id, userId)
		: { allowed: false };

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold">Community Badges</h2>
					<p className="text-sm text-muted-foreground">
						{badges.length === 0
							? "No badges generated yet"
							: badges.length === 1
								? "1 badge generated"
								: `${badges.length} badges generated`}
					</p>
				</div>

				{org.badgeEnabled && canGenerate.allowed && (
					<Button asChild size="sm" className="gap-2">
						<Link href={`/c/${slug}/badge`}>
							<Sparkles className="h-4 w-4" />
							Generate Your Badge
						</Link>
					</Button>
				)}

				{userBadge && userBadge.status === "completed" && (
					<Button asChild variant="outline" size="sm" className="gap-2">
						<Link href={`/c/${slug}/badge/${userBadge.shareToken}`}>
							<Award className="h-4 w-4" />
							View Your Badge
						</Link>
					</Button>
				)}
			</div>

			{badges.length > 0 ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{badges.map((badge) => (
						<BadgeGalleryCard
							key={badge.id}
							badge={badge}
							communitySlug={slug}
						/>
					))}
				</div>
			) : (
				<div className="rounded-lg border border-dashed border-border p-12 text-center">
					<div className="flex justify-center mb-4">
						<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
							<Award className="h-6 w-6 text-muted-foreground" />
						</div>
					</div>
					<h3 className="text-sm font-medium mb-1">No badges yet</h3>
					<p className="text-sm text-muted-foreground mb-4">
						{org.badgeEnabled
							? "Be the first to generate a personalized badge!"
							: "Badge generation is not enabled for this community"}
					</p>
					{org.badgeEnabled && canGenerate.allowed && (
						<Button asChild size="sm" className="gap-2">
							<Link href={`/c/${slug}/badge`}>
								<Sparkles className="h-4 w-4" />
								Generate Your Badge
							</Link>
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
