import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/logo";
import { sql } from "@/lib/db";
import { getEntitlementByEmail } from "@/lib/entitlements";
import { verifiedPrimaryEmail } from "@/lib/session-access";
import { type WorkshopPhase, workshopPhase } from "@/lib/workshop-clock";
import { Clip } from "../clip";
import { Code } from "../code";
import { GALLERY, LAYER_LABEL } from "../gallery";
import { GalleryGrid } from "../gallery-grid";
import { MaterialNav } from "../material-nav";
import { SessionPlayer } from "../session-player";
import { SessionState } from "../session-state";
import { AGENDA, CLI, WORKSHOP } from "../workshop";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Material · Taste hacking",
  alternates: { canonical: "/taste-hacking/material" },
  robots: { index: false, follow: false },
};

const SIGN_IN = `/sign-in?redirect_url=${encodeURIComponent("/taste-hacking/material")}`;

/** The three live cases; their sessions arrive after the workshop. */
const LIVE_CASES = AGENDA.flatMap((a) => a.cases ?? []);

const RECORDED = GALLERY.filter((g) => g.session);

/** Playback length in seconds per recorded session; a missing row means it is not uploaded yet. */
async function durations(): Promise<Map<string, number>> {
  const rows = (await sql()`select slug, duration_s from sessions where workshop_id = ${WORKSHOP.id}`) as {
    slug: string;
    duration_s: number;
  }[];
  return new Map(rows.map((r) => [r.slug, r.duration_s]));
}

