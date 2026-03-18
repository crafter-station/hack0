---
name: scraper-optimizer
description: Optimizes LATAM hackathon discovery scrapers for the hack0.dev project. Reads every scraper in lib/scraper/sources/, launches one optimizer subagent per scraper in parallel (each iterates 2-3 times with self-scored F1 improvements and edits the file directly), then runs an evaluator that scores all scrapers on Quantity/Quality/Cost/Uniqueness and estimates a confusion matrix, writing the result to SCRAPER_EVALUATION.md. Use this skill whenever the user wants to improve scraper coverage, reduce false positives, add geographic or thematic queries, tune the discovery pipeline, rank scrapers, update SCRAPER_EVALUATION.md, or says anything like "optimize scrapers", "scraper quality", "scraper evaluation", "mejorar scrapers", or "falsos positivos en los scrapers". Trigger even if they only mention one scraper by name.
---

# scraper-optimizer

Orchestrates a multi-agent pipeline to continuously improve the hack0.dev scraper fleet. Each scraper gets its own optimizer that reads the source, proposes changes, self-scores the impact, and applies improvements directly. An evaluator then reads all scrapers in their updated state and produces a ranked report.

## Usage

```
/scraper-optimizer                  # optimize all scrapers + evaluate
/scraper-optimizer devpost          # optimize only one scraper, then evaluate
/scraper-optimizer --eval-only      # skip optimizers, just score current state
```

## Phase 0: Orient

Before spawning any agents, read these files to build context:

1. `lib/scraper/sources/` — list all `.ts` files; each filename = one scraper
2. `lib/scraper/types.ts` — RawHackathon interface and SourceType enum
3. `lib/scraper/latam-filter.ts` — scoreLATAM() thresholds (≥80 fast-keep, <25 fast-drop, 25–79 → LLM)
4. `lib/scraper/post-processor.ts` — pipeline: filterFuture → llmEnrichRaw → classifyLatamHybrid
5. `lib/scraper/SCRAPER_EVALUATION.md` — existing baseline scores (if it exists)

Note the absolute path to the project root (`pwd`) — you'll pass it to every agent.

## Phase 0.5: Run Scrapers — Get Real Output First

**Never optimize based on code reading alone. Always run first, then improve based on real results.**

For each scraper (or the one named by the user), execute it and capture real output before any optimizer agent touches the code.

### How to run each scraper

```bash
cd <PROJECT_ROOT> && bun -e "
import { scrape<Name> } from './lib/scraper/sources/<name>';
const results = await scrape<Name>();
console.log(JSON.stringify({ count: results.length, sample: results.slice(0, 10) }, null, 2));
" 2>&1 | head -200
```

Replace `<Name>` with the PascalCase export (e.g. `scrapeDevpost`, `scrapeEventbrite`, `scrapeMeetup`).

### Cost tiers — what to run

| Tier | Scrapers | Run policy |
|------|----------|------------|
| Free | devpost, eventbrite, mlh, meetup | Always run in full |
| Paid (Firecrawl) | universities | Run with reduced limit: first 5 URLs only |
| Paid (API/LLM) | perplexity, haiku, hackathon-com, exa | Run first 3 queries only (`slice(0, 3)` on the query array) |

For paid scrapers, temporarily monkey-patch the query list before running:
```bash
bun -e "
// Override query list to only run first 3
process.env.SCRAPER_SAMPLE_MODE = '3';
const { scrapePerplexity } = await import('./lib/scraper/sources/perplexity');
// ... etc
"
```
If the scraper doesn't support sampling, skip running it and note `RUN_OUTPUT: skipped (cost)`.

### What to capture per scraper

For each run, save:
```json
{
  "scraper": "devpost",
  "ranAt": "2026-03-10T...",
  "rawCount": 47,
  "sample": [ /* first 10 RawHackathon objects */ ],
  "falsePositiveExamples": [ /* events that clearly aren't hackathons or aren't LATAM */ ],
  "missingFields": { "country": 12, "startDate": 8, "city": 20 },
  "errors": [ /* any errors thrown */ ]
}
```

