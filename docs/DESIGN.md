# Design

The chat is the product. The web app is a judge's window into a recorded call, a verifier and a landing page.

## Mark and wordmark

A brass bollard with a hawser in a figure-eight, drawn as one continuous stroke (SVG, `Bollard`). Wordmark HAWSER in the display serif, tracked +2%.

## Colour tokens (light, magazine lustre)

| Token | Value | Use |
|---|---|---|
| `--paper` | #F5F0E6 | page ground, with two radial gradients (pearl top left, warm brass bottom right) and a 2% grain |
| `--ink` | #0F1C2E | all text |
| `--brass` | #A8834A | hairlines, ornaments, large numerals only |
| `--brass-ink` | #6B5028 | brass used for small text, so it passes contrast |
| `--signal` | #FF5B1F | International Code flag orange: one accent per view, primary buttons and REVIEW. Text on it is `--ink`, never white |
| `--radar` | #22D3E6 | live state, hover glow, focus rings. Never body text |
| `--slate` | #5B6371 | NOT OBSERVED, secondary text |

Verdicts: OBSERVED ink with a brass tick, REVIEW signal, NOT OBSERVED slate dashed. A dark theme exists for the desk page (navy #0B1524 ground, ivory text). The landing page stays light.

Brass and slate have a second, darker value for small text because #A8834A on the paper is about 3 to 1. This is the only deviation from the original palette, made for the accessibility check.

## Fonts (self-hosted through fontsource, no request to Google at build or run time)

Display serif Newsreader (variable, italic for emphasis words). Sans Schibsted Grotesk (body and interface). Mono Geist Mono (times, digests, sequence numbers). Never Inter, Roboto, Arial or system defaults.

## Type scale

14, 16, 20, 28, 40, 64, 96 px. Hero 96 desktop and 52 mobile, line height 0.95, tracking -2%.

## Ornament

Brass hairlines, small tracked uppercase labels (`PORT CALL 014`), oldstyle numerals in display text, tabular numerals in data, nautical chart grid lines at 4% opacity behind data.

## Motion

One signature motion: the hawser line draws itself from the ship to the bollard when the hero loads (stroke-dashoffset, 1.6 s), then rests. Everywhere else, motion only explains state: cards slide in, a divergence pulses once, signatures stamp in. `prefers-reduced-motion` turns every one of these off.

## Hero

A generated photograph (bulk carrier at anchor at sunset, seen from the bridge wing, with a brass ship's clock, a deck log and a coil of rope in the foreground): `apps/web/public/hero.webp` (92 KB), with `hero-1000.webp` (45 KB) and `hero-640.webp` (23 KB) served through `srcset`, and `og.jpg` (1200 by 630) for link previews. On wide screens it fills the right three quarters of the first screen and fades into the paper on the left and at the bottom with a CSS mask, so no text sits on busy pixels. On narrow screens it becomes a banner above the headline. The hawser line draws itself across the lower right of the image. No people, no real company, no real ship name.

## Cards

Every graphics card has a radar glow that follows the cursor (`--mx`, `--my`, 0.18 opacity, 280 px) plus a 1 px brass border that brightens. Disabled on touch and under reduced motion.

## Honesty in the interface

Anything recorded, replayed or simulated carries its label where it is shown: `simulated people on a local switch-core`, with the date. The first screen of the desk page says so.
