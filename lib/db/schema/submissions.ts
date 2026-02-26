import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import {
	submissionStatusEnum,
	teamMemberRoleEnum,
	teamMemberStatusEnum,
} from "./enums";
import { events } from "./events";

// ============================================
// SUBMISSION TEMPLATES - Form definition per event
// ============================================

export type TemplateFieldValidation = {
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
	pattern?: string;
	accept?: string;
	maxFileSize?: number;
};

export type TemplateFieldOption = {
	label: string;
	value: string;
};

export type TemplateFieldConditional = {
	fieldId: string;
	operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty";
	value?: string;
};

export type TemplateField = {
	id: string;
	key: string;
	type:
		| "text"
		| "textarea"
		| "url"
		| "email"
		| "number"
		| "select"
		| "multiselect"
		| "checkbox"
		| "file"
		| "richtext";
	label: string;
	description?: string;
	placeholder?: string;
	required: boolean;
	order: number;
	validation?: TemplateFieldValidation;
	options?: TemplateFieldOption[];
	conditional?: TemplateFieldConditional;
};

export type JudgingCriterion = {
	id: string;
	name: string;
	description?: string;
	weight: number;
	maxScore: number;
	order: number;
};

export const submissionTemplates = pgTable("submission_templates", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id, { onDelete: "cascade" })
		.notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),

	fields: jsonb("fields").$type<TemplateField[]>().default([]),
	judgingCriteria: jsonb("judging_criteria")
		.$type<JudgingCriterion[]>()
		.default([]),

	submissionDeadline: timestamp("submission_deadline", {
		mode: "date",
		withTimezone: true,
	}),
	editDeadline: timestamp("edit_deadline", {
		mode: "date",
		withTimezone: true,
	}),

	allowLateSubmissions: boolean("allow_late_submissions").default(false),
	allowSoloSubmissions: boolean("allow_solo_submissions").default(true),
	minTeamSize: integer("min_team_size").default(1),
	maxTeamSize: integer("max_team_size").default(5),

	isActive: boolean("is_active").default(true),

	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type SubmissionTemplate = typeof submissionTemplates.$inferSelect;
export type NewSubmissionTemplate = typeof submissionTemplates.$inferInsert;

// ============================================
// SUBMISSIONS - Participant projects
// ============================================

export const submissions = pgTable(
	"submissions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.references(() => events.id, { onDelete: "cascade" })
			.notNull(),
		templateId: uuid("template_id")
			.references(() => submissionTemplates.id, { onDelete: "cascade" })
			.notNull(),

		projectName: varchar("project_name", { length: 255 }).notNull(),
		projectSlug: varchar("project_slug", { length: 255 }).notNull(),
		shortDescription: text("short_description"),

		responses: jsonb("responses")
			.$type<Record<string, string | string[] | number | boolean>>()
			.default({}),

		leadUserId: varchar("lead_user_id", { length: 255 }).notNull(),

		status: submissionStatusEnum("status").default("draft"),

		submittedAt: timestamp("submitted_at", {
			mode: "date",
			withTimezone: true,
		}),
		editedAt: timestamp("edited_at", {
			mode: "date",
			withTimezone: true,
		}),

		totalScore: integer("total_score"),
		averageScore: integer("average_score"),
		judgeCount: integer("judge_count").default(0),
		rank: integer("rank"),

		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("submissions_event_slug_idx").on(
			table.eventId,
			table.projectSlug,
		),
	],
);

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

// ============================================
// SUBMISSION TEAM MEMBERS
// ============================================

export const submissionTeamMembers = pgTable(
	"submission_team_members",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		submissionId: uuid("submission_id")
			.references(() => submissions.id, { onDelete: "cascade" })
			.notNull(),

		userId: varchar("user_id", { length: 255 }).notNull(),
		role: teamMemberRoleEnum("role").default("developer"),
		status: teamMemberStatusEnum("status").default("pending"),

		inviteToken: varchar("invite_token", { length: 255 }).unique(),
		invitedBy: varchar("invited_by", { length: 255 }),

		joinedAt: timestamp("joined_at", {
			mode: "date",
			withTimezone: true,
		}),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("team_member_submission_user_idx").on(
			table.submissionId,
			table.userId,
		),
	],
);

export type SubmissionTeamMember = typeof submissionTeamMembers.$inferSelect;
export type NewSubmissionTeamMember = typeof submissionTeamMembers.$inferInsert;

// ============================================
// JUDGE ASSIGNMENTS
// ============================================

export const judgeAssignments = pgTable(
	"judge_assignments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.references(() => events.id, { onDelete: "cascade" })
			.notNull(),

		userId: varchar("user_id", { length: 255 }).notNull(),
		submissionId: uuid("submission_id").references(() => submissions.id, {
			onDelete: "cascade",
		}),

		assignedBy: varchar("assigned_by", { length: 255 }).notNull(),

		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("judge_event_user_idx").on(table.eventId, table.userId),
	],
);

export type JudgeAssignment = typeof judgeAssignments.$inferSelect;
export type NewJudgeAssignment = typeof judgeAssignments.$inferInsert;

// ============================================
// JUDGE SCORES
// ============================================

export const judgeScores = pgTable(
	"judge_scores",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		submissionId: uuid("submission_id")
			.references(() => submissions.id, { onDelete: "cascade" })
			.notNull(),

		judgeUserId: varchar("judge_user_id", { length: 255 }).notNull(),
		criterionId: varchar("criterion_id", { length: 255 }).notNull(),

		score: integer("score").notNull(),
		comment: text("comment"),

		scoredAt: timestamp("scored_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("judge_score_unique_idx").on(
			table.submissionId,
			table.judgeUserId,
			table.criterionId,
		),
	],
);

export type JudgeScore = typeof judgeScores.$inferSelect;
export type NewJudgeScore = typeof judgeScores.$inferInsert;
