"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { Building2, LogOut, Moon, Sun, User, Zap } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserDropdownProps {
	isGodMode?: boolean;
	adminCommunities?: Array<{
		organization: {
			id: string;
			slug: string;
			name: string;
			displayName: string | null;
			logoUrl: string | null;
			isPersonalOrg: boolean | null;
		};
		role: "owner" | "admin";
	}>;
}

export function UserDropdown({
	isGodMode = false,
	adminCommunities = [],
}: UserDropdownProps) {
	const { user } = useUser();
	const { signOut } = useClerk();
	const { theme, setTheme } = useTheme();

	if (!user) return null;

	const userEmail = user.primaryEmailAddress?.emailAddress;
	const userName = user.fullName || user.username || userEmail;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="relative h-7 w-7 rounded-full overflow-hidden ring-1 ring-border hover:ring-foreground/20 transition-all">
					{user.imageUrl ? (
						<img
							src={user.imageUrl}
							alt={userName || "Usuario"}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="h-full w-full bg-muted flex items-center justify-center">
							<User className="h-3.5 w-3.5 text-muted-foreground" />
						</div>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuLabel className="font-normal py-1.5">
					<div className="flex flex-col gap-0.5">
						<p className="text-xs font-medium leading-none">{userName}</p>
						{userEmail && (
							<p className="text-[10px] leading-none text-muted-foreground truncate">
								{userEmail}
							</p>
						)}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{isGodMode && (
					<>
						<DropdownMenuItem
							asChild
							className="text-amber-600 dark:text-amber-400"
						>
							<Link href="/god">
								<Zap className="h-3.5 w-3.5" />
								<span className="text-xs">Panel Admin</span>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}
				{adminCommunities && adminCommunities.length > 0 && (
					<>
						<DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-medium px-2 py-1.5">
							Mis comunidades
						</DropdownMenuLabel>
						{[...adminCommunities]
							.sort((a, b) => {
								if (a.organization.isPersonalOrg && !b.organization.isPersonalOrg) return -1;
								if (!a.organization.isPersonalOrg && b.organization.isPersonalOrg) return 1;
								const nameA = a.organization.displayName || a.organization.name;
								const nameB = b.organization.displayName || b.organization.name;
								return nameA.localeCompare(nameB);
							})
							.slice(0, 5)
							.map(({ organization }) => (
							<DropdownMenuItem asChild key={organization.id}>
								<Link
									href={`/c/${organization.slug}`}
									className="flex items-center gap-2"
								>
									{organization.logoUrl ? (
										<img
											src={organization.logoUrl}
											alt={organization.displayName || organization.name}
											className="h-4 w-4 rounded-full object-cover ring-1 ring-border"
										/>
									) : organization.isPersonalOrg ? (
										<User className="h-3.5 w-3.5" />
									) : (
										<Building2 className="h-3.5 w-3.5" />
									)}
									<span className="text-xs truncate">
										{organization.isPersonalOrg
											? "Personal"
											: organization.displayName || organization.name}
									</span>
								</Link>
							</DropdownMenuItem>
						))}
						{adminCommunities.length > 5 && (
							<DropdownMenuItem asChild>
								<Link
									href="/c"
									className="flex items-center justify-center text-muted-foreground"
								>
									<span className="text-xs">Ver todas ({adminCommunities.length})</span>
								</Link>
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuItem asChild>
					<Link href="/profile">
						<User className="h-3.5 w-3.5" />
						<span className="text-xs">Perfil</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
				>
					{theme === "dark" ? (
						<>
							<Sun className="h-3.5 w-3.5" />
							<span className="text-xs">Tema claro</span>
						</>
					) : (
						<>
							<Moon className="h-3.5 w-3.5" />
							<span className="text-xs">Tema oscuro</span>
						</>
					)}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => signOut({ redirectUrl: "/" })}
				>
					<LogOut className="h-3.5 w-3.5" />
					<span className="text-xs">Cerrar sesión</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
