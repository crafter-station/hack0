# Scraper Evaluation Report

**Date:** 2026-03-10
**Scope:** 12 hackathon scraper modules for LATAM discovery pipeline
**Evaluated by:** scraper-optimizer skill (automated static analysis + optimizer agent results)
**Previous evaluation:** 2026-03-10 (prior run, eval-only mode)

---

## Executive Summary

**Top recommended scraper: Devpost (`sources/devpost.ts`)** remains the single highest-value
source in the pipeline. After batch optimization it reaches ~100 LATAM search terms × 5 URL variants
each (500+ LATAM-scoped API calls) plus 18 global URLs. The three-tier `isLikelyHackathon()` filter
(`HACK_POSITIVE_RE` → fast-keep; `NOISE_NAME_RE` → drop; `NOISE_SOFT_RE` → soft-drop) drives
estimated precision to 0.88 — the highest of any scraper outside MLH. The detail-page enrichment
path (registration deadline, teamSizeMin/Max, language detection from body HTML) adds structured
fields that reduce downstream LLM enrichment cost. Overall score: **8.60**.

**Second recommended scraper: Meetup (`sources/meetup.ts`)** punches above its weight in recall
for community-organized hackathons that never appear on Devpost or Eventbrite. The 16-city Tier-1
matrix (6 search terms × 2 pages) plus 29 Tier-2 cities (hackathon-only) plus 11 curated group URLs
produces a broad search surface at zero API cost. The `emptyPage1Pairs` optimization (Batch 2)
eliminates guaranteed-empty second-page requests, keeping run time proportional to actual signal.
Overall score: **7.80**.

**Third recommended scraper: Eventbrite (`sources/eventbrite.ts`)** covers 25 LATAM countries with
~316 deduplicated URLs and a four-tier filter stack (`HACK_TIER1`, `HACK_CITY_BRAND`, `MARATONA_TECH`,
`HACK_LATAM_PATTERNS` + `NOISE_NAME_PATTERNS`). City-level URL expansions (44 cities across 13
countries) recover events that country-level searches rank too low to surface. All fetches are native
(no Firecrawl), making it cost-free. Overall score: **7.75**.

**Scrapers flagged for monitoring or deprecation:**
- **Social (`sources/social.ts`)** is operating with a known data-integrity bug (Bluesky posts
  emit `sourceType: "twitter"` due to missing enum value) and recorded a negative F1 delta
  (-0.01). Recall dropped to 0.12 after MIN_ENGAGEMENT raised to 2. Unless the `SourceType`
  enum is extended with `"bluesky"` and the attribution fixed, results from this scraper will
  be mislabeled in the database. Recommend holding at current state pending enum fix.
- **LinkedIn (`sources/linkedin.ts`)** achieved the lowest recall (0.18) and still depends on
  the Apify paid actor. The F1 uplift from this run (+0.01) is marginal relative to the Apify
  credit burn. It is worth retaining for Peru-specific corporate/government LinkedIn
  announcements not found elsewhere, but the query count should not increase.

---

## Ranked Summary Table

| Rank | Scraper | Quantity | Quality | Cost | Uniqueness | Overall |
|------|---------|----------|---------|------|------------|---------|
| 1 | devpost | 9.5 | 8.5 | 9.0 | 7.0 | **8.60** |
| 2 | meetup | 7.5 | 7.5 | 9.0 | 7.5 | **7.80** |
| 3 | eventbrite | 8.0 | 7.5 | 9.0 | 6.5 | **7.75** |
| 4 | websearch | 8.5 | 6.0 | 8.0 | 6.5 | **7.25** |
| 5 | mlh | 1.5 | 9.5 | 9.0 | 9.0 | **6.90** |
| 6 | perplexity | 5.5 | 6.5 | 6.0 | 7.0 | **6.20** |
| 6 | exa | 5.5 | 6.5 | 6.5 | 6.5 | **6.20** |
| 6 | universities | 6.0 | 6.0 | 4.0 | 9.0 | **6.20** |
| 9 | haiku | 5.0 | 6.5 | 5.0 | 7.0 | **5.85** |
| 10 | hackathon-com | 4.0 | 6.0 | 6.0 | 8.0 | **5.80** |
| 11 | social | 2.0 | 4.5 | 9.0 | 5.0 | **4.75** |
| 12 | linkedin | 2.5 | 5.0 | 3.0 | 6.0 | **4.05** |

Overall = (Quantity × 0.3) + (Quality × 0.3) + (Cost × 0.2) + (Uniqueness × 0.2)

---

## Per-Scraper Detail

### Devpost (`sources/devpost.ts`)

**Quantity: 9.5/10** — `LATAM_SEARCH_TERMS` grew from ~79 to ~100 entries (Batch 1). At 5 URL
variants per term (4 popularity pages + 1 recently-added) this produces ~500 LATAM-scoped API
requests. Global sweep adds 18 more URLs (5 popularity + 2 recently-added + 3 deadline + 3 in-person
+ 9 theme-filtered × 2 pages). All 24 LATAM countries covered, including newly added Cuba, Dominican
Republic, and Caribbean islands. Caribbean search terms: `"republica dominicana"`, `"santo domingo"`,
`"cuba"`, `"la habana"`. Bolivia/HN/PY city-level added.

