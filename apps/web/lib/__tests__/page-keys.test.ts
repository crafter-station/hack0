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

test("official, English and suburb names join one metro hub", () => {
  expect(eventMetro("Ciudad Autónoma de Buenos Aires")).toBe("Buenos Aires");
  expect(eventMetro("palermo")).toBe("Buenos Aires");
  expect(eventMetro("Mexico City")).toBe("Ciudad de México");
  expect(eventMetro("Guatemala city")).toBe("Ciudad de Guatemala");
  expect(eventMetro("Zapopan, Jalisco")).toBe("Guadalajara");
  expect(eventMetro("José Luis Bustamante")).toBe("Arequipa");
});

test("a country or state in the city field is not a city", () => {
  expect(eventMetro("Argentina")).toBeNull();
  expect(eventMetro("Perú")).toBeNull();
  expect(eventMetro("Chiapas")).toBeNull();
});

test("Lima districts sent as a bare city join Lima, accents and case aside", () => {
  expect(eventMetro("Miraflores")).toBe("Lima");
  expect(eventMetro("Jesús María")).toBe("Lima");
  expect(eventMetro("VILLA EL SALVADOR")).toBe("Lima");
  expect(eventMetro("Surquillo, al")).toBe("Lima");
});
