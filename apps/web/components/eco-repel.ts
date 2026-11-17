type Point = { x: number; y: number };

/** One overlapping pair, pushed apart along the axis where they overlap least; each moves half. */
function separatePair(i: number, j: number, pts: Point[], off: Point[], gx: number, gy: number) {
  const dx = pts[j].x + off[j].x - (pts[i].x + off[i].x);
  const dy = pts[j].y + off[j].y - (pts[i].y + off[i].y);
  const px = gx - Math.abs(dx);
  const py = gy - Math.abs(dy);
  if (px <= 0 || py <= 0) return;
  if (px < py) {
    // Same spot: alternate sides so identical addresses fan out left and right.
    const sx = Math.abs(dx) < 0.5 ? ((i + j) % 2 === 0 ? 1 : -1) : Math.sign(dx);
    off[i].x -= (sx * px) / 2;
    off[j].x += (sx * px) / 2;
    return;
  }
  const sy = Math.abs(dy) < 0.5 ? 1 : Math.sign(dy);
  off[i].y -= (sy * py) / 2;
  off[j].y += (sy * py) / 2;
}

/**
 * Screen offsets that keep markers from overlapping. Markers are boxes `widths[i]` wide and `height` tall,
 * plus `pad` between them; relaxation passes settle chains of neighbours.
 */
export function separate(pts: Point[], widths: number[], height: number, pad: number, passes = 24): Point[] {
  const off = pts.map(() => ({ x: 0, y: 0 }));
  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) separatePair(i, j, pts, off, (widths[i] + widths[j]) / 2 + pad, height);
    }
  }
  return off;
}
