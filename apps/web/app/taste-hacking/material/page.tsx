import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getEntitlementByEmail } from "@/lib/entitlements";
import { verifiedPrimaryEmail } from "@/lib/session-access";
import { Clip } from "../clip";
import { Code } from "../code";
import { GALLERY, LAYER_LABEL } from "../gallery";
import { GalleryGrid } from "../gallery-grid";
import { SessionPlayer } from "../session-player";
import { CLI, WORKSHOP } from "../workshop";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Material · Taste hacking",
  alternates: { canonical: "/taste-hacking/material" },
  robots: { index: false, follow: false },
};

const SIGN_IN = `/sign-in?redirect_url=${encodeURIComponent("/taste-hacking/material")}`;

/** The three live cases; their sessions arrive after the workshop. */
const LIVE_CASES = ["Una animación viral de X", "Una landing premium", "Un estilo de edición de video"];

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

const CONTENTS = [
  { href: "#skill", n: "01", label: "la skill" },
  { href: "#sesiones", n: "02", label: "las sesiones" },
  { href: "#grabacion", n: "03", label: "la grabación" },
  { href: "#galeria", n: "04", label: "la galería" },
];

function Material({ email, recording, lengths }: { email: string; recording: BundleLink | null; lengths: Map<string, number> }) {
  return (
    <>
      <section className="th-gate th-mat-head">
        <h1>Material</h1>
        <p>
          Entraste como <b>{email}</b>. Aquí está todo lo del workshop.
        </p>
        <nav aria-label="Contenido">
          <ol>
            {CONTENTS.map((c) => (
              <li key={c.href}>
                <a href={c.href}>
                  <span className="th-n">{c.n}</span> {c.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <section className="th-mat-section" id="skill">
        <header>
          <p className="th-index">01 · la skill</p>
          <h2>Instala la skill</h2>
        </header>
        <div className="th-skill">
          <div>
            <p className="th-lead">
              Tu key llegó por email cuando te registraste, desde {WORKSHOP.keySender}. Empieza con h0_ y no se puede volver a mostrar.
            </p>
            <Code label="instalar" lines={[CLI.login, CLI.add]} />
          </div>
          <div>
            <p className="th-lead">¿Perdiste la key? Pide una nueva. Llega a tu email y la anterior deja de funcionar.</p>
            <Code label="pedir una key nueva" lines={[CLI.recover(email)]} />
          </div>
        </div>
      </section>

      <section className="th-mat-section" id="sesiones">
        <header>
          <p className="th-index">02 · las sesiones</p>
          <h2>Sesiones</h2>
          <p className="th-lead">
            Claude Code tal cual, con las pausas largas acortadas. Las piezas de la galería ya están; los casos en vivo llegan después del
            workshop.
          </p>
        </header>
        <ol className="th-sessions">
          {RECORDED.map((g, i) => {
            const length = lengths.get(g.slug);
            return (
              <li key={g.slug} id={g.slug} className="th-session">
                <header>
                  <span className="th-n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{g.title}</h3>
                  <span className="th-tag">{LAYER_LABEL[g.layer]}</span>
                  <span className="th-session-ref">ref: {g.credit}</span>
                  <span className="th-session-len">{length ? minutes(length) : "pendiente"}</span>
                </header>
                <div className="th-session-body">
                  {length && g.sessionPoster ? (
                    <SessionPlayer slug={g.slug} title={g.title} poster={g.sessionPoster} />
                  ) : (
                    <p className="th-cast-fail">La sesión todavía no está subida.</p>
                  )}
                  <aside className="th-session-result" aria-label={`Resultado de ${g.title}`}>
                    <div className="th-piece-clip">
                      <Clip src={g.video} poster={g.poster} label={`Resultado: ${g.title}`} sound={g.sound} />
                    </div>
                    <div>
                      <p className="th-label">resultado</p>
                      <p>{g.after}</p>
                      {g.original ? (
                        <p className="th-piece-links">
                          <a href={g.original} rel="noreferrer">
                            original <span aria-hidden="true">↗</span>
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </aside>
                </div>
              </li>
            );
          })}
        </ol>
        <ol className="th-pending" aria-label="Sesiones de los casos en vivo">
          {LIVE_CASES.map((s, i) => (
            <li key={s}>
              <span className="th-n">{String(RECORDED.length + i + 1).padStart(2, "0")}</span>
              <h3>{s}</h3>
              <span>después del workshop</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="th-mat-section" id="grabacion">
        <header>
          <p className="th-index">03 · la grabación</p>
          <h2>Grabación</h2>
          {recording ? (
            <p className="th-lead">
              <a href={recording.url}>{recording.title} ↗</a>
            </p>
          ) : (
            <p className="th-lead">El link aparece aquí después del workshop del jueves 19.</p>
          )}
        </header>
      </section>

      <section className="th-mat-section" id="galeria">
        <header>
          <p className="th-index">04 · la galería</p>
          <h2>Galería completa</h2>
          <p className="th-lead">Cada ficha con sesión lleva a ella.</p>
        </header>
        <GalleryGrid />
      </section>
    </>
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
        <Material email={email} recording={recordingLink(access.packageBundle?.links ?? [])} lengths={await durations()} />
      ) : (
        <NotEntitled email={email ?? primary?.emailAddress ?? "una cuenta sin email verificado"} />
      )}
    </main>
  );
}
