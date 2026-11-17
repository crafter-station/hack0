"use client";

import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@ui-sdk/react/popover";
import Link from "next/link";
import { AccountNav } from "@/components/account-nav";
import { ThemeToggle } from "@/components/theme-toggle";

/** The phone header's menu: every nav link and the theme switch, behind one button. */
export function SiteMenu({ links }: { links: { href: string; label: string; external?: boolean }[] }) {
  return (
    <Popover>
      <PopoverTrigger className="site-menu-trigger" aria-label="Abrir menú">
        <span aria-hidden="true" className="site-menu-icon" />
        menú
      </PopoverTrigger>
      <PopoverContent className="site-menu-panel" align="end" sideOffset={10}>
        <PopoverTitle className="visually-hidden">Menú</PopoverTitle>
        <nav className="site-menu-links" aria-label="Principal">
          {links.map((l) =>
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
          <AccountNav part="link" />
        </nav>
        <ThemeToggle />
      </PopoverContent>
    </Popover>
  );
}
