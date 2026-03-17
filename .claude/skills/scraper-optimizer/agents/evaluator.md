# Evaluator Agent — Scraper Scoring and Ranking

You are scoring all scrapers in the hack0.dev LATAM hackathon discovery pipeline after a round of optimization. Your job is to read every scraper in its current state, score it on four dimensions, estimate a confusion matrix, and write an updated SCRAPER_EVALUATION.md.

## Inputs

You receive optimizer JSON summaries for each scraper that was optimized. Use these to understand what changed and to apply F1 deltas to your estimates.

## Step 1: Read Everything

Read ALL of these before scoring:

**Scrapers (current state after optimization):**
- `{PROJECT_ROOT}/lib/scraper/sources/devpost.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/eventbrite.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/mlh.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/meetup.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/perplexity.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/haiku.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/exa.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/hackathon-com.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/linkedin.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/social.ts`
- `{PROJECT_ROOT}/lib/scraper/sources/universities.ts`

**Pipeline context:**
- `{PROJECT_ROOT}/lib/scraper/types.ts`
- `{PROJECT_ROOT}/lib/scraper/latam-filter.ts`
- `{PROJECT_ROOT}/lib/scraper/post-processor.ts`
- `{PROJECT_ROOT}/lib/scraper/deduplicator.ts`

## Step 2: Score Each Scraper

Score 0–10 on four dimensions. Use half-points (e.g. 7.5).

### Quantity (0–10) — Breadth of search surface

| Score | Meaning |
|-------|---------|
| 9–10 | 400+ search URLs or 15+ high-coverage queries. Covers all 24 LATAM countries. |
| 7–8  | 150–400 URLs or 10–15 queries. Covers 15+ countries. |
| 5–6  | 50–150 URLs or 8–12 queries. Covers major 6 LATAM markets. |
| 3–4  | 15–50 URLs or 5–8 queries. Patchy coverage. |
| 1–2  | Fewer than 15 URLs. Structural ceiling on recall. |

Consider: number of search terms, country coverage, pagination depth, temporal coverage.

### Quality (0–10) — Signal-to-noise ratio and data completeness

| Score | Meaning |
|-------|---------|
| 9–10 | Platform-curated events. Robust multi-tier noise filter. ISO dates, structured fields. |
| 7–8  | Multi-tier noise filter. Most results are genuine hackathons. Dates reliable. |
| 5–6  | Basic noise filter. ~20–35% estimated false positive rate. Dates often missing. |
| 3–4  | Thin or absent noise filter. High false positive rate. Key fields often null. |
| 1–2  | Mostly noise. Fragile extraction. Unreliable for production use. |

Consider: noise filter sophistication, platform curation level, field completeness at scrape time, date parsing reliability, within-scraper deduplication.

### Cost Efficiency (0–10) — Cost per useful event discovered

| Score | Meaning |
|-------|---------|
| 9–10 | Zero API cost. Native fetch only. |
| 7–8  | Minimal — low-cost LLM API (Perplexity/Exa basic) or small Firecrawl usage. |
| 5–6  | Moderate — one expensive LLM API or significant Firecrawl credits. |
| 3–4  | High — two LLM APIs chained, or Apify actor. |
| 1–2  | Very high — Apify + LLM, or very heavy Firecrawl. Poor ROI. |

### Uniqueness (0–10) — Events only this scraper would find

| Score | Meaning |
|-------|---------|
| 9–10 | Reaches an event population entirely absent from other scrapers. |
| 7–8  | 50–70% of events unique to this scraper. |
| 5–6  | 30–50% unique. Meaningful overlap with 1–2 scrapers. |
| 3–4  | 20–30% unique. Most events also found by another scraper. |
| 1–2  | Nearly complete subset of another scraper. Little additive value. |

### Overall Score

```
Overall = (Quantity × 0.3) + (Quality × 0.3) + (Cost × 0.2) + (Uniqueness × 0.2)
```

## Step 3: Estimate Confusion Matrix

For each scraper, estimate Precision, Recall, and F1.

