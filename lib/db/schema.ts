import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// ============================================
// ENUMS - Full LATAM Innovation Ecosystem
// ============================================

// Event Types - Categorías principales
export const eventTypeEnum = pgEnum("event_type", [
	// Hackathones
	"hackathon", // Competencias de desarrollo clásicas

	// Eventos Académicos
	"conference", // Congresos, simposios
	"seminar", // Seminarios, ponencias
	"research_fair", // Ferias científicas, pósters

	// Formación
	"workshop", // Talleres prácticos
	"bootcamp", // Programas intensivos
	"summer_school", // Escuelas de verano/invierno
	"course", // Cursos, diplomados
	"certification", // Certificaciones

	// Comunidad
	"meetup", // Encuentros de comunidad
	"networking", // Eventos de networking

	// Competencias
	"olympiad", // Olimpiadas (mate, física, programación)
	"competition", // Competencias generales
	"robotics", // Torneos de robótica

	// Oportunidades
	"accelerator", // Programas de aceleración
	"incubator", // Incubadoras
	"fellowship", // Fellowships, becas
	"call_for_papers", // Convocatorias académicas
]);

// Organizer Types
export const organizerTypeEnum = pgEnum("organizer_type", [
	"university", // Universidades
	"government", // Gobierno, municipalidades, ministerios
	"company", // Empresas privadas
	"community", // Comunidades tech (GDG, PyPeru, etc.)
	"ngo", // ONGs, fundaciones
	"embassy", // Embajadas, centros culturales
	"international_org", // Orgs internacionales (NASA, UNESCO, etc.)
	"student_org", // Organizaciones estudiantiles (IEEE, ACM)
	"startup", // Startups, incubadoras
	"media", // Medios tech
]);

export const formatEnum = pgEnum("format", ["virtual", "in-person", "hybrid"]);

export const currencyEnum = pgEnum("currency", ["USD", "PEN"]);

export const skillLevelEnum = pgEnum("skill_level", [
	"beginner",
	"intermediate",
	"advanced",
	"all",
]);

export const statusEnum = pgEnum("status", [
	"upcoming",
	"open",
	"ongoing",
	"ended",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
	"pending",
	"approved",
	"rejected",
]);

export const userRoleEnum = pgEnum("user_role", [
	"member", // Participante/asistente a eventos
	"organizer", // Organizador de eventos/comunidad
]);

export const formatPreferenceEnum = pgEnum("format_preference", [
	"virtual",
	"in-person",
	"hybrid",
	"any", // Sin preferencia
]);

// Events table (hackathons, conferences, workshops, etc.)
export const events = pgTable("events", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: varchar("slug", { length: 255 }).unique().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),

	// Type
	eventType: eventTypeEnum("event_type").default("hackathon"),

	// Parent/Child relationship (for multi-day/multi-venue events)
	parentEventId: uuid("parent_event_id"), // References another event as parent
	dayNumber: integer("day_number"), // Day 1, 2, 3... for child events

	// Dates
	startDate: timestamp("start_date", { mode: "date", withTimezone: true }),
	endDate: timestamp("end_date", { mode: "date", withTimezone: true }),
	registrationDeadline: timestamp("registration_deadline", { mode: "date", withTimezone: true }),

	// Location
	format: formatEnum("format").default("virtual"),
	country: varchar("country", { length: 10 }), // ISO code or region like "LATAM"
	department: varchar("department", { length: 100 }), // Region/state (e.g., Lima, Puno, Arequipa)
	city: varchar("city", { length: 100 }),
	venue: varchar("venue", { length: 255 }), // Exact venue name
	timezone: varchar("timezone", { length: 50 }),

	// Classification
	skillLevel: skillLevelEnum("skill_level").default("all"),
	domains: text("domains").array(), // ['ai', 'web3', 'fintech', etc.]

	// Prizes
	prizePool: integer("prize_pool"),
	prizeCurrency: currencyEnum("prize_currency").default("USD"),
	prizeDescription: text("prize_description"),

	// Links
	websiteUrl: varchar("website_url", { length: 500 }).notNull(),
	registrationUrl: varchar("registration_url", { length: 500 }),
	devpostUrl: varchar("devpost_url", { length: 500 }),

	// Media
	eventImageUrl: varchar("event_image_url", { length: 500 }),

	// Status
	status: statusEnum("status").default("upcoming"),
	isFeatured: boolean("is_featured").default(false),
	isApproved: boolean("is_approved").default(true),
	approvalStatus: approvalStatusEnum("approval_status").default("approved"),

	// Organization (for self-service orgs)
	organizationId: uuid("organization_id"),

	// Organizer verification (legacy - for claimed events)
	isOrganizerVerified: boolean("is_organizer_verified").default(false),
	verifiedOrganizerId: varchar("verified_organizer_id", { length: 255 }), // Clerk user ID

	// Timestamps
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
	sourceScrapedAt: timestamp("source_scraped_at", { mode: "date", withTimezone: true }),
});

