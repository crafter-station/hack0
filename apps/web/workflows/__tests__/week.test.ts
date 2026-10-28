import { expect, test } from "bun:test";
import { isoWeek } from "../publish";

test("every day of a week shares one Monday and label", () => {
  const monday = isoWeek(new Date("2026-11-02T12:00:00Z"));
  const sunday = isoWeek(new Date("2026-11-08T23:00:00Z"));
  expect(monday.label).toBe("2026-W45");
  expect(sunday.label).toBe("2026-W45");
  expect(monday.start.toISOString()).toBe("2026-11-02T00:00:00.000Z");
  expect(isoWeek(new Date("2026-11-09T00:00:00Z")).label).toBe("2026-W46");
});

test("the first days of January can belong to the previous year's last week", () => {
  expect(isoWeek(new Date("2027-01-01T12:00:00Z")).label).toBe("2026-W53");
});
