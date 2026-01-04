"use client";

import Atropos from "atropos/react";
import { Download, Sparkles, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadgeDisplay } from "./badge-display";

interface BadgeViralViewProps {
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
		shortCode: string;
	};
	token: string;
}

export function BadgeViralView({
	badge,
	community,
	token,
}: BadgeViralViewProps) {
	const shareUrl = `https://hack0.dev/b/${community.shortCode}/${token}`;
	const twitterText = encodeURIComponent(
		`Mi badge de ${community.displayName || community.name} en @hack0dev`,
	);
	const communityName = community.displayName || community.name;

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 gap-8">
			<div className="flex items-center gap-3">
				{community.logoUrl && (
					<Image
						src={community.logoUrl}
						alt={communityName}
						width={40}
						height={40}
						className="rounded-lg"
					/>
				)}
				<span className="text-lg font-semibold">{communityName}</span>
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
					communityName={communityName}
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
			</div>

			<div className="w-full max-w-sm pt-4 border-t">
				<div className="text-center space-y-3">
					<p className="text-sm text-muted-foreground">
						¿Quieres ser parte de {communityName}?
					</p>
					<Button asChild size="lg" className="w-full gap-2">
						<Link href={`/b/${community.shortCode}`}>
							<Sparkles className="h-4 w-4" />
							Genera tu badge
						</Link>
					</Button>
				</div>
			</div>

			<p className="text-xs text-muted-foreground text-center max-w-md">
				Badge generado con IA en{" "}
				<Link href="/" className="underline hover:text-foreground">
					hack0.dev
				</Link>
			</p>
		</div>
	);
}