// Types
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// ============================================
// SUBSCRIPTIONS - Email notifications
// ============================================

export const subscriptions = pgTable("subscriptions", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).notNull().unique(),

	// Clerk user ID (optional - for logged in users)
	userId: varchar("user_id", { length: 255 }),

	// Preferences
	frequency: varchar("frequency", { length: 20 }).default("weekly"), // instant, daily, weekly

	// Verification
	isVerified: boolean("is_verified").default(false),
	verificationToken: varchar("verification_token", { length: 255 }),

	// Status
	isActive: boolean("is_active").default(true),
	unsubscribeToken: varchar("unsubscribe_token", { length: 255 }),

	// Timestamps
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
	lastEmailSentAt: timestamp("last_email_sent_at", { mode: "date", withTimezone: true }),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// ============================================
// NOTIFICATION LOG - Track sent emails
// ============================================

export const notificationLogs = pgTable("notification_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
	eventId: uuid("event_id").references(() => events.id),

	// Email details
	subject: varchar("subject", { length: 500 }),
	sentAt: timestamp("sent_at", { mode: "date", withTimezone: true }).defaultNow(),

	// Status
	status: varchar("status", { length: 20 }).default("sent"), // sent, failed, bounced
	resendId: varchar("resend_id", { length: 255 }), // Resend email ID for tracking
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;

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
	position: integer("position").notNull(), // 1 = 🥇, 2 = 🥈, 3 = 🥉
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

	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
});

export type WinnerClaim = typeof winnerClaims.$inferSelect;
export type NewWinnerClaim = typeof winnerClaims.$inferInsert;

// ============================================
// CONSTANTS - For filters and UI
// ============================================

export const EVENT_TYPES = [
	// Hackathones
	"hackathon",
	// Académicos
	"conference",
	"seminar",
	"research_fair",
	// Formación
	"workshop",
	"bootcamp",
	"summer_school",
	"course",
	"certification",
	// Comunidad
	"meetup",
	"networking",
	// Competencias
	"olympiad",
	"competition",
	"robotics",
	// Oportunidades
	"accelerator",
	"incubator",
	"fellowship",
	"call_for_papers",
] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
	hackathon: "Hackathon",
	conference: "Congreso",
	seminar: "Seminario",
	research_fair: "Feria Científica",
	workshop: "Taller",
	bootcamp: "Bootcamp",
	summer_school: "Escuela de Verano",
	course: "Curso / Diplomado",
	certification: "Certificación",
	meetup: "Meetup",
	networking: "Networking",
	olympiad: "Olimpiada",
	competition: "Competencia",
	robotics: "Robótica",
	accelerator: "Aceleradora",
	incubator: "Incubadora",
	fellowship: "Fellowship / Beca",
	call_for_papers: "Call for Papers",
};

export const ORGANIZER_TYPES = [
	"university",
	"government",
	"company",
	"community",
	"ngo",
	"embassy",
	"international_org",
	"student_org",
	"startup",
	"media",
] as const;

export const ORGANIZER_TYPE_LABELS: Record<string, string> = {
	university: "Universidad",
	government: "Gobierno",
	company: "Empresa",
	community: "Comunidad",
	ngo: "ONG / Fundación",
	embassy: "Embajada",
	international_org: "Org. Internacional",
	student_org: "Org. Estudiantil",
	startup: "Startup",
	media: "Medio Tech",
};

