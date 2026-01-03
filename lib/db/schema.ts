import { relations } from "drizzle-orm";
import {
	boolean,
	index,
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
	"investor", // Fondos de inversión, VCs, SAFIs, Red Ángel, CVC
	"law_firm", // Estudios de abogados
	"consulting", // Consultoras
	"coworking", // Espacios de coworking
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

export const relationshipTypeEnum = pgEnum("relationship_type", [
	"partner",
	"investor",
	"invested_by",
	"accelerated",
	"accelerated_by",
	"incubated",
	"incubated_by",
	"member_of",
	"sponsor",
	"co_host",
	"alumni",
	"subsidiary",
	"parent",
]);

export const relationshipSourceEnum = pgEnum("relationship_source", [
	"manual",
	"scraped",
	"inferred",
	"imported",
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

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: varchar("email", { length: 255 }).notNull(),

		// Clerk user ID (optional - for logged in users)
		userId: varchar("user_id", { length: 255 }),

		// Community ID (optional - null means global subscription)
		communityId: uuid("community_id").references(() => organizations.id, {
			onDelete: "cascade",
		}),

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
	},
	(t) => [
		uniqueIndex("subscription_email_community_idx").on(t.email, t.communityId),
	],
);

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
	"investor",
	"law_firm",
	"consulting",
	"coworking",
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
	investor: "Fondo / VC",
	law_firm: "Estudio Legal",
	consulting: "Consultora",
	coworking: "Coworking",
};

export const COMMUNITY_TAG_AREAS = [
	"development",
	"design",
	"data-ai",
	"web3",
	"mobile",
	"cybersecurity",
	"product",
] as const;

export const COMMUNITY_TAG_SECTORS = [
	"fintech",
	"healthtech",
	"edtech",
	"agritech",
	"legaltech",
	"govtech",
	"proptech",
	"climatetech",
] as const;

export const COMMUNITY_TAG_VALUES = [
	"open-source",
	"social-impact",
	"sustainability",
	"diversity-inclusion",
] as const;

export const COMMUNITY_TAG_ACTIVITIES = [
	"education",
	"networking",
	"incubation",
	"acceleration",
	"investment",
	"coworking",
	"events",
	"mentorship",
] as const;

export const COMMUNITY_TAG_STAGES = [
	"students",
	"early-stage",
	"growth",
	"corporate",
] as const;

export const COMMUNITY_TAGS = [
	...COMMUNITY_TAG_AREAS,
	...COMMUNITY_TAG_SECTORS,
	...COMMUNITY_TAG_VALUES,
	...COMMUNITY_TAG_ACTIVITIES,
	...COMMUNITY_TAG_STAGES,
] as const;

export type CommunityTag = (typeof COMMUNITY_TAGS)[number];

export const COMMUNITY_TAG_LABELS: Record<CommunityTag, string> = {
	development: "Desarrollo",
	design: "Diseño",
	"data-ai": "Data & IA",
	web3: "Web3",
	mobile: "Mobile",
	cybersecurity: "Ciberseguridad",
	product: "Producto",
	fintech: "Fintech",
	healthtech: "Healthtech",
	edtech: "Edtech",
	agritech: "Agritech",
	legaltech: "Legaltech",
	govtech: "Govtech",
	proptech: "Proptech",
	climatetech: "Climatetech",
	"open-source": "Open Source",
	"social-impact": "Impacto Social",
	sustainability: "Sostenibilidad",
	"diversity-inclusion": "Diversidad e Inclusión",
	education: "Educación",
	networking: "Networking",
	incubation: "Incubación",
	acceleration: "Aceleración",
	investment: "Inversión",
	coworking: "Coworking",
	events: "Eventos",
	mentorship: "Mentoría",
	students: "Estudiantes",
	"early-stage": "Early-stage",
	growth: "Growth",
	corporate: "Corporate",
};

export const COMMUNITY_TAG_CATEGORIES = {
	areas: {
		label: "Áreas",
		tags: COMMUNITY_TAG_AREAS,
	},
	sectors: {
		label: "Sectores",
		tags: COMMUNITY_TAG_SECTORS,
	},
	values: {
		label: "Valores",
		tags: COMMUNITY_TAG_VALUES,
	},
	activities: {
		label: "Actividades",
		tags: COMMUNITY_TAG_ACTIVITIES,
	},
	stages: {
		label: "Etapa",
		tags: COMMUNITY_TAG_STAGES,
	},
} as const;

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
	shortCode: varchar("short_code", { length: 10 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }), // Public-facing name
	description: text("description"),
	type: organizerTypeEnum("type").default("community"),

	// Contact
	email: varchar("email", { length: 255 }),

	// Location (LATAM)
	country: varchar("country", { length: 10 }), // ISO code: PE, CO, MX, AR, CL, etc.
	department: varchar("department", { length: 100 }), // Region/State: Lima, Arequipa, Antioquia, etc.
	city: varchar("city", { length: 100 }), // City name

	// Links
	websiteUrl: varchar("website_url", { length: 500 }),
	logoUrl: varchar("logo_url", { length: 500 }),
	coverUrl: varchar("cover_url", { length: 500 }),

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

	// Tags for discoverability
	tags: text("tags").array(),

	// Badge settings
	badgeEnabled: boolean("badge_enabled").default(false),
	badgeStylePrompt: text("badge_style_prompt"),
	badgeBackgroundPrompt: text("badge_background_prompt"),
	badgePrimaryColor: varchar("badge_primary_color", { length: 20 }),
	badgeSecondaryColor: varchar("badge_secondary_color", { length: 20 }),
	badgeLogoPosition: varchar("badge_logo_position", { length: 20 }),

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
// ORGANIZATION RELATIONSHIPS - Graph connections
// ============================================

