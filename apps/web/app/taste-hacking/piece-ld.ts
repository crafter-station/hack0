import { SITE } from "@/lib/site";
import { PIECES_PUBLISHED, type Piece, pieceHref } from "./pieces";
import { WORKSHOP } from "./workshop";

export const LAYER_ROWS = [
  { key: "seVe", name: "Cómo se ve" },
  { key: "seMueve", name: "Cómo se mueve" },
  { key: "estaHecho", name: "Cómo está hecho" },
] as const;

/** Article structured data for a piece page. A reference author is an Organization unless the piece types it as a person. */
export function articleLd(piece: Piece, poster: string) {
  const url = `${SITE}${pieceHref(piece)}`;
  const layers = LAYER_ROWS.filter((l) => piece.layers[l.key]).map((l) => ({ "@type": "Thing", name: l.name }));
  const reference = piece.reference
    ? [
        {
          "@type": "CreativeWork",
          name: piece.reference.name,
          url: piece.reference.url,
          author: { "@type": piece.reference.authorType ?? "Organization", name: piece.reference.author },
        },
      ]
    : [];
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: piece.title,
    description: piece.metaDescription,
    inLanguage: "es",
    image: [`${SITE}${poster}`],
    url,
    mainEntityOfPage: url,
    datePublished: PIECES_PUBLISHED,
    author: { "@type": "Person", name: "Railly Hugo", url: "https://railly.dev" },
    publisher: { "@type": "Organization", name: "hack0", url: SITE },
    about: [...reference, ...layers],
    isPartOf: {
      "@type": "Event",
      name: `${WORKSHOP.title}: ${WORKSHOP.subtitle}`,
      startDate: WORKSHOP.startAt,
      endDate: WORKSHOP.endAt,
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: { "@type": "VirtualLocation", url: WORKSHOP.luma },
      url: `${SITE}/taste-hacking`,
    },
  };
}