export const SKILL_LEVELS = [
	"beginner",
	"intermediate",
	"advanced",
	"all",
] as const;
export const FORMATS = ["virtual", "in-person", "hybrid"] as const;
export const STATUSES = ["upcoming", "open", "ongoing", "ended"] as const;

export const DOMAINS = [
	"ai",
	"web3",
	"blockchain",
	"fintech",
	"social-impact",
	"open-source",
	"mobile",
	"gaming",
	"healthtech",
	"edtech",
	"climate",
	"cybersecurity",
	"data-science",
	"iot",
	"robotics",
	"quantum",
	"biotech",
	"agritech",
	"legaltech",
	"govtech",
	"space",
	"energy",
	"general",
] as const;

export const DOMAIN_LABELS: Record<string, string> = {
	ai: "IA / Machine Learning",
	web3: "Web3",
	blockchain: "Blockchain",
	fintech: "Fintech",
	"social-impact": "Impacto Social",
	"open-source": "Open Source",
	mobile: "Mobile",
	gaming: "Gaming",
	healthtech: "Healthtech",
	edtech: "Edtech",
	climate: "Clima / Sostenibilidad",
	cybersecurity: "Ciberseguridad",
	"data-science": "Data Science",
	iot: "IoT",
	robotics: "Robótica",
	quantum: "Computación Cuántica",
	biotech: "Biotech",
	agritech: "Agritech",
	legaltech: "Legaltech",
	govtech: "Govtech",
	space: "Espacio / Aeroespacial",
	energy: "Energía",
	general: "General",
};

export const LATAM_COUNTRIES = [
	{ code: "AR", name: "Argentina" },
	{ code: "BO", name: "Bolivia" },
	{ code: "BR", name: "Brazil" },
	{ code: "CL", name: "Chile" },
	{ code: "CO", name: "Colombia" },
	{ code: "CR", name: "Costa Rica" },
	{ code: "CU", name: "Cuba" },
	{ code: "DO", name: "Dominican Republic" },
	{ code: "EC", name: "Ecuador" },
	{ code: "SV", name: "El Salvador" },
	{ code: "GT", name: "Guatemala" },
	{ code: "HN", name: "Honduras" },
	{ code: "MX", name: "Mexico" },
	{ code: "NI", name: "Nicaragua" },
	{ code: "PA", name: "Panama" },
	{ code: "PY", name: "Paraguay" },
	{ code: "PE", name: "Peru" },
	{ code: "PR", name: "Puerto Rico" },
	{ code: "UY", name: "Uruguay" },
	{ code: "VE", name: "Venezuela" },
	{ code: "GLOBAL", name: "Global" },
] as const;

// ============================================
// ORGANIZATIONS/COMMUNITIES - For self-service event publishing
// ============================================

