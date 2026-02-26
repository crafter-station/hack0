/**
 * Seed script: Fixes community membership and creates a submission template
 * for the existing "Hackathin 8m" event (39w3si).
 *
 * Usage: bun run scripts/seed-submission-test.ts
 */

import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
	communityMembers,
	events,
	organizations,
	submissionTemplates,
} from "../lib/db/schema";

const EVENT_SHORT_CODE = "39w3si";

async function main() {
	// 1. Get the event
	console.log("🔍 Finding event...");
	const event = await db.query.events.findFirst({
		where: eq(events.shortCode, EVENT_SHORT_CODE),
	});

	if (!event) {
		console.error("❌ Event not found");
		process.exit(1);
	}

	console.log(`   Event: ${event.name} (${event.shortCode})`);

	if (!event.organizationId) {
		console.error("❌ Event has no organization");
		process.exit(1);
	}

	// 2. Get the org
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, event.organizationId),
	});

	if (!org) {
		console.error("❌ Organization not found");
		process.exit(1);
	}

	console.log(`   Org: ${org.name} (owner: ${org.ownerUserId})`);

	// 3. Ensure community membership exists
	console.log("\n👤 Ensuring community membership...");
	const existingMembership = await db.query.communityMembers.findFirst({
		where: eq(communityMembers.communityId, org.id),
	});

	if (!existingMembership) {
		await db.insert(communityMembers).values({
			communityId: org.id,
			userId: org.ownerUserId,
			role: "owner",
		});
		console.log("   ✅ Added owner as community member");
	} else {
		console.log("   ⏭️  Membership already exists");
	}

	// 4. Ensure event type is hackathon (for tabs to show)
	if (event.eventType !== "hackathon") {
		console.log(
			`\n🔧 Updating event type from "${event.eventType}" to "hackathon"...`,
		);
		await db
			.update(events)
			.set({ eventType: "hackathon" })
			.where(eq(events.id, event.id));
		console.log("   ✅ Updated");
	}

	// 5. Create submission template if not exists
	console.log("\n📝 Checking submission template...");
	const existingTemplate = await db.query.submissionTemplates.findFirst({
		where: eq(submissionTemplates.eventId, event.id),
	});

	if (existingTemplate) {
		console.log("   ⏭️  Template already exists");
	} else {
		const [template] = await db
			.insert(submissionTemplates)
			.values({
				eventId: event.id,
				name: "Entrega de proyecto",
				description:
					"Envía tu proyecto para participar en el hackathon. Incluye tu demo, repositorio y presentación.",
				fields: [
					{
						id: "field_repo",
						key: "repository_url",
						type: "url",
						label: "Repositorio (GitHub/GitLab)",
						description: "URL del repositorio público de tu proyecto",
						placeholder: "https://github.com/tu-usuario/tu-proyecto",
						required: true,
						order: 1,
					},
					{
						id: "field_demo",
						key: "demo_url",
						type: "url",
						label: "Demo URL",
						description: "URL de tu demo desplegada (si aplica)",
						placeholder: "https://tu-proyecto.vercel.app",
						required: false,
						order: 2,
					},
					{
						id: "field_video",
						key: "video_url",
						type: "url",
						label: "Video demo (YouTube/Loom)",
						description: "Un video de 2-3 minutos explicando tu proyecto",
						placeholder: "https://youtube.com/watch?v=...",
						required: true,
						order: 3,
					},
					{
						id: "field_tech",
						key: "tech_stack",
						type: "multiselect",
						label: "Stack tecnológico",
						description: "Selecciona las tecnologías que usaste",
						required: true,
						order: 4,
						options: [
							{ label: "React/Next.js", value: "react" },
							{ label: "Python", value: "python" },
							{ label: "Node.js", value: "nodejs" },
							{ label: "Rust", value: "rust" },
							{ label: "AI/ML", value: "ai_ml" },
							{ label: "Blockchain", value: "blockchain" },
							{ label: "Mobile", value: "mobile" },
							{ label: "Otro", value: "other" },
						],
					},
					{
						id: "field_track",
						key: "track",
						type: "select",
						label: "Track",
						description: "¿En qué categoría compites?",
						required: true,
						order: 5,
						options: [
							{ label: "AI & Machine Learning", value: "ai" },
							{ label: "FinTech", value: "fintech" },
							{ label: "Social Impact", value: "social" },
							{ label: "Open Innovation", value: "open" },
						],
					},
					{
						id: "field_desc",
						key: "detailed_description",
						type: "textarea",
						label: "Descripción detallada",
						description:
							"Explica qué problema resuelve tu proyecto y qué lo hace único",
						required: true,
						order: 6,
						validation: {
							minLength: 50,
							maxLength: 5000,
						},
					},
				],
				judgingCriteria: [
					{
						id: "criteria_innovation",
						name: "Innovación",
						description: "¿Qué tan original y creativa es la solución?",
						weight: 3,
						maxScore: 10,
						order: 1,
					},
					{
						id: "criteria_execution",
						name: "Ejecución técnica",
						description: "¿Qué tan bien implementado está?",
						weight: 3,
						maxScore: 10,
						order: 2,
					},
					{
						id: "criteria_impact",
						name: "Impacto",
						description: "¿Qué tan grande es el impacto potencial?",
						weight: 2,
						maxScore: 10,
						order: 3,
					},
					{
						id: "criteria_design",
						name: "Diseño y UX",
						description: "¿Es fácil de usar? ¿Buen diseño visual?",
						weight: 1,
						maxScore: 10,
						order: 4,
					},
					{
						id: "criteria_presentation",
						name: "Presentación",
						description: "¿El video/pitch es claro y convincente?",
						weight: 1,
						maxScore: 10,
						order: 5,
					},
				],
				submissionDeadline: new Date("2026-12-31T23:59:00-05:00"),
				editDeadline: new Date("2026-12-31T23:59:00-05:00"),
				allowLateSubmissions: false,
				allowSoloSubmissions: true,
				minTeamSize: 1,
				maxTeamSize: 5,
				isActive: true,
			})
			.returning();

		console.log(
			`   ✅ Created template: ${template.name} (${template.fields?.length} fields, ${template.judgingCriteria?.length} criteria)`,
		);
	}

	// Summary
	console.log("\n" + "=".repeat(60));
	console.log("✅ READY TO TEST");
	console.log("=".repeat(60));
	console.log(
		`\n🔗 Event page:     http://localhost:3000/e/${event.shortCode}`,
	);
	console.log(
		`📋 Manage page:    http://localhost:3000/e/${event.shortCode}/manage`,
	);
	console.log(
		`📝 Submit page:    http://localhost:3000/e/${event.shortCode}/submit`,
	);
	console.log(
		`🖼️  Gallery:        http://localhost:3000/e/${event.shortCode}/submissions`,
	);
	console.log(`\n📊 Manage tabs:`);
	console.log(
		`   Entregas:       http://localhost:3000/e/${event.shortCode}/manage?tab=submissions`,
	);
	console.log(
		`   Evaluación:     http://localhost:3000/e/${event.shortCode}/manage?tab=judging`,
	);
	console.log();

	process.exit(0);
}

main().catch((err) => {
	console.error("❌ Error:", err);
	process.exit(1);
});
