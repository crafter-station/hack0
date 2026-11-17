import Link from "next/link";
import { AccountNav } from "@/components/account-nav";
import { Wordmark } from "@/components/logo";
import { SiteMenu } from "@/components/site-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { LUMA } from "@/lib/site";

const LINKS = [
  { href: "/eventos", label: "eventos" },
  { href: "/comunidades", label: "comunidades" },
  { href: "/ecosistema", label: "ecosistema" },
  { href: LUMA, label: "luma", external: true },
];

/** One header for every page. Wide screens show the links; phones keep the wordmark and avatar and fold the rest into a menu. */
export function SiteHeader() {
  return (
    <header className="top">
      <Link href="/" aria-label="hack0" style={{ textDecoration: "none" }}>
        <Wordmark size={26} />
      </Link>
      <nav className="site-nav">
        {LINKS.map((l) =>
          l.external ? (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ) : (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ),
        )}
        <AccountNav />
        <ThemeToggle />
      </nav>
      <div className="site-bar">
        <AccountNav part="avatar" />
        <SiteMenu links={LINKS} />
      </div>
    </header>
  );
}
