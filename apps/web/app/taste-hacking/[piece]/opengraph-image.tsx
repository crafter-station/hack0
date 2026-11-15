import { notFound } from "next/navigation";
import { PieceCard } from "../_og/cards";
import { OG_SIZE, OG_TYPE, posterData, renderOg } from "../_og/render";
import { chapterNumber } from "../chapters";
import { GALLERY, LAYER_LABEL } from "../gallery";
import { CHAPTER_BY_LAYER, PIECES, pieceByPath } from "../pieces";

export const alt = "Una pieza de Taste hacking: su título, su capa y el resultado";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const dynamicParams = false;

export function generateStaticParams() {
  return PIECES.map((p) => ({ piece: p.path }));
}

export default async function Image({ params }: { params: Promise<{ piece: string }> }) {
  const piece = pieceByPath((await params).piece);
  const media = piece ? GALLERY.find((g) => g.slug === piece.slug) : undefined;
  if (!piece || !media) notFound();
  return renderOg(
    <PieceCard
      chapter={chapterNumber(CHAPTER_BY_LAYER[piece.layer].chapter)}
      layer={LAYER_LABEL[piece.layer]}
      title={piece.title}
      poster={await posterData(media.poster)}
    />,
  );
}
