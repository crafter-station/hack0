import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Mark, Wordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import "./brand.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "hack0 · brand",
  description: "Logo, colores, tipografía y assets de hack0.",
  alternates: { canonical: "/brand" },
};

const COLORS = [
  { name: "Papel", hex: "#F3F0E8", use: "Fondo claro" },
  { name: "Tinta", hex: "#111111", use: "Texto y fondo oscuro" },
  { name: "Naranja", hex: "#FF3D00", use: "Acento, una vez por pieza" },
  { name: "Blueprint", hex: "#1C3FAA", use: "Solo líneas y grillas" },
  { name: "Gris", hex: "#6B6B63", use: "Texto secundario" },
];

const ASSETS = [
  { file: "hack0-mark-light.svg", label: "Símbolo, fondo claro" },
  { file: "hack0-mark-dark.svg", label: "Símbolo, fondo oscuro" },
  { file: "hack0-mark-mono.svg", label: "Símbolo, una tinta" },
  { file: "hack0-icon.svg", label: "Favicon / app icon" },
  { file: "hack0-avatar.png", label: "Avatar 1000×1000" },
  { file: "hack0-luma-cover.png", label: "Cover de Luma 2400×686" },
  { file: "hack0-social-preview.png", label: "Social preview 1.91:1" },
];

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: ReactNode }) {
  return (
    <section id={id}>
      <div className="label">
        <span>{title}</span>
        <b>{n}</b>
      </div>
      {children}
    </section>
  );
}

function Tile({ children, caption, tone = "paper" }: { children: ReactNode; caption: string; tone?: "paper" | "ink" | "acc" }) {
  return (
    <figure className={`tile ${tone}`}>
      <div className="tile-art">{children}</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function Brand() {
  return (
    <main>
      <header className="top">
        <Link href="/" aria-label="hack0" style={{ textDecoration: "none" }}>
          <Wordmark size={26} />
        </Link>
        <nav>
          <Link href="/">inicio</Link>
          <a href="#assets">descargas</a>
          <ThemeToggle />
        </nav>
      </header>

      <div className="brand-hero">
        <div>
          <h1>brand</h1>
          <p>El 0 roto por una barra: hackear el cero, empezar de cero. Todo lo que necesitas para usar hack0 bien.</p>
        </div>
        <div className="brand-hero-mark anim">
          <Mark size={220} />
        </div>
      </div>

      <Section id="logo" n="01" title="logo">
        <div className="tiles">
          <Tile caption="Wordmark">
            <Wordmark size={64} />
          </Tile>
          <Tile caption="Símbolo">
            <Mark size={120} />
          </Tile>
          <Tile caption="App icon" tone="acc">
            <Mark size={120} ink="#fff" bg="var(--acc)" accent="#111" />
          </Tile>
        </div>
        <p className="note">
          Siempre <code>hack0</code> en minúscula. El nombre se escribe con cero, nunca con o.
        </p>
      </Section>

      <Section id="versiones" n="02" title="versiones de color">
        <div className="tiles four">
          <Tile caption="Sobre papel">
            <Mark size={96} ink="#111" bg="#f3f0e8" />
          </Tile>
          <Tile caption="Sobre tinta" tone="ink">
            <Mark size={96} ink="#f3f0e8" bg="#111110" />
          </Tile>
          <Tile caption="Una tinta">
            <Mark size={96} ink="#111" bg="#f3f0e8" accent="#111" />
          </Tile>
          <Tile caption="Invertido, una tinta" tone="ink">
            <Mark size={96} ink="#f3f0e8" bg="#111110" accent="#f3f0e8" />
          </Tile>
        </div>
      </Section>

      <Section id="tamanos" n="03" title="tamaños">
        <div className="tile scale">
          {[16, 24, 32, 64, 128].map((s) => (
            <span key={s}>
              <Mark size={s} />
              <small>{s}px</small>
            </span>
          ))}
        </div>
        <p className="note">Por debajo de 32 px usa el favicon (naranja, trazo más grueso). El wordmark no baja de 24 px de alto.</p>
      </Section>

      <Section id="aire" n="04" title="espacio libre">
        <div className="tile clear">
          <div className="clear-box">
            <Wordmark size={56} />
          </div>
        </div>
        <p className="note">Deja alrededor del logo al menos el alto del 0. Nada de texto, bordes ni otros logos dentro de esa zona.</p>
      </Section>

      <Section id="color" n="05" title="color">
        <div className="swatches">
          {COLORS.map((c) => (
            <div key={c.hex} className="swatch">
              <div style={{ background: c.hex }} />
              <b>{c.name}</b>
              <code>{c.hex}</code>
              <small>{c.use}</small>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tipo" n="06" title="tipografía">
        <div className="tile type">
          <p className="type-big">JetBrains Mono</p>
          <p className="type-row">
            <span style={{ fontWeight: 800 }}>ExtraBold 800 · titulares</span>
            <span style={{ fontWeight: 700 }}>Bold 700 · botones</span>
            <span style={{ fontWeight: 500 }}>Medium 500 · texto</span>
          </p>
          <p className="type-sample">Desarma. Nombra. Construye. 0123456789</p>
        </div>
      </Section>

      <Section id="motion" n="07" title="motion">
        <div className="tiles">
          <Tile caption="Desarmar → reconstruir, 2.4 s">
            <div className="anim">
              <Mark size={120} />
            </div>
          </Tile>
          <Tile caption="Sting para videos" tone="ink">
            <div className="anim">
              <Mark size={120} ink="#f3f0e8" bg="#111110" />
            </div>
          </Tile>
        </div>
        <p className="note">
          Una sola idea de movimiento. El último frame siempre es el logo quieto. Con movimiento reducido, no se anima.
        </p>
      </Section>

      <Section id="no" n="08" title="no hagas esto">
        <div className="tiles four">
          <Tile caption="No cambies el color de la barra">
            <Mark size={88} accent="#1c3faa" />
          </Tile>
          <Tile caption="No lo estires">
            <div style={{ transform: "scaleX(1.6)" }}>
              <Mark size={88} />
            </div>
          </Tile>
          <Tile caption="No lo rotes">
            <div style={{ transform: "rotate(-25deg)" }}>
              <Mark size={88} />
            </div>
          </Tile>
          <Tile caption="No escribas Hack0 ni HACK0">
            <span className="wordmark" style={{ fontSize: 40 }}>
              Hack0
            </span>
          </Tile>
        </div>
      </Section>

      <Section id="assets" n="09" title="descargas">
        <ul className="assets">
          {ASSETS.map((a) => (
            <li key={a.file}>
              <span>{a.label}</span>
              <a href={`/brand/${a.file}`} download>
                {a.file}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <footer>
        <span>hack0 by Crafter Station</span>
        <Link href="/">hack0.dev</Link>
      </footer>
    </main>
  );
}