**Quality: 8.5/10** — Three-tier noise filter: `HACK_POSITIVE_RE` (fast-keep on hackathon
vocabulary), `NOISE_NAME_RE` (conference/summit/webinar/fellowship/internship → drop), `NOISE_SOFT_RE`
(design-challenge/photo-challenge/esports → drop). Detail page enrichment adds `registrationDeadline`
(two CSS selectors + regex fallback on `bodyHtml`), `teamSizeMin`/`teamSizeMax` (pattern matching on
`#rules`/`.rules-content`/`[class*='team-size']` sections), and `devpost_hackathon_confirmed` /
`devpost_schema_type_conference` markers in the `eligibility` field. Language inference
(`ES_INDICATORS`, `PT_INDICATORS`) fires at API-level and detail-page level, enabling `scoreLATAM`
Signal 5 (+20 pts) without a downstream LLM call. ISO normalization via `LATAM_COUNTRY_NAMES`
upgrades country signals from +60 to +80 in the LATAM filter.

**Cost: 9.0/10** — Native fetch only. No Firecrawl credits consumed for listing URLs; detail-page
enrichment also uses native fetch with a concurrency of 5. Zero paid API cost.

**Uniqueness: 7.0/10** — Devpost is the canonical hackathon aggregator. Many events from
perplexity/haiku/exa/hackathon-com ultimately resolve to Devpost URLs. However, the LATAM search
term matrix surfaces events that do not appear in global popularity listings, giving Devpost exclusive
recall for regionally-branded events.

**Changes since last evaluation:**
- Added 6 Caribbean search terms (Dominican Republic, Cuba)
- Added 4 city-level terms for HN, PY, UY
- Added 5 university/student hackathon search terms
- Added 6 thematic LATAM hackathon search terms (blockchain, govtech, fintech, health)
- Country ISO normalization in `apiHackathonToRaw()` using `LATAM_COUNTRY_NAMES`
- Language inference at scrape time in `apiHackathonToRaw()`
- Expanded `coreLATAM` array to include Cuba, Puerto Rico, Peru, Brasil
- Added `registrationDeadline` extraction in `parseDevpostDetailPage()`
- Added `teamSizeMin`/`teamSizeMax` extraction
- Language detection from detail page body HTML

---

### Eventbrite (`sources/eventbrite.ts`)

**Quantity: 8.0/10** — `EVENTBRITE_COUNTRIES` covers all 25 LATAM countries/territories listed
in Eventbrite's `/d/` routing. Primary terms (`hackathon`, `hackaton`, `datathon`) × 25 countries =
75 base URLs. Pagination for 6 high-volume countries (MX: 4, BR: 4, CO: 3, AR: 3, CL: 2, PE: 2)
adds ~30 URLs. City-level matrix: 44 cities across 13 countries (including newly added
`bolivia: ["la-paz", "santa-cruz-de-la-sierra"]`, `venezuela: ["caracas", "maracaibo"]`,
`paraguay: ["asuncion"]`, `el-salvador: ["san-salvador"]`, `honduras: ["tegucigalpa", "san-pedro-sula"]`,
`nicaragua: ["managua"]`, `dominican-republic: ["santo-domingo"]`, `guatemala: ["guatemala-city"]`)
× 3 primary terms = ~132 city URLs. Secondary ES terms (11 terms × 7 countries = 77 URLs) and PT
terms (7 terms × 1 country = 7 URLs). Online sweep: 3 URLs. Estimated total: ~316 deduplicated URLs.

**Quality: 7.5/10** — Four-tier filter: `HACK_TIER1` (unambiguous hackathon keywords → immediate
pass), `HACK_CITY_BRAND` (HackGDL, HackMTY, HackBog patterns), `MARATONA_TECH` (competition
marathon variants), `HACK_LATAM_PATTERNS` (innovathon, desafío digital, reto de datos). The
`NOISE_NAME_PATTERNS` regex was tightened in Batch 2 to avoid over-rejecting `"Hackathon &
Networking"` style names while keeping 30+ noise patterns. Data extraction uses `window.__SERVER_DATA__`
JSON with ISO date+time fields; fallback to JSON-LD; final fallback to HTML card scraping.

**Cost: 9.0/10** — Native fetch with retry and jitter (1–2.5 s randomized delay). No Firecrawl
credits, no paid APIs.

**Uniqueness: 6.5/10** — Eventbrite hosts many LATAM events that don't cross-list to Devpost
(particularly corporate and government events). City-branded events (HackMTY, HackBog) are
Eventbrite-native. However, the largest Devpost hackathons also appear on Eventbrite, giving
moderate overlap with the top scraper.

**Changes since last evaluation:**
- Added city-level searches for 8 previously uncovered LATAM countries (Bolivia, Venezuela,
  Paraguay, El Salvador, Honduras, Nicaragua, Dominican Republic, Guatemala) — +33 URLs
- Added 9 thematic secondary ES terms (ia-hackathon, ai-hackathon, blockchain-hackathon,
  web3-hackathon, hack-de-salud, hackathon-social) as bilingual pairs across 7 countries — +64 URLs
- Added 4 new PT secondary terms for Brazil
- Tightened `NOISE_NAME_PATTERNS` to avoid over-rejection of `"Hackathon & Networking"` events
- Extended `HACK_LATAM_PATTERNS` with `"desafío digital"`, `"reto de datos"`, etc.

---

### MLH (`sources/mlh.ts`)

**Quantity: 1.5/10** — 3 URLs: `CURRENT_YEAR - 1`, `CURRENT_YEAR`, `CURRENT_YEAR + 1` season
pages. MLH's season format means the previous-year page captures Q1 cross-season events. Coverage
is structurally capped: MLH sanctions ~200 events per season globally, with low LATAM density
(typically 5–15 events tagged with LATAM ISO codes per season). No further URL expansion is
meaningful — MLH does not expose filtered search endpoints.

