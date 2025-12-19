"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface JuniorFriendlyToggleProps {
	value: boolean;
	onChange: (value: boolean) => void;
}

export function JuniorFriendlyToggle({
	value,
	onChange,
}: JuniorFriendlyToggleProps) {
	return (
		<button
			type="button"
			onClick={() => onChange(!value)}
			className={cn(
				"relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left w-full",
				"hover:border-amber-500/50 hover:bg-amber-500/5",
				value ? "border-amber-500 bg-amber-500/5" : "border-border bg-card",
			)}
		>
			<div
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
					value
						? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
						: "bg-muted text-muted-foreground",
				)}
			>
				<Sparkles className="h-5 w-5" />
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p
						className={cn(
							"text-sm font-medium",
							value ? "text-foreground" : "text-muted-foreground",
						)}
					>
						Junior Friendly
					</p>
					{value && (
						<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
							Activado
						</span>
					)}
				</div>
				<p className="text-xs text-muted-foreground mt-1">
					Evento adecuado para principiantes sin experiencia previa
				</p>
			</div>

			{value && (
				<div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500" />
			)}
		</button>
	);
}
