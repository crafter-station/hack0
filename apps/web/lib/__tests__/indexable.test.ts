import { expect, test } from "bun:test";
import { indexable } from "../catalog";

test("a page needs a description or a curator's pick to be indexed", () => {
  expect(indexable({ description: null, curated: false })).toBe(false);
  expect(indexable({ description: "Charla sobre agentes", curated: false })).toBe(true);
  expect(indexable({ description: null, curated: true })).toBe(true);
});
