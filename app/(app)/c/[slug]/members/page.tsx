import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getOrganizationInvites } from "@/lib/actions/community-members";
import { MembersManagement } from "@/components/community/members-management";
import { CommunityHeader } from "@/components/community/community-header";

interface MembersPageProps {
	params: Promise<{ slug: string }>;
}

async function MembersList({ slug, currentUserId }: { slug: string; currentUserId: string | null }) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		with: {
			members: true,
		},
	});

	if (!community) return null;

	const clerk = await clerkClient();
	const memberUserIds = [community.ownerUserId, ...community.members.map(m => m.userId)];

	const users = await Promise.all(
		memberUserIds.map(async (userId) => {
			try {
				return await clerk.users.getUser(userId);
			} catch {
				return null;
			}
		})
	);

	const validUsers = users.filter((user): user is NonNullable<typeof user> => user !== null);

	// Get invites
	const invites = await getOrganizationInvites(community.id);

	// Check if current user is owner or admin
	const isOwner = currentUserId === community.ownerUserId;
	const currentMember = community.members.find(m => m.userId === currentUserId);
	const isAdmin = currentMember?.role === "admin";

	return (
		<MembersManagement
			communitySlug={slug}
			communityId={community.id}
			ownerUserId={community.ownerUserId}
			members={community.members}
			invites={invites}
			users={validUsers.map((u) => ({
				id: u.id,
				firstName: u.firstName,
				lastName: u.lastName,
				emailAddresses: u.emailAddresses.map(e => ({ emailAddress: e.emailAddress })),
				imageUrl: u.imageUrl,
			}))}
			currentUserId={currentUserId}
			isOwner={isOwner}
			isAdmin={isAdmin}
		/>
	);
}

function MembersSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-5 bg-muted rounded w-32 animate-pulse" />
			<div className="rounded-lg border border-border overflow-hidden">
				<div className="divide-y divide-border">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="px-5 py-4 flex items-center gap-3 animate-pulse">
							<div className="h-10 w-10 rounded-full bg-muted" />
							<div className="space-y-2 flex-1">
								<div className="h-4 bg-muted rounded w-48" />
								<div className="h-3 bg-muted rounded w-64" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export async function generateMetadata({
	params,
}: MembersPageProps): Promise<Metadata> {
	const { slug } = await params;
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		return {
			title: "Comunidad no encontrada",
		};
	}

	return {
		title: `Miembros - ${community.displayName || community.name}`,
		description: `Miembros de ${community.displayName || community.name}`,
	};
}

export default async function MembersPage({ params }: MembersPageProps) {
	const { slug } = await params;
	const { userId } = await auth();

	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
	});

	if (!community) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<Suspense fallback={null}>
				<CommunityHeader community={community} slug={slug} currentTab="members" />
			</Suspense>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8 flex-1 w-full">
				<Suspense fallback={<MembersSkeleton />}>
					<MembersList slug={slug} currentUserId={userId} />
				</Suspense>
			</main>

			<SiteFooter />
		</div>
	);
}
