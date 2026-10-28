import { describe, expect, test } from "bun:test";
import { enrichEventForRouting, inferRoutingCountryCode } from "../event-routing-enrichment";

describe("event routing enrichment", () => {
  test("preserves explicit provider evidence", () => {
    const enrichment = enrichEventForRouting({
      event: {
        name: "AI Builders",
        description: "An event for developers.",
        city: "Madrid",
        enrichment: {
          countryCode: "ES",
          languageCode: "es",
          isOnline: false,
          confidence: 0.98,
          sources: { countryCode: "provider_api" },
        },
      },
      calendarNames: ["Lima Tech"],
    });

    expect(enrichment.countryCode).toBe("ES");
    expect(enrichment.sources?.countryCode).toBe("provider_api");
    expect(enrichment.confidence).toBe(0.98);
  });

  test("uses event location as strong LATAM evidence", () => {
    const enrichment = enrichEventForRouting({
      event: {
        name: "Cursor Meetup Barranquilla",
        city: "Barranquilla",
      },
    });

    expect(enrichment.countryCode).toBe("CO");
    expect(enrichment.isOnline).toBe(false);
    expect(enrichment.format).toBe("in_person");
    expect(enrichment.sources?.countryCode).toBe("event_location");
    expect(enrichment.confidence).toBe(0.85);
  });

  test("marks title and description geography as review evidence", () => {
    const fromTitle = enrichEventForRouting({
      event: {
        name: "Cursor Meetup Barranquilla",
      },
    });
    const fromDescription = enrichEventForRouting({
      event: {
        name: "International QA Certification",
        description: "Accredited by institutions in Spain, Germany, Colombia and more.",
      },
    });

    expect(fromTitle.countryCode).toBe("CO");
    expect(fromTitle.sources?.countryCode).toBe("event_title");
    expect(fromTitle.isOnline).toBeNull();
    expect(fromDescription.countryCode).toBe("CO");
    expect(fromDescription.sources?.countryCode).toBe("event_description");
    expect(fromDescription.confidence).toBe(0.5);
  });

  test("marks calendar-only geography as weak evidence", () => {
    const enrichment = enrichEventForRouting({
      event: {
        name: "The BMAD Method",
        description: "Context engineering for AI development.",
      },
      calendarNames: ["Advanced AI Concepts-Lima"],
    });

    expect(enrichment.countryCode).toBe("PE");
    expect(enrichment.isOnline).toBeNull();
    expect(enrichment.sources?.countryCode).toBe("calendar_name");
    expect(enrichment.confidence).toBe(0.6);
  });

  test("identifies Spanish online events without inventing a country", () => {
    const enrichment = enrichEventForRouting({
      event: {
        name: "De idea a producción: cómo construir un SaaS con IA",
        description: "Taller virtual para aprender con ejemplos y construir tu producto.",
      },
    });

    expect(enrichment.countryCode).toBeNull();
    expect(enrichment.languageCode).toBe("es");
    expect(enrichment.isOnline).toBe(true);
    expect(enrichment.format).toBe("online");
    expect(enrichment.sources?.languageCode).toBe("event_text");
  });

  test("keeps global calendars unclassified", () => {
    const enrichment = enrichEventForRouting({
      event: {
        name: "Claude Community Session",
        description: "A community conversation for builders.",
      },
      calendarNames: ["Claude Community Events"],
    });

    expect(enrichment.countryCode).toBeNull();
    expect(enrichment.region).toBeNull();
  });

  test("uses LATAM calendar labels as regional review evidence", () => {
    const enrichment = enrichEventForRouting({
      event: { name: "Agentic RAG Community Session" },
      calendarNames: ["My Agents LATAM"],
    });

    expect(enrichment.countryCode).toBeNull();
    expect(enrichment.region).toBe("LATAM");
    expect(enrichment.sources?.region).toBe("calendar_name");
    expect(enrichment.confidence).toBe(0.55);
  });

  test("normalizes common LATAM location names", () => {
    expect(inferRoutingCountryCode("Mérida, México")).toBe("MX");
    expect(inferRoutingCountryCode("Montevideo")).toBe("UY");
    expect(inferRoutingCountryCode("Rio de Janeiro")).toBe("BR");
  });

  test("normalizes provider language names", () => {
    const enrichment = enrichEventForRouting({
      event: {
        name: "AI Builders",
        enrichment: { languageCode: "Español" },
      },
    });

    expect(enrichment.languageCode).toBe("es");
    expect(enrichment.languages).toEqual(["es"]);
  });
});
