import "dotenv/config";
import { db } from "@/lib/db";
import { achievements } from "@/lib/db/schema";

const INITIAL_ACHIEVEMENTS = [
	{
		id: "christmas_gift_2025",
		name: "Espíritu Navideño 2025",
		description: "Creaste tu tarjeta de Navidad personalizada con IA",
		type: "seasonal" as const,
		rarity: "rare" as const,
		points: 50,
		isActive: true,
		isSecret: false,
		availableFrom: new Date("2025-12-01"),
		availableUntil: new Date("2026-01-06"),
	},
	{
		id: "first_event_attendance",
		name: "Primer Paso",
		description: "Marcaste asistencia a tu primer evento",
		type: "participation" as const,
		rarity: "common" as const,
		points: 10,
		isActive: true,
		isSecret: false,
	},
	{
		id: "hackathon_winner",
		name: "Campeón",
		description: "Ganaste un hackathon registrado en hack0.dev",
		type: "winner" as const,
		rarity: "legendary" as const,
		points: 100,
		isActive: true,
		isSecret: false,
	},
	{
		id: "community_founder",
		name: "Fundador",
		description: "Creaste una comunidad en hack0.dev",
		type: "organizer" as const,
		rarity: "epic" as const,
		points: 75,
		isActive: true,
		isSecret: false,
	},
	{
		id: "event_host",
		name: "Anfitrión",
		description: "Organizaste tu primer evento en hack0.dev",
		type: "organizer" as const,
		rarity: "rare" as const,
		points: 50,
		isActive: true,
		isSecret: false,
	},
	{
		id: "community_joiner_5",
		name: "Networker",
		description: "Te uniste a 5 comunidades diferentes",
		type: "community" as const,
		rarity: "uncommon" as const,
		points: 25,
		isActive: true,
		isSecret: false,
	},
	{
		id: "hackathon_streak_3",
		name: "Hackeador Serial",
		description: "Participaste en 3 hackathons en un año",
		type: "streak" as const,
		rarity: "epic" as const,
		points: 75,
		isActive: true,
		isSecret: false,
	},
	{
		id: "early_adopter",
		name: "Early Adopter",
		description: "Te uniste a hack0.dev en sus primeros meses",
		type: "explorer" as const,
		rarity: "rare" as const,
		points: 40,
		isActive: true,
		isSecret: true,
	},
	{
		id: "events_10",
		name: "Veterano",
		description: "Asististe a 10 eventos",
		type: "participation" as const,
		rarity: "uncommon" as const,
		points: 30,
		isActive: true,
		isSecret: false,
	},
	{
		id: "events_50",
		name: "Leyenda",
		description: "Asististe a 50 eventos",
		type: "participation" as const,
		rarity: "legendary" as const,
		points: 150,
		isActive: true,
		isSecret: false,
	},
];

async function seedAchievements() {
	console.log("Seeding achievements...");

	for (const achievement of INITIAL_ACHIEVEMENTS) {
		try {
			await db
				.insert(achievements)
				.values(achievement)
				.onConflictDoUpdate({
					target: achievements.id,
					set: {
						name: achievement.name,
						description: achievement.description,
						type: achievement.type,
						rarity: achievement.rarity,
						points: achievement.points,
						isActive: achievement.isActive,
						isSecret: achievement.isSecret,
						availableFrom: achievement.availableFrom,
						availableUntil: achievement.availableUntil,
					},
				});
			console.log(`  ✓ ${achievement.name}`);
		} catch (error) {
			console.error(`  ✗ ${achievement.name}:`, error);
		}
	}

	console.log("Done!");
	process.exit(0);
}

seedAchievements();
