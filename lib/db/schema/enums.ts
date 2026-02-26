import { pgEnum } from "drizzle-orm/pg-core";

// ============================================
// ENUMS - Full LATAM Innovation Ecosystem
// ============================================

// Event Types - Categorias principales
export const eventTypeEnum = pgEnum("event_type", [
	// Hackathones
	"hackathon", // Competencias de desarrollo clasicas

	// Eventos Academicos
	"conference", // Congresos, simposios
	"seminar", // Seminarios, ponencias
	"research_fair", // Ferias cientificas, posters

	// Formacion
	"workshop", // Talleres practicos
	"bootcamp", // Programas intensivos
	"summer_school", // Escuelas de verano/invierno
	"course", // Cursos, diplomados
	"certification", // Certificaciones

	// Comunidad
	"meetup", // Encuentros de comunidad
	"networking", // Eventos de networking

	// Competencias
	"olympiad", // Olimpiadas (mate, fisica, programacion)
	"competition", // Competencias generales
	"robotics", // Torneos de robotica

	// Oportunidades
	"accelerator", // Programas de aceleracion
	"incubator", // Incubadoras
	"fellowship", // Fellowships, becas
	"call_for_papers", // Convocatorias academicas
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
	"investor", // Fondos de inversion, VCs, SAFIs, Red Angel, CVC
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

export const hostSourceEnum = pgEnum("host_source", ["luma", "manual"]);

export const communityRoleEnum = pgEnum("community_role", [
	"owner",
	"admin",
	"member",
	"follower",
]);

export const inviteTypeEnum = pgEnum("invite_type", ["link", "email"]);

export const roleRequestStatusEnum = pgEnum("role_request_status", [
	"pending",
	"approved",
	"rejected",
]);

export const eventOrganizerRoleEnum = pgEnum("event_organizer_role", [
	"lead", // Organizador principal (puede gestionar todo)
	"organizer", // Co-organizador (puede editar)
	"volunteer", // Voluntario (solo puede ver analytics)
]);

export const importStatusEnum = pgEnum("import_status", [
	"pending",
	"processing",
	"completed",
	"failed",
]);

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

export const scrapeRunStatusEnum = pgEnum("scrape_run_status", [
	"pending",
	"running",
	"completed",
	"failed",
]);

export const shareAssetTypeEnum = pgEnum("share_asset_type", [
	"og",
	"twitter",
	"linkedin",
	"instagram_post",
	"instagram_story",
	"whatsapp",
]);

export const emailVerificationPurposeEnum = pgEnum(
	"email_verification_purpose",
	["luma_connect"],
);

export const attendanceVerificationEnum = pgEnum("attendance_verification", [
	"self_reported",
	"organizer_verified",
]);

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

export const badgeCampaignStatusEnum = pgEnum("badge_campaign_status", [
	"draft",
	"active",
	"ended",
	"archived",
]);

export const badgeCampaignTypeEnum = pgEnum("badge_campaign_type", [
	"default",
	"seasonal",
	"event",
]);

export const communityBadgeStatusEnum = pgEnum("community_badge_status", [
	"pending",
	"generating",
	"completed",
	"failed",
]);

// ============================================
// SUBMISSION SYSTEM
// ============================================

export const submissionStatusEnum = pgEnum("submission_status", [
	"draft",
	"submitted",
	"under_review",
	"scored",
	"winner",
	"finalist",
	"rejected",
	"disqualified",
]);

export const teamMemberRoleEnum = pgEnum("team_member_role", [
	"lead",
	"developer",
	"designer",
	"pm",
	"other",
]);

export const teamMemberStatusEnum = pgEnum("team_member_status", [
	"pending",
	"accepted",
	"declined",
	"removed",
]);