Identify false positives manually by scanning the sample: events without hackathon keywords, news article URLs, past events, non-LATAM events with no LATAM connection.

Write all run outputs to `/tmp/scraper-run-<timestamp>.json` for reference.

### Skip this phase if

- `--eval-only` was requested
- The scraper has no `scrape*()` export (e.g. websearch.ts — it's a skill, not a function)
- Running would take >5 minutes (universities full run) — use sample mode instead

## Phase 1: Parallel Optimizer Agents

Read `agents/optimizer.md` first. Then for each scraper (or the one named by the user), spawn one optimizer agent. Launch all in the same message — parallelism is the point.

Each agent prompt should be self-contained. Include:
- The full text of `agents/optimizer.md`
- The specific inputs:
  ```
  SCRAPER_NAME: <name>
  SCRAPER_PATH: <project_root>/lib/scraper/sources/<name>.ts
  PROJECT_ROOT: <project_root>
  ```
- A reminder of the anti-bias rules (see below)

The agent will read the scraper, iterate improvements, and write changes directly to the file. It will output a JSON summary block.

Skip this phase if `--eval-only` was requested.

## Phase 2: Evaluator Agent

After all optimizer agents finish (or immediately for `--eval-only`), read `agents/evaluator.md`. Spawn one evaluator agent whose prompt includes:
- The full text of `agents/evaluator.md`
- All optimizer JSON summaries collected in Phase 1 (paste them in)
- `PROJECT_ROOT`: absolute path to project root

The evaluator reads all scrapers in their current state and writes `lib/scraper/SCRAPER_EVALUATION.md`.

## Phase 3: Report

Print a consolidated summary:

```
## scraper-optimizer Results

### Optimizer Summary
| Scraper     | Iterations | Before | After | +Valid | -FP | -Valid | Key changes |
|-------------|-----------|--------|-------|--------|-----|--------|-------------|
| devpost     | 3         | 47     | 53    | +8     | -3  | -1     | +6 Bolivian city queries |
| mlh         | 1         | 22     | 22    | 0      | 0   | 0      | No improvements found |

### Evaluation Report
Written to: lib/scraper/SCRAPER_EVALUATION.md
Top scorer: devpost (8.6/10)
Most improved: <scraper>

### Architecture Observations
<3–5 bullets from evaluator>
```

---

## Anti-Bias Rules

These exist because the goal is to discover future hackathons that don't exist yet — events that haven't been announced, indexed, or named. Searching for a specific event name only finds events whose organizers already chose that exact name. Searching by characteristics (geography, themes, organizer types) finds both existing events and new ones we couldn't have predicted.

Include these in every optimizer agent prompt:

1. **Never add queries for specific event names.** No "HackMIT", "ETHDenver", "NASA Space Apps", "ICPC", "Hack the North". Only search by characteristics: geography, themes, organizer types, event formats.
2. **Never hard-code future years.** Use dynamic variables already present in the scraper (e.g. `getYearRange()`, `CURRENT_YEAR`, template literals with `new Date().getFullYear()`).
3. **Never remove existing geographic coverage** without replacing it with equivalent or broader coverage.
4. **Never increase total API call count by more than 50%** without documenting why it's worth the cost.
5. **Never add English-only queries** to scrapers whose existing queries are in Spanish/Portuguese — always add bilingual pairs.

---

## Scraper Type Reference

Optimizer agents must classify the scraper before proposing changes — different types have very different levers:

| Type | Scrapers | Optimization focus |
|------|----------|-------------------|
| A: Structured data | devpost, eventbrite, mlh, meetup, universities | Query/URL coverage, geographic breadth, noise filter regex |
| B: LLM-search | perplexity, haiku, hackathon-com | Conservative — each query costs API money; quality over quantity |
| C: Semantic | exa | Domain filters, query theme diversity |
| D: Social/API | social, linkedin | Noise reduction and signal quality, not query expansion |

---

## Agent Files

Read before spawning agents, and include full content verbatim in each agent's prompt:

- `agents/optimizer.md` — per-scraper self-improvement loop
- `agents/evaluator.md` — post-optimization scoring and ranking
