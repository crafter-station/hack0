# Luma Integration

## How It Works

Hack0 has a single Luma calendar (`lu.ma/hack0`) with a Plus subscription ($60/mo). This calendar acts as an aggregator for all LATAM tech events.

Events can enter Hack0 in two ways:

1. **Created directly** on lu.ma/hack0 → Hack0 owns these events and can update them
2. **Imported via URL** → Hack0 creates a reference (like a bookmark) to the external event

The tricky part is figuring out which organization each event belongs to. Since Luma events can have multiple hosts, we use a smart resolution system to match events to the right community.

---

## The Two Paths

### Path A: Someone creates an event on lu.ma/hack0

```mermaid
sequenceDiagram
    participant User
    participant Luma as lu.ma/hack0
    participant Webhook as Hack0 Webhook
    participant Resolver as Host Resolver
    participant DB as Hack0 DB

    User->>Luma: Create event as host
    Luma->>Webhook: POST /api/webhooks/luma (event.created)
    Webhook->>Webhook: Extract hosts[] from payload

    Webhook->>Resolver: resolveOrganization(hosts[])

    alt Verified mapping found
        Resolver->>DB: Query luma_host_mappings (is_verified=true)
        DB-->>Resolver: organizationId, confidence=100
    else Domain match
        Resolver->>DB: Query organization_domains by email domain
        DB-->>Resolver: organizationId, confidence=85
    else Unverified suggestion
        Resolver->>DB: Query luma_host_mappings (any)
        DB-->>Resolver: organizationId, confidence=low
    else No match
        Resolver-->>Webhook: orgId=null, confidence=0
    end

    Webhook->>DB: INSERT event (ownership='created')
    Webhook->>DB: INSERT event_hosts[] (all hosts)
    Webhook->>DB: UPSERT luma_host_mappings (last_seen_at)

    alt Org assigned
        Webhook-->>User: Event visible with org badge
    else Org pending
        Webhook-->>User: Event visible, pending queue for admin
    end
```

**What happens:**
1. Someone creates an event on the hack0 Luma calendar
2. Luma sends a webhook to Hack0
3. We look at ALL the hosts (not just the first one) and try to match them to an organization
4. If we find a match, the event gets assigned to that org
5. If not, it goes to a pending queue for manual review

---

### Path B: Someone imports an external Luma event

```mermaid
sequenceDiagram
    participant User
    participant UI as Hack0 UI
    participant Import as luma-import Task
    participant Luma as Luma API
    participant Resolver as Host Resolver
    participant DB as Hack0 DB

    User->>UI: Paste external Luma URL
    UI->>Import: Trigger import task

    Import->>Import: Scrape/fetch event data
    Import->>Import: Extract lumaEventApiId

    Import->>Resolver: resolveOrganization(hosts[])
    Resolver-->>Import: {orgId, confidence, matchSource}

    Import->>DB: INSERT event (ownership='referenced')
    Import->>DB: Set sourceLumaCalendarId, sourceLumaEventId
    Import->>DB: INSERT event_hosts[]
    Import->>DB: UPSERT luma_host_mappings

    Import->>Luma: POST /v1/calendar/add-event
    Note over Import,Luma: Adds reference to Hack0 calendar

    Luma-->>Import: Success
    Import-->>User: Event imported + added to Hack0 calendar
```

**What happens:**
1. User pastes a Luma URL (like `lu.ma/gdg-lima-meetup`)
2. We scrape the event data
3. Try to match hosts to organizations
4. Save the event as "referenced" (we don't own it, just indexing it)
5. Call Luma's add-event API to bookmark it in the hack0 calendar

---

## How We Match Hosts to Organizations

When an event has multiple hosts, we check them in this order:

| Priority | Method | Confidence | Example |
|----------|--------|------------|---------|
| 1 | Verified manual mapping | 100% | Admin manually linked "GDG Lima" host to GDG Lima org |
| 2 | Email domain match | 85% | Host email `@gdglima.org` matches org domain |
| 3 | Previous unverified match | Varies | We saw this host before and guessed |
| 4 | No match | 0% | Goes to pending queue |

This is deterministic - we always check ALL hosts, not just the first one.

---

## Keeping Events Up to Date

### For referenced events: Drift Detection

External events can change. Every week, we check if they've been updated:

```mermaid
sequenceDiagram
    participant Scheduler
    participant DriftJob as luma-check-drift Task
    participant Luma as Luma API
    participant DB as Hack0 DB

    Scheduler->>DriftJob: Weekly trigger
    DriftJob->>DB: SELECT events WHERE ownership='referenced'
    DB-->>DriftJob: Referenced events list

    loop For each referenced event
        DriftJob->>Luma: GET /v1/event/get?event_api_id=X

        alt Event found
            Luma-->>DriftJob: Current event data
            DriftJob->>DriftJob: Compare sourceContentHash

            alt Hash matches
                DriftJob->>DB: UPDATE last_source_check_at
            else Hash differs
                DriftJob->>DB: UPDATE event data + sync_status='drifted'
            end
        else 404 Not Found
            DriftJob->>DB: UPDATE sync_status='source_deleted'
        end
    end

    DriftJob-->>Scheduler: Complete
```

**Possible states:**
- `synced` - Event matches the source
- `drifted` - Source changed, we updated our copy
- `source_deleted` - Original event was deleted

---

## Self-Service: Claiming Your Organization

If an event has the wrong org (or no org), communities can claim it:

```mermaid
sequenceDiagram
    participant User
    participant UI as Claim Button
    participant Action as host-claims Action
    participant Email as Resend
    participant DB as Hack0 DB

    User->>UI: Click "Claim Organization"
    UI->>Action: initiateClaim(lumaHostApiId, orgId)

    Action->>DB: Get host email from event_hosts

    alt Host has email
        Action->>Action: Generate verification token
        Action->>DB: INSERT host_claims (status='pending')
        Action->>Email: Send magic link to host email
        Email-->>User: Verification email sent

        User->>Action: Click magic link with token
        Action->>DB: Verify token, UPDATE status='verified'
        Action->>DB: UPSERT luma_host_mappings (is_verified=true, match_source='claim')
        Action->>DB: UPDATE all events from this host with orgId
        Action-->>User: Claim verified, events updated
    else No email
        Action-->>User: Manual admin verification required
    end
```

**How it works:**
1. User clicks "Claim Organization" on an event
2. We send a verification email to the host's email
3. They click the magic link
4. All their events get assigned to their org
5. Future events from that host auto-match

---

## Background Jobs

| Job | When | What it does |
|-----|------|--------------|
| `luma-scheduled-sync` | Every 6 hours | Syncs new events from lu.ma/hack0 |
| `luma-backfill-orgs` | Sundays 3am | Re-tries matching for events with no org |
| `luma-check-drift` | Sundays 4am | Checks if referenced events changed |

---

## Setup

You need these environment variables:

```bash
# Your Luma API key (from the hack0 calendar with Plus subscription)
LUMA_API_KEY=luma_xxxxx

# The calendar API ID (to know which events we "own")
HACK0_LUMA_CALENDAR_API_ID=cal_xxxxx
```

---

## Quick Reference

| Term | Meaning |
|------|---------|
| **Created event** | Event made on lu.ma/hack0 - we own it |
| **Referenced event** | External event we imported - read-only |
| **Host** | Person/org that created the Luma event |
| **Confidence** | How sure we are about the org match (0-100) |
| **Drift** | When an external event changes after we imported it |
