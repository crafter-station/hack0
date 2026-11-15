import { tokenizeShell } from "@/lib/shell-tokens";
import { CopyButton } from "./copy-button";

/** Shell commands on a plate: one row per command, highlighted with the page's tokens, each with its own copy button. */
export function Code({ lines, label }: { lines: string[]; label?: string }) {
  return (
    <figure className="th-code">
      {label ? (
        <figcaption>
          <span>{label}</span>
          <span>shell</span>
        </figcaption>
      ) : null}
      <ol>
        {lines.map((line) => (
          <li key={line}>
            <code>
              {tokenizeShell(line).map((t, i) =>
                t.kind === "space" ? (
                  t.text
                ) : (
                  // biome-ignore lint/suspicious/noArrayIndexKey: tokens of a fixed command never reorder
                  <span key={i} className={`tk-${t.kind}`}>
                    {t.text}
                  </span>
                ),
              )}
            </code>
            <CopyButton text={line} />
          </li>
        ))}
      </ol>
    </figure>
  );
}
