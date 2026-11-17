import Link from "next/link";
import { AccountNav } from "@/components/account-nav";
import { Wordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LUMA } from "@/lib/site";

/** `immersive` drops the footer and the reading width, for full-screen views like the ecosystem map. */
export function Shell({ children, immersive = false }: { children: React.ReactNode; immersive?: boolean }) {
  return (
    <main className={immersive ? "immersive" : undefined}>
      <header className="top">
        <Link href="/" aria-label="hack0" style={{ textDecoration: "none" }}>
          <Wordmark size={26} />
        </Link>
        <nav>
          <Link href="/eventos">eventos</Link>
          <Link href="/comunidades">comunidades</Link>
          <Link href="/ecosistema">ecosistema</Link>
          <a href={LUMA}>luma</a>
          <AccountNav />
          <ThemeToggle />
        </nav>
      </header>
      {children}
      {!immersive && (
        <footer>
          <span>
            hack0 by <a href="https://crafter.run">Crafter Station</a>
          </span>
          <span>
            <Link href="/eventos">eventos</Link> · <Link href="/comunidades">comunidades</Link> · <Link href="/ecosistema">ecosistema</Link>{" "}
            · <Link href="/brand">brand</Link> · <a href="https://github.com/crafter-station/hack0">github</a>
          </span>
        </footer>
      )}
    </main>
  );
}
