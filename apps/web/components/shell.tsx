import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

/**
 * `immersive` drops the footer and the reading width, for full-screen views like the ecosystem map.
 * `fit` keeps the reading width but drops the footer and, on desktop, holds the page to one screen, for tools like the badge builder.
 */
export function Shell({ children, immersive = false, fit = false }: { children: React.ReactNode; immersive?: boolean; fit?: boolean }) {
  return (
    <main className={immersive ? "immersive" : fit ? "fit" : undefined}>
      <SiteHeader />
      {children}
      {!immersive && !fit && (
        <footer>
          <span>
            hack0 by <a href="https://crafter.run">Crafter Station</a>
          </span>{" "}
          <span>
            <Link href="/eventos">eventos</Link> · <Link href="/calendario-2027">calendario 2027</Link> ·{" "}
            <Link href="/comunidades">comunidades</Link> · <Link href="/ecosistema">ecosistema</Link> · <Link href="/about">about</Link> ·{" "}
            <Link href="/brand">brand</Link> · <a href="https://github.com/crafter-station/hack0">github</a>
          </span>
        </footer>
      )}
    </main>
  );
}
