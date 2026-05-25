# hack0 Brand

Status: v0.2, based on the green block-zero direction.

hack0 is a LATAM builder index for tech events, hackathons, communities, and ecosystem signals. The brand should feel technical, active, sharp, and useful. It should look like something builders would trust, organizers would share, and sponsors would recognize.

The identity is built around one shape: a squared broken `0` with an acid-green active cell.

## Brand Idea

**Active Cell**

The `0` in `hack0` is not a normal zero. It is a blocky, broken-ring form that feels like:

- an active terminal cell
- a compiled UI primitive
- an event slot
- a map/index marker
- a live builder signal

The green segment is the active part of the system. It should feel alive, not decorative.

## Personality

hack0 is:

- Technical.
- Fast to parse.
- Builder-native.
- Useful before pretty.
- Slightly experimental.
- LATAM-aware without using obvious flags or clichés.

hack0 is not:

- Generic SaaS.
- Racing or sports branding.
- Cyberpunk.
- v0-style prompt branding.
- A soft community logo.
- A black-and-white utility with no brand signal.

## Logo System

Canonical SVG assets:

- Wordmark: `public/brand/svg/hack0-wordmark.svg`
- Logo: `public/brand/svg/hack0-logo.svg`

Both SVGs are theme-aware:

- Light mode foreground: `#050605`
- Dark mode foreground: `#F3F1E8`
- Green active segment: `#22FF66`
- Background: transparent

Use the same files on light and dark surfaces. The SVGs switch foreground color with `prefers-color-scheme` while keeping the green fixed. If the SVG is inlined in React, override `--hack0-logo-fg` and `--hack0-logo-green` from CSS for app-controlled themes.

## Logo Variants

### Wordmark

Use for headers, landing pages, decks, press, sponsor assets, and places where the brand needs to be readable.

Rules:

- Text is always lowercase: `hack0`.
- The final character is numeric `0`, not letter `O`.
- The `0` uses the block-zero logo.
- Do not replace the `0` with a circular glyph.
- Do not add a prompt arrow before the wordmark.

### Logo

Use for favicon, social avatar, app icon, event badge, map pin, QR poster corners, and small sponsor lists.

Rules:

- Use the block-zero alone.
- Keep the green segment on the top/right side.
- Preserve the diagonal chamfer on the green segment.
- Preserve the open center.
- Do not rotate it.
- Do not round the corners.

## Block-Zero Construction

The logo is a squared broken `0`:

- Thick left vertical segment.
- Thick bottom segment.
- Short lower-right vertical segment.
- Open center negative space.
- Bright green top/right segment.
- Diagonal chamfer at the green segment's top-left corner.

The logo should feel like a live cell in an index, not a loop, infinity symbol, map track, or racing shape.

## Color

Core palette:

| Token | HEX | Use |
| --- | --- | --- |
| `hack0-black` | `#050605` | Light-mode logo foreground, dark surfaces, dense UI |
| `hack0-paper` | `#F3F1E8` | Warm light background, editorial surfaces |
| `hack0-green` | `#22FF66` | Active cell, logo signal, live states |
| `hack0-forest` | `#063B26` | Deep green surfaces, subdued panels |
| `hack0-grid` | `#7FBF9A` | Map/grid/data support lines |
| `hack0-muted` | `#A1A1AA` | Secondary text, metadata |

Color hierarchy:

- Black and paper are the base.
- Green is the signature.
- Forest green supports dark branded surfaces.
- Muted grid green is for maps, data, and secondary system details.

Avoid making the whole product neon green. Green should be high-signal and intentional.

Suggested CSS variables:

```css
:root {
  --hack0-black: #050605;
  --hack0-paper: #f3f1e8;
  --hack0-green: #22ff66;
  --hack0-forest: #063b26;
  --hack0-grid: #7fbf9a;
  --hack0-muted: #a1a1aa;
}
```

## Usage Modes

### Light

