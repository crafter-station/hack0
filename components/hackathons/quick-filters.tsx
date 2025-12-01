"use client";

import { useQueryStates } from "nuqs";
import { Sparkles, Laptop, Trophy, GraduationCap, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { searchParamsParsers } from "@/lib/search-params";

const quickEventTypes = [
  { value: "hackathon", label: "Hackathons", icon: Trophy },
  { value: "conference", label: "Conferencias", icon: Building2 },
  { value: "workshop", label: "Talleres", icon: Laptop },
  { value: "bootcamp", label: "Bootcamps", icon: GraduationCap },
];

const quickFormats = [
  { value: "virtual", label: "Virtual" },
  { value: "in-person", label: "Presencial" },
  { value: "hybrid", label: "Híbrido" },
];

export function QuickFilters() {
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    shallow: false,
  });

  const { juniorFriendly, eventType, format } = filters;

  const toggleEventType = (value: string) => {
    const newEventTypes = eventType.includes(value)
      ? eventType.filter((v) => v !== value)
      : [...eventType, value];
    setFilters({ eventType: newEventTypes });
  };

  const toggleFormat = (value: string) => {
    const newFormats = format.includes(value)
      ? format.filter((v) => v !== value)
      : [...format, value];
    setFilters({ format: newFormats });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Junior Friendly - Key differentiator */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant={juniorFriendly ? "default" : "outline"}
          className="cursor-pointer gap-1.5 py-1.5 px-3 text-sm transition-all hover:scale-105"
          onClick={() => setFilters({ juniorFriendly: !juniorFriendly })}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Para principiantes
        </Badge>

        {/* Quick event type filters */}
        {quickEventTypes.map((type) => {
          const Icon = type.icon;
          const isActive = eventType.includes(type.value);
          return (
            <Badge
              key={type.value}
              variant={isActive ? "default" : "outline"}
              className="cursor-pointer gap-1.5 py-1.5 px-3 text-sm transition-all hover:scale-105"
              onClick={() => toggleEventType(type.value)}
            >
              <Icon className="h-3.5 w-3.5" />
              {type.label}
            </Badge>
          );
        })}
      </div>

      {/* Format filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground mr-1">Formato:</span>
        {quickFormats.map((fmt) => {
          const isActive = format.includes(fmt.value);
          return (
            <Badge
              key={fmt.value}
              variant={isActive ? fmt.value as "virtual" | "in-person" | "hybrid" : "outline"}
              className="cursor-pointer py-1 px-2.5 text-xs transition-all hover:scale-105"
              onClick={() => toggleFormat(fmt.value)}
            >
              {fmt.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
