# Architecture

## Flow

```
Vercel Cron (daily)
  -> one Vercel Workflow per provider, one source at a time
     -> fetch: Luma public feed, Luma API (keyed calendars), Meetup GraphQL, Eventbrite JSON-LD
     -> canonicalize: dedupe by provider id, URL, and name + start + metro
     -> upsert canonical_events and event_sources (replays change nothing)
     -> mark upcoming sightings a complete sync no longer finds as removed
     -> refresh listing: active (some source still lists it) and listed (belongs on hack0)
  -> pages (ISR), API, MCP, agenda drafts, optional push to the hack0 Luma calendar
```

## Listing

An event is listed when it is held in a LATAM country, or has no known country but appears in a source marked `latam`, or is online in Spanish or Portuguese. Sources are `latam` or `global`; the admin switches them.

## Identity

Postgres (Neon) is the source of truth. The source that created an event may rewrite it (a rename on Luma shows up); any other source only fills fields that are still empty, so an event keeps its URL and its page.

## Pages

Event, city and topic pages are ISR and render on first request. Event pages without a description or a curator's pick are `noindex` and stay out of the sitemap. Hubs paginate by path (`/ciudad/lima/2`) so ISR can cache each page; filtered `/eventos` views are `noindex`. Nothing on a public page may read the request on the server (session, headers): that turns ISR pages dynamic and fails at runtime.

## Workshops

Workshop bundles move out of git into a private R2 bucket. The API checks the entitlement and returns a short-lived signed URL.