**Quality: 9.5/10** — Platform-curated: MLH manually reviews and sanctions every event. All events
are genuine hackathons by definition. `determineScopeHint()` (correcting previous eval which cited
the non-existent `regionToScopeHint()`) uses `LATAM_COUNTRIES_ISO` list against `venue_address.country`
— not the coarse `region` field (which is "AMER" for all Americas). Fields include ISO-format dates
(`starts_at`, `ends_at`), `format_type` (`physical`/`digital`/`hybrid`/`hybrid_physical`),
`venue_address.city`/`country`, and `website_url`. Cancelled events are explicitly filtered.

**Cost: 9.0/10** — Native fetch only. 3 HTTP requests per run.

**Uniqueness: 9.0/10** — MLH-sanctioned events carry the MLH brand and are only discoverable
through the MLH website. No other scraper in the pipeline covers this event population.

**Changes since last evaluation:**
- No code changes made (0 optimizer iterations resulted in modifications)
- Confirmed: `determineScopeHint()` is the correct function name (prior eval cited non-existent
  `regionToScopeHint()` — evaluation was inaccurate)
- Confirmed: scraper already fetches 3 season URLs (prior eval stated "2 URLs" — was outdated)
- F1 delta: 0.00 (no recall improvement possible given structural ceiling of 3 URLs × low LATAM density)

---

### Meetup (`sources/meetup.ts`)

**Quantity: 7.5/10** — Tier-1: 16 cities × 6 `CORE_HACK_TERMS` × 2 pages = 192 requests.
Tier-2: 29 cities (`TIER2_HACKATHON_ONLY`, hackathon-only) × 2 pages = 58 requests. Group pages:
11 `HACKATHON_GROUP_URLS` (curated hackathon-focused Meetup groups). New Tier-2 additions:
`do--Santo+Domingo`, `cu--La+Habana`, `hn--Tegucigalpa`, `sv--San+Salvador`, `ni--Managua`.
Total ~261 fetch operations before `emptyPage1Pairs` optimization skips. Covers 18+ countries
across all major LATAM tech cities.

**Quality: 7.5/10** — Two-stage Apollo state filter: `HACK_KEYWORDS` (hackathon/datathon/
buildathon/maratona variants) must match title or description; `NOISE_EXCLUSION` must not match
title. Batch 1 added `\bctf\b` and `capture[\s-]the[\s-]flag` to `NOISE_EXCLUSION`, preventing
cybersecurity CTF events from slipping through. The `emptyPage1Pairs` set (Batch 2) eliminates
~15–20% of guaranteed-empty page-2 requests. Data quality is limited by Meetup's Apollo state
structure: events without `__NEXT_DATA__` on the page are silently skipped.

**Cost: 9.0/10** — Native fetch. Rate-limited to 1.2 s between requests (`RATE_LIMIT_MS = 1200`).
No paid APIs.

**Uniqueness: 7.5/10** — Meetup covers community-organized hackathons (GDG, IEEE, local
developer groups) that organizers don't cross-list to Devpost or Eventbrite. The 11 curated group
URLs (`hackathonbrasil`, `HackathonMexico`, `hackathon-colombia`, etc.) provide a direct feed from
known hackathon-producing Meetup groups.

**Changes since last evaluation:**
- Added 5 cities to Tier-2: do--Santo+Domingo, cu--La+Habana, hn--Tegucigalpa, sv--San+Salvador,
  ni--Managua (+10 fetch ops, ~4% increase)
- Added `\bctf\b` and `capture[\s-]the[\s-]flag` to `NOISE_EXCLUSION` regex
- Implemented `emptyPage1Pairs` Set — skip-next-page optimization reducing ~15–20% wasted requests

---

### WebSearch (`sources/websearch.ts`)

**Quantity: 8.5/10** — 56 queries total: 17 geographic LATAM (including new
`salvador-honduras-nicaragua` covering SV/HN/NI, and expanded `caribe` to include Cuba, Jamaica,
Trinidad), 13 city-level, 10 thematic (including new `latam-datathon`), 11 global tech-company
(Microsoft, Google, OpenAI, Meta, AWS, Anthropic, Hugging Face, GitHub, NVIDIA, IBM, blockchain
foundations), and 5 global-open queries. `scopeHint: "latam"` added to all 37 LATAM-scoped queries.
`COUNTRY_ISO` map expanded from 19 to 29 entries. This is a query manifest consumed by a Claude
Code agent skill (`websearch-hackathons-scraper`), not a direct HTTP scraper.

**Quality: 6.0/10** — Quality depends on Claude Code WebSearch execution fidelity per run.
`deduplicateByName()` was fixed to support Portuguese accented characters (expanded character class
in word regex). 4 low-signal global company queries (Vercel, Stripe, Cloudflare, Salesforce)
removed in Batch 2. No code-level hackathon keyword guard exists — the skill's extraction prompt
acts as the gate. Results are not reproducible across runs due to WebSearch variability.

**Cost: 8.0/10** — Claude Code WebSearch tool is free at point of use (included in Claude Code
subscription), but requires agent execution time. No Firecrawl credits or paid APIs.

**Uniqueness: 6.5/10** — Reaches different pages than Perplexity/Haiku (different search index,
different result ranking). The 11 tech-company global queries are unique to this scraper. City-level
queries (Bogotá/Medellín, CDMX/GDL/MTY, Lima/Arequipa, São Paulo/Rio, etc.) add geographic
precision beyond what other LLM scrapers provide.

