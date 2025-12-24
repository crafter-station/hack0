import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import { AchievementGrid } from "@/components/achievements/achievement-grid";
import { db } from "@/lib/db";
import { achievements, userAchievements } from "@/lib/db/schema";

export const metadata = {
	title: "Mis Logros",
	description: "Tus logros y medallas en hack0.dev",
};

export default async function ProfileAchievementsPage() {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const [allAchievements, userAchievementsList] = await Promise.all([
		db.query.achievements.findMany({
			where: eq(achievements.isActive, true),
			orderBy: (achievements, { desc }) => [desc(achievements.createdAt)],
		}),
		db.query.userAchievements.findMany({
			where: eq(userAchievements.userId, userId),
		}),
	]);

	return (
		<div className="mx-auto max-w-screen-lg px-4 py-8 lg:px-8">
			<div className="mb-6">
				<div className="flex items-center gap-2 mb-1">
					<Trophy className="h-5 w-5 text-amber-500" />
					<h1 className="text-xl font-semibold text-foreground">Mis Logros</h1>
				</div>
				<p className="text-sm text-muted-foreground">
					Tus medallas y logros en la comunidad hack0.dev
				</p>
			</div>

			<AchievementGrid
				achievements={allAchievements}
				userAchievements={userAchievementsList}
			/>
		</div>
	);
}
