import { expect, test } from "bun:test";
import { eventMetro, eventSlug } from "../page-keys";

test("the slug matches what the Luma-backed pages published", () => {
  expect(eventSlug("Cursor Meetup: Lima Edición", "https://luma.com/1z4no5h8")).toBe("cursor-meetup-lima-edicion-1z4no5h8");
});

test("Luma's city_state and bare cities resolve to the same metro", () => {
  expect(eventMetro("Barranco, Lima")).toBe("Lima");
  expect(eventMetro("Lima")).toBe("Lima");
  expect(eventMetro("Vitacura, Región Metropolitana")).toBe("Santiago");
  expect(eventMetro(null)).toBeNull();
});

test("a venue district with the group's city as region joins that metro, unless it is a metro itself", () => {
  expect(eventMetro("Pueblo Libre", "Lima")).toBe("Lima");
  expect(eventMetro("Arequipa", "Lima")).toBe("Arequipa");
  expect(eventMetro("LIMA")).toBe("Lima");
  expect(eventMetro("SANTA CRUZ")).toBe("Santa Cruz");
  expect(eventMetro("Online, al")).toBeNull();
  expect(eventMetro("Sesion Online")).toBeNull();
  expect(eventMetro("CABA, Ch")).toBe("Buenos Aires");
});
