# Taste hacking: design log

Run of the `award-site` skill on `/taste-hacking`, 2026-11-15. Constraint: the workshop is on 2026-11-19, so the page had about one day. That bounds the run to one idea, five chapters, native scroll and no asset pipeline. The skill itself says not to use it with under two weeks; what was cut for that is listed at the end.

Brief from the owner: the previous page read like a restatement of the promo video and still felt overscaled. The looping before/after clips stay. The page teaches taste, so it has to be the proof.

## 1. The idea

**The site IS a workbench. The workshop's own ticket sits on a plate with one switch per layer, and the prompt next to it rewrites itself with the words for whatever is on.**

Turning a layer off hands that layer back to "hazlo bonito", so the visitor sees the thesis instead of reading it: a layer you name is a layer you can ask for. The ticket is the page's real Luma CTA, so the specimen is the product.

Killed:

1. **A scanner that corrects a slop version of the page as you scroll.** It is the promo video again, in a browser. That is the exact complaint about the previous page.
2. **An exploded view where scroll separates the page into three physical layers.** Also shot 3 of the promo, and it needs a pinned scrubbed scene that a day does not pay for.
3. **A dictionary where each word demonstrates itself.** Good content, wrong hero: 20 small demos have no single object, nothing to buy from, and the nearest reference (Emil Kowalski's vocabulary) already owns the form. The glossary survives as chapter 2.
4. **A terminal session where the page is typed as a prompt.** A terminal cliché, slow to read, and it hides the gallery the owner likes.
5. **A catalogue only, with the gallery as the hero.** Five pieces today is too few to carry a first frame, and a grid of videos is the same proof the promo already gives.

Archetype: **product demo of itself** (set: Lenis, Anime.js), in an editorial rail layout.

Hero object: the ticket on its plate. It belongs to this workshop only: its date, its price, its Luma link.

Chain: the plate with three switches (hero) → the three switches become the three glossary columns (capas) → the layer tags label every piece in the catalogue, each on the same kind of plate, with an empty plate for the ones still coming (galería) → the tags label the three live cases inside the agenda (workshop) → the ticket comes back, assembled, on its plate (cierre).

## 2. Art direction

One sentence no goldenset site fits: *a black cutting mat where one paper ticket is the only lit object, everything else is hairlines and 13px mono, and the single orange belongs to whatever is switched on.*

- Type: JetBrains Mono only (the brand's decided font). Scale 11 / 13 / 15 / 17 / 20, h2 24-30, h1 38-58. The previous hero was 104px; nothing here passes 58. Density carries it: a 12-column rail layout, a 20-word glossary, a readout.
- Second voice: Arial, and only inside the unnamed ticket. The slop state is the second typeface.
- Colour: `#111110` stage, `#f3f0e8` ink and paper, `#ff3d00` accent. Orange marks state (a switch that is on, the scan, the probes) and the ticket's bar. The purple gradient exists only in the unnamed ticket and inside the "antes" half of the clips.
- Motion tokens in `tokens.css`: one easing family (`--ease-out`, `--ease-inout`), `--d-press` 150 ms, `--d-hover` 200 ms, `--d-reveal` 600 ms, `--d-stagger` 40 ms. The literals `ease-in`, `transition: all` and the pulse in the stylesheet are the specimen of bad motion, commented as such.
- Restraint: body copy never animates. No scroll-linked motion. What moves: the ticket's entrance (once, and on each switch), the scan line that covers the swap, the word bench when a control is used, the clips.
- Dropped from the brand inputs: the cobe globe. It competed with the plate for the focal point and it is already inside every clip.

Signature moments (a third came in round 4: the word bench, below):
1. Flipping a layer: the scan crosses the plate, the ticket re-enters in its new state, the prompt gains or loses the words.
2. The inspector: numbered probes on the ticket and a readout of `getComputedStyle`, so "cómo está hecho" shows the values the browser is using at that moment. The readout cannot disagree with the piece.

Diegetic metadata: the third glossary column lists what this page is made of. The clip weight is read from disk at build time.

## 3. Scroll model

Native. The page is content-heavy and has no scrubbed scene, so Lenis and GSAP would add weight with nothing to sync. Reduced motion: entrances, scan and figure stop, clips show their poster with controls, and a line says the motion layer is paused. Mobile branch: none needed (no canvas); the layout reorders so the switches sit above the plate, and the catalogue becomes a snap rail.

## 4. Stack

No new dependency. `cobe` is no longer imported by this route. Plain CSS, one client component (`bench.tsx`), the clips' existing `clip.tsx`.

## 5. The loop

Stills at 1440x900 and 390x844, compared against the Anime.js and Lenis contact sheets (same archetype). What the comparison gave: Anime.js keeps one object and labels its parts with leader lines at a small headline size, which is the principle behind the plate and its probes. Lenis puts its showcase in a horizontal strip, which the mobile catalogue borrows.

Scores are Design / Usability / Creativity / Content.

| Round | Hero | Capas | Galería | Workshop | Cierre | Change |
|---|---|---|---|---|---|---|
| 1 | 7 / 7 / 8 / 7.5 | 6.5 / 7 / 6.5 / 8 | 7 / 7 / 7 / 7 | 7 / 7.5 / 7 / 7.5 | 6.5 / 7.5 / 7 / 7 | First build. Biggest gap: too many orange marks in the hero (9 underlines, 5 numbers), so "one accent" was false |
| 2 | 8 / 8 / 8 / 8 | 7.5 / 8 / 7 / 8.5 | 7.5 / 7.5 / 7 / 7.5 | 7.5 / 8 / 7 / 8 | 7.5 / 8 / 7 / 7 | Accent only on state. Also outside the budget: figures on a shared subgrid, closing mirrors the hero's 5/7 split |
| Juror | 6 / 5 / 7 / 5 overall, 5.8 weighted | | | | | See below |
| 3 | 8 / 7.5 / 8 / 8 | 7 / 7.5 / 6.5 / 8 | 7.5 / 7 / 7 / 7 | 7.5 / 8 / 7 / 7.5 | 7.5 / 8 / 7 / 7 | Juror fixes. Rescored lower where an objection survived |
| 4 | 8 / 7.5 / 8 / 8 | 8 / 8 / 7.5 / 8.5 | 7.5 / 7 / 7 / 7 | 7.5 / 8 / 7 / 7.5 | 7.5 / 8 / 7 / 7 | Owner review. The word bench in Capas, a quieter slop ticket, the early bird price. See round 4 |

Open gap after round 3: **Capas, Creativity 6.5.** The bench stops after the hero and the glossary is a list. The next single change would be to make three words operable (tracking, easing, stagger) on the same plate. Closed in round 4 on the owner's call.

Layout bugs fixed outside the rounds: the CTA's press transition was overridden by the link rule (`.th a` beat `.th-cta`, so the inspector read `text-decoration-color`); the unnamed ticket was taller than the stage; the time row wrapped mid-city.

### Round 4: owner review

The owner approved the page and asked for three changes.

1. **Early bird.** Luma sells an early bird ticket at US$15 next to the general US$20. It sits in the ticket's price row in the muted weight, so the row still reads US$20 first. The home banner still shows US$20 only.
2. **Slop ticket, turned down.** Two versions were shot side by side with the old one. *Subtle* (grey-violet gradient, no emoji, a flat translucent button, 16px glow) stopped reading as slop: it looks like a decent glass card. *Medium* shipped: the same three-stop purple gradient at lower saturation, one sparkle on the button and no rocket, the glow cut from 48px to 28px, the pop from `scale(0.4)` without the spin, the pulse at 1.022. It still has all four tells (purple gradient, Arial, pill button with an emoji, ease-in pop and a pulse that never stops).
3. **The word bench.** A second plate, numbered 01 after the hero's 00, opens chapter 1 with three stations. The glossary words tracking, easing and stagger carry the station's probe number and link to it.
   - *tracking*: a slider from -0.10em to 0.10em on the word "Taste" between its cap-height and baseline hairlines. Prints `letter-spacing: -0.05em`.
   - *easing*: four curves (ease-in, linear, ease-out, spring). A dot crosses a track to a tick at 84% so the spring's overshoot has room to show, and a marker rides the plotted curve at the same time. Prints the `cubic-bezier(...)` and its duration, or the spring's stiffness and damping. The spring is simulated (stiffness 170, damping 14, mass 1) and its frames feed both the plot and the animation, so the drawing and the motion cannot disagree.
   - *stagger*: a slider from 0 to 200 ms over five rows. Prints the step and the total.

   The static tracking and easing figures in the glossary columns became the stations. "Esta página, por debajo" moved under the third column's shorter list, which evens the three columns.

Checks. Heights: every value of every control was swept at 1440, 1000, 760 and 390 px and the stations, the plate and the document height did not change. At 1000 to 1239 px the printed value wraps, so two lines are reserved there. Keyboard: native range inputs and radios, arrows change the value, Tab reaches each "probar". Reduced motion: changing a value never starts a demo, only "probar" does, and the plate says so. Motion runs through the Web Animations API, so nothing loops and nothing autoplays.

Juror objection 5 (the bench dies after the hero) is answered by the second plate. Not re-run through the juror.

### Seams

`scripts/seams.sh` at 1440x900 and 390x844, 24 frames each. No scroll-linked motion, so permanence is about layout: the section rail stays pinned beside its content on desktop, the ticket leaves in chapter 1 and lands again in chapter 5, no overlap or clipping in either sheet. The montage step printed a font error and still wrote the sheet.

### Anti-clone

Closest three in the set: Anime.js (dark, mono labels, one object with callouts), Linear (dark, dense, hairlines), Rauno (interface craft as the subject). A still of the hero shows a paper ticket with a date and a price on a dotted mat, with three switches. None of the three has a ticket, a paper object, or a slop state, so the 5-second test passes.

### Adversarial juror

Run on a different model (gpt-6.1-sol through fx), read-only, with the code, the stills and both seams sheets. Weighted 5.8.

| # | Objection | Result |
|---|---|---|
| 1 | On mobile the switches came after the ticket and four empty readout rows | Fixed. Switches sit above the plate as one compact row, the readout is hidden until the inspector is on, the CTA still lands in the first viewport (bottom at 803 of 844) |
| 2 | The third switch does not behave like the other two, and "uno por capa" was false of the agenda | Partly. The switch now says it opens the inspector, and the claim is gone. It still is a different kind of control |
| 3 | No element carried probe 3, and the probes stole the `::after` of the slop emoji, so inspecting changed the look | Fixed. Probe 3 is the rows, the emoji moved to `::before` |
| 4 | The prompt promised staggered rows and "tracking apretado"; the stagger ran on the ticket's children and the value was vague | Fixed. The three rows stagger, the readout computes the step from their delays, the prompt says -0.06em |
| 5 | The bench dies after the hero; chapter 2 is documentation | Fixed in round 4: the word bench |
| 6 | The catalogue is videos, with no controls, prompt or provenance; the mobile rail has no affordance | Partly. A "desliza" line on mobile. Each plate has the slot for the session replay and the original, both empty until the sessions exist |
| 7 | Loops cannot be paused outside reduced motion | Stands. Clips play only while on screen; the pulse is the specimen |
| 8 | "premium", "viral" and "lo hice en una noche" are the fog the workshop argues against, and prerequisites are missing | Stands. That wording is the Luma listing's; changing the promise is the owner's call |

## Cut for time

- `cast.mjs` recordings and `measure.mjs` traces. There is no scrubbed motion to measure; the build and a production run stand in.
- A designed 404, sound, a loader, a case study page.
- A hand-made input (photo, drawn type). The only hand-made assets are the clips.
- Step 7 of the skill (run file and FRICTION entries in the skill repo).

## Material page: density pass (2026-11-15)

Owner review of `/taste-hacking/material`: too much empty space, code blocks glued to the prose with no highlighting, and sessions that needed a click before showing anything.

1. **Density.** The rail layout is gone on this page: each section is a hairline, a one-line head (index, title, lead) and content at the full 1200px. Spacing comes from four values (`--m-sec`, `--m-head`, `--m-card`, `--m-h1`). Three settings were shot side by side at 1440: *conservative* (64 / 24 / 44, h1 at the public scale), *medium* (44 / 18 / 30, h1 32-44) and *aggressive* (26 / 12 / 18, h1 28, sessions two per row). Medium shipped. Aggressive is the shortest page, but two terminals per row put the text near 8px, which is a thumbnail and not something to watch inline.
2. **Code.** `code.tsx`: commands on a plate, one row each, an optional label chip, a copy button per command (native button, "copiado" announced through `aria-live`). `lib/shell-tokens.ts` splits a command into prompt, runner, package, subcommand, flag, placeholder, email, path and argument. The package takes the accent; a placeholder is italic with a dashed underline, because it is the part the reader fills in. The `$` is generated content, so selecting a row never copies it.
3. **Sessions.** Each one is an open card: number, title, layer, reference and length in the head, the terminal on the left and the piece it produced on the right, so the session and its result read together. A card loads when it nears the viewport and shows a still until it is played. Play, pause and speed are native buttons in a bar above the terminal. On mobile the result drops under the terminal as a small clip beside its text.
4. A row of anchors under the title jumps to the four sections. The gallery runs five across at desktop width.

Checks at 1440x900 and 390x844: no horizontal scroll; signed out, nothing is requested from the sessions route and the route answers 401; signed in, a session is requested only when its card nears the viewport; copy and play work from the keyboard (Tab, Enter, Space); with reduced motion nothing plays on its own and the new transitions are off.

## Material page: breathing pass (2026-11-15)

Owner review of the density pass: too dense now, and it repeats itself. A section had an index label ("02 · las sesiones"), a title ("Sesiones") and a chip at the top saying the same thing. Reference for the feel: emilkowal.ski and animations.dev. The principles were measured and then written in this page's language (dark, mono, one accent); nothing was copied.

### Measured

| | emilkowal.ski | animations.dev |
|---|---|---|
| Reading column | 692px box, 644px of text | 732px box, 700px of text |
| Body | 16px / 26.4px (1.65), gray on near-white | 18px / 28.8px (1.6) |
| Section title | 16px, weight 500: the size of the body, set apart by ink only | 26px / 32px, weight 500 |
| Space above a section | about 130 to 150px | 80 to 200px |
| Title to content | about 50px | 16 to 28px |
| Between items | about 28px | 24px |
| Elements with a border | 1 of 119 | |

What carries over: one column near 680px, titles close to body size, a body line-height of 1.65, and three to five times more space between sections than inside them. Borders are the exception.

### Decisions

1. **One title per section.** The index labels are gone. Section numbers live in one place, the contents nav, because that is where order is useful: it says where you are out of four. The chip row is gone with them.
2. **Contents nav.** A rail beside the column on wide screens and a bar pinned to the top under 1100px. It marks the section in view with the accent, lists the sessions with how far each was watched (not started, started, finished; kept on the device), and `j` / `k` step through the sessions. A restyled chip row was the alternative; it would still have been a second copy of the titles with nothing of its own to say.
3. **The pass.** The header is the workshop ticket again, in paper: who it belongs to, what it opened (skill, sessions, recording, gallery) and one action, install the skill. It replaces "Entraste como…".
4. **Sessions.** One per row: a quiet line (number, title, layer, length), the terminal at the full width of the wide grid, and the piece it produced as a small clip with one sentence under it. A session opens where it was left. The live cases follow as the same line set back, with the day they arrive.
5. **Recording, before there is one.** A plate with how long until the workshop (counted in calendar days on the server), the date in both time zones, what it will contain, a link to the event and a way back to the sessions.
6. **Gallery, here and on the public page.** The clip and one line (title, layer). Before, after and reference sit behind a native disclosure, one open at a time, so nothing is hover-only. Three across on desktop. Pieces without a session no longer carry a line saying so.
7. **Fewer boxes.** Code plates, the copy button, the player bar and its buttons lost their borders; sections lost their hairline.

### Three settings, shot side by side

| | Column | Between sections | Between sessions | Sessions | Nav |
|---|---|---|---|---|---|
| Conservative | 720 | 88 | 48 | terminal with the result beside it, at 1200 | bar on every width |
| Medium | 680 | 136 | 72 | terminal across the 944 grid, result under it | rail + bar |
| Aggressive | 640 | 184 | 112 | everything inside the column | rail + bar |

Medium shipped. Conservative still reads as the dense page with more margin, and its side column brings back a second thing to look at per session. Aggressive is the calmest still, but a terminal inside a 640px column renders at 8.7px, against 12.8px on the wide grid: the session stops being readable in place, which is the one thing this page is for.

Checks at 1440x900 and 390x844: no horizontal scroll on either page; signed out, the sessions route is not requested and answers 401; `j` / `k`, play, copy and the gallery disclosure work from the keyboard; with reduced motion nothing plays on its own, the nav and disclosure transitions are off and `j` / `k` jump without smooth scrolling.
