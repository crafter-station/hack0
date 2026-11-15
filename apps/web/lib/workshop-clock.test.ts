import { expect, test } from "bun:test";
import { workshopPhase } from "./workshop-clock";

const START = "2026-11-19T21:00:00-03:00";
const END = "2026-11-19T22:30:00-03:00";
const at = (iso: string) => workshopPhase(new Date(iso), START, END);

test("counts calendar days before the workshop", () => {
  expect(at("2026-11-15T16:00:00-03:00")).toEqual({ phase: "before", days: 4, label: "en 4 días" });
  expect(at("2026-11-18T23:50:00-05:00")).toEqual({ phase: "before", days: 1, label: "mañana" });
  expect(at("2026-11-19T00:10:00-05:00")).toEqual({ phase: "before", days: 0, label: "hoy" });
});

test("a late evening is still one day away, not zero", () => {
  expect(at("2026-11-18T22:00:00-03:00").label).toBe("mañana");
});

test("live between start and end, after from the end on", () => {
  expect(at(START).phase).toBe("live");
  expect(at("2026-11-19T22:29:59-03:00").phase).toBe("live");
  expect(at(END).phase).toBe("after");
  expect(at("2026-12-01T10:00:00-03:00").phase).toBe("after");
});
