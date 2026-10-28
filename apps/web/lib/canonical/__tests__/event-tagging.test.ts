import { describe, expect, it } from "bun:test";
import { classifyEventTags } from "../event-tagging";

describe("event tag classifier", () => {
  it("uses controlled namespaces and deterministic aliases", () => {
    const tags = classifyEventTags({
      name: "AI founders workshop",
      description: "A hands-on session for startup entrepreneurs",
    });
    expect(tags.some((tag) => tag.namespace === "topic" && tag.slug === "ai")).toBe(true);
    expect(tags.some((tag) => tag.namespace === "format" && tag.slug === "workshop")).toBe(true);
    expect(tags.some((tag) => tag.namespace === "audience" && tag.slug === "founders")).toBe(true);
    expect(tags.every((tag) => tag.confidence >= 0 && tag.confidence <= 1)).toBe(true);
  });

  it("does not create free-form duplicate labels", () => {
    const tags = classifyEventTags({
      name: "Artificial Intelligence meetup",
      topics: ["AI", "artificial intelligence"],
      isOnline: true,
    });
    expect(tags.filter((tag) => tag.namespace === "topic" && tag.slug === "ai")).toHaveLength(1);
    expect(tags.every((tag) => tag.slug.length > 0 && !tag.slug.includes(" "))).toBe(true);
  });
});
