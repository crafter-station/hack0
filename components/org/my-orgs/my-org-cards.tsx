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

interface MyOrgCardsProps {
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

export function MyOrgCards({ organizations }: MyOrgCardsProps) {
	if (organizations.length === 0) {
		return (
			<div className="py-12 text-center text-xs text-muted-foreground">
				No tienes comunidades aún
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
			{organizations.map(({ organization, role }) => {
				const roleConfig = ROLE_CONFIG[role ?? "follower"];
				const RoleIcon = roleConfig.icon;

				return (
					<Link
						key={organization.id}
						href={`/c/${organization.slug}`}
						className="group flex flex-col rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
					>
						<div className="flex items-start gap-3 mb-2">
							<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
								{organization.logoUrl ? (
									<Image
										src={organization.logoUrl}
										alt={organization.displayName || organization.name}
										fill
										className="object-cover"
										sizes="40px"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
										{(organization.displayName || organization.name).charAt(0)}
									</div>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="text-sm font-medium text-foreground group-hover:underline underline-offset-2 line-clamp-1 flex items-center gap-1">
									{organization.isPersonalOrg
										? "Personal"
										: organization.displayName || organization.name}
									{organization.isVerified && (
										<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
									)}
								</h3>
								<p className="text-[11px] text-muted-foreground">
									@{organization.slug}
								</p>
							</div>
						</div>

						{organization.description && !organization.isPersonalOrg && (
							<p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
								{organization.description}
							</p>
						)}

						<div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
							<div className="flex items-center gap-2">
								{organization.type && (
									<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
										{ORGANIZER_TYPE_LABELS[organization.type] ||
											organization.type}
									</span>
								)}
							</div>
							<span
								className={`inline-flex items-center gap-1 ${roleConfig.color}`}
							>
								<RoleIcon className="h-3 w-3" />
								{roleConfig.label}
							</span>
						</div>
					</Link>
				);
			})}
		</div>
	);
}