**Changes since last evaluation (new scraper — first optimization run):**
- Added `scopeHint: "latam"` to all 37 geographic and thematic queries (enables fast-keep path)
- Added `salvador-honduras-nicaragua` query (SV, HN, NI were absent from all geographic queries)
- Expanded `caribe` query to include Cuba, Jamaica, Trinidad
- Added `latam-datathon` thematic query in bilingual Spanish/Portuguese
- Removed 4 low-signal global company queries (Vercel, Stripe, Cloudflare, Salesforce)
- Expanded `COUNTRY_ISO` map from 19 to 29 entries to match latam-filter.ts coverage
- Fixed `deduplicateByName` regex for Portuguese accented characters

---

### Perplexity (`sources/perplexity.ts`)

**Quantity: 5.5/10** — 17 queries: 6 geographic LATAM bundles (mexico, brasil, cono-sur,
colombia, pais-andinos-venezuela, centroamerica-caribe), 6 thematic (ia-fintech, impacto-social,
salud-agro, web3-blockchain, universitario, virtual-abierto), 3 global (social-impact, ai-open,
web3-fintech-open), + 1 new `global-open-pt` (Portuguese-language global, Batch 2). Colombia split
from the venezuela bundle into its own dedicated query. Covers all 24 LATAM countries across queries.

**Quality: 6.5/10** — Three-criterion `SYSTEM_PROMPT` gate: (1) genuine hackathon format where
participants build a project in limited time, (2) future event, (3) verifiable evidence. Explicit
exclusion list in prompt: conferences, meetups, bootcamps, courses, workshops, networking, job fairs,
demo days. `HACKATHON_KEYWORD_GUARD` regex applied at `itemToRaw()` to drop items lacking hackathon
vocabulary in name+description before they reach the pipeline. `wordOverlapRatio()` dedup
(threshold 0.75) + URL equality. Dates are ISO strings but LLM-generated (unverified). Fields often
missing `city`, `modality`.

**Cost: 6.0/10** — 17 × Perplexity sonar-pro API calls. Estimated ~$0.10–0.25 per full run.

**Uniqueness: 7.0/10** — LLM-search reaches pages not indexed by Devpost/Eventbrite/Meetup (local
government portals, university microsites, corporate hackathon pages). Each query covers a
thematic/geographic niche that the direct scrapers don't explicitly target.

**Changes since last evaluation:**
- Tightened `SYSTEM_PROMPT` with 3-criterion gate and explicit exclusion list
- Added `HACKATHON_KEYWORD_GUARD` regex + gate in `itemToRaw()` — drops non-hackathon items
- Split colombia-venezuela query into dedicated colombia query; Venezuela moved to andean query
- Added `global-open-pt` query (Portuguese-language global, 17th query)

---

### Exa (`sources/exa.ts`)

**Quantity: 5.5/10** — 17 queries: 6 aggregator-platform domain-filtered (devpost, luma,
eventbrite, sympla, dorahacks standalone — Batch 1, online-aggregators), 5 geographic semantic,
4 thematic semantic, 2 global. `numResults` increased 10→15 for devpost-latam, luma-latam,
sympla-brasil (Batch 1). Non-domain-filtered queries return 10 results each. Exa's `type: "deep"`
runs internal query variations, so effective coverage is larger than query count suggests.

**Quality: 6.5/10** — `HACKATHON_KEYWORD_GUARD` regex + `looksLikeHackathon()` filter applied to
non-global queries (Batch 2), rejecting events without hackathon vocabulary in name+description.
`nameOverlapRatio()` Jaccard dedup (threshold ≥ 0.75) added alongside exact URL match (Batch 2).
Neural semantic search (`type: "deep"`) finds pages by meaning. `outputSchema` structures extraction
at search time. `normalizeModality()` handles hybrid/presencial/virtual variants.

**Cost: 6.5/10** — Single Exa API call per query (vs. 2 API calls for haiku). Exa deep search
pricing is ~$0.005–0.02/query. Estimated ~$0.10–0.35 per full run.

**Uniqueness: 6.5/10** — Domain-filtered queries (dorahacks.io standalone, sympla.com.br, lu.ma)
reach platforms that other scrapers only cover thematically. Neural search surfaces pages that
exact-keyword scrapers miss. Moderate overlap with perplexity and haiku on geographic results.

**Changes since last evaluation:**
- Separated dorahacks.io into standalone domain-filtered query (16→17 queries)
- Increased `numResults` 10→15 for devpost-latam, luma-latam, sympla-brasil
- Added `HACKATHON_KEYWORD_GUARD` regex + `looksLikeHackathon()` filter for non-global queries
- Added `nameOverlapRatio()` Jaccard fuzzy dedup (threshold 0.75) alongside exact match

---

### Haiku (`sources/haiku.ts`)

**Quantity: 5.0/10** — 16 queries: 3 platform-targeted (dorahacks.io, lu.ma, sympla.com.br), 3
geographic secondaries (peru-andino, centroamerica-caribe, andino-cono-sur), 5 thematic
(latam-govtech-datos-abiertos, latam-agroindustria-agua, latam-educacion-inclusion,
latam-salud-biotech, latam-fintech-web3), 2 organizer-type (latam-bid-caf-multilateral,
latam-corporativo-telecom), 3 global (ai-open, web3-open, social-impact-open). Batch 2 replaced 12
of 17 original queries; API calls reduced from 34 to 32 (sonar-pro search + Haiku extraction per
query = 2 calls per query × 16 queries).

