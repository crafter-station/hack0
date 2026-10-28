import { drizzle as neonDrizzle } from "drizzle-orm/neon-http";
import { drizzle as pgDrizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Db = ReturnType<typeof pgDrizzle<typeof schema>>;

let db: Db | null = null;

/** Drizzle over Neon HTTP in production, plain TCP for a local Postgres. */
export function getDb(): Db {
  if (db) return db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const local = /@(localhost|127\.0\.0\.1)[:/]|^postgres(ql)?:\/\/localhost/.test(url);
  // SAFETY: both drivers expose the same query builder for this schema; only shared APIs are used.
  db = (local ? pgDrizzle(url, { schema }) : neonDrizzle(url, { schema })) as unknown as Db;
  return db;
}
