import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeDetailView } from "@/components/org/badges";
import { Button } from "@/components/ui/button";
import { getBadgeByToken } from "@/lib/actions/badges";

interface BadgePageProps {
	params: Promise<{ slug: string; token: string }>;
}

export async function generateMetadata({
	params,
}: BadgePageProps): Promise<Metadata> {
	const { token } = await params;
	const data = await getBadgeByToken(token);

	if (!data) {
		return { title: "Badge no encontrado" };
	}

	const title = data.badge.memberName
		? `${data.badge.memberName} - ${data.community.displayName || data.community.name}`
		: `Badge #${data.badge.badgeNumber} - ${data.community.displayName || data.community.name}`;

	return {
		title,
		description: `Badge de ${data.community.displayName || data.community.name} generado con IA`,
		openGraph: {
			title,
			description: `Badge de ${data.community.displayName || data.community.name}`,
			images: [`/api/badge/og/${token}`],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: `Badge de ${data.community.displayName || data.community.name}`,
			images: [`/api/badge/og/${token}`],
		},
	};
}

export default async function BadgePage({ params }: BadgePageProps) {
	const { token, slug } = await params;
	const data = await getBadgeByToken(token);

	if (!data || data.badge.status !== "completed") {
		return (
			<div className="flex flex-col items-center py-8 gap-8">
				<p className="text-muted-foreground">Badge no encontrado</p>
				<Button asChild variant="outline" className="gap-2">
					<Link href={`/c/${slug}/comunidad`}>
						<ArrowLeft className="h-4 w-4" />
						Volver a comunidad
					</Link>
				</Button>
			</div>
		);
	}

	const { badge, community } = data;

	return (
		<BadgeDetailView
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
				slug: community.slug,
			}}
			token={token}
		/>
	);
}
