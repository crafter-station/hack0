import { db } from "../lib/db/index";
import { organizations } from "../lib/db/schema";

const orgs = await db
  .select({
    slug: organizations.slug,
    name: organizations.name,
    displayName: organizations.displayName,
  })
  .from(organizations)
  .orderBy(organizations.slug);

console.log("Verificando organizaciones:");
console.log("=".repeat(80));

let needsAttention = 0;

for (const org of orgs) {
  const noDisplayName = org.displayName === null || org.displayName === undefined;
  const different = org.displayName && org.displayName != org.name;

  if (noDisplayName || different) {
    needsAttention++;
    console.log(`📋 ${org.slug}`);
    console.log(`   name: ${org.name}`);
    console.log(`   displayName: ${org.displayName || "(vacío)"}`);
    console.log("");
  }
}

if (needsAttention === 0) {
  console.log("✅ Todas las organizaciones están consistentes");
} else {
  console.log(`Total: ${needsAttention} organizaciones que revisar`);
}

process.exit(0);
