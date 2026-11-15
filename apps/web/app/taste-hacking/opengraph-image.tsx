import { MainCard } from "./_og/cards";
import { OG_SIZE, OG_TYPE, renderOg } from "./_og/render";
import { WORKSHOP } from "./workshop";

export const alt = `${WORKSHOP.title}: todo lo que ves tiene 3 capas. Workshop online de hack0, ${WORKSHOP.day}.`;
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return renderOg(<MainCard />);
}
