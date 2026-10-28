import { type CalendarEvent, placeLabel } from "@/lib/calendar";
import { SITE } from "@/lib/site";

const DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
const TIME: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

/** Formats the event's start in its own timezone, so a Lima event reads in Lima time. */
const zoned = (e: CalendarEvent, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es", { ...options, timeZone: e.timezone }).format(new Date(e.startAt));

const pageUrl = (e: CalendarEvent) => `${SITE}/eventos/${e.slug}`;

/** The week's curated agenda as Markdown, grouped by metro, online last. */
export function agendaDraft(events: CalendarEvent[], weekStart: Date) {
  const groups = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.metro ?? (e.online ? "Online" : "Por confirmar");
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const online = (place: string) => (place === "Online" ? 1 : 0);
  const order = [...groups.keys()].sort((a, b) => online(a) - online(b) || (groups.get(b)?.length ?? 0) - (groups.get(a)?.length ?? 0));
  const title = `Agenda tech LATAM: semana del ${new Intl.DateTimeFormat("es", DAY).format(weekStart)}`;
  const sections = order.map((place) => {
    const lines = (groups.get(place) ?? []).map((e) => `- ${zoned(e, DAY)}, ${zoned(e, TIME)}: [${e.name}](${pageUrl(e)})`);
    return `## ${place}\n\n${lines.join("\n")}`;
  });
  const body = [
    `# ${title}`,
    events.length === 1 ? "1 evento curado por hack0 para esta semana." : `${events.length} eventos curados por hack0 para esta semana.`,
    ...sections,
    `Todo el calendario: ${SITE}/eventos`,
  ].join("\n\n");
  return { title, body };
}

/** One short post per event, linking to its hack0 page. */
export function eventPostDraft(e: CalendarEvent) {
  const place = placeLabel(e) || "online";
  const title = e.name;
  const body = [
    `${e.name}`,
    `${zoned(e, DAY)}, ${zoned(e, TIME)} · ${place}`,
    ...(e.tags.length ? [e.tags.map((t) => `#${t}`).join(" ")] : []),
    pageUrl(e),
  ].join("\n");
  return { title, body };
}
