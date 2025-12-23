"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { COMMUNITY_TAG_LABELS, type CommunityTag } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const POPULAR_TAGS: CommunityTag[] = [
	"early-stage",
	"data-ai",
	"networking",
	"mobile",
	"acceleration",
	"incubation",
	"investment",
];

interface CommunityCategoryTabsProps {
	activeTab?: string;
	tagCounts?: Record<string, number>;
	totalCount?: number;
}

export function CommunityCategoryTabs({
	activeTab = "todas",
	tagCounts = {},
	totalCount = 0,
}: CommunityCategoryTabsProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const viewportRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const checkScroll = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const { scrollLeft, scrollWidth, clientWidth } = viewport;
		setCanScrollLeft(scrollLeft > 0);
		setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
	}, []);

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		checkScroll();
		viewport.addEventListener("scroll", checkScroll);
		window.addEventListener("resize", checkScroll);

		return () => {
			viewport.removeEventListener("scroll", checkScroll);
			window.removeEventListener("resize", checkScroll);
		};
	}, [checkScroll]);

	const handleTabChange = (tabId: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (tabId === "todas") {
			params.delete("tags");
		} else {
			params.set("tags", tabId);
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="relative min-w-0">
			<div
				className={cn(
					"pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 transition-opacity duration-200",
					canScrollLeft ? "opacity-100" : "opacity-0",
				)}
			/>
			<div
				className={cn(
					"pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 transition-opacity duration-200",
					canScrollRight ? "opacity-100" : "opacity-0",
				)}
			/>

			<div
				ref={viewportRef}
				className="w-full overflow-x-auto"
				style={{
					scrollbarWidth: "none",
					msOverflowStyle: "none",
				}}
			>
				<div className="flex items-center gap-1 pb-1">
					<button
						type="button"
						onClick={() => handleTabChange("todas")}
						className={cn(
							"px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
							activeTab === "todas"
								? "text-foreground border-b-2 border-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Todas ({totalCount})
					</button>
					{POPULAR_TAGS.map((tag) => (
						<button
							key={tag}
							type="button"
							onClick={() => handleTabChange(tag)}
							className={cn(
								"px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
								activeTab === tag
									? "text-foreground border-b-2 border-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{COMMUNITY_TAG_LABELS[tag]} ({tagCounts[tag] || 0})
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
