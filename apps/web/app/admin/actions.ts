"use server";

import { and, eq, ilike, notInArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { start } from "workflow/api";
import { requireAdmin } from "@/lib/admin/auth";
import { createToken, revokeToken } from "@/lib/api/tokens";
import { detectProviderImportTarget } from "@/lib/canonical/event-providers";
import { encrypt } from "@/lib/crypto";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, contentDrafts, sources } from "@/lib/db/schema";
import { lumaPageKind } from "@/lib/ingest/luma-public";
import { refreshListing } from "@/lib/ingest/persist";
import { syncSource } from "@/workflows/sync-source";

export async function syncNow(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  // Claims the source first, so a second click or the cron cannot start another run that races this one.
  const claimed = await getDb()
    .update(sources)
    .set({ syncStatus: "queued" })
    .where(and(eq(sources.id, id), notInArray(sources.syncStatus, ["queued", "running"])))
    .returning({ id: sources.id });
  if (claimed.length > 0) await start(syncSource, [id]);
  revalidatePath("/admin", "layout");
}

/** Flips a boolean the form posts back as its current value. */
function flipped(formData: FormData, field: string) {
  return { id: String(formData.get("id")), next: formData.get(field) !== "true" };
}

export async function toggleSync(formData: FormData) {
  await requireAdmin();
  const { id, next } = flipped(formData, "enabled");
  await getDb().update(sources).set({ syncEnabled: next }).where(eq(sources.id, id));
  revalidatePath("/admin", "layout");
}

export async function addSource(formData: FormData) {
  await requireAdmin();
  const url = String(formData.get("url") ?? "").trim();
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const detected = url ? detectProviderImportTarget(url) : null;
  if (!detected) return;
  // A short luma.com link may be a calendar or one event; the page says which.
  const kind =
    detected.provider === "luma" && detected.confidence === "inferred"
      ? ((await lumaPageKind(detected.normalizedUrl)) ?? detected.kind)
      : detected.kind;
  const target = { ...detected, kind };
  await getDb()
    .insert(sources)
    .values({
      provider: target.provider,
      kind: target.kind,
      providerSourceId: target.providerSourceId,
      url: target.normalizedUrl,
      name: String(formData.get("name") ?? "").trim() || null,
      scope: formData.get("scope") === "latam" ? "latam" : "global",
      lumaCalendarId: target.provider === "luma" && kind === "calendar" ? (url.match(/cal-[A-Za-z0-9]+/)?.[0] ?? null) : null,
      apiKeyCiphertext: apiKey && target.provider === "luma" ? encrypt(apiKey) : null,
    })
    .onConflictDoNothing();
  revalidatePath("/admin", "layout");
}

/** Connects a Luma calendar through its own API key and rereads it from scratch, history included. */
export async function setSourceKey(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  if (!apiKey) return;
  const claimed = await getDb()
    .update(sources)
    .set({ apiKeyCiphertext: encrypt(apiKey), lastSyncedAt: null, syncError: null, nextSyncAt: null, syncStatus: "queued" })
    .where(and(eq(sources.id, id), eq(sources.provider, "luma"), notInArray(sources.syncStatus, ["queued", "running"])))
    .returning({ id: sources.id });
  if (claimed.length > 0) await start(syncSource, [id]);
  revalidatePath("/admin", "layout");
}

export async function toggleScope(formData: FormData) {
  await requireAdmin();
  const latam = formData.get("scope") === "latam";
  await getDb()
    .update(sources)
    .set({ scope: latam ? "global" : "latam" })
    .where(eq(sources.id, String(formData.get("id"))));
  await refreshListing(getDb());
  revalidatePath("/admin", "layout");
}

export async function toggleCurated(formData: FormData) {
  await requireAdmin();
  const { id, next } = flipped(formData, "curated");
  await getDb().update(canonicalEvents).set({ curated: next }).where(eq(canonicalEvents.id, id));
  revalidatePath("/admin", "layout");
}

export async function issueToken(_prev: string | null, formData: FormData): Promise<string | null> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return null;
  const raw = await createToken(name);
  revalidatePath("/admin", "layout");
  return raw;
}

export async function revokeApiToken(formData: FormData) {
  await requireAdmin();
  await revokeToken(String(formData.get("id")));
  revalidatePath("/admin", "layout");
}

export async function decideDraft(formData: FormData) {
  await requireAdmin();
  const status = formData.get("status") === "approved" ? "approved" : "discarded";
  await getDb()
    .update(contentDrafts)
    .set({ status })
    .where(eq(contentDrafts.id, String(formData.get("id"))));
  revalidatePath("/admin", "layout");
}

/** Pauses every failing source whose page is gone or that duplicates another; retrying cannot fix those. */
export async function pauseUnfixable() {
  await requireAdmin();
  await getDb()
    .update(sources)
    .set({ syncEnabled: false })
    .where(
      and(
        eq(sources.syncStatus, "failed"),
        or(
          ilike(sources.syncError, "%not found or is not publicly accessible%"),
          ilike(sources.syncError, "%no Luma calendar behind%"),
          ilike(sources.syncError, "%duplicate of source%"),
        ),
      ),
    );
  revalidatePath("/admin", "layout");
}
