"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { GithubLogo } from "@/components/logos/github";

export function GithubStars() {
	const [stars, setStars] = useState<number | null>(null);

	useEffect(() => {
		const fetchStars = async () => {
			try {
				const response = await fetch(
					"https://api.github.com/repos/crafter-station/hack0",
				);
				if (response.ok) {
					const data = await response.json();
					setStars(data.stargazers_count);
				}
			} catch (error) {
				console.warn("Failed to fetch GitHub stars:", error);
			}
		};
		fetchStars();
	}, []);

	return (
		<a
			href="https://github.com/crafter-station/hack0"
			target="_blank"
			rel="noopener noreferrer"
			className="hidden sm:inline-flex h-7 items-center gap-1.5 border border-border/50 px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<GithubLogo className="h-3.5 w-3.5" mode="currentColor" />
			<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
			{stars === null ? (
				<span className="h-3 w-4 bg-muted animate-pulse rounded" />
			) : (
				<span>{stars}</span>
			)}
		</a>
	);
}
