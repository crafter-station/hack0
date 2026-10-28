# Architecture

## Today

`apps/web` reads the hack0 Luma calendar through the Luma public API, cached for an hour. Every public event becomes a page at `/eventos/<slug>`, grouped into `/ciudad/<metro>` and `/tema/<tag>` hubs. Pages use ISR, so a new Luma event becomes a page without a deploy.

Luma stores the district as the city. `metroOf` in `apps/web/lib/calendar.ts` rolls districts up to their metro area (Barranco to Lima).

## Next

Postgres (Neon) becomes the source of truth. Luma is an input (the calendars the aggregator syncs) and an output (curated events pushed to the hack0 calendar).

```
Trigger.dev cron -> ingest per source -> event_sources -> canonicalize -> canonical_events
  -> LATAM and language filter -> curated
  -> pages in apps/web, push to the hack0 Luma calendar, newsletter and social posts
```

Workshop bundles move out of git into a private R2 bucket. The API checks the entitlement and returns a short-lived signed URL.
