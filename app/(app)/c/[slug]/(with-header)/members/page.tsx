import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MembersManagement } from "@/components/community/members-management";
import { getUserCommunityRole } from "@/lib/actions/community-members";
import { getOrganizationInvites } from "@/lib/actions/community-members";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { isGodMode } from "@/lib/god-mode";

interface MembersPageProps {
	params: Promise<{ slug: string }>;
}

async function MembersList({
	slug,
	currentUserId,
}: {
	slug: string;
	currentUserId: string | null;
}) {
	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		with: {
			members: true,
		},
	});

	if (!community) return null;

	const godMode = await isGodMode();
	if (!godMode) {
		const userRole = await getUserCommunityRole(community.id);
		if (userRole === "follower" || userRole === null) {
			redirect(`/c/${slug}`);
		}
	}

	const GHOST_ADMIN_ID = "user_36EEeOvb4zfhKhIVSfK46or5pkC";
	const isCrafterStation = slug === "crafter-station";

	const clerk = await clerkClient();
	const uniqueMemberIds = community.members
		.map((m) => m.userId)
		.filter((id) => id !== community.ownerUserId);

	let memberUserIds = [community.ownerUserId, ...uniqueMemberIds];

	if (!isCrafterStation) {
		memberUserIds = memberUserIds.filter((id) => id !== GHOST_ADMIN_ID);
	}

	const users = await Promise.all(
		memberUserIds.map(async (userId) => {
			try {
				return await clerk.users.getUser(userId);
			} catch {
				return null;
			}
		}),
	);

	const validUsers = users.filter(
		(user): user is NonNullable<typeof user> => user !== null,
	);

	// Get invites
	const invites = await getOrganizationInvites(community.id);

	// Check if current user is owner, admin, or god mode
	const isOwner = currentUserId === community.ownerUserId;
	const currentMember = community.members.find(
		(m) => m.userId === currentUserId,
	);
	const isAdmin = currentMember?.role === "admin";

	const filteredMembers = community.members.filter((m) => {
		if (m.userId === community.ownerUserId) return false;
		if (!isCrafterStation && m.userId === GHOST_ADMIN_ID) return false;
		return true;
	});

	return (
		<MembersManagement
			communitySlug={slug}
			communityId={community.id}
			ownerUserId={community.ownerUserId}
			members={filteredMembers}
			invites={invites}
			users={validUsers.map((u) => ({
				id: u.id,
				firstName: u.firstName,
				lastName: u.lastName,
				emailAddresses: u.emailAddresses.map((e) => ({
					emailAddress: e.emailAddress,
				})),
				imageUrl: u.imageUrl,
			}))}
			currentUserId={currentUserId}
			isOwner={isOwner}
			isAdmin={isAdmin}
			isGodMode={godMode}
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
						<div
							key={i}
							className="px-5 py-4 flex items-center gap-3 animate-pulse"
						>
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

	return (
		<Suspense fallback={<MembersSkeleton />}>
			<MembersList slug={slug} currentUserId={userId} />
		</Suspense>
	);
}
