"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/event-categories";
import { Trophy, GraduationCap, Users, LayoutGrid } from "lucide-react";

const CATEGORY_ICONS: Record<EventCategory, React.ReactNode> = {
  all: <LayoutGrid className="h-4 w-4" />,
  competitions: <Trophy className="h-4 w-4" />,
  learning: <GraduationCap className="h-4 w-4" />,
  community: <Users className="h-4 w-4" />,
};

export function CategoryTabs() {
  const searchParams = useSearchParams();
  const currentCategory = (searchParams.get("category") as EventCategory) || "all";

  return (
    <div className="flex items-center gap-1">
      {EVENT_CATEGORIES.map((category) => {
        const isActive = currentCategory === category.id;

        // Build URL preserving other params but resetting page
        const params = new URLSearchParams(searchParams.toString());
        params.set("category", category.id);
        params.delete("page"); // Reset page when changing category
        params.delete("eventType"); // Reset event type filter

        return (
          <Link
            key={category.id}
            href={`/?${params.toString()}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {CATEGORY_ICONS[category.id]}
            <span className="hidden sm:inline">{category.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
