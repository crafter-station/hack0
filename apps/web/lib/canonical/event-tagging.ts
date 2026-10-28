type TagNamespace = "format" | "topic" | "audience";

type TagDefinition = {
  namespace: TagNamespace;
  slug: string;
  label: string;
  aliases: string[];
};

type TagCandidate = TagDefinition & { confidence: number };

const RAW_DEFINITIONS: Array<[TagNamespace, string, string, string[]]> = [
  ["format", "talk", "Talk", ["lecture", "keynote"]],
  ["format", "workshop", "Workshop", ["hands-on", "training"]],
  ["format", "conference", "Conference", ["summit"]],
  ["format", "meetup", "Meetup", ["community meetup"]],
  ["format", "networking", "Networking", ["networking event"]],
  ["format", "hackathon", "Hackathon", ["hack day"]],
  ["format", "webinar", "Webinar", ["online event"]],
  ["format", "course", "Course", ["class", "bootcamp"]],
  ["format", "panel", "Panel", ["panel discussion"]],
  ["format", "demo", "Demo", ["demo day"]],
  ["format", "social", "Social", ["party"]],
  ["topic", "ai", "AI", ["artificial intelligence", "machine learning", "ml"]],
  ["topic", "startups", "Startups", ["startup", "founders"]],
  ["topic", "entrepreneurship", "Entrepreneurship", ["business"]],
  ["topic", "technology", "Technology", ["tech"]],
  ["topic", "software", "Software", ["engineering", "developer"]],
  ["topic", "design", "Design", ["ux", "ui"]],
  ["topic", "product", "Product", ["product management"]],
  ["topic", "marketing", "Marketing", ["growth"]],
  ["topic", "finance", "Finance", ["investing"]],
  ["topic", "careers", "Careers", ["jobs", "employment"]],
  ["topic", "education", "Education", ["learning"]],
  ["topic", "climate", "Climate", ["sustainability"]],
  ["topic", "community", "Community", ["social impact"]],
  ["audience", "founders", "Founders", ["entrepreneurs"]],
  ["audience", "developers", "Developers", ["engineers", "programmers"]],
  ["audience", "designers", "Designers", ["ux designers"]],
  ["audience", "marketers", "Marketers", ["marketing professionals"]],
  ["audience", "students", "Students", ["learners"]],
  ["audience", "investors", "Investors", ["venture capital"]],
  ["audience", "operators", "Operators", ["business operators"]],
  ["audience", "creators", "Creators", ["content creators"]],
  ["audience", "general", "General", ["everyone", "all welcome"]],
];

const TAG_DEFINITIONS: TagDefinition[] = RAW_DEFINITIONS.map(([namespace, slug, label, aliases]) => ({
  namespace,
  slug,
  label,
  aliases,
}));

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function classifyEventTags(input: {
  name: string;
  description?: string | null;
  format?: string | null;
  topics?: string[] | null;
  audience?: string[] | null;
  isOnline?: boolean | null;
}): TagCandidate[] {
  const title = normalize(input.name);
  const text = normalize([input.name, input.description ?? ""].join(" "));
  const candidates: TagCandidate[] = [];
  for (const definition of TAG_DEFINITIONS) {
    const explicit = [input.format, ...(input.topics ?? []), ...(input.audience ?? [])]
      .filter(Boolean)
      .map((value) => normalize(String(value)));
    const values = [definition.slug, ...definition.aliases].map(normalize);
    const matches = (value: string, haystack: string) =>
      (value.length > 2 || ["ai", "ml", "ux", "ui"].includes(value)) &&
      new RegExp(`(^|\\s)${value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(?=\\s|$)`, "i").test(haystack);
    const exactExplicit = explicit.some((value) => values.includes(value));
    const inTitle = values.some((value) => matches(value, title));
    const inText = values.some((value) => matches(value, text));
    if (exactExplicit || inTitle || inText) {
      candidates.push({
        ...definition,
        confidence: exactExplicit ? 0.98 : inTitle ? 0.9 : 0.76,
      });
    }
  }
  if (input.isOnline && !candidates.some((candidate) => candidate.slug === "webinar")) {
    const webinar = TAG_DEFINITIONS.find((candidate) => candidate.slug === "webinar");
    if (webinar) candidates.push({ ...webinar, confidence: 0.82 });
  }
  return candidates
    .sort((a, b) => b.confidence - a.confidence || a.slug.localeCompare(b.slug))
    .filter((candidate, index, all) => all.findIndex((x) => x.slug === candidate.slug && x.namespace === candidate.namespace) === index);
}