function minutes(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

type BundleLink = { title: string; url: string };

/** Bundle links come from the packages table as untyped JSON. */
function recordingLink(links: unknown[]): BundleLink | null {
  for (const l of links) {
    if (typeof l !== "object" || l === null) continue;
    const { title, url } = l as { title?: unknown; url?: unknown };
    if (typeof title === "string" && typeof url === "string" && /record|grabaci/i.test(title)) return { title, url };
  }
  return null;
}

function SignedOut() {
  return (
    <section className="th-gate">
      <h1>Material</h1>
      <p>Ingresa con el mismo email con el que te registraste en Luma. Ahí está tu compra.</p>
      <div className="th-actions">
        <Link className="th-cta" href={SIGN_IN}>
          Ingresar <span aria-hidden="true">→</span>
        </Link>
        <a className="th-ghost" href={WORKSHOP.luma}>
          Todavía no compré
        </a>
      </div>
    </section>
  );
}

function NotEntitled({ email }: { email: string }) {
  return (
    <section className="th-gate">
      <h1>No encontramos tu compra</h1>
      <p>
        Entraste como <b>{email}</b>. Tu compra está en el email con el que te registraste en Luma.
      </p>
      <ol className="th-steps">
        <li>
          <h2>Si usaste otro email en Luma</h2>
          <p>Cambia de cuenta desde tu avatar, arriba a la derecha, e ingresa con ese email.</p>
        </li>
        <li>
          <h2>Si no recuerdas cuál fue</h2>
          <p>
            Busca un mail de {WORKSHOP.keySender}: llegó al email con el que compraste. O pide una key nueva. Llega solo si ese email tiene
            una compra, y la key anterior deja de funcionar.
          </p>
          <Code label="pedir una key nueva" lines={[CLI.recover("tu@email.com")]} />
        </li>
        <li>
          <h2>Si todavía no compraste</h2>
          <p>
            <a href={WORKSHOP.luma}>Inscríbete en Luma</a> y vuelve aquí con ese email.
          </p>
        </li>
      </ol>
    </section>
  );
}

const SECTIONS = [
  { id: "skill", label: "Skill" },
  { id: "sesiones", label: "Sesiones" },
  { id: "grabacion", label: "Grabación" },
  { id: "galeria", label: "Galería" },
];

const TIMES = WORKSHOP.times.map((t) => `${t.time} ${t.place}`).join(" · ");

function Recording({ recording, when }: { recording: BundleLink | null; when: WorkshopPhase }) {
  if (recording) {
    return (
      <p className="th-prose">
        Los 90 minutos completos, con los tres casos en vivo. <a href={recording.url}>{recording.title} ↗</a>
      </p>
    );
  }
  return (
    <div className="th-wait th-ticks">
      <p className="th-wait-when">{when.phase === "after" ? "Subiendo" : when.label}</p>
      <p className="th-wait-date">
        {WORKSHOP.day} · {TIMES}
      </p>
      <p className="th-prose">
        {when.phase === "after"
          ? "El workshop ya terminó. El link a los 90 minutos completos aparece aquí apenas esté subido."
          : "90 minutos en vivo: la tesis, el vocabulario y los tres casos. El link aparece aquí esa misma noche, cuando termine."}
      </p>
      <p className="th-wait-actions">
        {when.phase === "after" ? null : (
          <a href={WORKSHOP.luma} rel="noreferrer">
            Agregar al calendario desde Luma <span aria-hidden="true">↗</span>
          </a>
        )}
        <a href="#sesiones">
          Mientras tanto, las sesiones <span aria-hidden="true">↑</span>
        </a>
      </p>
    </div>
  );
}

function Material({
  email,
  recording,
  lengths,
  when,
}: {
  email: string;
  recording: BundleLink | null;
  lengths: Map<string, number>;
  when: WorkshopPhase;
}) {
  const ready = RECORDED.filter((g) => lengths.has(g.slug));
  const status = [
    { label: "skill", value: "lista para instalar", open: true },
    { label: "sesiones", value: `${ready.length} listas, ${LIVE_CASES.length} el jueves`, open: ready.length > 0 },
    { label: "grabación", value: recording ? "disponible" : when.phase === "before" ? when.label : "en camino", open: recording !== null },
    { label: "galería", value: `${GALLERY.length} piezas`, open: true },
  ];
  return (
    <div className="th-mat-grid">
      <MaterialNav sections={SECTIONS} sessions={RECORDED.map((g) => ({ slug: g.slug, title: g.title }))} />
      <div className="th-mat-body">
        <header className="th-pass">
          <div className="th-pass-main">
            <p className="th-pass-kicker">
              <Mark size={20} bg="var(--card)" ink="var(--card-ink)" />
              <span>workshop 01 · {WORKSHOP.day}</span>
            </p>
            <h1>Material</h1>
            <p className="th-pass-who">{email}</p>
            <a className="th-cta" href="#skill">
              Instala la skill <span aria-hidden="true">↓</span>
            </a>
          </div>
          <dl className="th-pass-status">
            {status.map((s) => (
              <div key={s.label} data-open={s.open}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <section className="th-mat-section" id="skill">
          <h2>Instala la skill</h2>
          <p className="th-prose">Tu key llegó desde {WORKSHOP.keySender} cuando te registraste. Empieza con h0_.</p>
          <Code lines={[CLI.login, CLI.add]} />
          <p className="th-prose th-aside">¿La perdiste? Pide una nueva. Llega a tu email y la anterior deja de funcionar.</p>
          <Code lines={[CLI.recover(email)]} />
        </section>

        <section className="th-mat-section" id="sesiones">
          <h2>Sesiones</h2>
          <p className="th-prose">Las sesiones completas de cada pieza, en Claude Code.</p>
          <ol className="th-sessions">
            {RECORDED.map((g, i) => {
              const length = lengths.get(g.slug);
              return (
                <li key={g.slug} id={g.slug} className="th-session" tabIndex={-1}>
                  <header>
                    <span className="th-session-n">{String(i + 1).padStart(2, "0")}</span>
                    <h3>{g.title}</h3>
                    <span className="th-session-meta">
                      {LAYER_LABEL[g.layer]} · {length ? minutes(length) : "pendiente"}
                    </span>
                    <SessionState slug={g.slug} />
                  </header>
                  {length && g.sessionPoster ? (
                    <SessionPlayer slug={g.slug} title={g.title} poster={g.sessionPoster} />
                  ) : (
                    <p className="th-cast-fail">La sesión todavía no está subida.</p>
                  )}
                  <aside className="th-session-result" aria-label={`Resultado de ${g.title}`}>
                    <div className="th-piece-clip">
                      <Clip src={g.video} poster={g.poster} label={`Resultado: ${g.title}`} sound={g.sound} />
                    </div>
                    <p>
                      {g.after}
                      {g.original ? (
                        <>
                          {" "}
                          <a href={g.original} rel="noreferrer">
                            {g.credit ?? "original"} <span aria-hidden="true">↗</span>
                          </a>
                        </>
                      ) : null}
                    </p>
                  </aside>
                </li>
              );
            })}
          </ol>
          <div className="th-next">
            <p className="th-prose">Tres más se graban en vivo el {WORKSHOP.day} y se suman aquí esa noche.</p>
            <ol>
              {LIVE_CASES.map((c, i) => (
                <li key={c.title}>
                  <span className="th-session-n">{String(RECORDED.length + i + 1).padStart(2, "0")}</span>
                  <h3>{c.title}</h3>
                  <span className="th-session-meta">{c.layer} · en vivo</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="th-mat-section" id="grabacion">
          <h2>Grabación</h2>
          <Recording recording={recording} when={when} />
        </section>

        <section className="th-mat-section" id="galeria">
          <h2>Galería</h2>
          <p className="th-prose">Las {GALLERY.length} piezas. Abre el detalle de cualquiera para ver qué cambió.</p>
          <GalleryGrid />
        </section>
      </div>
    </div>
  );
}

export default async function MaterialPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <main className="th-mat">
        <SignedOut />
      </main>
    );
  }
  const primary = user.primaryEmailAddress;
  const email = verifiedPrimaryEmail(user);
  const access = email ? await getEntitlementByEmail(email, WORKSHOP.id) : null;
  return (
    <main className="th-mat">
      <div className="th-account">
        <UserButton />
      </div>
      {email && access?.hasEntitlement ? (
        <Material
          email={email}
          recording={recordingLink(access.packageBundle?.links ?? [])}
          lengths={await durations()}
          when={workshopPhase(new Date(), WORKSHOP.startAt, WORKSHOP.endAt)}
        />
      ) : (
        <NotEntitled email={email ?? primary?.emailAddress ?? "una cuenta sin email verificado"} />
      )}
    </main>
  );
}
