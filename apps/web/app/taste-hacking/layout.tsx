import type { Viewport } from "next";
import Link from "next/link";
import { Mark } from "@/components/logo";
import { THEME_COLORS } from "@/lib/theme";
import "./taste-hacking.css";

/** The workshop pages are dark in both themes, as in the promo. */
export const viewport: Viewport = { colorScheme: "dark", themeColor: THEME_COLORS.dark };

export default function TasteHackingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="th">
      <header className="th-top">
        <Link href="/" aria-label="hack0, inicio">
          <Mark size={30} />
        </Link>
        <span className="th-badge">workshop 01</span>
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