**Quality: 6.5/10** — Two-step pipeline: (1) `generateText` with sonar-pro for web search, (2)
`generateObject` with Zod schema and system prompt for structured extraction. `passesHackathonGuard()`
applies `HACKATHON_NAME_KEYWORDS` regex after LLM extraction — drops items without hackathon
vocabulary in name+description unless description is < 30 chars. System prompt strengthened with
explicit exclusion list. Truncation increased from 12,000 to 16,000 characters (Batch 1).

**Cost: 5.0/10** — Two paid API calls per query: Perplexity sonar-pro (search) + Claude Haiku
(extraction) via Vercel AI Gateway. Estimated ~$0.20–0.50 per full run (32 total API calls).

**Uniqueness: 7.0/10** — Platform-targeted queries (dorahacks.io, lu.ma, sympla.com.br) surface
events not covered by the direct-fetch scrapers (only exa.ts has domain-filtered dorahacks/luma
queries, with different query framing). Multilateral bank queries (BID/CAF/FOMIN) and corporate
telecom queries are unique to this scraper among LLM-based sources.

**Changes since last evaluation:**
- Added `passesHackathonGuard()` code-level filter — `HACKATHON_NAME_KEYWORDS` regex on
  name+description
- Strengthened extraction system prompt with explicit exclusion list
- Increased search result truncation from 12,000 to 16,000 characters
- Replaced 12 of 17 queries with differentiated ones (platform-targeted, multilateral, telecom,
  agtech/water); removed generic geographic queries that duplicated perplexity.ts
- API calls reduced 34→32

---

### Hackathon-com (`sources/hackathon-com.ts`)

**Quantity: 4.0/10** — 12 queries via Perplexity sonar-pro. All 12 queries are intentionally
distinct from perplexity.ts: peru-only, caribbean-islands (English/French-speaking: Jamaica,
Trinidad, Barbados, Belize, Guyana, Suriname, Haiti), latam-govtech-ministry, latam-corporate-telecom
(Bancolombia, Nubank, BBVA, Claro, Movistar, Tigo), latam-gamedev-creative, latam-space-robotics
(CONAE, AEB, CONIDA, SpaceApps), latam-edtech-futureofwork, brazil-sympla-luma, latam-luma-platform,
peru-bolivia-innovation, global-hardware-iot, global-opensource-dev. Coverage is niche rather than
broad, targeting organizer types and themes not addressed by perplexity.ts.

**Quality: 6.0/10** — `HACKATHON_KEYWORD_GUARD` (includes `game[\s-]jam`) applied in
`itemToRawHackathon()` (Batch 3). System prompt strengthened (Batch 3). Word-overlap dedup
(threshold 0.75) matching perplexity.ts (Batch 2). Protocol-relative URL fix (`https://` prepended —
Batch 3). `normalizeCountry()` expanded for all Caribbean ISO codes (JM, HT, BZ, GY, SR, TT, BB,
PR — Batch 3).

**Cost: 6.0/10** — 12 × Perplexity sonar-pro API calls. Estimated ~$0.06–0.18 per full run
(5 fewer queries than perplexity.ts).

**Uniqueness: 8.0/10** — Game dev/creative (game jams) and space tech/robotics queries are unique
to this scraper across the entire pipeline. Caribbean English/French-speaking islands (Jamaica,
Trinidad, Barbados, Belize, Guyana, Suriname, Haiti) are covered by the caribbean-islands query and
not by any other LLM scraper with this specificity. Note: `sourceType: "hackathon_com"` is
misleading — data comes from Perplexity sonar-pro, not hackathon.com. This flag warrants a future
rename.

**Changes since last evaluation:**
- Replaced all 12 queries with clearly distinct topics (see above)
- Replaced exact-name dedup with word-overlap dedup matching perplexity.ts (threshold 0.75)
- Added `HACKATHON_KEYWORD_GUARD` in `itemToRawHackathon()`
- Fixed protocol-relative URL handling (prepend `https://`)
- Expanded `normalizeCountry()` for all Caribbean ISO codes
- Strengthened system prompt to filter non-hackathon events

---

### Universities (`sources/universities.ts`)

**Quantity: 6.0/10** — `UNIVERSITY_REGISTRY` contains 55 entries: 45+ universities across 17
LATAM countries + Caribbean (PR, DO), plus student chapter aggregators (IEEE Peru, IEEE PUCP,
IEEE Colombia, IEEE Mexico, IEEE Brasil; GDSC LATAM Hub; ACM ICPC South America), and community
aggregators (lu.ma LATAM Tech Clubs, Sympla Brasil hackathons). Each entry uses Firecrawl
`mapSite()` (limit: 20 after Batch 2 reduction from 30) to discover event-like URLs, then scrapes
up to 8 per base URL with `waitFor: 2500` (reduced from 3500 ms in Batch 2). Batch 2 additions:
8 universities for Panama (USMA, UTP), Guatemala (URL, USAC), Honduras (UNITEC, UNAH-CUEC),
Nicaragua (UCA, UNI); 2 Caribbean entries (PUCMM for DO, UPRM for PR).

**Quality: 6.0/10** — Three-tier relevance filter: `HACKATHON_KEYWORDS_REGEX` (primary, 25+
patterns including ICPC, `startup-weekend`, `pitch-competition`), `SECONDARY_KEYWORDS_REGEX` (broad,
only for texts < 500 chars), `FALSE_POSITIVE_REGEX` (thesis defenses, graduation ceremonies,
scholarship announcements). HTML parsing uses generic card selectors (`article`, `.event`, `.card`,
`[class*='event']`, `tr`). Dates are raw text strings requiring post-processor normalization. Note:
lu.ma LATAM Tech Clubs URLs (`lu.ma/latam-tech`, `lu.ma/hackathon-latam`) are speculative —
validate on first production run.

