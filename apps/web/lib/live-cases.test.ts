import { afterEach, expect, setSystemTime, test } from "bun:test";
import { liveCasesOpen } from "./live-cases";

afterEach(() => {
  setSystemTime();
});

test("the live cases stay closed until the workshop has ended", () => {
  setSystemTime(new Date("2026-11-15T12:00:00Z"));
  expect(liveCasesOpen()).toBe(false);
  setSystemTime(new Date("2026-11-20T01:29:59Z"));
  expect(liveCasesOpen()).toBe(false);
});

test("they open at 01:30 UTC on Nov 20 and stay open", () => {
  setSystemTime(new Date("2026-11-20T01:30:00Z"));
  expect(liveCasesOpen()).toBe(true);
  setSystemTime(new Date("2026-12-01T00:00:00Z"));
  expect(liveCasesOpen()).toBe(true);
});

test("an explicit date wins over the clock", () => {
  setSystemTime(new Date("2026-12-01T00:00:00Z"));
  expect(liveCasesOpen(new Date("2026-11-19T23:00:00Z"))).toBe(false);
});
