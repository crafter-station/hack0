// getEntitlementByEmail(email, workshopId) -> { hasEntitlement, packageBundle }; bundle is read only when entitled (or the package is free).
import { sql } from "./db";

export type PackageBundle = {
  id: string;
  version: string;
  title: string;
  free: boolean;
  files: unknown[];
  links: unknown[];
};

export type EntitlementResult = { hasEntitlement: boolean; packageBundle: PackageBundle | null };

export async function getEntitlementByEmail(email: string, workshopId: string): Promise<EntitlementResult> {
  const db = sql();
  const normalized = email.trim().toLowerCase();
  const owned = (await db`
    select 1 from buyers b join entitlements e on e.buyer_id = b.id
    where b.email = ${normalized} and e.workshop_id = ${workshopId}
    limit 1`) as unknown[];
  const hasEntitlement = owned.length > 0;
  const rows = (await db`
    select id, version, title, free, bundle from packages
    where id = ${workshopId} order by published_at desc limit 1`) as {
    id: string;
    version: string;
    title: string;
    free: boolean;
    bundle: { files?: unknown[]; links?: unknown[] };
  }[];
  const pkg = rows[0];
  if (!pkg || !(hasEntitlement || pkg.free)) return { hasEntitlement, packageBundle: null };
  return {
    hasEntitlement,
    packageBundle: { id: pkg.id, version: pkg.version, title: pkg.title, free: pkg.free, files: pkg.bundle.files ?? [], links: pkg.bundle.links ?? [] },
  };
}
