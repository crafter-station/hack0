"use client";

import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from "@ui-sdk/react/segmented-control";
import { useState } from "react";
import { BadgeColorRow } from "@/components/badge-colors";
import { BADGE_STEPS, type BadgeChoice, badgeQuery, badgeSnippet, DEFAULT_CHOICE, snippetTokens } from "@/lib/badge-options";

type Props = {
  name: string;
  /** Absolute URLs for the snippet. */
  page: string;
  badge: string;
  /** The badge route on this host, so the preview works before a deploy. */
  preview: string;
  /** The "next event" step only shows when there is a next event to show. */
  hasNext: boolean;
};

type Format = "html" | "markdown";

/** Build a badge in a few choices, see it live, copy one snippet. */
export function BadgeBuilder({ name, page, badge, preview, hasNext }: Props) {
  const [choice, setChoice] = useState<BadgeChoice>(DEFAULT_CHOICE);
  const [format, setFormat] = useState<Format>("html");
  const [copied, setCopied] = useState(false);
  const steps = BADGE_STEPS.filter((s) => hasNext || !("communityOnly" in s));
  const code = badgeSnippet(format, { name, page, badge, choice });

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="bb">
      <div
        className="bb-stage"
        data-surface={choice.tema === "oscuro" ? "dark" : "light"}
        style={choice.tema === "propio" ? { backgroundColor: choice.colors.fondo } : undefined}
      >
        {/* biome-ignore lint/performance/noImgElement: the live SVG from the badge route, exactly what the snippet embeds */}
        <img src={`${preview}${badgeQuery(choice)}`} alt={`${name} en hack0`} data-form={choice.forma} />
      </div>
      <div className="bb-code">
        <div className="bb-code-bar">
          <SegmentedControl
            className="bb-seg"
            aria-label="Formato"
            value={format}
            onValueChange={(next) => next && setFormat(next as Format)}
          >
            <SegmentedControlIndicator />
            <SegmentedControlItem value="html">HTML</SegmentedControlItem>
            <SegmentedControlItem value="markdown">Markdown</SegmentedControlItem>
          </SegmentedControl>
          <button type="button" className="btn primary bb-copy" onClick={copy}>
            {copied ? "Copiado ✓" : "Copiar"}
          </button>
        </div>
        <pre>
          <code>
            {snippetTokens(code, format).map((t, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional and rebuilt whole on every change
              <span key={i} className={`tk-${t.kind}`}>
                {t.text}
              </span>
            ))}
          </code>
        </pre>
      </div>

      <ol className="bb-steps">
        {steps.map((step, i) => (
          <li key={step.key}>
            <span className="bb-step-label">
              <b className="bb-step-n">{String(i + 1).padStart(2, "0")}</b> {step.label}
            </span>
            <SegmentedControl
              className="bb-seg"
              data-grid={step.options.length > 3 ? "" : undefined}
              aria-label={step.label}
              value={choice[step.key]}
              onValueChange={(next) => next && setChoice((c) => ({ ...c, [step.key]: next }))}
            >
              <SegmentedControlIndicator />
              {step.options.map((o) => (
                <SegmentedControlItem key={o.value} value={o.value}>
                  {"swatch" in o && <i className="bb-swatch" style={{ background: o.swatch }} aria-hidden="true" />}
                  {o.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
            {step.key === "tema" && choice.tema === "propio" && (
              <BadgeColorRow colors={choice.colors} onChange={(colors) => setChoice((c) => ({ ...c, colors }))} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
