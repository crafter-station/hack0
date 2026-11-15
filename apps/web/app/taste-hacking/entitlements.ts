/**
 * Stand-in for `@/lib/entitlements` (branch railly/workshop-infra), same signature and result shape.
 * Swap the import in material/page.tsx and delete this file once that lands.
 * Fails closed: nobody is entitled unless listed in HACK0_DEV_ENTITLED_EMAILS, and that is ignored in production.
 */
type PackageBundle = { id: string; version: string; title: string; free: boolean; files: unknown[]; links: unknown[] };

type EntitlementResult = { hasEntitlement: boolean; packageBundle: PackageBundle | null };

export async function getEntitlementByEmail(email: string, _workshopId: string): Promise<EntitlementResult> {
  if (process.env.NODE_ENV === "production") return { hasEntitlement: false, packageBundle: null };
  const allowed = (process.env.HACK0_DEV_ENTITLED_EMAILS ?? "").split(",").map((v) => v.trim().toLowerCase());
  return { hasEntitlement: allowed.includes(email.trim().toLowerCase()), packageBundle: null };
}
