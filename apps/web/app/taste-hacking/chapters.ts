import { CHAPTER_BY_LAYER, type Layer, PIECES, type Piece } from "./pieces";
import { AGENDA } from "./workshop";

type LiveCase = {
  chapter: number;
  layer: string;
  title: string;
  /** URL segment of the case's page; null until it is written. */
  path: string | null;
  /** One line for the index; null until it is written. */
  summary: string | null;
};

/** The three cases worked live. Their content is filled in after the workshop. */
export const LIVE_CASES: LiveCase[] = AGENDA.flatMap((a) => a.cases ?? []).map((c, i) => ({
  chapter: 2 + i,
  layer: c.layer,
  title: c.title,
  path: null,
  summary: null,
}));

/** The pieces of each layer, in chapter order. */
export const PIECE_CHAPTERS: { chapter: number; label: string; pieces: Piece[] }[] = (Object.keys(CHAPTER_BY_LAYER) as Layer[])
  .map((layer) => ({ ...CHAPTER_BY_LAYER[layer], pieces: PIECES.filter((p) => p.layer === layer) }))
  .sort((a, b) => a.chapter - b.chapter);

export function chapterNumber(n: number): string {
  return String(n).padStart(2, "0");
}
