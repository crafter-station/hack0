import type { Viewport } from "next";
import Link from "next/link";
import { Mark } from "@/components/logo";
import { THEME_COLORS } from "@/lib/theme";
import "./tokens.css";
import "./taste-hacking.css";
import { WORKSHOP } from "./workshop";

/** The workshop pages are dark in both themes, as in the promo. */
export const viewport: Viewport = { colorScheme: "dark", themeColor: THEME_COLORS.dark };

export default function TasteHackingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="th">
      <header className="th-top">
        <Link href="/" aria-label="hack0, inicio">
          <Mark size={26} />
        </Link>
        <p>
          <span>{WORKSHOP.day} · online</span>
          <b>workshop 01</b>
        </p>
      </header>
      {children}
      <footer className="th-foot">
        <span>
          hack0 by <a href="https://crafter.run">Crafter Station</a>
        </span>
        <span>
          <Link href="/taste-hacking">taste hacking</Link> · <Link href="/taste-hacking/material">material</Link> ·{" "}
          <Link href="/eventos">eventos</Link>
        </span>
      </footer>
    </div>
  );
}
