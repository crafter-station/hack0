import { beforeAll, describe, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { canonicalEvents, contentDrafts } from "@/lib/db/schema";
import { writeDrafts } from "@/workflows/publish";

const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;
const NOW = new Date("2026-11-02T12:00:00Z");

beforeAll(async () => {
  if (!url) return;
  process.env.DATABASE_URL = url;
  await getDb().execute(sql`truncate content_drafts`);
  await getDb().update(canonicalEvents).set({ curated: false });
  await getDb().update(canonicalEvents).set({ curated: true }).where(eq(canonicalEvents.name, "Cursor Meetup Lima"));
});

run("content drafts", () => {
  test("a curated event this week gets an agenda and a post", async () => {
    expect(await writeDrafts(NOW)).toEqual({ drafts: 2 });
    const drafts = await getDb().select().from(contentDrafts);
    const agenda = drafts.find((d) => d.kind === "agenda");
    expect(agenda?.body).toContain("## Lima");
    expect(agenda?.body).toContain("https://hack0.dev/eventos/cursor-meetup-lima-e-1");
    expect(drafts.find((d) => d.kind === "event_post")?.body).toContain("Cursor Meetup Lima");
  });

  test("rerunning updates open drafts instead of adding more", async () => {
    await writeDrafts(NOW);
    expect(await getDb().select().from(contentDrafts)).toHaveLength(2);
  });

  test("a discarded draft keeps its decision", async () => {
    await getDb().update(contentDrafts).set({ status: "discarded", body: "kept" }).where(eq(contentDrafts.kind, "event_post"));
    await writeDrafts(NOW);
    const [post] = await getDb().select().from(contentDrafts).where(eq(contentDrafts.kind, "event_post"));
    expect(post?.status).toBe("discarded");
    expect(post?.body).toBe("kept");
  });
});
