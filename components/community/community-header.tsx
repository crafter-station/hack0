import { auth } from "@clerk/nextjs/server";
import {
	BarChart3,
	Calendar,
	CheckCircle2,
	Settings,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { isAdmin } from "@/lib/actions/claims";
import { getUserCommunityRole } from "@/lib/actions/community-members";
import type { Organization } from "@/lib/db/schema";
import { CommunityActions } from "./community-actions";

interface CommunityHeaderProps {
	community: Organization;
	slug: string;
	currentTab: "events" | "members" | "analytics" | "settings";
}

export async function CommunityHeader({
	community,
	slug,
	currentTab,
}: CommunityHeaderProps) {
	const { userId } = await auth();
	const userRole = await getUserCommunityRole(community.id);
	const isOwner = userRole === "owner";
	const isAdminUser = await isAdmin();
	const canManage = isOwner || userRole === "admin" || isAdminUser;
	const isAuthenticated = !!userId;

	const tabs = [
		{ id: "events" as const, label: "Eventos", icon: Calendar, requiresAdmin: false },
		{ id: "members" as const, label: "Miembros", icon: Users, requiresAdmin: false },
		{ id: "analytics" as const, label: "Analytics", icon: BarChart3, requiresAdmin: true },
		{ id: "settings" as const, label: "Configuración", icon: Settings, requiresAdmin: true },
	];

	return (
		<div className="border-b border-border/50">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="flex items-center justify-between gap-4 py-2.5">
					<div className="flex items-center gap-2.5 min-w-0">
						{community.logoUrl ? (
							<div className="relative h-7 w-7 shrink-0 rounded overflow-hidden bg-muted">
								<Image
									src={community.logoUrl}
									alt={community.displayName || community.name}
									fill
									className="object-cover"
								/>
							</div>
						) : (
							<div className="h-7 w-7 shrink-0 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
								{(community.displayName || community.name).charAt(0)}
							</div>
						)}

						<div className="min-w-0 flex items-center gap-2">
							<h1 className="text-sm font-semibold tracking-tight truncate">
								{community.displayName || community.name}
							</h1>
							{community.isVerified && (
								<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
							)}
							{community.description && (
								<p className="hidden lg:block text-xs text-muted-foreground truncate max-w-md">
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

				<nav className="flex items-center gap-0.5 -mb-px">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = currentTab === tab.id;
						const href =
							tab.id === "events" ? `/c/${slug}` : `/c/${slug}/${tab.id}`;
						const isDisabled = tab.requiresAdmin && !canManage;

						if (isDisabled) {
							return (
								<span
									key={tab.id}
									title="Solo para administradores"
									className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 border-transparent text-muted-foreground/50 cursor-not-allowed whitespace-nowrap"
								>
									<Icon className="h-3.5 w-3.5" />
									{tab.label}
								</span>
							);
						}

						return (
							<Link
								key={tab.id}
								href={href}
								className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
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
