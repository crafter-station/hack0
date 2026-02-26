// ============================================
// CONSTANTS - For filters and UI
// ============================================

export const EVENT_TYPES = [
	// Hackathones
	"hackathon",
	// Academicos
	"conference",
	"seminar",
	"research_fair",
	// Formacion
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

export const IMPORT_STATUSES = [
	"pending",
	"processing",
	"completed",
	"failed",
] as const;

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
