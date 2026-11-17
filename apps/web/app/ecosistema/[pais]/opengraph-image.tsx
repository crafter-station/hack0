import { OG_SIZE, OG_TYPE } from "@/app/taste-hacking/_og/render";
import { hubImage } from "@/lib/ecosistema-og";

export const alt = "Ecosistema tech de un país en hack0, con los logos de sus organizaciones";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ pais: string }> }) {
  return hubImage((await params).pais);
}
