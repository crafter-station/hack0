"use client";

import {
	Building2,
	Check,
	ChevronsUpDown,
	Crown,
	LayoutGrid,
	Plus,
	Search,
	Shield,
	User,
	UserPlus,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Organization } from "@/lib/db/schema";

interface OrganizationWithRole {
	organization: Organization;
	role: "owner" | "admin" | "member" | "follower";
}

interface OrgSwitcherProps {
	organizations: OrganizationWithRole[];
	personalOrg: Organization | null;
}

const ROLE_CONFIG = {
	owner: {
		label: "Owner",
		icon: Crown,
		color: "text-amber-500",
	},
	admin: {
		label: "Admin",
		icon: Shield,
		color: "text-blue-500",
	},
	member: {
		label: "Miembro",
		icon: Users,
		color: "text-muted-foreground",
	},
	follower: {
		label: "Seguidor",
		icon: UserPlus,
		color: "text-muted-foreground",
	},
};

export function OrgSwitcher({ organizations, personalOrg }: OrgSwitcherProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const params = useParams();
	const currentSlug = params.slug as string | undefined;

	const currentOrg = organizations.find(
		(o) => o.organization.slug === currentSlug,
	);

	const filteredOrganizations = useMemo(() => {
		if (!searchQuery.trim()) return organizations;

		const query = searchQuery.toLowerCase();
		return organizations.filter(({ organization }) => {
			const name = (
				organization.displayName || organization.name
			).toLowerCase();
			const slug = organization.slug.toLowerCase();
			return name.includes(query) || slug.includes(query);
		});
	}, [organizations, searchQuery]);

	if (organizations.length === 0) {
		return (
			<Link
				href="/c"
				className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				<LayoutGrid className="h-3.5 w-3.5" />
				<span className="hidden sm:inline">Comunidades</span>
			</Link>
		);
	}

	if (organizations.length === 1 && !currentSlug) {
		return (
			<Link
				href="/c"
				className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				<LayoutGrid className="h-3.5 w-3.5" />
				<span className="hidden sm:inline">Ver Comunidades</span>
			</Link>
		);
	}

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				{currentOrg ? (
					<>
						{currentOrg.organization.logoUrl ? (
							<img
								src={currentOrg.organization.logoUrl}
								alt=""
								className="h-4 w-4 rounded object-cover"
							/>
						) : (
							<Building2 className="h-3.5 w-3.5" />
						)}
						<span className="hidden sm:inline max-w-[120px] truncate">
							{currentOrg.organization.displayName ||
								currentOrg.organization.name}
						</span>
						<ChevronsUpDown className="h-3.5 w-3.5 ml-auto" />
					</>
				) : (
					<>
						<LayoutGrid className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">Ir a comunidad</span>
					</>
				)}
			</button>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 z-[60]"
						onClick={() => {
							setIsOpen(false);
							setSearchQuery("");
						}}
					/>
					<div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-popover shadow-lg z-[70] overflow-hidden">
						<div className="p-2">
							{personalOrg && (
								<>
									<Link
										href={`/c/${personalOrg.slug}`}
										onClick={() => {
											setIsOpen(false);
											setSearchQuery("");
										}}
										className="flex items-center gap-2 rounded-md px-2 py-3 mb-2 text-sm transition-colors bg-accent/50 hover:bg-accent border border-border/50"
									>
										{personalOrg.logoUrl ? (
											<img
												src={personalOrg.logoUrl}
												alt=""
												className="h-5 w-5 rounded object-cover shrink-0"
											/>
										) : (
											<User className="h-5 w-5 shrink-0" />
										)}
										<div className="flex-1 min-w-0">
											<div className="truncate font-medium">Mi Perfil</div>
											<div className="text-xs text-muted-foreground truncate">
												{personalOrg.slug}
											</div>
										</div>
									</Link>
									<div className="h-px bg-border my-2" />
								</>
							)}

							<div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
								Tus comunidades
							</div>

							{organizations.length > 5 && (
								<div className="px-2 pb-2">
									<div className="relative">
										<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
										<Input
											type="text"
											placeholder="Buscar..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="h-8 pl-7 text-sm"
										/>
									</div>
								</div>
							)}

							<div className="space-y-1 max-h-[400px] overflow-y-auto">
								{filteredOrganizations.length === 0 ? (
									<div className="px-2 py-4 text-center text-sm text-muted-foreground">
										No se encontraron comunidades
									</div>
								) : (
									filteredOrganizations.map(({ organization, role }) => {
										const roleConfig = ROLE_CONFIG[role];
										const RoleIcon = roleConfig.icon;
										const isActive = organization.slug === currentSlug;

										return (
											<Link
												key={organization.id}
												href={`/c/${organization.slug}`}
												onClick={() => {
													setIsOpen(false);
													setSearchQuery("");
												}}
												className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent ${
													isActive ? "bg-accent" : ""
												}`}
											>
												{organization.logoUrl ? (
													<img
														src={organization.logoUrl}
														alt=""
														className="h-5 w-5 rounded object-cover shrink-0"
													/>
												) : (
													<div className="h-5 w-5 rounded bg-muted flex items-center justify-center shrink-0">
														<Building2 className="h-3 w-3 text-muted-foreground" />
													</div>
												)}
												<div className="flex-1 min-w-0">
													<div className="truncate font-medium">
														{organization.displayName || organization.name}
													</div>
													<div className="flex items-center gap-1 text-xs text-muted-foreground">
														<RoleIcon className="h-3 w-3" />
														{roleConfig.label}
													</div>
												</div>
												{isActive && <Check className="h-4 w-4 shrink-0" />}
											</Link>
										);
									})
								)}
							</div>
						</div>
						<div className="border-t border-border p-2 space-y-1">
							<Link
								href="/c"
								onClick={() => {
									setIsOpen(false);
									setSearchQuery("");
								}}
								className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
							>
								<LayoutGrid className="h-4 w-4" />
								Ver todas las comunidades
							</Link>
							<Link
								href="/c/new"
								onClick={() => {
									setIsOpen(false);
									setSearchQuery("");
								}}
								className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
							>
								<Plus className="h-4 w-4" />
								Crear comunidad
							</Link>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
