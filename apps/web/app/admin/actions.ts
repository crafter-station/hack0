"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { start } from "workflow/api";
import { requireAdmin } from "@/lib/admin/auth";
import { createToken, revokeToken } from "@/lib/api/tokens";
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
  // Single events and Luma profiles need their own fetchers; calendars, groups and organizers sync.
  if (!target || target.kind === "event" || target.kind === "profile") return;
  await getDb()
    .insert(sources)
    .values({
      provider: target.provider,
      kind: target.kind,
      providerSourceId: target.providerSourceId,
      url: target.normalizedUrl,
      name: String(formData.get("name") ?? "").trim() || null,
      lumaCalendarId: target.provider === "luma" ? (url.match(/cal-[A-Za-z0-9]+/)?.[0] ?? null) : null,
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

export async function issueToken(_prev: string | null, formData: FormData): Promise<string | null> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return null;
  const raw = await createToken(name);
  revalidatePath("/admin");
  return raw;
}

export async function revokeApiToken(formData: FormData) {
  await requireAdmin();
  await revokeToken(String(formData.get("id")));
  revalidatePath("/admin");
}