**Cost: 4.0/10** — Heavy Firecrawl usage: `mapSite()` per base URL + `scrape()` per discovered
page. Batch 2 optimizations (limit 30→20, waitFor 3500→2500 ms) reduced per-call cost by ~25–33%.
Remains the most Firecrawl-intensive scraper in the pipeline.

**Uniqueness: 9.0/10** — University event pages are not indexed by any event aggregator platform.
This is the only scraper that systematically targets university microsites, faculty event calendars,
IEEE/ACM chapter pages, and ICPC regional competition listings. Events discovered here exist nowhere
else in the pipeline.

**Changes since last evaluation:**
- Added 8 universities for Panama (USMA, UTP), Guatemala (URL, USAC), Honduras (UNITEC,
  UNAH-CUEC), Nicaragua (UCA, UNI)
- Added 2 Caribbean entries: PUCMM (DO), UPRM (PR)
- Added lu.ma LATAM Tech Clubs and Sympla Brasil community aggregators
- Reduced `mapSite` limit 30→20 (~33% less Firecrawl map depth)
- Reduced `waitFor` 3500→2500 ms (~29% per-call time reduction)

---

### LinkedIn (`sources/linkedin.ts`)

**Quantity: 2.5/10** — 5 queries × 8 max results = 40 posts max. Queries retained:
`hackathon latam convocatoria`, `hackathon peru lima convocatoria`, `hackathon colombia bogota
medellin`, `hackathon brasil sao paulo`, `hackathon latinoamerica online virtual`. 6 queries removed
(MX, AR, CL per-country; latam-inscripciones-abiertas; thematic datathon and AI).

**Quality: 5.0/10** — Multi-tier filter: `HACKATHON_KEYWORDS` type check, `isPostRecent()` (90-day
cutoff), 4 `NEGATIVE_PATTERNS` arrays (job postings, recap/past-tense articles, news/sponsored
content, course/training promotions — extended in Batch 2 with Portuguese recap phrases), 5
`POSITIVE_SIGNALS` arrays (registration/apply language, platform URLs, future-date language,
deadline language, prize mention near hackathon), `LATAM_GEO` geographic guard. `extractCountryFromText()`
added (Batch 2) using `LATAM_COUNTRY_NAMES` + `LATAM_CITIES` with word-boundary guards. Name
extraction from unstructured post text remains fragile (first-line heuristic).

**Cost: 3.0/10** — Apify `curious_coder/linkedin-post-search-scraper` actor: paid Apify credits
per actor run (5 runs × 8 results each). LinkedIn data access requires Apify intermediary, making
this the highest-cost scraper per useful event discovered.

**Uniqueness: 6.0/10** — Corporate and government hackathon announcements on LinkedIn precede their
appearance on Devpost/Eventbrite by 1–4 weeks. Peru-specific corporate/government LinkedIn posts
(CONCYTEC, StartUp Peru, Bancolombia-adjacent) are genuinely LinkedIn-first. The low maxResults
cap (8) limits practical unique yield.

**Changes since last evaluation:**
- Reduced query count 11→5 (kept: latam-general, peru, colombia, brasil, virtual-latam)
- Reduced `maxResults` 15→8 per query (165→40 posts max, 76% cost reduction)
- Extended `NEGATIVE_PATTERNS` with Portuguese recap phrases and course/training promotions
- Added `extractCountryFromText()` using `LATAM_COUNTRY_NAMES` + `LATAM_CITIES` with word-boundary
  guards

---

### Social (`sources/social.ts`)

**Quantity: 2.0/10** — 12 Bluesky queries (`BLUESKY_QUERIES`) × 25 posts (`limit: "25"`) = 300
posts max. Twitter/X disabled entirely (`scrapeTwitter()` returns `[]` immediately). Queries: 2
broad LATAM sweeps, 6 country-specific (MX, BR, CO, PE, AR, CL), 2 thematic (datathon, AI,
fintech/blockchain), 2 Portuguese-language for Brazil (datathon, maratona).

**Quality: 4.5/10** — `HACKATHON_KEYWORDS_REGEX` + `NOISE_REGEX` + `MIN_ENGAGEMENT ≥ 2` (raised
from 1 in Batch 2) + `MAX_POST_AGE_DAYS = 90` recency cutoff. Bluesky embed URL extraction
(`post.record.embed.external.uri`) is reliable when present. Known data-integrity bug:
`bskyPostToRaw()` emits `sourceType: "twitter"` instead of `"bluesky"` because `SourceType` enum
in `types.ts` lacks a `"bluesky"` variant. All Bluesky-sourced events are mislabeled in the database
until this is fixed. The `_apifyClient` import is present but unused (Twitter disabled), creating
dead dependency.

**Cost: 9.0/10** — Bluesky public AT Protocol API (`app.bsky.feed.searchPosts`) requires no auth
and has no paid cost. Twitter/X Apify call disabled saves credits. Light rate limiting: 500 ms
between queries.

**Uniqueness: 5.0/10** — Bluesky posts surface announcements before they appear on event platforms,
but most events mentioned on Bluesky also appear on Devpost/Eventbrite/Meetup within days. Posts
that include embedded event URLs (via Bluesky card embeds) are the most valuable output — they
provide direct links to platform pages that can be followed.

**Changes since last evaluation:**
- Documented Twitter disabled status and Bluesky sourceType attribution bug in JSDoc
- Disabled Twitter/X Apify calls entirely — `scrapeTwitter()` returns `[]` immediately
- Increased `MIN_ENGAGEMENT` from 1 to 2
- Expanded `BLUESKY_QUERIES` from 10 to 12 (added registration-intent, fintech/blockchain,
  Brazilian Portuguese queries)
