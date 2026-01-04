import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { MembersManagement } from "@/components/org/members";
import {
	getOrganizationInvites,
	getUserCommunityRole,
} from "@/lib/actions/community-members";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { isGodMode } from "@/lib/god-mode";

interface MembersSettingsPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: MembersSettingsPageProps): Promise<Metadata> {
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
		title: `Gestión de miembros - ${community.displayName || community.name}`,
		description: `Administrar miembros de ${community.displayName || community.name}`,
	};
}

export default async function MembersSettingsPage({
	params,
}: MembersSettingsPageProps) {
	const { slug } = await params;
	const { userId } = await auth();

	const community = await db.query.organizations.findFirst({
		where: eq(organizations.slug, slug),
		with: {
			members: true,
		},
	});

	if (!community) return null;

	const godMode = await isGodMode();
	const userRole = await getUserCommunityRole(community.id);
	const isOwner = userId === community.ownerUserId;
	const currentMember = community.members.find((m) => m.userId === userId);
	const isAdmin = currentMember?.role === "admin";

	const clerk = await clerkClient();
	const uniqueMemberIds = community.members
		.map((m) => m.userId)
		.filter((id) => id !== community.ownerUserId);

	const memberUserIds = [community.ownerUserId, ...uniqueMemberIds];

	const users = await Promise.all(
		memberUserIds.map(async (memberId) => {
			try {
				return await clerk.users.getUser(memberId);
			} catch {
				return null;
			}
		}),
	);

	const validUsers = users.filter(
		(user): user is NonNullable<typeof user> => user !== null,
	);

	const invites = await getOrganizationInvites(community.id);

	const filteredMembers = community.members.filter(
		(m) => m.userId !== community.ownerUserId,
	);

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold">Gestión de miembros</h2>
				<p className="text-sm text-muted-foreground">
					Invita, administra roles y gestiona los miembros de tu comunidad
				</p>
			</div>
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
				currentUserId={userId}
				isOwner={isOwner}
				isAdmin={isAdmin}
				isGodMode={godMode}
			/>
		</div>
	);
}
