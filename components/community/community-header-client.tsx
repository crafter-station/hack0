"use client";

import {
	Award,
	BarChart3,
	Calendar,
	Globe,
	MapPin,
	Settings,
	Trophy,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VerifiedBadge } from "@/components/icons/verified-badge";
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
	id:
		| "events"
		| "members"
		| "achievements"
		| "badges"
		| "analytics"
		| "settings";
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
	Trophy,
	Award,
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
		: pathname.includes("/achievements")
			? "achievements"
			: pathname.includes("/badges")
				? "badges"
				: pathname.includes("/analytics")
					? "analytics"
					: pathname.includes("/settings")
						? "settings"
						: "events";

	return (
		<div className="border-b">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				{/* Cover Image Section */}
				<div className="relative aspect-[3/1] md:aspect-[4/1] rounded-xl overflow-hidden mt-4">
					{community.coverUrl ? (
						<Image
							src={community.coverUrl}
							alt={`${community.displayName || community.name} cover`}
							fill
							className="object-cover"
							priority
						/>
					) : (
						<div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
					)}
				</div>

				{/* Logo Overlay */}
				<div className="relative -mt-10 ml-4 z-10">
					{community.logoUrl ? (
						<div className="relative h-20 w-20 rounded-xl border-4 border-background shadow-lg overflow-hidden bg-background">
							<Image
								src={community.logoUrl}
								alt={community.displayName || community.name}
								fill
								className="object-cover"
							/>
						</div>
					) : (
						<div className="h-20 w-20 rounded-xl border-4 border-background shadow-lg bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground">
							{(community.displayName || community.name)
								.charAt(0)
								.toUpperCase()}
						</div>
					)}
				</div>

				{/* Info + Actions Section */}
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pt-3 pb-4">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-semibold tracking-tight">
								{community.displayName || community.name}
							</h1>
							{community.isVerified && (
								<VerifiedBadge className="h-5 w-5 text-blue-500 shrink-0" />
							)}
						</div>

						{community.description && (
							<p className="text-sm text-muted-foreground mt-1 line-clamp-2 max-w-2xl">
								{community.description}
							</p>
						)}

						<div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
							{community.department && (
								<span className="inline-flex items-center gap-1">
									<MapPin className="h-3.5 w-3.5" />
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
									<Globe className="h-3.5 w-3.5" />
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
									<TwitterLogo className="h-3.5 w-3.5" />@
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
									<LinkedinLogo className="h-3.5 w-3.5" mode="currentColor" />
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
									<InstagramLogo className="h-3.5 w-3.5" mode="currentColor" />@
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
									<GithubLogo className="h-3.5 w-3.5" mode="currentColor" />
									{extractUsername(community.githubUrl, "github")}
								</a>
							)}
						</div>
					</div>

					<div className="shrink-0">
						<CommunityActions
							communityId={community.id}
							communitySlug={slug}
							communityName={community.displayName || community.name}
							userRole={userRole}
							isAuthenticated={isAuthenticated}
							hasLumaIntegration={hasLumaIntegration}
						/>
					</div>
				</div>

				{/* Navigation Tabs */}
				<nav className="flex items-center gap-1 border-t -mb-px overflow-x-auto">
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
