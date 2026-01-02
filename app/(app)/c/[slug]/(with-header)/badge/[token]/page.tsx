import { Download, Share2, Twitter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeDisplay } from "@/components/community/badge-display";
import { Button } from "@/components/ui/button";
import { getBadgeByToken } from "@/lib/actions/badges";

interface BadgePageProps {
	params: Promise<{ slug: string; token: string }>;
}

export async function generateMetadata({
	params,
}: BadgePageProps): Promise<Metadata> {
	const { token, slug } = await params;
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
		notFound();
	}

	const { badge, community } = data;
	const shareUrl = `https://hack0.dev/c/${slug}/badge/${token}`;
	const twitterText = encodeURIComponent(
		`Mi badge de ${community.displayName || community.name} en @hack0dev`
	);

	return (
		<div className="flex flex-col items-center py-8 gap-8">
			<div className="w-full max-w-sm">
				<BadgeDisplay
					generatedImageUrl={badge.generatedImageUrl!}
					generatedBackgroundUrl={badge.generatedBackgroundUrl || undefined}
					memberName={badge.memberName || undefined}
					memberRole={badge.memberRole}
					badgeNumber={badge.badgeNumber}
					communityName={community.displayName || community.name}
					communityLogo={community.logoUrl}
					primaryColor={community.badgePrimaryColor}
					secondaryColor={community.badgeSecondaryColor}
				/>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-3">
				<Button asChild variant="outline" className="gap-2">
					<a
						href={`https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(shareUrl)}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Twitter className="h-4 w-4" />
						Compartir
					</a>
				</Button>

				<Button asChild variant="outline" className="gap-2">
					<a href={badge.generatedImageUrl!} download={`badge-${token}.png`}>
						<Download className="h-4 w-4" />
						Descargar
					</a>
				</Button>

				<Button asChild variant="ghost" className="gap-2">
					<Link href={`/c/${slug}/badges`}>
						<Share2 className="h-4 w-4" />
						Ver galería
					</Link>
				</Button>
			</div>

			<p className="text-xs text-muted-foreground text-center max-w-md">
				Tu badge fue generado con IA. Compártelo en redes sociales para mostrar
				tu membresía en {community.displayName || community.name}.
			</p>
		</div>
	);
}
