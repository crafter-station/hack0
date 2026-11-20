import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

/** `immersive` drops the footer and the reading width, for full-screen views like the ecosystem map. */
export function Shell({ children, immersive = false }: { children: React.ReactNode; immersive?: boolean }) {
  return (
    <main className={immersive ? "immersive" : undefined}>
      <SiteHeader />
      {children}
      {!immersive && (
        <footer>
          <span>
            hack0 by <a href="https://crafter.run">Crafter Station</a>
          </span>{" "}
          <span>
            <Link href="/eventos">eventos</Link> · <Link href="/comunidades">comunidades</Link> · <Link href="/ecosistema">ecosistema</Link>{" "}
            · <Link href="/about">about</Link> · <Link href="/brand">brand</Link> ·{" "}
            <a href="https://github.com/crafter-station/hack0">github</a>
          </span>
        </footer>
      )}
    </main>
  );
}
