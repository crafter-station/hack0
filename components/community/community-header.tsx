import {
	ArrowLeft,
	BarChart3,
	Calendar,
	CheckCircle2,
	Facebook,
	Github,
	Instagram,
	Linkedin,
	Settings,
	Twitter,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
	const userRole = await getUserCommunityRole(community.id);
	const isOwner = userRole === "owner";
	const isAdminUser = await isAdmin();
	const canManage = isOwner || userRole === "admin" || isAdminUser;

	const tabs = [
		{ id: "events" as const, label: "Eventos", icon: Calendar },
		{ id: "members" as const, label: "Miembros", icon: Users },
		...(canManage
			? [
					{ id: "analytics" as const, label: "Analytics", icon: BarChart3 },
					{ id: "settings" as const, label: "Configuración", icon: Settings },
				]
			: []),
	];

	return (
		<div className="border-b bg-muted/30">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="flex items-center justify-between gap-4 py-4">
					<div className="flex items-center gap-3 min-w-0">
						<Link href="/">
							<Button variant="ghost" size="sm" className="gap-2">
								<ArrowLeft className="h-4 w-4" />
								Volver
							</Button>
						</Link>
						<div className="h-6 w-px bg-border" />

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
							{(community.twitterUrl ||
								community.linkedinUrl ||
								community.instagramUrl ||
								community.facebookUrl ||
								community.githubUrl) && (
								<div className="flex items-center gap-3 mt-2">
									{community.twitterUrl && (
										<Link
											href={community.twitterUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
												<Twitter className="h-3.5 w-3.5" />
											</Button>
										</Link>
									)}
									{community.linkedinUrl && (
										<Link
											href={community.linkedinUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
												<Linkedin className="h-3.5 w-3.5" />
											</Button>
										</Link>
									)}
									{community.instagramUrl && (
										<Link
											href={community.instagramUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
												<Instagram className="h-3.5 w-3.5" />
											</Button>
										</Link>
									)}
									{community.facebookUrl && (
										<Link
											href={community.facebookUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
												<Facebook className="h-3.5 w-3.5" />
											</Button>
										</Link>
									)}
									{community.githubUrl && (
										<Link
											href={community.githubUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
												<Github className="h-3.5 w-3.5" />
											</Button>
										</Link>
									)}
								</div>
							)}
						</div>
					</div>

					<CommunityActions communitySlug={slug} userRole={userRole} />
				</div>

				<nav className="flex items-center gap-1 border-t -mb-px">
					{tabs.map((tab) => {
						const Icon = tab.icon;
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
