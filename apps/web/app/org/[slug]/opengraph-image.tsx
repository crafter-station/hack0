import { OG_SIZE, OG_TYPE } from "@/app/taste-hacking/_og/render";
import { orgImage } from "@/lib/ecosistema-og";

export const alt = "Logo y nombre de una organización del ecosistema tech en hack0";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  return orgImage((await params).slug);
}
