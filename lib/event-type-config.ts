import {
	Award,
	BookOpen,
	Bot,
	Building2,
	FileText,
	GraduationCap,
	Lightbulb,
	Microscope,
	Rocket,
	Sun,
	Trophy,
	Users,
	Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface EventTypeConfig {
	icon: LucideIcon;
	label: string;
	description: string;
	showPrize: boolean;
	showSkillLevel: boolean;
}

export const EVENT_TYPE_CONFIG: Record<string, EventTypeConfig> = {
	hackathon: {
		icon: Zap,
		label: "Hackathon",
		description: "Competencia de desarrollo de software",
		showPrize: true,
		showSkillLevel: false,
	},
	olympiad: {
		icon: Trophy,
		label: "Olimpiada",
		description: "Matemáticas, física o programación",
		showPrize: true,
		showSkillLevel: false,
	},
	competition: {
		icon: Award,
		label: "Competencia",
		description: "Competencias generales tech",
		showPrize: true,
		showSkillLevel: false,
	},
	robotics: {
		icon: Bot,
		label: "Robótica",
		description: "Torneos y competencias de robots",
		showPrize: true,
		showSkillLevel: false,
	},
	workshop: {
		icon: BookOpen,
		label: "Taller",
		description: "Sesiones prácticas hands-on",
		showPrize: false,
		showSkillLevel: true,
	},
	bootcamp: {
		icon: Rocket,
		label: "Bootcamp",
		description: "Programas intensivos de formación",
		showPrize: false,
		showSkillLevel: true,
	},
	course: {
		icon: GraduationCap,
		label: "Curso / Diplomado",
		description: "Formación estructurada por módulos",
		showPrize: false,
		showSkillLevel: true,
	},
	summer_school: {
		icon: Sun,
		label: "Escuela de Verano",
		description: "Programas de temporada",
		showPrize: false,
		showSkillLevel: true,
	},
	certification: {
		icon: Award,
		label: "Certificación",
		description: "Programas con certificado oficial",
		showPrize: false,
		showSkillLevel: true,
	},
	meetup: {
		icon: Users,
		label: "Meetup",
		description: "Encuentros de comunidad tech",
		showPrize: false,
		showSkillLevel: false,
	},
	networking: {
		icon: Users,
		label: "Networking",
		description: "Eventos para hacer conexiones",
		showPrize: false,
		showSkillLevel: false,
	},
	conference: {
		icon: GraduationCap,
		label: "Congreso",
		description: "Conferencias y simposios",
		showPrize: false,
		showSkillLevel: false,
	},
	seminar: {
		icon: Microscope,
		label: "Seminario",
		description: "Ponencias y charlas académicas",
		showPrize: false,
		showSkillLevel: false,
	},
	research_fair: {
		icon: Lightbulb,
		label: "Feria Científica",
		description: "Ferias de ciencia y pósters",
		showPrize: false,
		showSkillLevel: false,
	},
	accelerator: {
		icon: Rocket,
		label: "Aceleradora",
		description: "Programas de aceleración de startups",
		showPrize: false,
		showSkillLevel: false,
	},
	incubator: {
		icon: Building2,
		label: "Incubadora",
		description: "Programas de incubación",
		showPrize: false,
		showSkillLevel: false,
	},
	fellowship: {
		icon: Award,
		label: "Fellowship / Beca",
		description: "Becas y programas de fellowship",
		showPrize: false,
		showSkillLevel: false,
	},
	call_for_papers: {
		icon: FileText,
		label: "Call for Papers",
		description: "Convocatorias académicas",
		showPrize: false,
		showSkillLevel: false,
	},
};

const EVENT_TYPE_ORDER = [
	"meetup",
	"hackathon",
	"workshop",
	"conference",
	"networking",
	"bootcamp",
	"seminar",
	"competition",
	"olympiad",
	"course",
	"accelerator",
	"fellowship",
	"robotics",
	"incubator",
	"call_for_papers",
	"research_fair",
	"summer_school",
	"certification",
];

export const EVENT_TYPE_LIST = EVENT_TYPE_ORDER.map((value) => ({
	value,
	...EVENT_TYPE_CONFIG[value],
}));

export function getEventTypeConfig(type: string): EventTypeConfig {
	return (
		EVENT_TYPE_CONFIG[type] || {
			icon: Zap,
			label: "Evento",
			description: "Evento general",
			showPrize: false,
			showSkillLevel: false,
		}
	);
}

export function hasEventOptions(type: string): boolean {
	const config = getEventTypeConfig(type);
	return config.showPrize || config.showSkillLevel;
}
