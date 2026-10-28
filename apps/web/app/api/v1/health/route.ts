import { json } from "@/lib/api/http";

export function GET() {
  return json({ ok: true, service: "hack0", apiVersion: "v1" });
}
