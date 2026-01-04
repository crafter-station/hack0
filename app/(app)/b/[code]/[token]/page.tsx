import { and, eq, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeViralView } from "@/components/org/badges";
import { db } from "@/lib/db";
import { communityBadges, organizations } from "@/lib/db/schema";

interface BadgePageProps {
	params: Promise<{ code: string; token: string }>;
}

async function getBadgeData(code: string, token: string) {
	const community = await db.query.organizations.findFirst({
		where: and(
			isNotNull(organizations.shortCode),
			eq(organizations.shortCode, code),
		),
	});

	if (!community) return null;

	const badge = await db.query.communityBadges.findFirst({
		where: eq(communityBadges.shareToken, token),
	});

	if (!badge || badge.communityId !== community.id) return null;

	return { badge, community };
}

export async function generateMetadata({
	params,
}: BadgePageProps): Promise<Metadata> {
	const { code, token } = await params;
	const data = await getBadgeData(code, token);

	if (!data) {
		return { title: "Badge no encontrado" };
	}

	const { badge, community } = data;
	const communityName = community.displayName || community.name;
	const title = badge.memberName
		? `${badge.memberName} - ${communityName}`
		: `Badge #${badge.badgeNumber} - ${communityName}`;

	return {
		title,
		description: `Badge de ${communityName} generado con IA`,
		openGraph: {
			title,
			description: `Badge de ${communityName}`,
			images: [`/api/badge/og/${token}`],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: `Badge de ${communityName}`,
			images: [`/api/badge/og/${token}`],
		},
	};
}

export default async function BadgePage({ params }: BadgePageProps) {
	const { code, token } = await params;
	const data = await getBadgeData(code, token);

	if (!data || data.badge.status !== "completed") {
		notFound();
	}

	const { badge, community } = data;

	return (
		<BadgeViralView
			badge={{
				generatedImageUrl: badge.generatedImageUrl!,
				generatedBackgroundUrl: badge.generatedBackgroundUrl,
				memberName: badge.memberName,
				memberRole: badge.memberRole,
				badgeNumber: badge.badgeNumber,
			}}
			community={{
				displayName: community.displayName,
				name: community.name,
				logoUrl: community.logoUrl,
				badgeAccentColor: community.badgeAccentColor,
				shortCode: community.shortCode!,
			}}
			token={token}
		/>
	);
}
