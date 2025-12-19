import {
	createUniqueSlug,
	generateSlug,
	isValidSlugFormat,
} from "@/lib/slug-utils";

console.log("🧪 Testing Slug Generation\n");

const testCases = [
	"HackAru 2025",
	"V Congreso de Tecnología, Innovación y Hab...",
	"Perú Fintech Forum Hackathon 2025",
	"AYNI Hackathon Nacional 2024",
	"Proof-of-Builders | Syscoin Hackathon Perú",
	"II Hackathon de Química Verde: Transformando tus ideas en soluci...",
	"   Multiple    Spaces   Test   ",
	"Special!@#$%Characters&*()Test",
	"Ñoño's Café & Bar",
	"JAKUMBRE 2025 - IV Cumbre de Emprendimiento",
];

console.log("📝 Basic Slug Generation:");
testCases.forEach((name) => {
	const slug = generateSlug(name);
	const isValid = isValidSlugFormat(slug);
	console.log(`  ${isValid ? "✅" : "❌"} "${name}"`);
	console.log(`     → "${slug}"\n`);
});

console.log("\n🔍 Slug Validation Tests:");
const validationTests = [
	["hackathon-2025", true],
	["UPPERCASE", false],
	["has spaces", false],
	["has--double-hyphen", false],
	["-leading-hyphen", false],
	["trailing-hyphen-", false],
	["valid-slug-123", true],
	["", false],
	["special!chars", false],
];

validationTests.forEach(([slug, expected]) => {
	const result = isValidSlugFormat(slug as string);
	const status = result === expected ? "✅" : "❌";
	console.log(`  ${status} "${slug}" → ${result} (expected: ${expected})`);
});

console.log("\n🔄 Testing Unique Slug Generation:");
// Test with an existing event name
const existingName = "Hackathon MINEDU 2025";
createUniqueSlug(existingName).then((slug) => {
	console.log(`  Event: "${existingName}"`);
	console.log(`  Generated: "${slug}"`);
	console.log(`  Note: May add -2, -3 if slug already exists`);
	process.exit(0);
});
