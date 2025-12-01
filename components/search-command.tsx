"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Sparkles, ArrowRight, Command } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getCountryFlag, formatEventDateShort } from "@/lib/event-utils";
import type { Hackathon } from "@/lib/db/schema";

// Trigger component for the header
export function SearchTrigger() {
  const handleClick = () => {
    // Dispatch a custom event to open the search
    document.dispatchEvent(new CustomEvent("open-search-command"));
  };

  return (
    <button
      onClick={handleClick}
      className="hidden sm:inline-flex h-7 items-center gap-1 rounded border bg-muted px-2 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
    >
      <Command className="h-3 w-3" />K
    </button>
  );
}

interface SearchCommandProps {
  hackathons: Hackathon[];
}

export function SearchCommand({ hackathons }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    document.addEventListener("open-search-command", handleCustomOpen);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("open-search-command", handleCustomOpen);
    };
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  // Group hackathons by status for better organization
  const upcomingEvents = hackathons.filter((h) => {
    const now = new Date();
    const start = h.startDate ? new Date(h.startDate) : null;
    return start && start > now;
  });

  const ongoingEvents = hackathons.filter((h) => {
    const now = new Date();
    const start = h.startDate ? new Date(h.startDate) : null;
    const end = h.endDate ? new Date(h.endDate) : null;
    return start && end && start <= now && end >= now;
  });

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Buscar eventos"
      description="Busca hackathons, conferencias y eventos tech en Perú"
    >
      <CommandInput placeholder="Buscar eventos..." />
      <CommandList>
        <CommandEmpty>No se encontraron eventos.</CommandEmpty>

        {/* Quick actions */}
        <CommandGroup heading="Acciones rápidas">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/submit"))}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Agregar nuevo evento
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/?juniorFriendly=true"))}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Ver eventos para principiantes
          </CommandItem>
        </CommandGroup>

        {/* Ongoing events */}
        {ongoingEvents.length > 0 && (
          <CommandGroup heading="En curso">
            {ongoingEvents.slice(0, 3).map((event) => (
              <CommandItem
                key={event.id}
                value={event.name}
                onSelect={() => runCommand(() => router.push(`/${event.slug}`))}
              >
                <div className="flex items-center gap-3 w-full">
                  {event.logoUrl ? (
                    <img
                      src={event.logoUrl}
                      alt=""
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <span className="text-base">
                      {getCountryFlag(event.country)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{event.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.organizerName}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <CommandGroup heading="Próximos eventos">
            {upcomingEvents.slice(0, 5).map((event) => (
              <CommandItem
                key={event.id}
                value={event.name}
                onSelect={() => runCommand(() => router.push(`/${event.slug}`))}
              >
                <div className="flex items-center gap-3 w-full">
                  {event.logoUrl ? (
                    <img
                      src={event.logoUrl}
                      alt=""
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <span className="text-base">
                      {getCountryFlag(event.country)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{event.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {event.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatEventDateShort(new Date(event.startDate))}
                        </span>
                      )}
                      {event.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getCountryFlag(event.country)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
