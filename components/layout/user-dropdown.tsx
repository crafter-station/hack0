"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Moon, Sun, User, Zap } from "lucide-react";
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
}

export function UserDropdown({ isGodMode = false }: UserDropdownProps) {
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
