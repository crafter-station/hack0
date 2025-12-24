"use client";

import {
	BarChart3,
	Calendar,
	CheckCircle2,
	Globe,
	MapPin,
	Settings,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GithubLogo } from "@/components/logos/github";
import { InstagramLogo } from "@/components/logos/instagram";
import { LinkedinLogo } from "@/components/logos/linkedin";
import { TwitterLogo } from "@/components/logos/twitter";
import type { Organization } from "@/lib/db/schema";
import { CommunityActions } from "./community-actions";

function extractUsername(url: string, platform: string): string {
	try {
		const parsed = new URL(url);
		const path = parsed.pathname.replace(/^\//, "").replace(/\/$/, "");
		const parts = path.split("/");
		if (platform === "linkedin") {
			return parts[1] || parts[0] || url;
		}
		return parts[0] || url;
	} catch {
		return url;
	}
}

interface Tab {
	id: "events" | "members" | "analytics" | "settings";
	label: string;
	icon: string;
}

interface CommunityHeaderClientProps {
	community: Organization;
	slug: string;
	userRole: "owner" | "admin" | "member" | "follower" | null;
	isAuthenticated: boolean;
	tabs: Tab[];
	hasLumaIntegration?: boolean;
}

const iconMap = {
	Calendar,
	Users,
	Settings,
	BarChart3,
} as const;

export function CommunityHeaderClient({
	community,
	slug,
	userRole,
	isAuthenticated,
	tabs,
	hasLumaIntegration = false,
}: CommunityHeaderClientProps) {
	const pathname = usePathname();

	const currentTab = pathname.includes("/members")
		? "members"
		: pathname.includes("/analytics")
			? "analytics"
			: pathname.includes("/settings")
				? "settings"
				: "events";

	return (
		<div className="border-b bg-muted/30">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="flex items-center justify-between gap-4 py-4">
					<div className="flex items-center gap-3 min-w-0">
						{community.logoUrl ? (
							<div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-border">
								<Image
									src={community.logoUrl}
									alt={community.displayName || community.name}
									fill
									className="object-cover"
								/>
							</div>
						) : (
							<div className="h-16 w-16 shrink-0 rounded-lg bg-muted border border-border flex items-center justify-center text-xl font-medium text-muted-foreground">
								{(community.displayName || community.name)
									.charAt(0)
									.toUpperCase()}
							</div>
						)}

						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<h1 className="text-lg font-semibold tracking-tight">
									{community.displayName || community.name}
								</h1>
								{community.isVerified && (
									<CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
								)}
							</div>

							{community.description && (
								<p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
									{community.description}
								</p>
							)}

							<div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
								{community.department && (
									<span className="inline-flex items-center gap-1">
										<MapPin className="h-3 w-3" />
										{community.department}
										{community.country ? `, ${community.country}` : ""}
									</span>
								)}
								{community.websiteUrl && (
									<a
										href={community.websiteUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
									>
										<Globe className="h-3 w-3" />
										<span className="truncate max-w-[120px]">
											{community.websiteUrl
												.replace(/^https?:\/\//, "")
												.replace(/\/$/, "")}
										</span>
									</a>
								)}
								{community.twitterUrl && (
									<a
										href={community.twitterUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
									>
										<TwitterLogo className="h-3 w-3" />@
										{extractUsername(community.twitterUrl, "twitter")}
									</a>
								)}
								{community.linkedinUrl && (
									<a
										href={community.linkedinUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
									>
										<LinkedinLogo className="h-3 w-3" mode="currentColor" />
										{extractUsername(community.linkedinUrl, "linkedin")}
									</a>
								)}
								{community.instagramUrl && (
									<a
										href={community.instagramUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
									>
										<InstagramLogo className="h-3 w-3" mode="currentColor" />@
										{extractUsername(community.instagramUrl, "instagram")}
									</a>
								)}
								{community.githubUrl && (
									<a
										href={community.githubUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
									>
										<GithubLogo className="h-3 w-3" mode="currentColor" />
										{extractUsername(community.githubUrl, "github")}
									</a>
								)}
							</div>
						</div>
					</div>

					<CommunityActions
						communityId={community.id}
						communitySlug={slug}
						communityName={community.displayName || community.name}
						userRole={userRole}
						isAuthenticated={isAuthenticated}
						hasLumaIntegration={hasLumaIntegration}
					/>
				</div>

				<nav className="flex items-center gap-1 border-t -mb-px">
					{tabs.map((tab) => {
						const Icon = iconMap[tab.icon as keyof typeof iconMap];
						const isActive = currentTab === tab.id;
						const href =
							tab.id === "events" ? `/c/${slug}` : `/c/${slug}/${tab.id}`;

						return (
							<Link
								key={tab.id}
								href={href}
								className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
									isActive
										? "border-foreground text-foreground"
										: "border-transparent text-muted-foreground hover:text-foreground"
								}`}
							>
								<Icon className="h-3.5 w-3.5" />
								{tab.label}
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
}
