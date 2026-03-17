import { neon } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

let _db: DB | undefined;

function getDb(): DB {
	if (!_db) {
		const sql = neon(process.env.DATABASE_URL!);
		_db = drizzle(sql, { schema });
	}
	return _db;
}

export const db: DB = new Proxy({} as DB, {
	get(_, prop: string | symbol) {
		return getDb()[prop as keyof DB];
	},
});

export type Database = typeof db;