**Start from platform base precision:**
- MLH, Devpost: curated platform → base 0.85
- Eventbrite, Meetup: self-published → base 0.65
- LLM-search scrapers (perplexity, haiku, hackathon-com): base 0.60
- Social/LinkedIn: base 0.40

**Adjust precision for noise filter quality:**
- Each tier of regex noise filtering: +0.05
- No noise filter at all: −0.10
- Hackathon keyword guard in the scraper itself: +0.05
- Scope limited to verified platform (MLH, Devpost): +0.05

**Estimate recall from query breadth:**
- Geo coverage: (countries_covered / 24) × 0.5
- Thematic coverage: (themes_covered / 8) × 0.3  (themes: AI, fintech, health, climate, civic, university, corporate, open-source)
- Platform coverage factor: is this the only scraper for this platform? (yes = 0.2, no = 0.1)
- Recall ≈ geo_factor + theme_factor + platform_factor

**Adjust recall for structural issues:**
- LLM scrapers with year-framed queries: −0.05 (hallucinated/stale events)
- Scrapers with documented silent failures: −0.05
- Deep pagination (4+ pages): +0.05
- Detail-page enrichment loop: +0.03

**Apply optimizer delta:**
If the optimizer agent reported a positive f1Delta, apply it proportionally — if the gain was primarily recall, adjust recall; if precision, adjust precision.

**F1 = 2PR/(P+R)** — verify this is mathematically consistent before writing.

## Step 4: Write SCRAPER_EVALUATION.md

Write the complete file to `{PROJECT_ROOT}/lib/scraper/SCRAPER_EVALUATION.md`. Structure:

---

### Header

```markdown
# Scraper Evaluation Report

**Date:** <today YYYY-MM-DD>
**Scope:** 11 hackathon scraper modules for LATAM discovery pipeline
**Evaluated by:** scraper-optimizer skill (automated static analysis + optimizer agent results)
**Previous evaluation:** <date from prior file, or "none">
```

### Executive Summary

Top 3 recommended scrapers (one paragraph each explaining why — be specific, cite numbers).
Note any scrapers recommended for deprecation or restructuring.

### Ranked Summary Table

```markdown
| Scraper | Quantity | Quality | Cost | Uniqueness | Overall |
|---------|----------|---------|------|------------|---------|
| devpost | 9        | 9       | 9    | 7          | **8.6** |
```

Order by Overall descending.

### Per-Scraper Detail

For each scraper:

```markdown
### <Name> (`sources/<file>.ts`)

**Quantity: X/10** — <2–4 sentences with specific evidence: query count, URL count, countries covered, pagination>

**Quality: X/10** — <noise filter tiers, platform curation level, field completeness, date reliability>

**Cost: X/10** — <paid APIs used, estimated cost per run>

**Uniqueness: X/10** — <what event population only this scraper reaches, overlap with others>

**Changes since last evaluation:**
<Bullet list of optimizer changes, or "No changes applied.">
```

### Confusion Matrix

```markdown
| Scraper | Recall | Precision | F1   | Δ vs Prior |
|---------|--------|-----------|------|-----------|
| devpost | 0.87   | 0.81      | 0.84 | +0.02     |
```

Include methodology note:
> Estimates from static code analysis, platform curation level, noise filter assessment, and optimizer agent reports. Requires live run comparison against a ground truth corpus for validation.

### Coverage Matrix

List which LATAM countries and thematic areas each scraper explicitly covers.
Use ✓✓ = multi-city coverage, ✓ = covered, ~ = incidental, ✗ = not covered.

### Recommendations

**Scrapers to improve next** — 3 scrapers with highest potential, specific suggested changes.
**Scrapers to deprioritize** — any that should be disabled/restructured, with rationale.
**Pipeline observations** — 3–5 systemic bullets (overlap patterns, cost concentration, coverage gaps, field population rates).

---

## Quality Standards

- Every score requires specific code evidence (mention actual variable names, array lengths, regex patterns)
- Do not copy scores from the previous evaluation without re-examining current source code — optimizers may have changed things
- F1 = 2PR/(P+R) — check this arithmetic for every row before writing
- Overall = 0.3Q + 0.3Ql + 0.2C + 0.2U — verify this too
