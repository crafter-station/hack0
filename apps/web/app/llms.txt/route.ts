import { AUTHORS, CRAFTER, GITHUB, LUMA, SITE } from "@/lib/site";

export const revalidate = 86400;

/** llms.txt (llmstxt.org): what hack0 is and where its pages live, for language models. */
export function GET() {
  const body = `# hack0

> hack0 is Crafter Station's open calendar of tech events and communities in Latin America: hackathons, meetups, workshops and conferences, with a page for every event, city, topic and community. Not related to the BTCPay Server "Hack0" hardware node.

hack0 is part of [Crafter Station](${CRAFTER}), the open source community of builders from Peru and Latin America. It was created and is maintained by ${AUTHORS.map((a) => `[${a.name}](${a.url})`).join(" and ")}. Pages are in Spanish. The code is open source under Apache-2.0.

## Pages

- [Calendario 2026–2027](${SITE}/calendario-2027): chronological calendar of flagship 2026-2027 LATAM tech, AI and startup conferences
- [Eventos](${SITE}/eventos): every upcoming and past event, searchable by country, city and topic
- [Eventos tech en Lima](${SITE}/ciudad/lima): one hub per city, e.g. /ciudad/<city>
- [Comunidades](${SITE}/comunidades): the communities that organize the events, grouped by city
- [Ecosistema](${SITE}/ecosistema): map of startups, investors, incubators, universities and coworkings, by country
- [Workshops](${SITE}/taste-hacking): live online workshops in Spanish
- [About](${SITE}/about): who builds hack0

## Links

- [Luma calendar](${LUMA}): subscribe to the weekly agenda
- [GitHub](${GITHUB}): source code, REST API and MCP server docs
- [Crafter Station](${CRAFTER})
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
