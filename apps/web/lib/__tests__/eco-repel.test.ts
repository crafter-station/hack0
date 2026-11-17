import { describe, expect, test } from "bun:test";
import { separate } from "@/components/eco-repel";

/** No two boxes overlap on both axes once separated. */
function overlaps(pts: { x: number; y: number }[], off: { x: number; y: number }[], widths: number[], height: number, pad: number) {
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = Math.abs(pts[j].x + off[j].x - pts[i].x - off[i].x);
      const dy = Math.abs(pts[j].y + off[j].y - pts[i].y - off[i].y);
      if (dx < (widths[i] + widths[j]) / 2 + pad - 0.5 && dy < height - 0.5) return true;
    }
  }
  return false;
}

describe("separate", () => {
  test("orgs at the same address end up side by side", () => {
    const pts = [
      { x: 100, y: 100 },
      { x: 100, y: 100 },
    ];
    const off = separate(pts, [40, 40], 52, 12);
    expect(overlaps(pts, off, [40, 40], 52, 12)).toBe(false);
  });

  test("a long name pushes its neighbour clear of the label", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 150, y: 38 },
    ];
    const widths = [240, 85];
    const off = separate(pts, widths, 76, 12);
    expect(overlaps(pts, off, widths, 76, 12)).toBe(false);
  });

  test("markers already apart don't move", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
    ];
    expect(separate(pts, [40, 40], 52, 12)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  test("a crowd of five at one point settles without overlap", () => {
    const pts = Array.from({ length: 5 }, () => ({ x: 0, y: 0 }));
    const widths = [40, 64, 40, 40, 64];
    const off = separate(pts, widths, 52, 12);
    expect(overlaps(pts, off, widths, 52, 12)).toBe(false);
  });
});
