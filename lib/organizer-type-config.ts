import {
	Building2,
	Flag,
	GraduationCap,
	Handshake,
	Landmark,
	Newspaper,
	Rocket,
	School,
	Users,
	Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface OrganizerTypeConfig {
	icon: LucideIcon;
	label: string;
	description: string;
}

export const ORGANIZER_TYPE_CONFIG: Record<string, OrganizerTypeConfig> = {
	community: {
		icon: Users,
		label: "Comunidad",
		description: "Grupo de interés, club o comunidad tech",
	},
	company: {
		icon: Building2,
		label: "Empresa",
		description: "Empresa privada o corporación",
	},
	startup: {
		icon: Rocket,
		label: "Startup",
		description: "Startup o empresa emergente",
	},
	university: {
		icon: GraduationCap,
		label: "Universidad",
		description: "Institución de educación superior",
	},
	student_org: {
		icon: School,
		label: "Org. Estudiantil",
		description: "Organización o club estudiantil",
	},
	ngo: {
		icon: Handshake,
		label: "ONG / Fundación",
		description: "Organización sin fines de lucro",
	},
	government: {
		icon: Landmark,
		label: "Gobierno",
		description: "Entidad gubernamental o pública",
	},
	embassy: {
		icon: Flag,
		label: "Embajada",
		description: "Embajada o consulado",
	},
	international_org: {
		icon: Globe,
		label: "Org. Internacional",
		description: "Organismo internacional",
	},
	media: {
		icon: Newspaper,
		label: "Medio Tech",
		description: "Blog, podcast o medio tecnológico",
	},
};

const ORGANIZER_TYPE_ORDER = [
	"community",
	"company",
	"startup",
	"university",
	"student_org",
	"ngo",
	"government",
	"embassy",
	"international_org",
	"media",
];

export const ORGANIZER_TYPE_LIST = ORGANIZER_TYPE_ORDER.map((value) => ({
	value,
	...ORGANIZER_TYPE_CONFIG[value],
}));

export function getOrganizerTypeConfig(type: string): OrganizerTypeConfig {
	return (
		ORGANIZER_TYPE_CONFIG[type] || {
			icon: Users,
			label: "Organización",
			description: "Organización general",
		}
	);
}
