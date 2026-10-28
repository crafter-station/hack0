import { and, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import { rowToEvent } from "@/lib/catalog-db";
import { agendaDraft, eventPostDraft } from "@/lib/content/drafts";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, contentDrafts } from "@/lib/db/schema";
import { submitToCalendar, toSubmission } from "@/lib/publish/luma-calendar";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function pendingSubmissions() {
  "use step";
  return getDb()
    .select({ id: canonicalEvents.id })
    .from(canonicalEvents)
    .where(and(eq(canonicalEvents.curated, true), isNull(canonicalEvents.lumaSubmissionId), isNull(canonicalEvents.lumaSubmitError), gte(canonicalEvents.startAt, new Date())));
}

async function submitOne(id: string) {
  "use step";
  const [row] = await getDb().select().from(canonicalEvents).where(eq(canonicalEvents.id, id));
  if (!row) return;
  const prepared = toSubmission(row);
  if ("error" in prepared) {
    await getDb().update(canonicalEvents).set({ lumaSubmitError: prepared.error }).where(eq(canonicalEvents.id, id));
    return;
  }
  const result = await submitToCalendar(prepared.submission);
  await getDb().update(canonicalEvents).set({ lumaSubmissionId: result.id, lumaSubmittedAt: new Date() }).where(eq(canonicalEvents.id, id));
}

/** Puts curated upcoming events on the hack0 Luma calendar. Off unless HACK0_PUBLISH_TO_LUMA=true. */
export async function publishCurated() {
  "use workflow";
  const pending = await pendingSubmissions();
  for (const { id } of pending) await submitOne(id);
  return { submitted: pending.length };
}

async function upsertDraft(draft: { kind: "agenda" | "event_post"; key: string; title: string; body: string; eventIds: string[] }) {
  await getDb()
    .insert(contentDrafts)
    .values(draft)
    .onConflictDoUpdate({ target: contentDrafts.key, set: { title: draft.title, body: draft.body, eventIds: draft.eventIds } });
}

export async function writeDrafts(now: Date) {
  "use step";
  const weekEnd = new Date(now.getTime() + WEEK_MS);
  const rows = await getDb()
    .select()
    .from(canonicalEvents)
    .where(and(eq(canonicalEvents.curated, true), gte(canonicalEvents.startAt, now), lt(canonicalEvents.startAt, weekEnd)));
  const events = rows.map(rowToEvent);
  // A draft someone already approved or discarded keeps its decision; only open drafts get rewritten.
  const decided = await getDb()
    .select({ key: contentDrafts.key })
    .from(contentDrafts)
    .where(inArray(contentDrafts.status, ["approved", "discarded"]));
  const skip = new Set(decided.map((d) => d.key));
  const day = now.toISOString().slice(0, 10);
  const drafts = [
    ...(events.length ? [{ kind: "agenda" as const, key: `agenda:${day}`, ...agendaDraft(events, now), eventIds: rows.map((r) => r.id) }] : []),
    ...rows.map((r, i) => ({ kind: "event_post" as const, key: `post:${r.id}`, ...eventPostDraft(events[i] as (typeof events)[number]), eventIds: [r.id] })),
  ].filter((d) => !skip.has(d.key));
  for (const d of drafts) await upsertDraft(d);
  return { drafts: drafts.length };
}

/** Rewrites the week's agenda and per-event post drafts from the curated catalog. */
export async function generateContent(now: Date) {
  "use workflow";
  return writeDrafts(now);
}
