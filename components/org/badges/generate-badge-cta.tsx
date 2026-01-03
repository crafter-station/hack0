"use client";

import { Award, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GenerateBadgeCTAProps {
	communitySlug: string;
	campaignSlug?: string | null;
	campaignName?: string | null;
	existingBadgeToken?: string | null;
	canGenerate: boolean;
	badgeEnabled: boolean;
	isAuthenticated: boolean;
}

export function GenerateBadgeCTA({
	communitySlug,
	campaignSlug,
	campaignName,
	existingBadgeToken,
	canGenerate,
	badgeEnabled,
	isAuthenticated,
}: GenerateBadgeCTAProps) {
	if (!badgeEnabled) {
		return null;
	}

	const badgeUrl = campaignSlug
		? `/c/${communitySlug}/badge?campaign=${campaignSlug}`
		: `/c/${communitySlug}/badge`;

	if (existingBadgeToken) {
		return (
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30">
				<div className="flex items-center gap-3 text-center sm:text-left">
					<div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
						<Award className="h-5 w-5 text-emerald-500" />
					</div>
					<div>
						<p className="font-medium">
							Ya tienes tu badge{campaignName ? ` de ${campaignName}` : ""}
						</p>
						<p className="text-sm text-muted-foreground">
							Compártelo con tu comunidad
						</p>
					</div>
				</div>
				<Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
					<Link href={`/c/${communitySlug}/badge/${existingBadgeToken}`}>
						<Award className="h-4 w-4" />
						Ver mi badge
					</Link>
				</Button>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-gradient-to-r from-muted/50 to-muted/30">
				<div className="flex items-center gap-3 text-center sm:text-left">
					<div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center shrink-0">
						<Sparkles className="h-5 w-5 text-foreground/60" />
					</div>
					<div>
						<p className="font-medium">Genera tu badge con IA</p>
						<p className="text-sm text-muted-foreground">
							Inicia sesión para crear tu badge personalizado
						</p>
					</div>
				</div>
				<Button asChild size="sm" className="gap-2 shrink-0">
					<Link href={`/sign-in?redirect=${encodeURIComponent(badgeUrl)}`}>
						<Sparkles className="h-4 w-4" />
						Iniciar sesión
					</Link>
				</Button>
			</div>
		);
	}

	if (!canGenerate) {
		return null;
	}

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-gradient-to-r from-foreground/[0.02] to-foreground/[0.05]">
			<div className="flex items-center gap-3 text-center sm:text-left">
				<div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center shrink-0">
					<Sparkles className="h-5 w-5" />
				</div>
				<div>
					<p className="font-medium">
						{campaignName
							? `Genera tu badge de ${campaignName}`
							: "Genera tu badge personalizado"}
					</p>
					<p className="text-sm text-muted-foreground">
						Sube tu foto y créalo con IA
					</p>
				</div>
			</div>
			<Button asChild size="sm" className="gap-2 shrink-0">
				<Link href={badgeUrl}>
					<Sparkles className="h-4 w-4" />
					Generar badge
				</Link>
			</Button>
		</div>
	);
}
