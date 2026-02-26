import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { attendanceVerificationEnum } from "./enums";
import { events } from "./events";

// ============================================
// WINNER CLAIMS - Podium verification requests
// ============================================

export const winnerClaims = pgTable("winner_claims", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(), // Clerk user ID

	// Winner info (solo podio: 1, 2, 3)
	position: integer("position").notNull(), // 1 = gold, 2 = silver, 3 = bronze
	teamName: varchar("team_name", { length: 255 }),
	projectName: varchar("project_name", { length: 255 }),
	projectUrl: varchar("project_url", { length: 500 }), // Devpost, GitHub, etc.

	// Proof
	proofUrl: varchar("proof_url", { length: 500 }).notNull(), // Screenshot, announcement link
	proofDescription: text("proof_description"),

	// Status: pending, approved, rejected
	status: varchar("status", { length: 20 }).default("pending"),
	reviewedAt: timestamp("reviewed_at", { mode: "date", withTimezone: true }),
	reviewedBy: varchar("reviewed_by", { length: 255 }),
	rejectionReason: text("rejection_reason"),

	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type WinnerClaim = typeof winnerClaims.$inferSelect;
export type NewWinnerClaim = typeof winnerClaims.$inferInsert;

// ============================================
// ATTENDANCE CLAIMS - "Asisti" Feature
// ============================================

export const attendanceClaims = pgTable(
	"attendance_claims",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.references(() => events.id, { onDelete: "cascade" })
			.notNull(),
		userId: varchar("user_id", { length: 255 }).notNull(),

		verification:
			attendanceVerificationEnum("verification").default("self_reported"),
		verifiedAt: timestamp("verified_at", {
			mode: "date",
			withTimezone: true,
		}),
		verifiedBy: varchar("verified_by", { length: 255 }),

		claimedAt: timestamp("claimed_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(t) => [
		uniqueIndex("attendance_claim_unique_idx").on(t.eventId, t.userId),
		index("attendance_claim_user_idx").on(t.userId),
		index("attendance_claim_event_idx").on(t.eventId),
	],
);

export type AttendanceClaim = typeof attendanceClaims.$inferSelect;
export type NewAttendanceClaim = typeof attendanceClaims.$inferInsert;
