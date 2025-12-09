"use client";

import { Calendar, Trophy, GraduationCap, Users, Sparkles, Heart } from "lucide-react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import { motion } from "framer-motion";

const FILTERS = {
	all: { label: "Todos", icon: Sparkles },
	following: { label: "Siguiendo", icon: Heart },
	competitions: { label: "Competencias", icon: Trophy },
	learning: { label: "Formación", icon: GraduationCap },
	community: { label: "Comunidad", icon: Users },
} as const;

export type FeedFilter = keyof typeof FILTERS;

const filterParser = parseAsStringLiteral(Object.keys(FILTERS) as FeedFilter[]);

export function FilterPills() {
	const [filter, setFilter] = useQueryState(
		"filter",
		filterParser.withDefault("all"),
	);

	return (
		<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
					{(Object.keys(FILTERS) as FeedFilter[]).map((key) => {
						const { label, icon: Icon } = FILTERS[key];
						const isActive = filter === key;

						return (
							<button
								key={key}
								onClick={() => setFilter(key)}
								className={`
									relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
									transition-colors whitespace-nowrap
									${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
								`}
							>
								{isActive && (
									<motion.div
										layoutId="pill-bg"
										className="absolute inset-0 bg-muted rounded-full"
										transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
									/>
								)}
								<Icon className="h-3.5 w-3.5 relative z-10" />
								<span className="relative z-10">{label}</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export function useCurrentFilter() {
	const [filter] = useQueryState("filter", filterParser.withDefault("all"));
	return filter;
}
