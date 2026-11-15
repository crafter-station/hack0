"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Code } from "./code";
import { SessionPlayer } from "./session-player";
import { CLI } from "./workshop";

type Access = { email: string; session: { poster: string; seconds: number } | null };
type Checked = { slug: string; access: Access | null };

const MATERIAL = "/taste-hacking/material";

function Buyer({ slug, title, access }: { slug: string; title: string; access: Access }) {
  return (
    <div className="th-paid-open">
      {access.session ? (
        <>
          <p className="th-prose">
            Entraste como {access.email}. La sesión dura unos {Math.max(1, Math.round(access.session.seconds / 60))} minutos y abre donde la
            dejaste.
          </p>
          <SessionPlayer slug={slug} title={title} poster={access.session.poster} />
        </>
      ) : (
        <p className="th-prose">
          Entraste como {access.email}. Esta pieza todavía no tiene sesión. Las que ya están grabadas viven en el{" "}
          <Link href={`${MATERIAL}#sesiones`}>material</Link>.
        </p>
      )}
      <h3>Instala la skill</h3>
      <Code lines={[CLI.login, CLI.add]} />
      <p className="th-prose">
        <Link href={MATERIAL}>
          Todo el material <span aria-hidden="true">→</span>
        </Link>
      </p>
    </div>
  );
}

/**
 * The end of a piece's page. Everyone gets `children`, the public offer, in the page's HTML.
 * A signed-in visitor is checked against the gated route, and a buyer gets the session and the install commands in its place.
 */
export function PieceAccess({ slug, title, path, children }: { slug: string; title: string; path: string; children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [checked, setChecked] = useState<Checked | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let gone = false;
    fetch(`/api/v1/sessions/${slug}/access`)
      .then(async (res) => {
        const access = res.ok ? ((await res.json()) as Access) : null;
        if (!gone) setChecked({ slug, access });
      })
      .catch(() => {
        // A check that fails leaves the public offer in place, which is the right page for someone we could not verify.
      });
    return () => {
      gone = true;
    };
  }, [isLoaded, isSignedIn, slug]);

  const result = isSignedIn && checked?.slug === slug ? checked : null;
  if (result?.access) return <Buyer slug={slug} title={title} access={result.access} />;
  return (
    <>
      {children}
      <p className="th-prose th-paid-enter">
        {result ? (
          <>
            Esta cuenta no tiene una compra. <Link href={MATERIAL}>Revisa con qué email te registraste</Link>
          </>
        ) : (
          <>
            ¿Ya compraste? <Link href={`/sign-in?redirect_url=${encodeURIComponent(path)}`}>Entra</Link>
          </>
        )}
      </p>
    </>
  );
}