export const organizationRelationships = pgTable("organization_relationships", {
	id: uuid("id").primaryKey().defaultRandom(),

	sourceOrgId: uuid("source_org_id")
		.references(() => organizations.id)
		.notNull(),
	targetOrgId: uuid("target_org_id")
		.references(() => organizations.id)
		.notNull(),

	relationshipType: relationshipTypeEnum("relationship_type").notNull(),

	description: text("description"),
	strength: integer("strength").default(5),

	source: relationshipSourceEnum("source").default("manual"),
	confidence: integer("confidence").default(100),
	sourceUrl: varchar("source_url", { length: 500 }),

	isBidirectional: boolean("is_bidirectional").default(false),

	isVerified: boolean("is_verified").default(false),
	verifiedBy: varchar("verified_by", { length: 255 }),
	verifiedAt: timestamp("verified_at", { mode: "date", withTimezone: true }),

	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type OrganizationRelationship =
	typeof organizationRelationships.$inferSelect;
export type NewOrganizationRelationship =
	typeof organizationRelationships.$inferInsert;

export const RELATIONSHIP_TYPES = [
	"partner",
	"investor",
	"invested_by",
	"accelerated",
	"accelerated_by",
	"incubated",
	"incubated_by",
	"member_of",
	"sponsor",
	"co_host",
	"alumni",
	"subsidiary",
	"parent",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
	partner: "Partner",
	investor: "Invirtió en",
	invested_by: "Recibió inversión de",
	accelerated: "Aceleró a",
	accelerated_by: "Fue acelerado por",
	incubated: "Incubó a",
	incubated_by: "Fue incubado por",
	member_of: "Miembro de",
	sponsor: "Patrocina a",
	co_host: "Co-organiza con",
	alumni: "Ex-participante de",
	subsidiary: "Subsidiaria de",
	parent: "Empresa matriz de",
};

export const RELATIONSHIP_SOURCES = [
	"manual",
	"scraped",
	"inferred",
	"imported",
] as const;

export const RELATIONSHIP_SOURCE_LABELS: Record<string, string> = {
	manual: "Manual",
	scraped: "Descubierto",
	inferred: "Inferido",
	imported: "Importado",
};

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

export const eventSponsors = pgTable("event_sponsors", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.references(() => events.id)
		.notNull(),
	organizationId: uuid("organization_id")
		.references(() => organizations.id)
		.notNull(),
	orderIndex: integer("order_index").default(0),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type EventSponsor = typeof eventSponsors.$inferSelect;
export type NewEventSponsor = typeof eventSponsors.$inferInsert;

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

// ============================================
// USERS - First-class builders in the ecosystem
// ============================================

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkId: varchar("clerk_id", { length: 255 }).unique().notNull(),

	username: varchar("username", { length: 50 }).unique(),
	displayName: varchar("display_name", { length: 100 }),
	email: varchar("email", { length: 255 }),
	avatarUrl: varchar("avatar_url", { length: 500 }),
	bio: text("bio"),
	headline: varchar("headline", { length: 150 }),

	country: varchar("country", { length: 10 }),
	region: varchar("region", { length: 100 }),
	city: varchar("city", { length: 100 }),
	timezone: varchar("timezone", { length: 50 }).default("America/Lima"),

	skills: text("skills").array(),
	domains: text("domains").array(),

	websiteUrl: varchar("website_url", { length: 500 }),
	githubUrl: varchar("github_url", { length: 500 }),
	linkedinUrl: varchar("linkedin_url", { length: 500 }),
	twitterUrl: varchar("twitter_url", { length: 500 }),

	isOpenToWork: boolean("is_open_to_work").default(false),
	isOpenToFreelance: boolean("is_open_to_freelance").default(false),
	isOpenToCollab: boolean("is_open_to_collab").default(false),
	isOpenToMentor: boolean("is_open_to_mentor").default(false),
	isOpenToSpeaking: boolean("is_open_to_speaking").default(false),

	isPublic: boolean("is_public").default(true),
	showEmail: boolean("show_email").default(false),

	role: userRoleEnum("role").default("member"),
	formatPreference: formatPreferenceEnum("format_preference").default("any"),
	skillLevel: skillLevelEnum("skill_level").default("all"),
	hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),

	eventsAttendedCount: integer("events_attended_count").default(0),
	eventsOrganizedCount: integer("events_organized_count").default(0),
	hackathonsCount: integer("hackathons_count").default(0),
	hackathonWinsCount: integer("hackathon_wins_count").default(0),
	communitiesCount: integer("communities_count").default(0),
	achievementsCount: integer("achievements_count").default(0),
	totalPoints: integer("total_points").default(0),

	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	lastSeenAt: timestamp("last_seen_at", {
		mode: "date",
		withTimezone: true,
	}),

	// Luma Email Verification (Fake OAuth)
	lumaEmail: varchar("luma_email", { length: 255 }),
	lumaEmailVerified: boolean("luma_email_verified").default(false),
	lumaEmailVerifiedAt: timestamp("luma_email_verified_at", {
		mode: "date",
		withTimezone: true,
	}),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ============================================
// MULTI-SOURCE SCRAPING - Scheduled scraping system
// ============================================

export const syncFrequencyEnum = pgEnum("sync_frequency", [
	"hourly",
	"daily",
	"weekly",
	"manual",
]);

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

// ============================================
// EMAIL VERIFICATIONS - For Luma email verification (Fake OAuth)
// ============================================

export const emailVerificationPurposeEnum = pgEnum(
	"email_verification_purpose",
	["luma_connect"],
);

export const emailVerifications = pgTable(
	"email_verifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		userId: varchar("user_id", { length: 255 }).notNull(),
		email: varchar("email", { length: 255 }).notNull(),
		purpose: emailVerificationPurposeEnum("purpose").notNull(),

		token: varchar("token", { length: 255 }).unique().notNull(),
		expiresAt: timestamp("expires_at", {
			mode: "date",
			withTimezone: true,
		}).notNull(),

		verifiedAt: timestamp("verified_at", {
			mode: "date",
			withTimezone: true,
		}),

		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
	},
	(t) => [
		index("email_verification_user_idx").on(t.userId),
		index("email_verification_token_idx").on(t.token),
	],
);

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;

// ============================================
// ATTENDANCE CLAIMS - "Asistí" Feature
// ============================================

export const attendanceVerificationEnum = pgEnum("attendance_verification", [
	"self_reported",
	"organizer_verified",
]);

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
	attendanceClaims: many(attendanceClaims),
}));

