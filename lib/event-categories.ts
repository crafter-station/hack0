// Event categories - groups of event types with specific display configurations

export type EventCategory = "all" | "competitions" | "learning" | "community";

export interface EventCategoryConfig {
  id: EventCategory;
  label: string;
  description: string;
  eventTypes: string[] | null; // null means all types
  // Columns to show in table
  showPrize: boolean;
  showFormat: boolean;
  showSkillLevel: boolean;
}

export const EVENT_CATEGORIES: EventCategoryConfig[] = [
  {
    id: "all",
    label: "Todos",
    description: "Todos los eventos",
    eventTypes: null, // No filter - show all
    showPrize: true,
    showFormat: true,
    showSkillLevel: false,
  },
  {
    id: "competitions",
    label: "Competencias",
    description: "Hackathons, olimpiadas y concursos con premios",
    eventTypes: [
      "hackathon",
      "olympiad",
      "competition",
      "robotics",
    ],
    showPrize: true,
    showFormat: true,
    showSkillLevel: false,
  },
  {
    id: "learning",
    label: "Formación",
    description: "Conferencias, talleres, bootcamps y cursos",
    eventTypes: [
      "conference",
      "seminar",
      "research_fair",
      "workshop",
      "bootcamp",
      "summer_school",
      "course",
      "certification",
    ],
    showPrize: false,
    showFormat: true,
    showSkillLevel: true,
  },
  {
    id: "community",
    label: "Comunidad",
    description: "Meetups, networking y oportunidades",
    eventTypes: [
      "meetup",
      "networking",
      "accelerator",
      "incubator",
      "fellowship",
      "call_for_papers",
    ],
    showPrize: false,
    showFormat: true,
    showSkillLevel: false,
  },
];

export function getCategoryById(id: EventCategory): EventCategoryConfig | undefined {
  return EVENT_CATEGORIES.find((cat) => cat.id === id);
}

export function getCategoryByEventType(eventType: string): EventCategoryConfig | undefined {
  return EVENT_CATEGORIES.find((cat) => cat.eventTypes.includes(eventType));
}

export function getDefaultCategory(): EventCategory {
  return "competitions";
}
