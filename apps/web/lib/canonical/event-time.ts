type EventTemporalStatus = "upcoming" | "ongoing" | "past" | "unknown";

type TimedEvent = {
  id: string;
  name: string;
  startAt: string;
  endAt?: string | null;
};

function parseEventTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function eventTemporalStatus(event: Pick<TimedEvent, "startAt" | "endAt">, now = Date.now()): EventTemporalStatus {
  const start = parseEventTime(event.startAt);
  if (start === null) return "unknown";
  if (start > now) return "upcoming";

  const end = parseEventTime(event.endAt);
  if (end !== null && end > now) return "ongoing";
  return "past";
}

export function eventDurationMinutes(event: Pick<TimedEvent, "startAt" | "endAt">): number | null {
  const start = parseEventTime(event.startAt);
  const end = parseEventTime(event.endAt);
  if (start === null || end === null || end < start) return null;
  return Math.round((end - start) / 60_000);
}

export function summarizeEventCounts(
  events: Array<Pick<TimedEvent, "startAt" | "endAt">>,
  now = Date.now(),
): { total: number; upcoming: number; past: number; unknown: number } {
  const summary = { total: events.length, upcoming: 0, past: 0, unknown: 0 };
  for (const event of events) {
    const status = eventTemporalStatus(event, now);
    if (status === "upcoming" || status === "ongoing") summary.upcoming++;
    else if (status === "past") summary.past++;
    else summary.unknown++;
  }
  return summary;
}

function compareName(a: TimedEvent, b: TimedEvent): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }) || a.id.localeCompare(b.id);
}

export function compareEventsUpcomingFirst(a: TimedEvent, b: TimedEvent, now = Date.now()): number {
  const rank: Record<EventTemporalStatus, number> = {
    ongoing: 0,
    upcoming: 1,
    past: 2,
    unknown: 3,
  };
  const aStatus = eventTemporalStatus(a, now);
  const bStatus = eventTemporalStatus(b, now);
  if (aStatus !== bStatus) return rank[aStatus] - rank[bStatus];

  const aStart = parseEventTime(a.startAt);
  const bStart = parseEventTime(b.startAt);
  if (aStart === null || bStart === null) return compareName(a, b);
  if (aStatus === "past") return bStart - aStart || compareName(a, b);
  return aStart - bStart || compareName(a, b);
}