Use for product surfaces, tables, directories, event lists, forms, docs, and long reading.

- Background: `hack0-paper` or white.
- Text: `hack0-black`.
- Logo: theme-aware SVG, foreground resolves to black.
- Accent: `hack0-green` for active or branded moments.

### Dark

Use for hero sections, social cards, event posters, sponsor slides, badge previews, and brand portal moments.

- Background: `hack0-black`.
- Text: `hack0-paper`.
- Logo: theme-aware SVG, foreground resolves to paper.
- Accent: `hack0-green`.

Dark mode should feel like a builder control surface, not terminal cosplay.

## Typography

Product:

- Geist Sans for UI.
- Geist Mono for event IDs, slugs, timestamps, and technical metadata.

Brand:

- Angular geometric lowercase wordmark.
- Sharp cuts and squared terminals.
- No monospace wordmark.
- No rounded SaaS type.

Naming:

- Use `hack0`.
- Use `hack0.dev` when the domain matters.
- Avoid `Hack0` unless a sentence absolutely requires capitalization.

## Graphic Language

Reusable motifs:

- Active green cell.
- Squared index blocks.
- Tiny event grid cells.
- Map/data dots.
- Packet labels.
- Compact stamps.
- Angular cuts.

Avoid:

- Prompt arrows as the main logo idea.
- Circular zeros.
- Infinity/open-loop shapes.
- Racing tracks.
- Lightning bolts.
- Neon cyberpunk glow.
- Generic circuit boards.
- Mascots.

## Product UI Direction

The current product can keep its utilitarian density, but the brand should appear at key recall points:

- Header logo should use `hack0-wordmark.svg`.
- Favicon should use `hack0-logo.svg`.
- Social avatar should use `hack0-logo.svg`.
- OG cards should use dark background, paper text, green logo.
- Live states can use `hack0-green`.
- Event maps can use muted green grid/data accents.
- Avoid violet as the default brand accent.

Current app application:

- Header uses the React wordmark component.
- Favicon uses the standalone block-zero SVG.
- Landing hero uses the wordmark plus the LATAM dot-map component.
- OG cards use the dark Active Cell system.
- Auth screens, footer, email templates, and key status surfaces use the brand palette.

Event status mapping:

- Live/open: `hack0-green`.
- Upcoming/imported/data: muted grid green or cyan only if needed.
- Sponsored/featured/prize: amber can exist as product information, not brand identity.
- Errors: use product error red, not brand green.

## Asset Exports

Current masters:

```txt
public/brand/svg/hack0-wordmark.svg
public/brand/svg/hack0-logo.svg
```

Recommended next exports:

```txt
public/brand/png/hack0-wordmark-light.png
public/brand/png/hack0-wordmark-dark.png
public/brand/png/hack0-logo-light.png
public/brand/png/hack0-logo-dark.png
public/brand/png/hack0-social-1200x630.png
public/favicon.svg
public/apple-touch-icon.png
```

## Brand Portal Draft

`brand.hack0.dev` should become a practical asset portal.

Suggested sections:

1. Overview
2. Logo
3. Color
4. Typography
5. UI examples
6. Event poster examples
7. Social assets
8. Downloads
9. Usage rules

The portal should help contributors, organizers, and sponsors use the brand correctly without asking for Figma access.

## Do

- Use the block-zero consistently.
- Keep the green very visible.
- Use dark surfaces when the brand needs presence.
- Use warm paper surfaces when readability matters.
- Keep layouts sharp, dense, and scannable.
- Make the product feel like an active index.

## Do Not

- Use circular zeros.
- Use prompt arrows as the primary symbol.
- Add glow to the logo.
- Round the block-zero.
- Rotate the logo.
- Make everything green.
- Make it look like racing, sports drink, Meta, or cyberpunk.

## Open Decisions

- Whether to build `brand.hack0.dev` inside this app or as a tiny standalone site.
- Whether `brand.md` becomes the template for other Crafter Station project brand kits.