- **Known bug (unresolved):** Bluesky posts use `sourceType: "twitter"` — requires `"bluesky"`
  added to `SourceType` enum in `lib/scraper/types.ts`

---

## Confusion Matrix

Methodology: Base precision set from platform type (MLH/Devpost: 0.85; Eventbrite/Meetup: 0.65;
LLM-search: 0.60; Social/LinkedIn: 0.40). Adjusted upward for each noise filter tier (+0.05 each),
hackathon keyword guard (+0.05), and platform curation (+0.05 where applicable). F1 deltas from
optimizer JSON applied to final state values. Recall estimated from search surface breadth and
optimizer final state. All F1 = 2PR/(P+R) verified arithmetically.

| Scraper | Recall | Precision | F1 | Δ vs Prior |
|---------|--------|-----------|-----|------------|
| devpost | 0.86 | 0.88 | 0.87 | +0.02 |
| eventbrite | 0.76 | 0.81 | 0.78 | +0.02 |
| mlh | 0.22 | 0.92 | 0.36 | 0.00 |
| meetup | 0.62 | 0.82 | 0.70 | +0.02 |
| websearch | 0.58 | 0.67 | 0.62 | +0.05 |
| perplexity | 0.54 | 0.68 | 0.60 | +0.03 |
| exa | 0.50 | 0.70 | 0.58 | +0.04 |
| universities | 0.50 | 0.72 | 0.59 | +0.06 |
| haiku | 0.55 | 0.65 | 0.60 | +0.05 |
| hackathon-com | 0.46 | 0.65 | 0.54 | +0.06 |
| linkedin | 0.18 | 0.48 | 0.27 | +0.01 |
| social | 0.12 | 0.44 | 0.19 | -0.01 |

**F1 verification (all rows):**
- devpost: 2×0.86×0.88 / (0.86+0.88) = 1.5136 / 1.74 = **0.870** ✓
- eventbrite: 2×0.76×0.81 / (0.76+0.81) = 1.2312 / 1.57 = **0.784** ✓
- mlh: 2×0.22×0.92 / (0.22+0.92) = 0.4048 / 1.14 = **0.355** ✓
- meetup: 2×0.62×0.82 / (0.62+0.82) = 1.0168 / 1.44 = **0.706** ✓
- websearch: 2×0.58×0.67 / (0.58+0.67) = 0.7772 / 1.25 = **0.622** ✓
- perplexity: 2×0.54×0.68 / (0.54+0.68) = 0.7344 / 1.22 = **0.602** ✓
- exa: 2×0.50×0.70 / (0.50+0.70) = 0.7000 / 1.20 = **0.583** ✓
- universities: 2×0.50×0.72 / (0.50+0.72) = 0.7200 / 1.22 = **0.590** ✓
- haiku: 2×0.55×0.65 / (0.55+0.65) = 0.7150 / 1.20 = **0.596** ✓
- hackathon-com: 2×0.46×0.65 / (0.46+0.65) = 0.5980 / 1.11 = **0.539** ✓
- linkedin: 2×0.18×0.48 / (0.18+0.48) = 0.1728 / 0.66 = **0.262** ✓
- social: 2×0.12×0.44 / (0.12+0.44) = 0.1056 / 0.56 = **0.189** ✓

---

## Coverage Matrix

✓✓ = multi-city coverage, ✓ = covered, ~ = incidental/via global queries, ✗ = not covered

| Country | devpost | eventbrite | meetup | mlh | perplexity | haiku | exa | hackathon-com | universities | websearch | linkedin | social |
|---------|---------|-----------|--------|-----|-----------|-------|-----|--------------|-------------|----------|---------|--------|
| AR | ✓✓ | ✓✓ | ✓✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓✓ | ✓✓ | ~ | ✓ |
| BO | ✓✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ~ |
| BR | ✓✓ | ✓✓ | ✓✓ | ~ | ✓ | ✓ | ✓✓ | ✓ | ✓✓ | ✓✓ | ✓ | ✓ |
| CL | ✓✓ | ✓✓ | ✓✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓✓ | ✓✓ | ~ | ✓ |
| CO | ✓✓ | ✓✓ | ✓✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓✓ | ✓✓ | ✓ | ✓ |
| CR | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✗ | ~ |
| CU | ✓ | ✓ | ✓ | ✗ | ~ | ~ | ✓ | ~ | ✗ | ✓ | ✗ | ~ |
| DO | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✗ | ~ |
| EC | ✓✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓✓ | ✓ | ✗ | ~ |
| SV | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✗ | ✓ | ✗ | ~ |
| GT | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✗ | ~ |
| HN | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✗ | ~ |
| MX | ✓✓ | ✓✓ | ✓✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓✓ | ✓✓ | ~ | ✓ |
| NI | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✗ | ~ |
| PA | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✗ | ~ |
| PY | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✗ | ~ |
| PE | ✓✓ | ✓✓ | ✓✓ | ~ | ✓ | ✓✓ | ✓ | ✓✓ | ✓✓ | ✓✓ | ✓ | ✓ |
| UY | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✗ | ~ |
| VE | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ | ✗ | ~ |
| GY | ~ | ✓ | ✗ | ✗ | ~ | ~ | ~ | ✓ | ✗ | ~ | ✗ | ✗ |
| SR | ~ | ✓ | ✗ | ✗ | ~ | ~ | ~ | ✓ | ✗ | ~ | ✗ | ✗ |
| BZ | ~ | ✓ | ✗ | ✗ | ~ | ~ | ~ | ✓ | ✗ | ~ | ✗ | ✗ |
| HT | ~ | ✓ | ✗ | ✗ | ~ | ~ | ~ | ✓ | ✗ | ~ | ✗ | ✗ |
| JM | ~ | ✓ | ✗ | ✗ | ~ | ~ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| TT | ~ | ✓ | ✗ | ✗ | ~ | ~ | ~ | ✓ | ✗ | ✓ | ✗ | ✗ |
| BB | ~ | ✓ | ✗ | ✗ | ~ | ~ | ~ | ✓ | ✗ | ~ | ✗ | ✗ |
| PR | ~ | ✓ | ✗ | ~ | ~ | ~ | ~ | ~ | ✓ | ✓ | ✗ | ✗ |

