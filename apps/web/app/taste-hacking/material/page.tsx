import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";
import { getEntitlementByEmail } from "@/lib/entitlements";
import { verifiedPrimaryEmail } from "@/lib/session-access";
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
          <pre>
            <code>{CLI.recover("tu@email.com")}</code>
          </pre>
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

function Material({ email, recording, lengths }: { email: string; recording: BundleLink | null; lengths: Map<string, number> }) {
  return (
    <>
      <section className="th-gate">
        <h1>Material</h1>
        <p>
          Entraste como <b>{email}</b>. Aquí está todo lo del workshop.
        </p>
      </section>

      <section className="th-section">
        <header>
          <p className="th-index">01 · la skill</p>
          <h2>Instala la skill</h2>
        </header>
        <div className="th-body">
          <p className="th-lead">
            Tu key llegó por email cuando te registraste, desde {WORKSHOP.keySender}. Empieza con h0_ y no se puede volver a mostrar.
          </p>
          <pre>
            <code>
              {CLI.login}
              {"\n"}
              {CLI.add}
            </code>
          </pre>
          <p className="th-lead">¿Perdiste la key? Pide una nueva. Llega a tu email y la anterior deja de funcionar.</p>
          <pre>
            <code>{CLI.recover(email)}</code>
          </pre>
        </div>
      </section>

      <section className="th-section">
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
              <li key={g.slug} id={g.slug}>
                <span>sesión {String(i + 1).padStart(2, "0")}</span>
                <h3>{g.title}</h3>
                <span>{length ? minutes(length) : "pendiente"}</span>
                <p className="th-session-meta">
                  {LAYER_LABEL[g.layer]} · ref: {g.credit}
                </p>
                {length ? <SessionPlayer slug={g.slug} title={g.title} /> : null}
              </li>
            );
          })}
          {LIVE_CASES.map((s, i) => (
            <li key={s}>
              <span>sesión {String(RECORDED.length + i + 1).padStart(2, "0")}</span>
              <h3>{s}</h3>
              <span>pendiente</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="th-section">
        <header>
          <p className="th-index">03 · la grabación</p>
          <h2>Grabación</h2>
        </header>
        <div className="th-body">
          {recording ? (
            <p className="th-lead">
              <a href={recording.url}>{recording.title} ↗</a>
            </p>
          ) : (
            <p className="th-lead">El link aparece aquí después del workshop del jueves 19.</p>
          )}
        </div>
      </section>

      <section className="th-section">
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
      <main>
        <SignedOut />
      </main>
    );
  }
  const primary = user.primaryEmailAddress;
  const email = verifiedPrimaryEmail(user);
  const access = email ? await getEntitlementByEmail(email, WORKSHOP.id) : null;
  return (
    <main>
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
