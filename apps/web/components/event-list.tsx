import Link from "next/link";
import { Flag } from "@/components/flag";
import { type CalendarEvent, placeLabel } from "@/lib/calendar";
import { formatDate } from "@/lib/site";

export function EventList({ events }: { events: CalendarEvent[] }) {
  return (
    <ul className="events">
      {events.map((e) => {
        const { day, time } = formatDate(e);
        return (
          <li key={e.id}>
            <Link href={`/eventos/${e.slug}`}>
              <span className="date">
                {day}
                <span>{time}</span>
              </span>
              <span className="name">{e.name}</span>
              <span className="where">
                <Flag code={e.country} /> {placeLabel(e)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
