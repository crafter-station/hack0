import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
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

// ============================================
// LUMA AGGREGATION ENUMS
// ============================================

export const eventOwnershipEnum = pgEnum("event_ownership", [
	"created", // Hack0 created this event (source of truth)
	"referenced", // External event, Hack0 just indexes
]);

export const eventSyncStatusEnum = pgEnum("event_sync_status", [
	"synced", // In sync with source
	"drifted", // Source has changed
	"source_deleted", // Source event no longer exists
	"unknown", // Never checked
]);


// Events table (hackathons, conferences, workshops, etc.)
export const events = pgTable("events", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: varchar("slug", { length: 255 }).unique().notNull(),
	shortCode: varchar("short_code", { length: 10 }).unique(),
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
	registrationDeadline: timestamp("registration_deadline", {
		mode: "date",
		withTimezone: true,
	}),

	// Location
	format: formatEnum("format").default("virtual"),
	country: varchar("country", { length: 10 }), // ISO code or region like "LATAM"
	department: varchar("department", { length: 100 }), // Region/state (e.g., Lima, Puno, Arequipa)
	city: varchar("city", { length: 100 }),
	venue: varchar("venue", { length: 255 }), // Exact venue name
	timezone: varchar("timezone", { length: 50 }),
	geoLatitude: varchar("geo_latitude", { length: 50 }),
	geoLongitude: varchar("geo_longitude", { length: 50 }),

	// Virtual meeting
	meetingUrl: varchar("meeting_url", { length: 500 }),

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

	// Luma Aggregation - Ownership & Sync
	ownership: eventOwnershipEnum("ownership").default("created"),
	lumaSlug: varchar("luma_slug", { length: 255 }),
	sourceLumaCalendarId: varchar("source_luma_calendar_id", { length: 255 }),
	sourceLumaEventId: varchar("source_luma_event_id", { length: 255 }),
	sourceContentHash: varchar("source_content_hash", { length: 64 }),
	lastSourceCheckAt: timestamp("last_source_check_at", {
		mode: "date",
		withTimezone: true,
	}),
	syncStatus: eventSyncStatusEnum("sync_status").default("synced"),

	// Timestamps
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	sourceScrapedAt: timestamp("source_scraped_at", {
		mode: "date",
		withTimezone: true,
	}),
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
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	lastEmailSentAt: timestamp("last_email_sent_at", {
		mode: "date",
		withTimezone: true,
	}),
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
	sentAt: timestamp("sent_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),

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

	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
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

export type OrganizerType = (typeof ORGANIZER_TYPES)[number];

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
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
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
	joinedAt: timestamp("joined_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
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
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type CommunityInvite = typeof communityInvites.$inferSelect;
export type NewCommunityInvite = typeof communityInvites.$inferInsert;

// ============================================
// COMMUNITY ROLE REQUESTS - For admin upgrade requests
// ============================================

export const roleRequestStatusEnum = pgEnum("role_request_status", [
	"pending",
	"approved",
	"rejected",
]);

export const communityRoleRequests = pgTable("community_role_requests", {
	id: uuid("id").primaryKey().defaultRandom(),
	communityId: uuid("community_id")
		.references(() => organizations.id)
		.notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	requestedRole: communityRoleEnum("requested_role").notNull(),
	message: text("message"),
	status: roleRequestStatusEnum("status").default("pending"),
	reviewedBy: varchar("reviewed_by", { length: 255 }),
	reviewedAt: timestamp("reviewed_at", { mode: "date", withTimezone: true }),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type CommunityRoleRequest = typeof communityRoleRequests.$inferSelect;
export type NewCommunityRoleRequest = typeof communityRoleRequests.$inferInsert;

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
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
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
	representingOrgId: uuid("representing_org_id").references(
		() => organizations.id,
	),

	// Timestamps
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type EventOrganizer = typeof eventOrganizers.$inferSelect;
export type NewEventOrganizer = typeof eventOrganizers.$inferInsert;

export const EVENT_ORGANIZER_ROLES = [
	"lead",
	"organizer",
	"volunteer",
] as const;

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
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
});

export type EventHostOrganization = typeof eventHostOrganizations.$inferSelect;
export type NewEventHostOrganization =
	typeof eventHostOrganizations.$inferInsert;

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
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
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
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

// ============================================
// LUMA INTEGRATION - Direct API calendar sync
// ============================================

export const syncFrequencyEnum = pgEnum("sync_frequency", [
	"hourly",
	"daily",
	"weekly",
	"manual",
]);

export const lumaEventMappings = pgTable("luma_event_mappings", {
	id: uuid("id").primaryKey().defaultRandom(),
	lumaEventId: varchar("luma_event_id", { length: 255 }).notNull().unique(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	lastSyncedAt: timestamp("last_synced_at", {
		mode: "date",
		withTimezone: true,
	}),
	lumaUpdatedAt: timestamp("luma_updated_at", {
		mode: "date",
		withTimezone: true,
	}),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type LumaEventMapping = typeof lumaEventMappings.$inferSelect;
export type NewLumaEventMapping = typeof lumaEventMappings.$inferInsert;


// ============================================
// EVENT HOSTS - All Luma hosts per event (not just first)
// ============================================

export const eventHostRoleEnum = pgEnum("event_host_role", [
	"host",
	"co-host",
	"speaker",
]);

export const eventHosts = pgTable(
	"event_hosts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id")
			.references(() => events.id, { onDelete: "cascade" })
			.notNull(),
		lumaHostApiId: varchar("luma_host_api_id", { length: 255 }).notNull(),
		name: varchar("name", { length: 255 }),
		email: varchar("email", { length: 255 }),
		avatarUrl: varchar("avatar_url", { length: 500 }),
		role: eventHostRoleEnum("role").default("host"),
		isPrimary: boolean("is_primary").default(false),
		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(table) => [uniqueIndex("event_host_unique_idx").on(table.eventId, table.lumaHostApiId)],
);

export type EventHost = typeof eventHosts.$inferSelect;
export type NewEventHost = typeof eventHosts.$inferInsert;

// ============================================
// LUMA HOST MAPPINGS - Map Luma hosts to organizations/users
// ============================================

export const hostClaimTypeEnum = pgEnum("host_claim_type", [
	"personal",
	"community",
]);

export const lumaHostMappings = pgTable("luma_host_mappings", {
	id: uuid("id").primaryKey().defaultRandom(),
	lumaHostApiId: varchar("luma_host_api_id", { length: 255 }).unique().notNull(),
	lumaHostName: varchar("luma_host_name", { length: 255 }),
	lumaHostEmail: varchar("luma_host_email", { length: 255 }),
	lumaHostAvatarUrl: varchar("luma_host_avatar_url", { length: 500 }),
	clerkUserId: varchar("clerk_user_id", { length: 255 }),
	organizationId: uuid("organization_id").references(() => organizations.id),
	isVerified: boolean("is_verified").default(false),
	verificationToken: varchar("verification_token", { length: 255 }),
	verificationEmail: varchar("verification_email", { length: 255 }),
	pendingClaimType: hostClaimTypeEnum("pending_claim_type"),
	lastSeenAt: timestamp("last_seen_at", {
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
});

export type LumaHostMapping = typeof lumaHostMappings.$inferSelect;
export type NewLumaHostMapping = typeof lumaHostMappings.$inferInsert;


// ============================================
// MULTI-SOURCE SCRAPING - Scheduled scraping system
// ============================================

export const scrapeSourceTypeEnum = pgEnum("scrape_source_type", [
	"devpost",
	"ecosistema_peruano",
	"dev_events",
	"rss",
	"luma_public",
	"custom",
]);

export const scrapeSources = pgTable("scrape_sources", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	sourceType: scrapeSourceTypeEnum("source_type").notNull(),
	sourceUrl: varchar("source_url", { length: 500 }).notNull(),
	isActive: boolean("is_active").default(true),
	scrapeFrequency: syncFrequencyEnum("scrape_frequency").default("daily"),
	lastScrapeAt: timestamp("last_scrape_at", {
		mode: "date",
		withTimezone: true,
	}),
	config: text("config"),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type ScrapeSource = typeof scrapeSources.$inferSelect;
export type NewScrapeSource = typeof scrapeSources.$inferInsert;

export const scrapeRunStatusEnum = pgEnum("scrape_run_status", [
	"pending",
	"running",
	"completed",
	"failed",
]);

export const scrapeRuns = pgTable("scrape_runs", {
	id: uuid("id").primaryKey().defaultRandom(),
	sourceId: uuid("source_id")
		.references(() => scrapeSources.id)
		.notNull(),
	status: scrapeRunStatusEnum("status").default("pending"),
	eventsFound: integer("events_found").default(0),
	eventsCreated: integer("events_created").default(0),
	eventsUpdated: integer("events_updated").default(0),
	errorMessage: text("error_message"),
	triggerRunId: varchar("trigger_run_id", { length: 255 }),
	startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
	completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type ScrapeRun = typeof scrapeRuns.$inferSelect;
export type NewScrapeRun = typeof scrapeRuns.$inferInsert;

export const rssFeedSubscriptions = pgTable("rss_feed_subscriptions", {
	id: uuid("id").primaryKey().defaultRandom(),
	organizationId: uuid("organization_id").references(() => organizations.id),
	feedUrl: varchar("feed_url", { length: 500 }).notNull(),
	feedTitle: varchar("feed_title", { length: 255 }),
	isActive: boolean("is_active").default(true),
	lastFetchedAt: timestamp("last_fetched_at", {
		mode: "date",
		withTimezone: true,
	}),
	lastItemGuid: varchar("last_item_guid", { length: 500 }),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type RssFeedSubscription = typeof rssFeedSubscriptions.$inferSelect;
export type NewRssFeedSubscription = typeof rssFeedSubscriptions.$inferInsert;

// ============================================
// SOCIAL SHARING - Share images and analytics
// ============================================

export const shareAssetTypeEnum = pgEnum("share_asset_type", [
	"og",
	"twitter",
	"linkedin",
	"instagram_post",
	"instagram_story",
	"whatsapp",
]);

export const eventShareAssets = pgTable("event_share_assets", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	assetType: shareAssetTypeEnum("asset_type").notNull(),
	imageUrl: varchar("image_url", { length: 500 }).notNull(),
	generatedAt: timestamp("generated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type EventShareAsset = typeof eventShareAssets.$inferSelect;
export type NewEventShareAsset = typeof eventShareAssets.$inferInsert;

export const attendanceStatusEnum = pgEnum("attendance_status", [
	"attending",
	"interested",
	"not_going",
]);

export const userEventAttendance = pgTable("user_event_attendance", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	status: attendanceStatusEnum("status").default("attending"),
	sharedAt: timestamp("shared_at", { mode: "date", withTimezone: true }),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type UserEventAttendance = typeof userEventAttendance.$inferSelect;
export type NewUserEventAttendance = typeof userEventAttendance.$inferInsert;

export const sharePlatformEnum = pgEnum("share_platform", [
	"twitter",
	"linkedin",
	"facebook",
	"whatsapp",
	"instagram",
	"copy",
]);

export const shareAnalytics = pgTable("share_analytics", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	userId: varchar("user_id", { length: 255 }),
	platform: sharePlatformEnum("platform").notNull(),
	sharedAt: timestamp("shared_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type ShareAnalytic = typeof shareAnalytics.$inferSelect;
export type NewShareAnalytic = typeof shareAnalytics.$inferInsert;

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
	lumaHosts: many(eventHosts),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
	events: many(events),
	members: many(communityMembers),
	invites: many(communityInvites),
	sponsorships: many(eventSponsors),
	hostingEvents: many(eventHostOrganizations),
	hostMappings: many(lumaHostMappings),
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

export const communityRoleRequestsRelations = relations(
	communityRoleRequests,
	({ one }) => ({
		community: one(organizations, {
			fields: [communityRoleRequests.communityId],
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

export const eventOrganizersRelations = relations(
	eventOrganizers,
	({ one }) => ({
		event: one(events, {
			fields: [eventOrganizers.eventId],
			references: [events.id],
		}),
		representingOrg: one(organizations, {
			fields: [eventOrganizers.representingOrgId],
			references: [organizations.id],
		}),
	}),
);

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


export const eventHostsRelations = relations(eventHosts, ({ one }) => ({
	event: one(events, {
		fields: [eventHosts.eventId],
		references: [events.id],
	}),
}));

export const lumaHostMappingsRelations = relations(
	lumaHostMappings,
	({ one }) => ({
		organization: one(organizations, {
			fields: [lumaHostMappings.organizationId],
			references: [organizations.id],
		}),
	}),
);