**Thematic coverage:**

| Theme | devpost | eventbrite | perplexity | haiku | exa | hackathon-com | websearch |
|-------|---------|-----------|-----------|-------|-----|--------------|---------|
| AI/ML | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ |
| Fintech/Web3 | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ |
| Health/Biotech | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ |
| GovTech/Open Data | ✓ | ~ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Agtech | ~ | ~ | ✓ | ✓ | ✓ | ~ | ✓ |
| EdTech | ~ | ~ | ~ | ✓ | ~ | ✓ | ✓ |
| Game Dev/Creative | ~ | ~ | ~ | ~ | ~ | ✓ | ~ |
| Space/Robotics | ~ | ~ | ~ | ~ | ~ | ✓ | ~ |
| Hardware/IoT | ~ | ~ | ~ | ~ | ~ | ✓ | ✓ |
| MLH student circuit | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| University circuit | ~ | ~ | ~ | ✓ | ~ | ~ | ✓ |

---

## Recommendations

### Scrapers to improve next (priority order)

1. **Universities** — The speculative lu.ma URLs (`lu.ma/latam-tech`, `lu.ma/hackathon-latam`)
   need validation on the first production run. The Firecrawl credit cost is the highest per-run
   in the pipeline; consider adding a dry-run mode that logs mapped URLs without scraping to
   validate coverage before committing credits. With uniqueness 9.0 and precision 0.72, improving
   recall (currently 0.50) would have outsized pipeline impact since universities represent events
   found nowhere else.

2. **Social** — The `SourceType` enum must be extended with `"bluesky"` in `lib/scraper/types.ts`
   and `bskyPostToRaw()` updated to use `sourceType: "bluesky"`. Until fixed, all Bluesky events
   are mislabeled as `"twitter"` in the database, making attribution impossible. Once the enum is
   fixed, consider adding country extraction logic mirroring `extractCountryFromText()` from
   linkedin.ts to recover LATAM filter misses on Bluesky posts.

3. **Hackathon-com** — The `sourceType: "hackathon_com"` label is misleading; data comes from
   Perplexity sonar-pro. A rename to `"hackathon_com_discovery"` or a new `"perplexity_niche"`
   source type would improve database transparency. The game-dev, space-robotics, and edtech
   queries (unique thematic angles with uniqueness 8.0) should be validated for actual yield in
   the first post-optimization production run before committing to further investment.

### Scrapers to deprioritize

- **LinkedIn** — F1 0.27, recall 0.18, requires paid Apify credits. The +0.01 F1 uplift from
  this cycle is marginal. Maintain at current state (5 queries, maxResults 8). Do not increase
  query count or maxResults without a demonstrated improvement in unique yield.

- **Social (Twitter branch)** — `scrapeTwitter()` is correctly disabled. The `TWITTER_QUERIES`
  array and `tweetToRaw()` function should be preserved as reference but not re-enabled without
  a fundamental change in the Apify cost/yield equation.

### Pipeline observations

- All 27 LATAM countries/territories in `LATAM_COUNTRIES_ISO` now have at least one dedicated
  scraper providing systematic coverage. The most underserved remain English/French-speaking
  Caribbean (GY, SR, BZ, HT, JM, TT, BB) — only Eventbrite + hackathon-com provide systematic
  coverage. Consider adding a dedicated Caribbean query to perplexity.ts in the next cycle.

- Three scrapers (perplexity, haiku, hackathon-com) maintain nearly identical `HACKATHON_KEYWORD_GUARD`
  regex patterns with minor differences (`game[\s-]jam` only in hackathon-com; `sprint[\s-]de[\s-]inovac`
  only in haiku). Consolidating into a shared utility in `latam-filter.ts` would reduce maintenance
  surface and ensure consistent behavior across all LLM-based scrapers.

- The `scopeHint: "latam"` added to all websearch.ts queries enables the post-processor's
  `classifyLatamHybrid` fast-keep path. The same pattern should be applied to eventbrite.ts
  country-level URLs — they are already LATAM-scoped but emit no `scopeHint`, causing unnecessary
  LLM classification calls for ~316 URLs per run.

- MLH's structural ceiling (3 URLs, 5–15 LATAM events per season) means recall (0.22) is not
  improvable through optimization. Its value is high-confidence labeling for the events it covers
  (precision 0.92). No further optimization effort is warranted for this scraper.

- The `nameOverlapRatio()` Jaccard dedup in exa.ts and the `wordOverlapRatio()` in perplexity.ts
  and hackathon-com.ts compute slightly different results for asymmetric name pairs (Jaccard uses
  union-size denominator; the others use max-set-size). Standardizing on Jaccard (more conservative,
  fewer false dedup merges) across all scrapers would improve cross-scraper consistency in the
  global deduplicator.
