"use client";

import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Sparkles } from "lucide-react";
import { TrophyIcon } from "@/components/icons/trophy";
import { PinIcon } from "@/components/icons/pin";
import { CalendarIcon } from "@/components/icons/calendar";
import type { Hackathon } from "@/lib/db/schema";
import {
  getEventStatus,
  getFormatLabel,
  getEventTypeLabel,
  formatEventDateRange,
  formatEventDateSmart,
} from "@/lib/event-utils";

interface EventRowProps {
  event: Hackathon;
}

export function EventRow({ event }: EventRowProps) {
  const startDate = event.startDate ? new Date(event.startDate) : null;
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const status = getEventStatus(event);

  // Visual treatment based on status
  const isEnded = status.status === "ended";
  const isOngoing = status.status === "ongoing";
  const isOpen = status.status === "open";
  const isUpcoming = status.status === "upcoming";
  const isFeatured = event.isFeatured;

  // Minimal amber stripe pattern for featured/sponsored events
  const featuredStripe = `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6L6 0' stroke='%23F59E0B' stroke-width='0.5' fill='none' opacity='0.15'/%3E%3C/svg%3E")`;

  return (
    <Link
      href={`/${event.slug}`}
      className={`group relative grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_200px_120px_100px_130px] gap-4 items-center px-5 py-4 transition-colors hover:bg-muted/50 ${
        isEnded && !isFeatured ? "opacity-50" : ""
      } ${isFeatured ? "border-l-2 border-l-amber-500" : ""}`}
      style={isFeatured ? {
        backgroundImage: featuredStripe,
        backgroundSize: "6px 6px",
      } : undefined}
    >
      {/* Name & Organizer */}
      <div className="min-w-0 flex items-center gap-3">
        {/* Thumbnail */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
          {event.logoUrl ? (
            <Image
              src={event.logoUrl}
              alt={event.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
              {event.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <h3 className="font-medium truncate group-hover:underline underline-offset-2">
            {event.name}
          </h3>
          {isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500 shrink-0">
              Sponsored
            </span>
          )}
          {event.isJuniorFriendly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500 shrink-0">
              <Sparkles className="h-2.5 w-2.5" />
              Junior
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {event.organizerName && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              {event.organizerName}
              {event.isOrganizerVerified ? (
                <BadgeCheck className="h-3.5 w-3.5 fill-foreground text-background" />
              ) : (
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-dashed border-muted-foreground/40">
                  <span className="text-[8px] text-muted-foreground/40">?</span>
                </span>
              )}
            </span>
          )}
          <span className="hidden lg:inline text-xs text-muted-foreground/50">
            {getEventTypeLabel(event.eventType)}
          </span>
        </div>
        </div>
      </div>

      {/* Date */}
      <div className="hidden lg:block text-sm text-muted-foreground">
        {startDate ? (
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{formatEventDateRange(startDate, endDate)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </div>

      {/* Format */}
      <div className="hidden lg:block">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <PinIcon className="h-3.5 w-3.5" />
          {getFormatLabel(event.format)}
        </span>
      </div>

      {/* Prize */}
      <div className="hidden lg:block text-right">
        {event.prizePool && event.prizePool > 0 ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium">
            <TrophyIcon className="h-3.5 w-3.5 text-amber-500" />
            ${event.prizePool.toLocaleString()}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Status - with visual color coding */}
      <div className="flex items-center justify-end">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isEnded
              ? "bg-muted text-muted-foreground"
              : isOngoing
              ? "bg-emerald-500/10 text-emerald-500"
              : isOpen
              ? "bg-blue-500/10 text-blue-500"
              : "bg-amber-500/10 text-amber-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isEnded
                ? "bg-muted-foreground/50"
                : isOngoing
                ? "bg-emerald-500 animate-pulse"
                : isOpen
                ? "bg-blue-500"
                : "bg-amber-500"
            }`}
          />
          {status.label}
        </span>
      </div>

      {/* Mobile meta row */}
      <div className="col-span-2 flex items-center gap-3 text-xs text-muted-foreground lg:hidden">
        {startDate && (
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {formatEventDateSmart(startDate)}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <PinIcon className="h-3 w-3" />
          {getFormatLabel(event.format)}
        </span>
        {event.prizePool && event.prizePool > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <TrophyIcon className="h-3 w-3 text-amber-500" />
            ${event.prizePool.toLocaleString()}
          </span>
        )}
      </div>
    </Link>
  );
}
