"use client";

import { CheckCircle2, Crown, Shield, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Organization } from "@/lib/db/schema";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";

interface OrganizationWithRole {
	organization: Organization;
	role: "owner" | "admin" | "member" | "follower" | null;
}

interface MyOrgListProps {
	organizations: OrganizationWithRole[];
}

const ROLE_CONFIG = {
	owner: { label: "Owner", icon: Crown, color: "text-amber-500" },
	admin: { label: "Admin", icon: Shield, color: "text-blue-500" },
	member: { label: "Miembro", icon: Users, color: "text-muted-foreground" },
	follower: {
		label: "Seguidor",
		icon: UserPlus,
		color: "text-muted-foreground",
	},
};

export function MyOrgList({ organizations }: MyOrgListProps) {
	if (organizations.length === 0) {
		return (
			<div className="py-12 text-center text-xs text-muted-foreground">
				No tienes comunidades aún
			</div>
		);
	}

	return (
		<div className="divide-y divide-border/50">
			{organizations.map(({ organization, role }) => {
				const roleConfig = ROLE_CONFIG[role ?? "follower"];
				const RoleIcon = roleConfig.icon;

				return (
					<Link
						key={organization.id}
						href={`/c/${organization.slug}`}
						className="group flex items-center gap-3 py-2 px-2 -mx-2 hover:bg-muted/30 transition-colors"
					>
						<div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
							{organization.logoUrl ? (
								<Image
									src={organization.logoUrl}
									alt={organization.displayName || organization.name}
									fill
									className="object-cover"
									sizes="32px"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
									{(organization.displayName || organization.name).charAt(0)}
								</div>
							)}
						</div>

						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1.5">
								<span className="text-sm font-medium truncate group-hover:underline underline-offset-2">
									{organization.isPersonalOrg
										? "Personal"
										: organization.displayName || organization.name}
								</span>
								{organization.isVerified && (
									<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
								)}
							</div>
							<p className="text-[11px] text-muted-foreground truncate">
								@{organization.slug}
							</p>
						</div>

						{organization.type && (
							<span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
								{ORGANIZER_TYPE_LABELS[organization.type] || organization.type}
							</span>
						)}

						<span
							className={`inline-flex items-center gap-1 text-[11px] ${roleConfig.color}`}
						>
							<RoleIcon className="h-3 w-3" />
							<span className="hidden sm:inline">{roleConfig.label}</span>
						</span>
					</Link>
				);
			})}
		</div>
	);
}
