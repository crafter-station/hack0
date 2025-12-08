"use client";

import {
	Building2,
	ChevronRight,
	Crown,
	Plus,
	Search,
	Shield,
	Sparkles,
	UserPlus,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import type { Organization } from "@/lib/db/schema";

interface OrganizationWithRole {
	organization: Organization;
	role: "owner" | "admin" | "member" | "follower";
}

interface OrganizationSelectorProps {
	organizations: OrganizationWithRole[];
}

const ROLE_CONFIG = {
	owner: {
		label: "Owner",
		icon: Crown,
		color: "text-amber-500",
		bgColor: "bg-amber-500/10",
		borderColor: "border-amber-500/20",
	},
	admin: {
		label: "Admin",
		icon: Shield,
		color: "text-blue-500",
		bgColor: "bg-blue-500/10",
		borderColor: "border-blue-500/20",
	},
	member: {
		label: "Miembro",
		icon: Users,
		color: "text-muted-foreground",
		bgColor: "bg-muted",
		borderColor: "border-border",
	},
	follower: {
		label: "Seguidor",
		icon: UserPlus,
		color: "text-muted-foreground",
		bgColor: "bg-muted",
		borderColor: "border-border",
	},
};

export function OrganizationSelector({
	organizations,
}: OrganizationSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredOrganizations = useMemo(() => {
		if (!searchQuery.trim()) return organizations;

		const query = searchQuery.toLowerCase();
		return organizations.filter(({ organization }) => {
			const name = (
				organization.displayName || organization.name
			).toLowerCase();
			const slug = organization.slug.toLowerCase();
			const description = organization.description?.toLowerCase() || "";

			return (
				name.includes(query) ||
				slug.includes(query) ||
				description.includes(query)
			);
		});
	}, [organizations, searchQuery]);

	if (organizations.length === 0) {
		return (
			<div className="mx-auto max-w-2xl py-16">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Building2 className="h-6 w-6" />
						</EmptyMedia>
						<EmptyTitle>No tienes comunidades</EmptyTitle>
						<EmptyDescription>
							Crea tu primera comunidad para comenzar a organizar eventos y
							conectar con tu audiencia.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button asChild>
							<Link href="/c/new">Crear comunidad</Link>
						</Button>
					</EmptyContent>
				</Empty>
			</div>
		);
	}

	const ownerOrgs = filteredOrganizations.filter(({ role }) => role === "owner");
	const adminOrgs = filteredOrganizations.filter(({ role }) => role === "admin");
	const memberOrgs = filteredOrganizations.filter(
		({ role }) => role === "member",
	);
	const followerOrgs = filteredOrganizations.filter(
		({ role }) => role === "follower",
	);

	return (
		<div className="mx-auto max-w-6xl">
			<div className="mb-8">
				<div className="flex items-start justify-between gap-4 mb-6">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight mb-2">
							Tus comunidades
						</h1>
						<p className="text-sm text-muted-foreground">
							Administra y accede a todas tus comunidades desde un solo lugar
						</p>
					</div>
					<Button asChild size="sm">
						<Link href="/c/new">
							<Plus className="h-4 w-4" />
							Nueva comunidad
						</Link>
					</Button>
				</div>

				{organizations.length > 4 && (
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Buscar comunidades..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 max-w-md"
						/>
					</div>
				)}
			</div>

			{filteredOrganizations.length === 0 ? (
				<div className="py-16 text-center">
					<div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
						<Search className="h-6 w-6 text-muted-foreground" />
					</div>
					<p className="text-sm text-muted-foreground">
						No se encontraron comunidades que coincidan con "{searchQuery}"
					</p>
				</div>
			) : (
				<div className="space-y-8">
					{ownerOrgs.length > 0 && (
						<section>
							<div className="flex items-center gap-2 mb-4">
								<Crown className="h-4 w-4 text-amber-500" />
								<h2 className="text-sm font-medium text-muted-foreground">
									Propietario · {ownerOrgs.length}
								</h2>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{ownerOrgs.map(({ organization, role }) => (
									<OrganizationCard
										key={organization.id}
										organization={organization}
										role={role}
									/>
								))}
							</div>
						</section>
					)}

					{adminOrgs.length > 0 && (
						<section>
							<div className="flex items-center gap-2 mb-4">
								<Shield className="h-4 w-4 text-blue-500" />
								<h2 className="text-sm font-medium text-muted-foreground">
									Administrador · {adminOrgs.length}
								</h2>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{adminOrgs.map(({ organization, role }) => (
									<OrganizationCard
										key={organization.id}
										organization={organization}
										role={role}
									/>
								))}
							</div>
						</section>
					)}

					{memberOrgs.length > 0 && (
						<section>
							<div className="flex items-center gap-2 mb-4">
								<Users className="h-4 w-4 text-muted-foreground" />
								<h2 className="text-sm font-medium text-muted-foreground">
									Miembro · {memberOrgs.length}
								</h2>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{memberOrgs.map(({ organization, role }) => (
									<OrganizationCard
										key={organization.id}
										organization={organization}
										role={role}
									/>
								))}
							</div>
						</section>
					)}

					{followerOrgs.length > 0 && (
						<section>
							<div className="flex items-center gap-2 mb-4">
								<UserPlus className="h-4 w-4 text-muted-foreground" />
								<h2 className="text-sm font-medium text-muted-foreground">
									Seguidor · {followerOrgs.length}
								</h2>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{followerOrgs.map(({ organization, role }) => (
									<OrganizationCard
										key={organization.id}
										organization={organization}
										role={role}
									/>
								))}
							</div>
						</section>
					)}
				</div>
			)}
		</div>
	);
}

function OrganizationCard({
	organization,
	role,
}: {
	organization: Organization;
	role: "owner" | "admin" | "member" | "follower";
}) {
	const roleConfig = ROLE_CONFIG[role];
	const RoleIcon = roleConfig.icon;

	return (
		<Link
			href={`/c/${organization.slug}`}
			className={`group relative overflow-hidden rounded-lg border ${roleConfig.borderColor} bg-card transition-all hover:shadow-md hover:shadow-foreground/5 hover:-translate-y-0.5`}
		>
			<div className="p-6">
				<div className="flex items-start gap-4 mb-4">
					{organization.logoUrl ? (
						<div className="h-12 w-12 rounded-lg border border-border overflow-hidden shrink-0 ring-1 ring-foreground/5">
							<img
								src={organization.logoUrl}
								alt={organization.displayName || organization.name}
								className="h-full w-full object-cover"
							/>
						</div>
					) : (
						<div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0 ring-1 ring-foreground/5">
							<Building2 className="h-6 w-6 text-muted-foreground" />
						</div>
					)}

					<div className="min-w-0 flex-1">
						<h3 className="font-semibold truncate mb-1 group-hover:text-foreground transition-colors">
							{organization.displayName || organization.name}
						</h3>
						<p className="text-xs text-muted-foreground truncate font-mono">
							@{organization.slug}
						</p>
					</div>
				</div>

				{organization.description && (
					<p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
						{organization.description}
					</p>
				)}

				<div className="flex items-center justify-between pt-4 border-t border-border">
					<span
						className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleConfig.bgColor} ${roleConfig.color}`}
					>
						<RoleIcon className="h-3 w-3" />
						{roleConfig.label}
					</span>
					<ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
				</div>
			</div>
		</Link>
	);
}
