import type { ReactNode } from "react";

/** Renders the small Markdown subset Luma descriptions use: headings, lists, bold, links. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    out.push(text.slice(last, m.index));
    out.push(
      m[1] ? (
        <b key={m.index}>{m[1]}</b>
      ) : (
        <a key={m.index} href={m[3]} rel="nofollow noopener">
          {m[2]}
        </a>
      ),
    );
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\\([*_#\-.])/g, "$1").split(/\n{2,}/);
  return (
    <div className="prose">
      {blocks.map((block) => {
        const lines = block.split("\n").filter(Boolean);
        if (lines.every((l) => /^\s*[-*•]\s/.test(l))) {
          return (
            <ul key={block}>
              {lines.map((l) => (
                <li key={l}>{inline(l.replace(/^\s*[-*•]\s/, ""))}</li>
              ))}
            </ul>
          );
        }
        const h = block.match(/^#{1,6}\s+(.*)/);
        if (h) return <h3 key={block}>{inline(h[1])}</h3>;
        return <p key={block}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
