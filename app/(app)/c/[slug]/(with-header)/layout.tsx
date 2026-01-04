import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { OrgHeaderClient } from "@/components/org/layout";
import { getUserCommunityRole } from "@/lib/actions/community-members";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { isGodMode } from "@/lib/god-mode";

interface WithHeaderLayoutProps {
	children: React.ReactNode;
	params: Promise<{ slug: string }>;
}

async function CommunityHeaderWrapper({ slug }: { slug: string }) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) return null;

	const { userId } = await auth();
	const userRole = await getUserCommunityRole(community.id);
	const isOwner = userRole === "owner";
	const godMode = await isGodMode();
	const canManage = isOwner || userRole === "admin" || godMode;

	const tabs = [
		{ id: "events" as const, label: "Eventos", icon: "Calendar" },
		...(community.isPersonalOrg
			? [{ id: "achievements" as const, label: "Logros", icon: "Trophy" }]
			: [{ id: "comunidad" as const, label: "Comunidad", icon: "Users" }]),
		...(canManage
			? [
					{ id: "analytics" as const, label: "Analytics", icon: "BarChart3" },
					{ id: "settings" as const, label: "Configuración", icon: "Settings" },
				]
			: []),
	];

	return (
		<OrgHeaderClient
			community={community}
			slug={slug}
			userRole={userRole}
			isAuthenticated={!!userId}
			tabs={tabs}
		/>
	);
}

function CommunityHeaderSkeleton() {
	return (
		<div className="border-b">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="relative aspect-[4/1] md:aspect-[5/1] rounded-xl overflow-hidden mt-4 bg-muted animate-pulse" />

				<div className="relative -mt-12 ml-4 z-10">
					<div className="h-24 w-24 rounded-xl border-4 border-background shadow-lg bg-muted animate-pulse" />
				</div>

				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pt-3 pb-4">
					<div className="min-w-0 flex-1 space-y-2">
						<div className="h-7 w-56 bg-muted rounded animate-pulse" />
						<div className="h-4 w-80 bg-muted rounded animate-pulse" />
						<div className="flex items-center gap-3 mt-2">
							<div className="h-3 w-24 bg-muted rounded animate-pulse" />
							<div className="h-3 w-20 bg-muted rounded animate-pulse" />
						</div>
					</div>
					<div className="h-9 w-32 bg-muted rounded animate-pulse" />
				</div>

				<nav className="flex items-center gap-1 border-t -mb-px">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-10 w-24 bg-muted/50 animate-pulse" />
					))}
				</nav>
			</div>
		</div>
	);
}

export default async function WithHeaderLayout({
	children,
	params,
}: WithHeaderLayoutProps) {
	const { slug } = await params;

	return (
		<>
			<Suspense fallback={<CommunityHeaderSkeleton />}>
				<CommunityHeaderWrapper slug={slug} />
			</Suspense>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				{children}
			</main>
		</>
	);
}
