import type { Metadata } from "next";
import Link from "next/link";
import { AdminTabs } from "@/components/admin/tabs";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/admin/auth";
import { adminCounts } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin | hack0", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const c = await adminCounts();
  return (
    <Shell>
      <header className="admin-head">
        <div>
          <h1>Admin</h1>
          <p>
            {c.sources} fuentes · {c.upcoming} eventos próximos · {c.curated} destacados
          </p>
        </div>
        <Link className="btn" href="/eventos">
          Ver sitio ↗
        </Link>
      </header>
      <AdminTabs
        tabs={[
          { href: "/admin", label: "Fuentes", count: c.failing || undefined },
          { href: "/admin/curacion", label: "Curación", count: c.upcoming - c.curated || undefined },
          { href: "/admin/contenido", label: "Contenido", count: c.drafts || undefined },
          { href: "/admin/api", label: "API" },
        ]}
      />
      <div className="admin-body">{children}</div>
    </Shell>
  );
}
