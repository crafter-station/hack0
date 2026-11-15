import type { CSSProperties } from "react";
import { WORKSHOP } from "../workshop";
import { OG_SIZE, POSTER_SIZE } from "./render";

const C = {
  stage: "#111110",
  well: "#171716",
  ink: "#f3f0e8",
  mute: "#a8a69d",
  hair: "#6a6862",
  rule: "#2f2e2b",
  acc: "#ff3d00",
  cardRule: "#d5d2c9",
};

const PAD = 56;

const page: CSSProperties = {
  ...OG_SIZE,
  display: "flex",
  background: C.stage,
  color: C.ink,
  fontFamily: "JetBrains Mono",
  fontWeight: 500,
};

/** The hack0 mark, drawn as on the site. `bg` is the surface behind it. */
function Mark({ size, bg = C.stage, ink = C.ink }: { size: number; bg?: string; ink?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="17" y="6" width="30" height="52" rx="15" fill="none" stroke={ink} strokeWidth="8" />
      <line x1="10" y1="60" x2="54" y2="4" stroke={bg} strokeWidth="15" />
      <line x1="10" y1="60" x2="54" y2="4" stroke={C.acc} strokeWidth="8" strokeLinecap="square" />
    </svg>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: size, fontWeight: 800, letterSpacing: "-0.05em" }}>
      hack
      <Mark size={size * 0.9} />
    </div>
  );
}

const LAYERS = ["se ve", "se mueve", "está hecho"];

const SHEET = { size: 220, left: 96, top: 85, step: 120 };

/** What each sheet carries: a card's face, three rows entering one after the other, and the boxes underneath. */
function SheetMarks({ layer }: { layer: number }) {
  if (layer === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", padding: 26 }}>
        <div style={{ display: "flex", width: 52, height: 8, background: C.acc }} />
        <div style={{ display: "flex", width: 132, height: 18, background: C.stage, marginTop: 14 }} />
        <div style={{ display: "flex", width: 96, height: 8, background: C.cardRule, marginTop: 14 }} />
      </div>
    );
  }
  if (layer === 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", padding: 26 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", width: 96, height: 8, background: C.hair, marginTop: i ? 14 : 34, marginLeft: i * 28 }} />
        ))}
      </div>
    );
  }
  return null;
}

const THESIS = "Todo lo que ves tiene 3 capas.";

/** The workshop: its title, the thesis and the date, with the thesis drawn as one sheet per layer, pulled apart. */
export function MainCard() {
  const sheet = (i: number): CSSProperties => ({
    position: "absolute",
    display: "flex",
    left: SHEET.left,
    top: SHEET.top + i * SHEET.step,
    width: SHEET.size,
    height: SHEET.size,
    transform: "rotate(-45deg) skewX(15deg) skewY(15deg)",
    border: `2px solid ${i === 0 ? C.ink : C.hair}`,
    background: i === 0 ? C.ink : i === 1 ? "#1d1d1b" : C.well,
  });
  return (
    <div style={page}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 540, padding: PAD, paddingRight: 0 }}>
        <Wordmark size={34} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{ display: "flex", flexDirection: "column", fontSize: 128, fontWeight: 800, letterSpacing: "-0.07em", lineHeight: 0.9 }}
          >
            <div style={{ display: "flex" }}>Taste</div>
            <div style={{ display: "flex" }}>hacking</div>
          </div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>{THESIS}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 26 }}>
          <div style={{ display: "flex", fontWeight: 800 }}>{WORKSHOP.day}</div>
          <div style={{ display: "flex", color: C.mute, marginLeft: 16 }}>· workshop online</div>
        </div>
      </div>
      <div style={{ display: "flex", position: "relative", width: 660, height: OG_SIZE.height }}>
        {[2, 1, 0].map((i) => (
          <div key={i} style={sheet(i)}>
            <SheetMarks layer={i} />
          </div>
        ))}
        {LAYERS.map((name, i) => (
          <div
            key={name}
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              left: 418,
              top: SHEET.top + SHEET.size / 2 + i * SHEET.step - 17,
              fontSize: 24,
            }}
          >
            <div style={{ display: "flex", width: 24, height: 2, background: i === 0 ? C.acc : C.hair }} />
            <div style={{ display: "flex", marginLeft: 10, color: C.acc, fontWeight: 800 }}>0{i + 1}</div>
            <div style={{ display: "flex", marginLeft: 10, fontWeight: 700 }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Short titles are set larger; none goes under 56px, which is 28px in a feed. */
function titleSize(title: string): number {
  if (title.length <= 28) return 72;
  if (title.length <= 44) return 64;
  return 56;
}

/** A piece: its chapter and layer, its title, and its own result filling the right of the card. */
export function PieceCard({ chapter, layer, title, poster }: { chapter: string; layer: string; title: string; poster: string }) {
  return (
    <div style={page}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: PAD, paddingRight: 44 }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 24 }}>
          <Mark size={34} />
          <div style={{ display: "flex", marginLeft: 14, fontWeight: 700 }}>Taste hacking</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, fontWeight: 700 }}>
            <div style={{ display: "flex", color: C.mute }}>{chapter}</div>
            <div style={{ display: "flex", width: 12, height: 12, background: C.acc, margin: "0 14px" }} />
            <div style={{ display: "flex", color: C.acc }}>{layer}</div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: titleSize(title),
              fontWeight: 800,
              letterSpacing: "-0.055em",
              lineHeight: 1.02,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: C.mute }}>hack0.dev/taste-hacking</div>
      </div>
      <div style={{ display: "flex", position: "relative", ...POSTER_SIZE, borderLeft: `1px solid ${C.rule}` }}>
        {/* biome-ignore lint/performance/noImgElement: the card renderer draws plain img elements only */}
        <img src={poster} alt="" width={POSTER_SIZE.width} height={POSTER_SIZE.height} />
      </div>
    </div>
  );
}

/** The vocabulary: three columns of words, one per layer. */
export function VocabCard({ columns }: { columns: { name: string; words: string[] }[] }) {
  return (
    <div style={{ ...page, flexDirection: "column", justifyContent: "space-between", padding: PAD }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 24 }}>
        <Mark size={34} />
        <div style={{ display: "flex", marginLeft: 14, fontWeight: 700 }}>Taste hacking</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 112, fontWeight: 800, letterSpacing: "-0.065em", lineHeight: 0.95 }}>El vocabulario</div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: C.mute }}>Las palabras para pedir cada capa.</div>
      </div>
      <div style={{ display: "flex", borderTop: `1px solid ${C.rule}`, paddingTop: 22 }}>
        {columns.map((c, i) => (
          <div key={c.name} style={{ display: "flex", flexDirection: "column", flex: 1, fontSize: 24 }}>
            <div style={{ display: "flex", fontWeight: 800, marginBottom: 6 }}>
              <div style={{ display: "flex", color: C.acc, marginRight: 12 }}>0{i + 1}</div>
              {c.name}
            </div>
            {c.words.map((w) => (
              <div key={w} style={{ display: "flex", marginTop: 4, color: C.mute }}>
                {w}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
