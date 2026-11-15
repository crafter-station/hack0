import Link from "next/link";
import { Mark } from "@/components/logo";
import { LIVE_CASES } from "../chapters";
import { Code } from "../code";
import { GALLERY, LAYER_LABEL } from "../gallery";
import { pieceBySlug, pieceHref } from "../pieces";
import { CLI, WORKSHOP } from "../workshop";
import { SwitchAccount } from "./switch-account";

const SIGN_IN = `/sign-in?redirect_url=${encodeURIComponent("/taste-hacking/material")}`;

const RECORDED = GALLERY.filter((g) => g.session);

/** What the pass opens. Only what the public page already says: no session, no install command. */
const INSIDE = [
  { label: "skill", value: `taste-hacking y ${WORKSHOP.extraSkills} más` },
  { label: "sesiones", value: `${RECORDED.length} completas, ${LIVE_CASES.length} el jueves` },
  { label: "grabación", value: "los 90 minutos" },
  { label: "galería", value: `${GALLERY.length} piezas` },
];

/** The buyer's pass before it is opened: the same paper ticket, with every row still empty. */
function LockedPass({ who }: { who: string }) {
  return (
    <article className="th-pass th-pass-locked" aria-label="Pase de material, sin abrir">
      <div className="th-pass-main">
        <p className="th-pass-kicker">
          <Mark size={20} bg="var(--card)" ink="var(--card-ink)" />
          <span>workshop 01 · {WORKSHOP.day}</span>
        </p>
        <h2>Material</h2>
        <p className="th-pass-who">{who}</p>
      </div>
      <dl className="th-pass-status">
        {INSIDE.map((s) => (
          <div key={s.label} data-open="false">
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

/** Which email opens the pass, and the one command the gate shows: asking for a new key. */
function Help() {
  return (
    <div className="th-gate-help">
      <dl>
        <div>
          <dt>¿Qué email uso?</dt>
          <dd>El de tu registro en Luma. Si dudas entre dos, busca un mail de {WORKSHOP.keySender}: llegó al de tu compra.</dd>
        </div>
        <div>
          <dt>¿No llegó tu key?</dt>
          <dd>Pide una nueva. Llega solo si ese email tiene una compra, y la anterior deja de funcionar.</dd>
        </div>
      </dl>
      <Code lines={[CLI.recover("tu@email.com")]} />
    </div>
  );
}

/** The pieces with a recorded session. Their pages are public, so the gate has a way forward for someone who has not bought. */
function Glimpse() {
  return (
    <aside className="th-gate-glimpse" aria-labelledby="th-glimpse">
      <header>
        <h2 id="th-glimpse">Las piezas se leen sin entrar</h2>
        <p>La sesión completa de cada una está en el material.</p>
      </header>
      <ul>
        {RECORDED.map((g) => {
          const piece = pieceBySlug(g.slug);
          if (!piece) return null;
          return (
            <li key={g.slug}>
              <Link href={pieceHref(piece)}>
                {/* biome-ignore lint/performance/noImgElement: a 96px poster already sized on disk; the optimizer adds a request for nothing */}
                <img src={g.poster} alt="" width={96} height={120} loading="lazy" decoding="async" />
                <span>
                  <b>{g.title}</b>
                  <small>{LAYER_LABEL[g.layer]}</small>
                  <i aria-hidden="true">→</i>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Buy() {
  return (
    <a className="th-gate-buy" href={WORKSHOP.luma}>
      <span>
        Inscríbete en Luma <i aria-hidden="true">↗</i>
      </span>
      <small>
        {WORKSHOP.price} · early bird {WORKSHOP.earlyBird}
      </small>
    </a>
  );
}

/**
 * The material page for someone it cannot open for: signed out, or signed in with an email that has no purchase.
 * `email` is the signed-in account; without it the gate asks the visitor to sign in.
 */
export function Gate({ email }: { email?: string }) {
  return (
    <section className="th-gate">
      <div className="th-gate-intro">
        {email ? (
          <>
            <h1>No hay una compra con este email</h1>
            <p className="th-gate-lead">
              Entraste como <b>{email}</b>. El material se abre con el email con el que te registraste en Luma.
            </p>
          </>
        ) : (
          <>
            <h1>El material se abre con tu email de Luma</h1>
            <p className="th-gate-lead">Tu compra quedó ligada al email con el que te registraste. Ingresa con ese mismo y se abre todo.</p>
          </>
        )}
        <div className="th-gate-actions">
          {email ? (
            <SwitchAccount to={SIGN_IN}>
              Entrar con otro email <span aria-hidden="true">→</span>
            </SwitchAccount>
          ) : (
            <Link className="th-cta" href={SIGN_IN}>
              Ingresar con el email de Luma <span aria-hidden="true">→</span>
            </Link>
          )}
          <Buy />
        </div>
        <Help />
      </div>
      <div className="th-plate th-ticks th-gate-plate">
        <p className="th-plate-head">
          <span>pase de material</span>
          <span>{email ? "sin compra" : "sin abrir"}</span>
        </p>
        <div className="th-plate-stage">
          <LockedPass who={email ? "sin compra con este email" : "se abre con tu email de Luma"} />
        </div>
      </div>
      <Glimpse />
    </section>
  );
}
