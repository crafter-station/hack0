import { getDb } from "@/lib/db/client";
import { seedSources } from "@/lib/ingest/sources";

const inserted = await seedSources(getDb());
console.log(`seeded ${inserted.length} sources`);
process.exit(0);