export const organizations = pgTable("organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: varchar("slug", { length: 255 }).unique().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }), // Public-facing name
	description: text("description"),
	type: organizerTypeEnum("type").default("community"),

	// Contact
	email: varchar("email", { length: 255 }),

	// Links
	websiteUrl: varchar("website_url", { length: 500 }),
	logoUrl: varchar("logo_url", { length: 500 }),

	// Social Links (stored as JSON)
	twitterUrl: varchar("twitter_url", { length: 500 }),
	linkedinUrl: varchar("linkedin_url", { length: 500 }),
	instagramUrl: varchar("instagram_url", { length: 500 }),
	facebookUrl: varchar("facebook_url", { length: 500 }),
	githubUrl: varchar("github_url", { length: 500 }),

	// Owner (Clerk user ID)
	ownerUserId: varchar("owner_user_id", { length: 255 }).notNull(),

	// Privacy
	isPublic: boolean("is_public").default(true), // Public communities anyone can follow
	isPersonalOrg: boolean("is_personal_org").default(false), // Personal org for individual organizers

	// Status
	isVerified: boolean("is_verified").default(false), // Admin can verify

	// Timestamps
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

// ============================================
// COMMUNITY MEMBERS - Multi-user community management
// ============================================

export const communityRoleEnum = pgEnum("community_role", [
	"owner",
	"admin",
	"member",
	"follower",
]);

export const communityMembers = pgTable("community_members", {
	id: uuid("id").primaryKey().defaultRandom(),
	communityId: uuid("community_id")
		.references(() => organizations.id)
		.notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(), // Clerk user ID

	// Role and permissions
	role: communityRoleEnum("role").default("follower"),

	// Tracking
	joinedAt: timestamp("joined_at", { mode: "date", withTimezone: true }).defaultNow(),
	invitedBy: varchar("invited_by", { length: 255 }), // Clerk user ID of inviter
});

export type CommunityMember = typeof communityMembers.$inferSelect;
export type NewCommunityMember = typeof communityMembers.$inferInsert;

export const COMMUNITY_ROLES = [
	"owner",
	"admin",
	"member",
	"follower",
] as const;

export const COMMUNITY_ROLE_LABELS: Record<string, string> = {
	owner: "Propietario",
	admin: "Administrador",
	member: "Miembro",
	follower: "Seguidor",
};

// ============================================
// COMMUNITY INVITES - Shareable invite links
// ============================================

export const communityInvites = pgTable("community_invites", {
	id: uuid("id").primaryKey().defaultRandom(),
	communityId: uuid("community_id")
		.references(() => organizations.id)
		.notNull(),
	createdBy: varchar("created_by", { length: 255 }).notNull(), // Clerk user ID

	// Invite token (for URL)
	inviteToken: varchar("invite_token", { length: 255 }).unique().notNull(),

	// Usage limits
	maxUses: integer("max_uses"), // null = unlimited
	usedCount: integer("used_count").default(0),

	// Role granted on join
	roleGranted: communityRoleEnum("role_granted").default("follower"),

	// Status
	isActive: boolean("is_active").default(true),
	expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),

	// Timestamps
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
});

export type CommunityInvite = typeof communityInvites.$inferSelect;
export type NewCommunityInvite = typeof communityInvites.$inferInsert;

// ============================================
// EVENT SPONSORS - Junction table for sponsors (using organizations)
// ============================================

export const sponsorTierEnum = pgEnum("sponsor_tier", [
	"platinum",
	"gold",
	"silver",
	"bronze",
	"partner",
	"community",
]);

export const eventSponsors = pgTable("event_sponsors", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	organizationId: uuid("organization_id")
		.references(() => organizations.id)
		.notNull(),

	// Tier/level
	tier: sponsorTierEnum("tier").default("partner"),
	orderIndex: integer("order_index").default(0), // For custom ordering within tier

	// Timestamps
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
});

export type EventSponsor = typeof eventSponsors.$inferSelect;
export type NewEventSponsor = typeof eventSponsors.$inferInsert;

export const SPONSOR_TIERS = [
	"platinum",
	"gold",
	"silver",
	"bronze",
	"partner",
	"community",
] as const;

export const SPONSOR_TIER_LABELS: Record<string, string> = {
	platinum: "Platino",
	gold: "Oro",
	silver: "Plata",
	bronze: "Bronce",
	partner: "Partner",
	community: "Comunidad",
};

// ============================================
// EVENT ORGANIZERS - Assign community members to specific events
// ============================================

export const eventOrganizerRoleEnum = pgEnum("event_organizer_role", [
	"lead", // Organizador principal (puede gestionar todo)
	"organizer", // Co-organizador (puede editar)
	"volunteer", // Voluntario (solo puede ver analytics)
]);

export const eventOrganizers = pgTable("event_organizers", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(), // Clerk user ID (must be community member)

	// Role specific to this event
	role: eventOrganizerRoleEnum("role").default("organizer"),

	// Organization this person represents (personal or community org)
	representingOrgId: uuid("representing_org_id").references(() => organizations.id),

	// Timestamps
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
});

export type EventOrganizer = typeof eventOrganizers.$inferSelect;
export type NewEventOrganizer = typeof eventOrganizers.$inferInsert;

export const EVENT_ORGANIZER_ROLES = ["lead", "organizer", "volunteer"] as const;

export const EVENT_ORGANIZER_ROLE_LABELS: Record<string, string> = {
	lead: "Organizador Principal",
	organizer: "Co-organizador",
	volunteer: "Voluntario",
};

// ============================================
// EVENT HOST ORGANIZATIONS - Multi-org co-hosting
// ============================================

