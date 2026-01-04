"use client";

import { ChevronRight, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { MemberShowcaseCard } from "../members/member-showcase-card";

interface Badge {
	id: string;
	badgeNumber: number;
	shareToken: string;
	generatedImageUrl: string | null;
	generatedBackgroundUrl: string | null;
	campaignId: string | null;
	status: "pending" | "completed" | "failed" | "generating" | null;
}

interface BadgeSectionProps {
	title: string;
	icon?: string | null;
	badges: Badge[];
	isDefault?: boolean;
	defaultExpanded?: boolean;
	communitySlug: string;
	campaignSlug?: string | null;
	canGenerate?: boolean;
	existingBadgeToken?: string | null;
	isAuthenticated?: boolean;
	badgeEnabled?: boolean;
}

export function BadgeSection({
	title,
	icon,
	badges,
	isDefault = false,
	defaultExpanded = false,
	communitySlug,
	campaignSlug,
	canGenerate = false,
	existingBadgeToken,
	isAuthenticated = false,
	badgeEnabled = true,
}: BadgeSectionProps) {
	const [isOpen, setIsOpen] = useState(isDefault || defaultExpanded);

	const completedBadges = badges.filter((b) => b.status === "completed");
	const badgeCount = completedBadges.length;

	const generateUrl = campaignSlug
		? `/c/${communitySlug}/badge?campaign=${campaignSlug}`
		: `/c/${communitySlug}/badge`;

	const showGenerateButton =
		badgeEnabled && isAuthenticated && canGenerate && !existingBadgeToken;

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div className="rounded-lg border bg-card">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
					>
						<div className="flex items-center gap-3">
							<ChevronRight
								className={cn(
									"h-4 w-4 text-muted-foreground transition-transform duration-200",
									isOpen && "rotate-90",
								)}
							/>
							{isDefault ? (
								<Users className="h-5 w-5 text-muted-foreground" />
							) : icon ? (
								<span className="text-lg">{icon}</span>
							) : (
								<Sparkles className="h-5 w-5 text-muted-foreground" />
							)}
							<span className="font-medium">{title}</span>
							<span className="text-sm text-muted-foreground">
								({badgeCount})
							</span>
						</div>
						{showGenerateButton && (
							<Button
								size="sm"
								variant="outline"
								className="gap-2"
								onClick={(e) => {
									e.stopPropagation();
								}}
								asChild
							>
								<Link href={generateUrl}>
									<Sparkles className="h-3.5 w-3.5" />
									Generar badge
								</Link>
							</Button>
						)}
						{existingBadgeToken && (
							<Button
								size="sm"
								variant="ghost"
								className="text-muted-foreground"
								onClick={(e) => {
									e.stopPropagation();
								}}
								asChild
							>
								<Link href={`/c/${communitySlug}/badge/${existingBadgeToken}`}>
									Ver mi badge
								</Link>
							</Button>
						)}
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="border-t px-4 pb-4 pt-4">
						{completedBadges.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<div className="rounded-full bg-muted p-3 mb-3">
									{isDefault ? (
										<Users className="h-6 w-6 text-muted-foreground" />
									) : (
										<Sparkles className="h-6 w-6 text-muted-foreground" />
									)}
								</div>
								<p className="text-sm text-muted-foreground">
									{isDefault
										? "Aún no hay badges de miembros"
										: "Aún no hay badges en esta campaña"}
								</p>
								{showGenerateButton && (
									<Button size="sm" className="mt-4 gap-2" asChild>
										<Link href={generateUrl}>
											<Sparkles className="h-3.5 w-3.5" />
											Sé el primero en generar
										</Link>
									</Button>
								)}
							</div>
						) : (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
								{completedBadges.map((badge) => (
									<MemberShowcaseCard
										key={badge.id}
										badgeId={badge.id}
										badgeNumber={badge.badgeNumber}
										shareToken={badge.shareToken}
										generatedImageUrl={badge.generatedImageUrl}
										generatedBackgroundUrl={badge.generatedBackgroundUrl}
										communitySlug={communitySlug}
									/>
								))}
							</div>
						)}
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
