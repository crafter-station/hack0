import { VocabCard } from "../_og/cards";
import { OG_SIZE, OG_TYPE, renderOg } from "../_og/render";
import { LAYERS } from "../workshop";

export const alt = "El vocabulario de Taste hacking: las palabras para pedir cada capa";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

/** Words shown under each layer. */
const SHOWN = 3;

export default function Image() {
  return renderOg(<VocabCard columns={LAYERS.map((l) => ({ name: l.short, words: l.words.slice(0, SHOWN).map((w) => w.w) }))} />);
}
