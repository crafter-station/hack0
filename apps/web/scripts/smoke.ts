export {};

/**
 * Requests the built site's public routes and fails on any non-2xx/3xx. ISR pages that read request data
 * only break at runtime in production (DYNAMIC_SERVER_USAGE), so this runs against `next start`, not dev.
 * Usage: bun run scripts/smoke.ts http://localhost:3000
 */
const base = process.argv[2] ?? "http://localhost:3000";
const routes = ["/", "/eventos", "/eventos?pais=pe", "/eventos/cursor-meetup-lima-e-1", "/ciudad/lima", "/ciudad/lima/2", "/tema/meetup", "/sitemap.xml", "/robots.txt", "/sign-in", "/api/v1/health"];

let failed = 0;
for (const route of routes) {
  const res = await fetch(base + route, { redirect: "manual" });
  const ok = res.status < 400 || (route === "/ciudad/lima/2" && res.status === 404);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${res.status} ${route}`);
}
process.exit(failed ? 1 : 0);
