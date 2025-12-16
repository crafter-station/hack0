"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserDropdown() {
	const { user } = useUser();
	const { signOut } = useClerk();
	const { theme, setTheme } = useTheme();

	if (!user) return null;

	const userEmail = user.primaryEmailAddress?.emailAddress;
	const userName = user.fullName || user.username || userEmail;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="relative h-8 w-8 rounded-full overflow-hidden ring-1 ring-border hover:ring-foreground/20 transition-all">
					{user.imageUrl ? (
						<img
							src={user.imageUrl}
							alt={userName || "Usuario"}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="h-full w-full bg-muted flex items-center justify-center">
							<User className="h-4 w-4 text-muted-foreground" />
						</div>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{userName}</p>
						{userEmail && (
							<p className="text-xs leading-none text-muted-foreground">
								{userEmail}
							</p>
						)}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/profile">
						<User className="h-4 w-4" />
						Perfil
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
				>
					{theme === "dark" ? (
						<>
							<Sun className="h-4 w-4" />
							Tema claro
						</>
					) : (
						<>
							<Moon className="h-4 w-4" />
							Tema oscuro
						</>
					)}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => signOut({ redirectUrl: "/" })}
				>
					<LogOut className="h-4 w-4" />
					Cerrar sesión
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
