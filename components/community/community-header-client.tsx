"use client";

import {
	BarChart3,
	Calendar,
	CheckCircle2,
	Settings,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Organization } from "@/lib/db/schema";
import { CommunityActions } from "./community-actions";

interface Tab {
	id: "events" | "members" | "analytics" | "settings";
	label: string;
	icon: string;
}

interface CommunityHeaderClientProps {
	community: Organization;
	slug: string;
	userRole: string | null;
	isAuthenticated: boolean;
	tabs: Tab[];
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
							<div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-border">
								<Image
									src={community.logoUrl}
									alt={community.displayName || community.name}
									fill
									className="object-cover"
								/>
							</div>
						) : null}

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
								<p className="text-sm text-muted-foreground">
									{community.description}
								</p>
							)}
						</div>
					</div>

					<CommunityActions
						communityId={community.id}
						communitySlug={slug}
						communityName={community.displayName || community.name}
						userRole={userRole}
						isAuthenticated={isAuthenticated}
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
								className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
									isActive
										? "border-foreground text-foreground"
										: "border-transparent text-muted-foreground hover:text-foreground"
								}`}
							>
								<Icon className="h-4 w-4" />
								{tab.label}
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
}
