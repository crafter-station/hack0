import { neon } from "@neondatabase/serverless";
import postgres from "postgres";

type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;

let client: Sql | null = null;

/** Neon over HTTP in production; a plain TCP client for a local Postgres in development. */
export function sql(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    // SAFETY: both clients are tagged-template functions resolving to row arrays; only that call shape is used.
    client = (local ? postgres(url) : neon(url)) as unknown as Sql;
  }
  return client;
}
