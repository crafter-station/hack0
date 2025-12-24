import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AchievementGrid } from "@/components/achievements/achievement-grid";
import { db } from "@/lib/db";
import { achievements, organizations, userAchievements } from "@/lib/db/schema";

interface AchievementsPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: AchievementsPageProps): Promise<Metadata> {
	const { slug } = await params;
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community || !community.isPersonalOrg) {
		return { title: "Logros" };
	}

	return {
		title: `Logros - ${community.displayName || community.name}`,
		description: `Logros y medallas de ${community.displayName || community.name} en hack0.dev`,
	};
}

export default async function AchievementsPage({
	params,
}: AchievementsPageProps) {
	const { slug } = await params;

	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community || !community.isPersonalOrg) {
		notFound();
	}

	const { userId: currentUserId } = await auth();
	const isOwner = currentUserId === community.ownerUserId;

	const [allAchievements, userAchievementsList] = await Promise.all([
		db.query.achievements.findMany({
			where: eq(achievements.isActive, true),
			orderBy: (achievements, { desc }) => [desc(achievements.createdAt)],
		}),
		db.query.userAchievements.findMany({
			where: eq(userAchievements.userId, community.ownerUserId),
		}),
	]);

	return (
		<div>
			{isOwner ? (
				<p className="text-sm text-muted-foreground mb-6">
					Tus medallas y logros en la comunidad hack0.dev
				</p>
			) : (
				<p className="text-sm text-muted-foreground mb-6">
					Logros de {community.displayName || community.name}
				</p>
			)}

			<AchievementGrid
				achievements={allAchievements}
				userAchievements={userAchievementsList}
			/>
		</div>
	);
}
