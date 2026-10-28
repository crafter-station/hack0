"use client";

import { usePathname } from "next/navigation";

export type Tab = { href: string; label: string; count?: number };

/** Section tabs under the admin header; the current route is underlined. */
export function AdminTabs({ tabs }: { tabs: Tab[] }) {
  const path = usePathname();
  return (
    <nav className="admin-tabs" aria-label="Secciones del admin">
      {tabs.map((t) => {
        const on = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
        return (
          <a key={t.href} href={t.href} aria-current={on ? "page" : undefined}>
            {t.label}
            {t.count ? <span>{t.count}</span> : null}
          </a>
        );
      })}
    </nav>
  );
}
