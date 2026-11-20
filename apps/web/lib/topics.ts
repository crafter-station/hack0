/**
 * Catalog tags are stored in English ("education", "hackathon"); pages are in Spanish.
 * Formats read as a plural noun ("Hackathones en LATAM"), subjects as "Eventos de IA en LATAM".
 */
const FORMATS: Record<string, string> = {
  conference: "Conferencias",
  course: "Cursos",
  demo: "Demos",
  hackathon: "Hackathones",
  meetup: "Meetups",
  networking: "Networking",
  panel: "Paneles",
  social: "Encuentros",
  talk: "Charlas",
  webinar: "Webinars",
  workshop: "Workshops",
};

const SUBJECTS: Record<string, string> = {
  ai: "IA",
  community: "comunidad",
  design: "diseño",
  developers: "developers",
  education: "educación",
  entrepreneurship: "emprendimiento",
  finance: "finanzas",
  founders: "founders",
  marketing: "marketing",
  product: "producto",
  software: "software",
  startups: "startups",
  technology: "tecnología",
};

/** Tags too broad to be a page of their own. */
const UNLISTED = new Set(["general"]);

export const isListedTopic = (tag: string) => !UNLISTED.has(tag.toLowerCase());

/** Short label for chips and facets. */
export function topicLabel(tag: string) {
  const key = tag.toLowerCase();
  return FORMATS[key]?.toLowerCase() ?? SUBJECTS[key] ?? tag;
}

/** Page title for a topic hub, without the site name. */
export function topicTitle(tag: string) {
  const key = tag.toLowerCase();
  if (FORMATS[key]) return `${FORMATS[key]} en LATAM`;
  return `Eventos de ${SUBJECTS[key] ?? tag} en LATAM`;
}

/** One-sentence intro for a topic hub. */
export function topicIntro(tag: string) {
  const key = tag.toLowerCase();
  if (FORMATS[key]) return `${FORMATS[key]} de tecnología en Latinoamérica, con fechas, lugares y registro.`;
  return `Meetups, hackathones y workshops sobre ${SUBJECTS[key] ?? tag} en Latinoamérica, con fechas, lugares y registro.`;
}
