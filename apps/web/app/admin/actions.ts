"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { start } from "workflow/api";
import { requireAdmin } from "@/lib/admin/auth";
import { detectProviderImportTarget } from "@/lib/canonical/event-providers";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, sources } from "@/lib/db/schema";
import { syncSource } from "@/workflows/sync-source";

export async function syncNow(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await getDb().update(sources).set({ syncStatus: "queued" }).where(eq(sources.id, id));
  await start(syncSource, [id]);
  revalidatePath("/admin");
}

/** Flips a boolean the form posts back as its current value. */
function flipped(formData: FormData, field: string) {
  return { id: String(formData.get("id")), next: formData.get(field) !== "true" };
}

export async function toggleSync(formData: FormData) {
  await requireAdmin();
  const { id, next } = flipped(formData, "enabled");
  await getDb().update(sources).set({ syncEnabled: next }).where(eq(sources.id, id));
  revalidatePath("/admin");
}

export async function addSource(formData: FormData) {
  await requireAdmin();
  const url = String(formData.get("url") ?? "").trim();
  const target = url ? detectProviderImportTarget(url) : null;
  // Only Luma calendars sync today; other providers arrive with their fetchers.
  if (target?.provider !== "luma" || target.kind !== "calendar") return;
  await getDb()
    .insert(sources)
    .values({
      provider: "luma",
      kind: "calendar",
      providerSourceId: target.providerSourceId,
      url: target.normalizedUrl,
      name: String(formData.get("name") ?? "").trim() || null,
      lumaCalendarId: url.match(/cal-[A-Za-z0-9]+/)?.[0] ?? null,
    })
    .onConflictDoNothing({ target: sources.providerSourceId });
  revalidatePath("/admin");
}

export async function toggleCurated(formData: FormData) {
  await requireAdmin();
  const { id, next } = flipped(formData, "curated");
  await getDb().update(canonicalEvents).set({ curated: next }).where(eq(canonicalEvents.id, id));
  revalidatePath("/admin");
}
