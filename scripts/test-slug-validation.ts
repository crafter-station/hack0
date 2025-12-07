import { slugSchema, isSlugUnique } from "@/lib/slug-utils";

console.log("🧪 Testing Slug Zod Validation\n");

const validationTests = [
  { slug: "hackathon-2025", shouldPass: true },
  { slug: "valid-slug-123", shouldPass: true },
  { slug: "a", shouldPass: true },
  { slug: "", shouldPass: false, error: "empty" },
  { slug: "UPPERCASE", shouldPass: false, error: "uppercase" },
  { slug: "has spaces", shouldPass: false, error: "spaces" },
  { slug: "has--double-hyphen", shouldPass: false, error: "consecutive hyphens" },
  { slug: "-leading-hyphen", shouldPass: false, error: "leading hyphen" },
  { slug: "trailing-hyphen-", shouldPass: false, error: "trailing hyphen" },
  { slug: "special!chars", shouldPass: false, error: "special chars" },
  { slug: "café", shouldPass: false, error: "accents" },
];

console.log("📝 Format Validation Tests:");
validationTests.forEach(({ slug, shouldPass, error }) => {
  try {
    slugSchema.parse(slug);
    if (shouldPass) {
      console.log(`  ✅ "${slug}" → PASSED (expected)`);
    } else {
      console.log(`  ❌ "${slug}" → PASSED (should have failed: ${error})`);
    }
  } catch (e: any) {
    if (!shouldPass) {
      console.log(`  ✅ "${slug}" → FAILED (expected: ${error})`);
    } else {
      console.log(`  ❌ "${slug}" → FAILED (should have passed)`);
      if (e.errors && e.errors[0]) {
        console.log(`     Error: ${e.errors[0].message}`);
      }
    }
  }
});

console.log("\n🔍 Testing Uniqueness Check:");
isSlugUnique("hackathon-minedu-2025").then(isUnique => {
  console.log(`  Event "hackathon-minedu-2025" is unique: ${isUnique ? 'NO (exists in DB)' : 'N/A'}`);

  isSlugUnique("brand-new-unique-slug-99999").then(isUnique2 => {
    console.log(`  Event "brand-new-unique-slug-99999" is unique: ${isUnique2 ? 'YES (not in DB)' : 'NO'}`);

    console.log("\n✅ All Zod validation tests complete!");
    process.exit(0);
  });
});