export const eventHostOrganizations = pgTable("event_host_organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	organizationId: uuid("organization_id")
		.references(() => organizations.id)
		.notNull(),

	// Primary host (only one per event - the creator)
	isPrimary: boolean("is_primary").default(false),

	// Invitation status (pending = invited but not accepted yet)
	status: approvalStatusEnum("status").default("pending"),
	invitedBy: varchar("invited_by", { length: 255 }), // Clerk user ID
	inviteToken: varchar("invite_token", { length: 255 }).unique(),

	// Timestamps
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
	acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
});

export type EventHostOrganization = typeof eventHostOrganizations.$inferSelect;
export type NewEventHostOrganization = typeof eventHostOrganizations.$inferInsert;

// ============================================
// IMPORT JOBS - For Luma/external event imports
// ============================================

export const importStatusEnum = pgEnum("import_status", [
	"pending",
	"processing",
	"completed",
	"failed",
]);

export const importJobs = pgTable("import_jobs", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: uuid("organization_id")
		.references(() => organizations.id)
		.notNull(),
	sourceUrl: varchar("source_url", { length: 500 }).notNull(),
	sourceType: varchar("source_type", { length: 50 }).default("luma"),
	status: importStatusEnum("status").default("pending"),
	triggerRunId: varchar("trigger_run_id", { length: 255 }),
	eventId: uuid("event_id").references(() => events.id),
	extractedData: text("extracted_data"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
});

export type ImportJob = typeof importJobs.$inferSelect;
export type NewImportJob = typeof importJobs.$inferInsert;

export const IMPORT_STATUSES = [
	"pending",
	"processing",
	"completed",
	"failed",
] as const;

// User Preferences (Onboarding)
export const userPreferences = pgTable("user_preferences", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkUserId: varchar("clerk_user_id", { length: 255 }).unique().notNull(),

	// Onboarding data
	role: userRoleEnum("role").notNull(), // member o organizer
	department: varchar("department", { length: 100 }), // Lima, Arequipa, etc.
	city: varchar("city", { length: 100 }), // Para ciudades específicas
	formatPreference: formatPreferenceEnum("format_preference").default("any"),
	skillLevel: skillLevelEnum("skill_level").default("all"),

	// Estado de onboarding
	hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),

	// Timestamps
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

// ============================================
// RELATIONS
// ============================================

export const eventsRelations = relations(events, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [events.organizationId],
		references: [organizations.id],
	}),
	sponsors: many(eventSponsors),
	organizers: many(eventOrganizers),
	hostOrganizations: many(eventHostOrganizations),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
	events: many(events),
	members: many(communityMembers),
	invites: many(communityInvites),
	sponsorships: many(eventSponsors),
	hostingEvents: many(eventHostOrganizations),
}));

export const communityMembersRelations = relations(
	communityMembers,
	({ one }) => ({
		community: one(organizations, {
			fields: [communityMembers.communityId],
			references: [organizations.id],
		}),
	}),
);

export const communityInvitesRelations = relations(
	communityInvites,
	({ one }) => ({
		community: one(organizations, {
			fields: [communityInvites.communityId],
			references: [organizations.id],
		}),
	}),
);

export const eventSponsorsRelations = relations(eventSponsors, ({ one }) => ({
	event: one(events, {
		fields: [eventSponsors.eventId],
		references: [events.id],
	}),
	organization: one(organizations, {
		fields: [eventSponsors.organizationId],
		references: [organizations.id],
	}),
}));

export const eventOrganizersRelations = relations(eventOrganizers, ({ one }) => ({
	event: one(events, {
		fields: [eventOrganizers.eventId],
		references: [events.id],
	}),
	representingOrg: one(organizations, {
		fields: [eventOrganizers.representingOrgId],
		references: [organizations.id],
	}),
}));

export const eventHostOrganizationsRelations = relations(
	eventHostOrganizations,
	({ one }) => ({
		event: one(events, {
			fields: [eventHostOrganizations.eventId],
			references: [events.id],
		}),
		organization: one(organizations, {
			fields: [eventHostOrganizations.organizationId],
			references: [organizations.id],
		}),
	}),
);
