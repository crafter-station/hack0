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
import { useMemo } from "react";
import { VerifiedBadge } from "@/components/icons/verified-badge";
import { GithubLogo } from "@/components/logos/github";
import { InstagramLogo } from "@/components/logos/instagram";
import { LinkedinLogo } from "@/components/logos/linkedin";
import { TwitterLogo } from "@/components/logos/twitter";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Organization } from "@/lib/db/schema";
import { OrgActions } from "./org-actions";
import { OrgSubscribeButton } from "./org-subscribe-button";

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

function generateGradient(name: string): { light: string; dark: string } {
	const hash = hashString(name);
	const hue1 = hash % 360;
	const hue2 = (hash * 7) % 360;
	const saturation = 25 + (hash % 15);
	return {
		light: `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, 92%) 0%, hsl(${hue2}, ${saturation}%, 88%) 100%)`,
		dark: `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, 12%) 0%, hsl(${hue2}, ${saturation}%, 16%) 100%)`,
	};
}

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
		| "comunidad"
		| "achievements"
		| "badges"
		| "analytics"
		| "settings";
	label: string;
	icon: string;
}

interface OrgHeaderClientProps {
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

export function OrgHeaderClient({
	community,
	slug,
	userRole,
	isAuthenticated,
	tabs,
	hasLumaIntegration = false,
}: OrgHeaderClientProps) {
	const pathname = usePathname();

	const gradients = useMemo(
		() => generateGradient(community.displayName || community.name),
		[community.displayName, community.name],
	);

	const currentTab = pathname.includes("/comunidad")
		? "comunidad"
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
				<div className="relative aspect-[4/1] md:aspect-[5/1] rounded-xl overflow-hidden mt-4">
					{community.coverUrl ? (
						<Image
							src={community.coverUrl}
							alt={`${community.displayName || community.name} cover`}
							fill
							className="object-cover"
							priority
						/>
					) : (
						<>
							<div
								className="absolute inset-0 dark:hidden"
								style={{ background: gradients.light }}
							/>
							<div
								className="absolute inset-0 hidden dark:block"
								style={{ background: gradients.dark }}
							/>
						</>
					)}
				</div>

				{/* Logo Overlay */}
				<div className="relative -mt-12 ml-4 z-10">
					{community.logoUrl ? (
						<div className="relative h-24 w-24 rounded-xl border-4 border-background shadow-lg overflow-hidden bg-background">
							<Image
								src={community.logoUrl}
								alt={community.displayName || community.name}
								fill
								className="object-cover"
							/>
						</div>
					) : (
						<div className="h-24 w-24 rounded-xl border-4 border-background shadow-lg bg-muted flex items-center justify-center text-3xl font-semibold text-muted-foreground">
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
							<h1 className="text-2xl font-semibold tracking-tight">
								{community.displayName || community.name}
							</h1>
							{community.isVerified && (
								<VerifiedBadge className="h-6 w-6 text-blue-500 shrink-0" />
							)}
						</div>

						{community.description && (
							<p className="text-sm text-muted-foreground mt-1 line-clamp-3 max-w-3xl">
								{community.description}
							</p>
						)}

						<div className="flex items-center gap-3 text-muted-foreground mt-3 flex-wrap">
							{community.department && (
								<span className="inline-flex items-center gap-1.5 text-xs">
									<MapPin className="h-4 w-4" />
									{community.department}
									{community.country ? `, ${community.country}` : ""}
								</span>
							)}
							<TooltipProvider delayDuration={100}>
								<div className="flex items-center gap-2">
									{community.websiteUrl && (
										<Tooltip>
											<TooltipTrigger asChild>
												<a
													href={community.websiteUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
												>
													<Globe className="h-4 w-4" />
												</a>
											</TooltipTrigger>
											<TooltipContent>
												<p className="text-xs">
													Website:{" "}
													{community.websiteUrl
														.replace(/^https?:\/\//, "")
														.replace(/\/$/, "")}
												</p>
											</TooltipContent>
										</Tooltip>
									)}
									{community.twitterUrl && (
										<Tooltip>
											<TooltipTrigger asChild>
												<a
													href={community.twitterUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
												>
													<TwitterLogo className="h-4 w-4" />
												</a>
											</TooltipTrigger>
											<TooltipContent>
												<p className="text-xs">
													X/Twitter: @
													{extractUsername(community.twitterUrl, "twitter")}
												</p>
											</TooltipContent>
										</Tooltip>
									)}
									{community.linkedinUrl && (
										<Tooltip>
											<TooltipTrigger asChild>
												<a
													href={community.linkedinUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
												>
													<LinkedinLogo
														className="h-4 w-4"
														mode="currentColor"
													/>
												</a>
											</TooltipTrigger>
											<TooltipContent>
												<p className="text-xs">
													LinkedIn:{" "}
													{extractUsername(community.linkedinUrl, "linkedin")}
												</p>
											</TooltipContent>
										</Tooltip>
									)}
									{community.instagramUrl && (
										<Tooltip>
											<TooltipTrigger asChild>
												<a
													href={community.instagramUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
												>
													<InstagramLogo
														className="h-4 w-4"
														mode="currentColor"
													/>
												</a>
											</TooltipTrigger>
											<TooltipContent>
												<p className="text-xs">
													Instagram: @
													{extractUsername(community.instagramUrl, "instagram")}
												</p>
											</TooltipContent>
										</Tooltip>
									)}
									{community.githubUrl && (
										<Tooltip>
											<TooltipTrigger asChild>
												<a
													href={community.githubUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
												>
													<GithubLogo className="h-4 w-4" mode="currentColor" />
												</a>
											</TooltipTrigger>
											<TooltipContent>
												<p className="text-xs">
													GitHub:{" "}
													{extractUsername(community.githubUrl, "github")}
												</p>
											</TooltipContent>
										</Tooltip>
									)}
								</div>
							</TooltipProvider>
						</div>
					</div>

					<div className="shrink-0 flex items-center gap-2">
						<OrgSubscribeButton
							communityId={community.id}
							communitySlug={slug}
						/>
						<OrgActions
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
