---
name: taste-hacking
version: 0.2.0
description: "Take apart something seen online (an animation, a landing page, a reel, a brand) and rebuild it in your own stack. Use when the user pastes a URL, video or tweet and says 'I want this', 'how did they make this', 'copy this style', 'make it like this' or 'reverse engineer'. Captures the original, names it with precise vocabulary, rebuilds it, and compares against the original until they match."
---

# taste-hacking

Anything you see online has three layers: how it looks, how it moves and how it is built. Once you can name each layer, you can ask an agent for it. Without the words, you end up asking for "nicer" five times.

Work through four phases in order. Phase 4 is the one people skip, and it is where "close enough" becomes "the same."

## Phase 1: capture

Pick the tool that looks at the thing itself.

**Video or animation** (tweet, reel, mp4):

```bash
yt-dlp -o original.mp4 "<url>"
# contact sheet: the whole video as a grid of frames
ffmpeg -i original.mp4 -vf "fps=6,scale=360:-1,tile=6x5" -frames:v 1 sheet.png
# for an animation under 1s, raise fps and trim to that stretch
ffmpeg -ss 00:00:02 -t 1 -i original.mp4 -vf "fps=30,scale=360:-1,tile=6x5" -frames:v 1 sheet-zoom.png
```

Open `sheet.png` and look at it. Count frames between states to estimate duration, check for overshoot, and see whether elements enter together or staggered.

**Web page or component:**

```bash
agent-browser open "<url>"
agent-browser screenshot original.png
agent-browser snapshot                       # accessibility tree with refs
agent-browser get styles "<selector>"        # real computed styles
agent-browser eval "[...document.scripts].map(s => s.src).filter(Boolean)"
```

Take exact values (sizes, colors, tracking, shadows, transition timing) from computed styles, never from the screenshot. The screenshot is for Phase 4.

**Brand** (a whole site): palette, typefaces, radii and copy voice. Capture three different pages before deciding what is system and what is exception.

Stay away from anything behind a login and from services whose terms forbid it. Use this to learn and create, and do not publish someone else's product as yours.

Done when the contact sheet or screenshot and the measured values are saved to files.

## Phase 2: name

Sort what you captured into the three layers, using the words in `vocabulary.md`. The output is a short paragraph with values:

> Motion: cards enter on a spring (no visible bounce, about 400ms), staggered 40ms top to bottom, fading from 0 to 1. Look: Geist 14/20 with -0.01em tracking, 12-column grid, two-layer shadows. Built with: Next.js and Motion (found in the bundles).

If you cannot name something, say so ("there is an edge effect I can't name"). Show the user the exact frame and find the word together. Never invent a term.

Done when every layer has at least one sentence with values and the user agrees with the description.

## Phase 3: rebuild

Build in the user's stack, not the original's. Start with the layer that defines the experience, which is usually motion for animations and look for landing pages. Use the measured values.

## Phase 4: compare

Capture your result with the same tool you used on the original, then put them side by side:

```bash
ffmpeg -i mine.mp4 -vf "fps=6,scale=360:-1,tile=6x5" -frames:v 1 sheet-mine.png
ffmpeg -i sheet.png -i sheet-mine.png -filter_complex vstack comparison.png
```

Look at it. Write down each difference in vocabulary terms ("mine has no overshoot", "the original's tracking is tighter") and fix it. Repeat until every remaining difference is a choice you made.

When the user asks for a visual tweak, offer a conservative, a medium and an aggressive option at once instead of moving one value at a time.

Done when the comparison is saved and no difference is left unexplained.

## Make it yours

An exact copy is the exercise. Finish by proposing one change that makes it yours, such as a new palette, a different rhythm or another context. Copy to learn, then change it to create.
