"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/event-categories";
import { Trophy, GraduationCap, Users, LayoutGrid } from "lucide-react";

const CATEGORY_ICONS: Record<EventCategory, React.ReactNode> = {
  all: <LayoutGrid className="h-3.5 w-3.5" />,
  competitions: <Trophy className="h-3.5 w-3.5" />,
  learning: <GraduationCap className="h-3.5 w-3.5" />,
  community: <Users className="h-3.5 w-3.5" />,
};

export function CategoryTabs() {
  const searchParams = useSearchParams();
  const currentCategory = (searchParams.get("category") as EventCategory) || "all";

  return (
    <div className="flex items-center gap-1">
      {EVENT_CATEGORIES.map((category) => {
        const isActive = currentCategory === category.id;

        const params = new URLSearchParams(searchParams.toString());
        params.set("category", category.id);
        params.delete("page");
        params.delete("eventType");

        return (
          <Link
            key={category.id}
            href={`/?${params.toString()}`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
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
