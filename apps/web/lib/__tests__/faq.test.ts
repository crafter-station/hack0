import { expect, test } from "bun:test";
import { agendaFrom, agendaSentence } from "../faq";
import type { SearchResult } from "../search";

const result = (ciudades: { label: string; count: number }[]): SearchResult => ({
  events: [],
  total: 12,
  facets: { paises: [{ value: "MX", label: "México", count: 12 }], ciudades: ciudades.map((c) => ({ ...c, value: c.label })), temas: [] },
});

test("the agenda counts suburbs and boroughs in their metro, busiest first", () => {
  const agenda = agendaFrom(
    result([
      { label: "Guadalajara", count: 2 },
      { label: "Cuauhtémoc", count: 4 },
      { label: "Zapopan", count: 2 },
      { label: "Mexico City", count: 1 },
    ]),
  );
  expect(agenda.cities).toEqual(["Ciudad de México", "Guadalajara"]);
  expect(agendaSentence(agenda)).toBe(
    "Ahora mismo hay 12 eventos tech próximos en 1 país y 2 ciudades, con más agenda en Ciudad de México y Guadalajara.",
  );
});
