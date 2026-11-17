import { OG_SIZE, OG_TYPE } from "@/app/taste-hacking/_og/render";
import { hubImage } from "@/lib/ecosistema-og";

export const alt = "Organizaciones de un tipo o una ciudad en el directorio de hack0";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ pais: string; segmento: string }> }) {
  const { pais, segmento } = await params;
  return hubImage(pais, segmento);
}
