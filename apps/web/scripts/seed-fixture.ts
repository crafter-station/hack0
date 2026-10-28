import { seedCatalog } from "@/lib/testing/catalog-fixture";

/** Seeds the small test catalog into DATABASE_URL, for the CI smoke run of the built site. */
await seedCatalog();
console.log("seeded fixture catalog");
process.exit(0);
