import { error } from "@/lib/http";
import { approvedTestimonials } from "@/lib/testimonials";

const WORKSHOP_ID = /^[a-z0-9-]{1,64}$/;

/** Approved testimonials are public: any site, such as the course's own, may read them. */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
};

export async function GET(req: Request) {
  const workshop = new URL(req.url).searchParams.get("workshop") ?? "01-taste-hacking";
  if (!WORKSHOP_ID.test(workshop)) return error(400, "usage", "workshop must be a workshop id, such as 01-taste-hacking.");
  const testimonials = await approvedTestimonials(workshop);
  return Response.json({ workshop, testimonials }, { headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