export const usersRelations = relations(users, ({ many }) => ({
	achievements: many(userAchievements),
	giftCards: many(giftCards),
	winnerClaims: many(winnerClaims),
	memberships: many(communityMembers),
	attendanceClaims: many(attendanceClaims),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
	events: many(events),
	members: many(communityMembers),
	invites: many(communityInvites),
	sponsorships: many(eventSponsors),
	hostingEvents: many(eventHostOrganizations),
	outgoingRelationships: many(organizationRelationships, {
		relationName: "sourceOrg",
	}),
	incomingRelationships: many(organizationRelationships, {
		relationName: "targetOrg",
	}),
}));

export const organizationRelationshipsRelations = relations(
	organizationRelationships,
	({ one }) => ({
		sourceOrg: one(organizations, {
			fields: [organizationRelationships.sourceOrgId],
			references: [organizations.id],
			relationName: "sourceOrg",
		}),
		targetOrg: one(organizations, {
			fields: [organizationRelationships.targetOrgId],
			references: [organizations.id],
			relationName: "targetOrg",
		}),
	}),
);

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

export const attendanceClaimsRelations = relations(
	attendanceClaims,
	({ one }) => ({
		event: one(events, {
			fields: [attendanceClaims.eventId],
			references: [events.id],
		}),
	}),
);

// ============================================
// GIFT CARDS - Christmas 2025 Gift Experience
// ============================================

export const giftCardStyleEnum = pgEnum("gift_card_style", [
	"cozy_christmas",
	"minimal_festive",
	"cute_christmas",
	"soft_pixel",
]);

export const giftCardStatusEnum = pgEnum("gift_card_status", [
	"pending",
	"generating",
	"completed",
	"failed",
]);

