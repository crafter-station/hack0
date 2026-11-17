import { OG_SIZE, OG_TYPE } from "@/app/taste-hacking/_og/render";
import { hubImage } from "@/lib/ecosistema-og";

export const alt = "Ecosistema tech de LATAM en hack0: logos de startups, fondos e incubadoras";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const revalidate = 3600;

export default function Image() {
  return hubImage();
}
