import type { CSSProperties } from "react";
import { Wordmark } from "@/app/taste-hacking/_og/cards";
import { OG_SIZE } from "@/app/taste-hacking/_og/render";

const C = { stage: "#111110", ink: "#f3f0e8", mute: "#a8a69d" };
const PAD = 64;

const page: CSSProperties = {
  ...OG_SIZE,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: PAD,
  background: C.stage,
  color: C.ink,
  fontFamily: "JetBrains Mono",
  fontWeight: 500,
};

type Logo = { slug: string; uri: string; light: boolean };

function Tile({ logo, size, style }: { logo: Logo; size: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        padding: size * 0.12,
        background: logo.light ? "#111111" : "#ffffff",
        border: `2px solid ${logo.light ? "#ffffff44" : C.stage}`,
        ...style,
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: Satori renders plain img tags only. */}
      <img src={logo.uri} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}

/** Up to six logos fanned like a hand of cards, the shape the map uses for a cluster. */
function Fan({ logos }: { logos: Logo[] }) {
  const hand = logos.slice(0, 6);
  const mid = (hand.length - 1) / 2;
  return (
    <div style={{ display: "flex", position: "relative", width: 600, height: 240 }}>
      {hand.map((logo, i) => (
        <Tile
          key={logo.slug}
          logo={logo}
          size={124}
          style={{
            position: "absolute",
            left: 238 + (i - mid) * 80,
            top: 52 + Math.abs(i - mid) * 12,
            transform: `rotate(${(i - mid) * 5}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function Header({ crumb }: { crumb: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <Wordmark size={40} />
      <div style={{ display: "flex", fontSize: 24, color: C.mute }}>{crumb}</div>
    </div>
  );
}

/** Share image for an /ecosistema hub: its title, its count, and a fan of the orgs it lists. */
export function HubCard({ title, count, crumb, logos }: { title: string; count: string; crumb: string; logos: Logo[] }) {
  return (
    <div style={page}>
      <Header crumb={crumb} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 560 }}>
          <div style={{ display: "flex", fontSize: title.length > 26 ? 60 : 72, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: C.mute }}>
            <span style={{ color: C.ink, fontWeight: 800, marginRight: 12 }}>{count.split(" ")[0]}</span>
            {count.split(" ").slice(1).join(" ")}
          </div>
        </div>
        <Fan logos={logos} />
      </div>
    </div>
  );
}

/** Share image for an org profile: its logo large, its name, and where it sits in the directory. */
export function OrgCard({ name, kind, crumb, logo }: { name: string; kind: string; crumb: string; logo: Logo | null }) {
  return (
    <div style={page}>
      <Header crumb={crumb} />
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        {logo ? (
          <Tile logo={logo} size={240} />
        ) : (
          <div
            style={{
              display: "flex",
              width: 240,
              height: 240,
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#111111",
              fontSize: 88,
              fontWeight: 800,
            }}
          >
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
          <div style={{ display: "flex", fontSize: name.length > 28 ? 56 : 72, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>
            {name}
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: C.mute }}>{kind}</div>
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 22, color: C.mute }}>hack0.dev · directorio del ecosistema tech</div>
    </div>
  );
}
