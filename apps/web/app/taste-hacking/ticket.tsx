import { Mark } from "@/components/logo";
import { WORKSHOP } from "./workshop";

/**
 * The workshop's ticket. It is the page's real call to action and the piece the bench takes apart,
 * so its text never changes: only the styles around it do. `data-probe` marks what the bench measures.
 */
export function Ticket() {
  return (
    <article className="th-ticket" data-probe="2" aria-label="Entrada al workshop">
      <header>
        <Mark size={22} bg="var(--card)" ink="var(--card-ink)" />
        <span>workshop 01</span>
      </header>
      <p className="th-ticket-date" data-probe="1">
        {WORKSHOP.day}
      </p>
      <p className="th-ticket-sub">90 minutos, en vivo</p>
      <dl data-probe="3">
        <div>
          <dt>hora</dt>
          <dd>
            {WORKSHOP.times.map((t) => (
              <span key={t.place}>
                {t.time} {t.place}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt>lugar</dt>
          <dd>online, por Google Meet</dd>
        </div>
        <div>
          <dt>entrada</dt>
          <dd>{WORKSHOP.price}</dd>
        </div>
      </dl>
      <a className="th-cta" href={WORKSHOP.luma} data-probe="4">
        Inscríbete en Luma <span aria-hidden="true">→</span>
      </a>
    </article>
  );
}
