import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { getEntitlementByEmail } from "@/lib/entitlements";
import { GalleryGrid } from "../gallery-grid";
import { CLI, WORKSHOP } from "../workshop";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Material · Taste hacking",
  alternates: { canonical: "/taste-hacking/material" },
  robots: { index: false, follow: false },
};

const SIGN_IN = `/sign-in?redirect_url=${encodeURIComponent("/taste-hacking/material")}`;

/** The three live cases; their sessions arrive in the package bundle after the workshop. */
const SESSIONS = ["Una animación viral de X", "Una landing premium", "Un estilo de edición de video"];

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

function Material({ email, recording }: { email: string; recording: BundleLink | null }) {
  return (
    <>
      <section className="th-gate">
        <h1>Material</h1>
        <p>
          Entraste como <b>{email}</b>. Tienes todo lo que compraste más las recreaciones nuevas que sigamos haciendo.
        </p>
      </section>

      <section className="th-section">
        <h2>Instala la skill</h2>
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
      </section>

      <section className="th-section">
        <h2>Sesiones</h2>
        <p className="th-lead">Claude Code tal cual, sin editar. Se publican después del workshop.</p>
        <ol className="th-agenda">
          {SESSIONS.map((s, i) => (
            <li key={s}>
              <span className="th-min">sesión {String(i + 1).padStart(2, "0")}</span>
              <h3>{s}</h3>
              <p>Pendiente</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="th-section">
        <h2>Grabación</h2>
        {recording ? (
          <p className="th-lead">
            <a href={recording.url}>{recording.title} ↗</a>
          </p>
        ) : (
          <p className="th-lead">El link aparece aquí después del workshop del jueves 19.</p>
        )}
      </section>

      <section className="th-section">
        <h2>Galería completa</h2>
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
  const email = primary?.verification?.status === "verified" ? primary.emailAddress : null;
  const access = email ? await getEntitlementByEmail(email, WORKSHOP.id) : null;
  return (
    <main>
      <div className="th-account">
        <UserButton />
      </div>
      {email && access?.hasEntitlement ? (
        <Material email={email} recording={recordingLink(access.packageBundle?.links ?? [])} />
      ) : (
        <NotEntitled email={email ?? primary?.emailAddress ?? "una cuenta sin email verificado"} />
      )}
    </main>
  );
}