export const giftCards = pgTable("gift_cards", {
	id: uuid("id").primaryKey().defaultRandom(),
	originalPhotoUrl: varchar("original_photo_url", { length: 500 }).notNull(),
	recipientName: varchar("recipient_name", { length: 100 }),
	generatedImageUrl: varchar("generated_image_url", { length: 500 }),
	generatedBackgroundUrl: varchar("generated_background_url", { length: 500 }),
	coverBackgroundUrl: varchar("cover_background_url", { length: 500 }),
	message: text("message"),
	layoutId: varchar("layout_id", { length: 20 }).notNull(),
	style: giftCardStyleEnum("style").notNull(),
	status: giftCardStatusEnum("status").default("pending"),
	errorMessage: text("error_message"),
	shareToken: varchar("share_token", { length: 64 }).unique().notNull(),
	builderId: integer("builder_id").unique(),
	verticalLabel: varchar("vertical_label", { length: 20 }),
	userId: varchar("user_id", { length: 255 }),
	triggerRunId: varchar("trigger_run_id", { length: 255 }),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
	completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
});

export type GiftCard = typeof giftCards.$inferSelect;
export type NewGiftCard = typeof giftCards.$inferInsert;

// ============================================
// ACHIEVEMENTS - Gamification System
// ============================================

export const achievementTypeEnum = pgEnum("achievement_type", [
	"seasonal",
	"participation",
	"winner",
	"organizer",
	"community",
	"streak",
	"explorer",
]);

export const achievementRarityEnum = pgEnum("achievement_rarity", [
	"common",
	"uncommon",
	"rare",
	"epic",
	"legendary",
]);

export const achievements = pgTable("achievements", {
	id: varchar("id", { length: 50 }).primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description").notNull(),
	iconUrl: varchar("icon_url", { length: 500 }),
	type: achievementTypeEnum("type").notNull(),
	rarity: achievementRarityEnum("rarity").default("common"),
	points: integer("points").default(10),
	isActive: boolean("is_active").default(true),
	isSecret: boolean("is_secret").default(false),
	unlockedBy: text("unlocked_by"),
	availableFrom: timestamp("available_from", {
		mode: "date",
		withTimezone: true,
	}),
	availableUntil: timestamp("available_until", {
		mode: "date",
		withTimezone: true,
	}),
	createdAt: timestamp("created_at", {
		mode: "date",
		withTimezone: true,
	}).defaultNow(),
});

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export const userAchievements = pgTable(
	"user_achievements",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id", { length: 255 }).notNull(),
		achievementId: varchar("achievement_id", { length: 50 })
			.references(() => achievements.id)
			.notNull(),
		unlockedAt: timestamp("unlocked_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		metadata: text("metadata"),
	},
	(table) => [
		uniqueIndex("user_achievement_unique_idx").on(
			table.userId,
			table.achievementId,
		),
	],
);

export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;

export const ACHIEVEMENT_TYPES = [
	"seasonal",
	"participation",
	"winner",
	"organizer",
	"community",
	"streak",
	"explorer",
] as const;

export const ACHIEVEMENT_RARITIES = [
	"common",
	"uncommon",
	"rare",
	"epic",
	"legendary",
] as const;

export const ACHIEVEMENT_RARITY_LABELS: Record<string, string> = {
	common: "Común",
	uncommon: "Poco común",
	rare: "Raro",
	epic: "Épico",
	legendary: "Legendario",
};

export const userAchievementsRelations = relations(
	userAchievements,
	({ one }) => ({
		achievement: one(achievements, {
			fields: [userAchievements.achievementId],
			references: [achievements.id],
		}),
	}),
);

// ============================================
// COMMUNITY BADGES - Member badges for communities
// ============================================

export const communityBadgeStatusEnum = pgEnum("community_badge_status", [
	"pending",
	"generating",
	"completed",
	"failed",
]);

export const communityBadges = pgTable(
	"community_badges",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		communityId: uuid("community_id")
			.references(() => organizations.id, { onDelete: "cascade" })
			.notNull(),
		userId: varchar("user_id", { length: 255 }).notNull(),

		badgeNumber: integer("badge_number").notNull(),
		shareToken: varchar("share_token", { length: 64 }).unique().notNull(),

		originalPhotoUrl: varchar("original_photo_url", { length: 500 }),
		generatedImageUrl: varchar("generated_image_url", { length: 500 }),
		generatedBackgroundUrl: varchar("generated_background_url", {
			length: 500,
		}),

		status: communityBadgeStatusEnum("status").default("pending"),
		errorMessage: text("error_message"),
		triggerRunId: varchar("trigger_run_id", { length: 255 }),

		createdAt: timestamp("created_at", {
			mode: "date",
			withTimezone: true,
		}).defaultNow(),
		completedAt: timestamp("completed_at", {
			mode: "date",
			withTimezone: true,
		}),
	},
	(t) => [
		uniqueIndex("community_badge_unique_idx").on(t.communityId, t.userId),
		index("community_badge_token_idx").on(t.shareToken),
	],
);

export type CommunityBadge = typeof communityBadges.$inferSelect;
export type NewCommunityBadge = typeof communityBadges.$inferInsert;
