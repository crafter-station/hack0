import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function cleanupBadOrgs() {
  console.log("🔍 Buscando organizaciones con slugs incorrectos...");

  const badOrgs = await db
    .select()
    .from(organizations)
    .where(
      sql`${organizations.slug} LIKE '%http%' OR ${organizations.slug} LIKE '%temp%'`
    );

  console.log(`Encontradas ${badOrgs.length} organizaciones:`);

  for (const org of badOrgs) {
    console.log(`  - ${org.name} (${org.slug})`);
  }

  if (badOrgs.length === 0) {
    console.log("✅ No hay organizaciones para limpiar");
    return;
  }

  console.log("\n🗑️  Eliminando organizaciones...");

  for (const org of badOrgs) {
    await db.delete(organizations).where(sql`${organizations.id} = ${org.id}`);
    console.log(`  ✓ Eliminado: ${org.name} (${org.slug})`);
  }

  console.log("\n✅ Limpieza completada!");
}

cleanupBadOrgs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
