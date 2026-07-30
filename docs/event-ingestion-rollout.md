# Event ingestion rollout

This document defines the release gate for every event source connected to
hack0. It complements the community-tooling phases in
[`implementation-phases.md`](./implementation-phases.md).

## Foundations

Before a source can write events, the shared pipeline must provide:

- runtime validation of the source-neutral event candidate;
- consistency checks for dates and required discovery fields;
- canonical URL comparison with tracking parameters removed;
- exact matching by provider and external ID;
- high-confidence matching by name, date, and compatible location;
- a manual-review state for possible, non-exact matches;
- collision-safe slugs that are not treated as event identity;
- dry-run reports and explicit production write authorization.

## Source release gate

Each source ships in its own branch and pull request. The gate is:

1. Implement the adapter without enabling a production schedule.
2. Run it in dry-run mode.
3. Review totals for rejected, inconsistent, duplicate, ambiguous, and new
   events.
4. Inspect a representative sample for LATAM relevance, dates, links, images,
   location, and organizer.
5. Verify in-batch idempotency with duplicate fixtures and confirm that the
   dry-run output contains no duplicate insert candidates.
6. With explicit approval, perform a small production canary import.
7. Re-run the canary input in dry-run mode. It must report zero new events.
8. Confirm the imported events in hack0 and, once two-way sync is available, in
   the Hack0 Luma calendar.
9. Deploy a Trigger.dev version without promotion and run only the new task.
10. Promote the version and activate only that source's schedule after review.
11. Monitor the first scheduled run and deactivate the schedule on regression.

Trigger.dev versions contain all project tasks. "Deploy one source" therefore
means that only the approved source receives an active schedule; the other
source tasks remain disabled or read-only. All event-writing Trigger tasks share
one queue with concurrency `1`, so two sources cannot deduplicate and write
against the same database snapshot simultaneously.

## Deduplication outcomes

The pipeline assigns one outcome to every consistent candidate:

| Outcome | Meaning | Automatic write |
|---|---|---|
| `insert` | No match was found. | Allowed after the source gate. |
| `skip` | Exact or high-confidence duplicate. | No. |
| `review` | Possible duplicate or incomplete consistency data. | No. |
| `reject` | Invalid or contradictory data. | No. |

An exact provider ID can be skipped automatically. A canonical event URL can
also be skipped when the dates are compatible; reused URLs with conflicting
dates go to review. Similar names alone are never enough. A high-confidence
fuzzy match also requires a close date and compatible location.

## Planned source order

1. Devpost.
2. Calendar router API.
3. Luma calendars connected by opted-in hack0 users.
4. Peruanos.dev.
5. LATAM-filtered Luma discovery.
6. Exa and Firecrawl discovery queries.

Two-way Hack0-Luma synchronization is a shared foundation that must be complete
before unattended source writes are enabled.

### Calendar router operating policy

The router is consumed through `EVENT_ROUTER_API_URL` and
`EVENT_ROUTER_API_TOKEN`. It returns canonical events across Luma, Eventbrite,
and Meetup, including source calendars and ownership evidence.

- `bun run sync:event-router --dry-run` is the manual validation path.
- `--max-events=20` limits a checkpoint sample.
- `--owned=true` inspects only events backed by a connected organizer source.
- The Trigger task `event-router-scraper` has no schedule until its source gate
  passes.
- Router candidates remain `pending` by default. `ownership=connected` is
  evidence, not consent. Automatic approval requires a separate, explicit
  Hack0 opt-in allowlist for the calendar.
- Hack0 accepts only events with a physical LATAM location, plus online events
  whose router language metadata identifies Spanish. Accepted online events
  receive LATAM scope; other regions and non-Spanish online events are reported
  as out of scope before database deduplication.
- Rotate any token shared in chat before storing it in Vercel or Trigger.dev.

## Read-only duplicate audit

Run the following command to inspect the current database without modifying it:

```bash
bun run audit:duplicates
```

The command only selects the event identity fields required by the matcher. It
does not call external source APIs and does not insert, update, or delete rows.
Duplicate and consistency results cover the approved public index; the report
also shows how many historical, pending, or rejected rows were excluded.

## Manual source suppression

Confirmed duplicate source URLs that could be re-approved by a direct provider
sync are recorded in `lib/ingestion/manual-overrides.ts`. A suppression must
name its canonical event and explain the reason. The historical duplicate row
is retained as rejected for auditability instead of being hard-deleted.

One-off reviewed data corrections use:

```bash
bun run remediate:event-audit
```

The command defaults to dry-run and verifies exact IDs and prior values before
any update. Production execution additionally requires all write-safety
environment confirmations.

## Remote event identity

`event_source_links` records provider identities separately from the Hack0 event
row. An `origin` link identifies where the event is managed. A
`calendar_listing` link identifies an additional calendar where the same event
is listed. The deterministic `identity_key` is unique, so repeating a sync
targets the same remote relationship instead of creating a second one.

The table is provider-neutral and supports inbound, outbound, or bidirectional
sync. Luma calendar connections are optional references; external discovery
sources can use the same identity model without storing credentials.
