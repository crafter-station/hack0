"use client";

import Atropos from "atropos/react";
import { ArrowLeft, Download, Share2, Twitter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadgeDisplay } from "./badge-display";

interface BadgeDetailViewProps {
	badge: {
		generatedImageUrl: string;
		generatedBackgroundUrl: string | null;
		memberName: string | null;
		memberRole: string;
		badgeNumber: number;
	};
	community: {
		displayName: string | null;
		name: string;
		logoUrl: string | null;
		badgeAccentColor: string | null;
		slug: string;
	};
	token: string;
}

export function BadgeDetailView({
	badge,
	community,
	token,
}: BadgeDetailViewProps) {
	const slug = community.slug;
	const shareUrl = `https://hack0.dev/c/${slug}/comunidad/badge/${token}`;
	const twitterText = encodeURIComponent(
		`Mi badge de ${community.displayName || community.name} en @hack0dev`,
	);

	return (
		<div className="flex flex-col items-center py-8 gap-8">
			<div className="w-full flex justify-start">
				<Button asChild variant="ghost" size="sm" className="gap-2">
					<Link href={`/c/${slug}/comunidad`}>
						<ArrowLeft className="h-4 w-4" />
						Comunidad
					</Link>
				</Button>
			</div>

			<Atropos
				className="w-full max-w-sm"
				activeOffset={40}
				shadowScale={1.05}
				rotateXMax={15}
				rotateYMax={15}
				shadow={true}
				highlight={true}
			>
				<BadgeDisplay
					generatedImageUrl={badge.generatedImageUrl}
					generatedBackgroundUrl={badge.generatedBackgroundUrl || undefined}
					memberName={badge.memberName || undefined}
					memberRole={badge.memberRole}
					badgeNumber={badge.badgeNumber}
					communityName={community.displayName || community.name}
					communityLogo={community.logoUrl}
					primaryColor={community.badgeAccentColor}
					secondaryColor={community.badgeAccentColor}
				/>
			</Atropos>

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
					<a href={badge.generatedImageUrl} download={`badge-${token}.png`}>
						<Download className="h-4 w-4" />
						Descargar
					</a>
				</Button>

				<Button asChild variant="ghost" className="gap-2">
					<Link href={`/c/${slug}/comunidad`}>
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
