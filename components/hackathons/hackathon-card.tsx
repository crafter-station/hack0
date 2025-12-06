import Link from "next/link";
import { Calendar, MapPin, ArrowUpRight, Sparkles } from "lucide-react";
import type { Hackathon } from "@/lib/db/schema";
import {
  getEventStatus,
  getFormatLabel,
  getCountryFlag,
  getEventTypeLabel,
  getDomainLabel,
  formatEventDateShort,
} from "@/lib/event-utils";

interface HackathonCardProps {
  hackathon: Hackathon;
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const startDate = hackathon.startDate ? new Date(hackathon.startDate) : null;
  const endDate = hackathon.endDate ? new Date(hackathon.endDate) : null;
  const status = getEventStatus(hackathon);

  return (
    <Link
      href={`/${hackathon.slug}`}
      className="group block p-5 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start gap-4">
        {/* Logo or flag */}
        {hackathon.eventImageUrl ? (
          <img
            src={hackathon.eventImageUrl}
            alt=""
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-lg">
            {getCountryFlag(hackathon.country)}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium truncate group-hover:underline underline-offset-2">
                {hackathon.name}
              </h3>
              {hackathon.organizerName && (
                <p className="text-sm text-muted-foreground truncate">
                  {hackathon.organizerName}
                </p>
              )}
            </div>
            <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {/* Description */}
          {hackathon.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {hackathon.description}
            </p>
          )}

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {/* Status */}
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
              {status.label}
            </span>

            {/* Dates */}
            {startDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatEventDateShort(startDate)}
                {endDate && ` – ${formatEventDateShort(endDate)}`}
              </span>
            )}

            {/* Location */}
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {getFormatLabel(hackathon.format, hackathon.department)}
              {hackathon.country && (
                <span className="ml-0.5">{getCountryFlag(hackathon.country)}</span>
              )}
            </span>

            {/* Prize */}
            {hackathon.prizePool && hackathon.prizePool > 0 && (
              <span className="font-medium text-foreground">
                ${hackathon.prizePool.toLocaleString()}
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex h-5 items-center rounded border border-border px-1.5 text-xs text-muted-foreground">
              {getEventTypeLabel(hackathon.eventType)}
            </span>
            {hackathon.isJuniorFriendly && (
              <span className="inline-flex h-5 items-center gap-1 rounded border border-border px-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-2.5 w-2.5" />
                Junior
              </span>
            )}
            {hackathon.domains?.slice(0, 2).map((domain) => (
              <span
                key={domain}
                className="inline-flex h-5 items-center rounded border border-border px-1.5 text-xs text-muted-foreground"
              >
                {getDomainLabel(domain)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
