# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
the numbering [SemVer](https://semver.org/).

## [1.3.0] — 2026-09-19

### Fixed

- **The glass had no response to being touched.** The core computes one — its
  springs run on press, pull and wave, and `activeMaterial` makes the medium
  denser and cleaner under a finger — but it bends the field for the LENS
  pass, which is off here, and for the SURFACE pass, which contributes about a
  tenth of what you see. The optics were baked into the CSS filter once per
  shape and never touched again, so the numbers changed and nothing moved.

  All eight values the core produces now reach the layers that actually draw,
  every frame. A press clears the medium (scattering falls from 6 px to 1.5)
  and deepens its refraction; the pull spring makes the pane lag behind the
  finger; the wave rings through the depth of the refraction and dies out; the
  contact point blooms with light at the radius the core gives for a finger,
  which has an area rather than being a point. The press also sinks the pane
  by 1.5%.

- **A stray pointer move could fling the pane across the screen.** If a
  `pointerup` went somewhere we never heard about — onto a native scrollbar, or
  out of a window that lost focus — the drag stayed armed, and the next
  movement of the mouse dragged the pane with nobody touching it.

### Changed

- **The morph no longer shows clipped text.** Content used to turn opaque
  within the first third of the shape change, so it was read through a box
  still growing around it and appeared to slide out of a hole. Arriving content
  now waits for the shape and resolves into it; leaving content goes at once,
  because lingering under the arriving one turns a cross-fade into a smear.
- **A change of shape rings.** A dense medium does that, and the core already
  knows how the ring looks and how fast it dies, so opening and closing borrow
  the same spring instead of a second kind of motion. The impulse starts at the
  corner the sheet is pinned to — the one place that stays put while the rest
  travels, and in the core's own morph model the neck between the two shapes.

## [1.2.0] — 2026-09-19

### Changed

- **The site is named by its host everywhere, not by a hand-written label.**
  Each adapter used to carry a display name — `Ficbook`, `Archive of Our Own`
  and so on — which only ever existed for the six sites that have an adapter.
  Everywhere else the panel said the useless `Any site`, while the book's own
  metadata already recorded the real host. The extension runs on any site, so
  the label now comes off the URL: `ficbook.net`, `royalroad.com`,
  `some-novel-site.example.org`. It is right on every site, needs no upkeep
  when one rebrands, and is what the reader recognises anyway.

  This shows in the panel header, in the progress line and in the book's
  metadata — `dc:publisher` in EPUB, EXTH 101 in MOBI, `Source:` in TXT.
  `Adapter` no longer has a `name` field at all.

## [1.1.1] — 2026-09-19

### Fixed

- **The extension would not install at all.** Chromium reads extension files
  through `IsStringUTF8()`, which rejects Unicode non-characters, and U+FFFE /
  U+FFFF sat as raw characters in the control-character regex in `lib/html.ts`.
  A bundler copies regex literals through verbatim, so they reached
  `dist/content.js` and the browser refused the whole manifest with "Could not
  load file dist/content.js for content script. It isn't UTF-8 encoded." The
  regex is now built from a string, where the escapes stay escapes, and a test
  checks the built bundles for exactly this before it can happen again.

## [1.1.0] — 2026-09-19

The whole project rewritten in TypeScript and switched to English.

### Changed

- **TypeScript throughout, under `strict`.** The UMD wrappers and the shared
  `VireBook` global are gone; modules import each other. Node 24 runs the
  sources and the tests directly by stripping types, `tsc --noEmit` is the type
  check, and esbuild produces the bundles the browser loads.
- **New layout**: `src/` holds the TypeScript, `dist/` the three bundles
  (`content.js`, `popup.js`, `background.js`). `dist/` is committed so that
  "load unpacked" still works straight from a clone, and CI fails if it drifts
  out of step with the sources.
- **The interface is in English** and speaks of a **book** rather than any
  narrower genre — the extension was never limited to one kind of site.
- The glass core is now a generated ES module,
  `src/glass/vireglass.bundle.js`, with hand-written types beside it, instead of
  an IIFE hanging a global off the window.
- `src/chrome.d.ts` describes the slice of the extension API actually used, so
  the "no dependencies" promise holds for types too.

### Added

- `npm run check` — typecheck, build and tests in the order CI runs them.
- A test that `dist/` and the sources agree, and one that every adapter's domain
  is present in the manifest's `matches`.

## [1.0.0] — 2026-09-19

The first public release.

### Features

- Assembles a whole book into **EPUB, MOBI, FB2 or TXT** right in the browser:
  walks the chapters, pulls the text out of the HTML and glues the file together
  locally. The site's server generates nothing, so there is nothing to wait for.
- Own parsers for **ficbook.net, archiveofourown.org, fanfics.me,
  fanfiction.net, wattpad.com, royalroad.com**, plus a generic reading for every
  other site — which doubles as the fallback if a known site is restyled.
- For AO3 it takes the **site's own ready-made file**: faster and of higher
  quality than reassembling it.
- A panel made of the **VireGlass** material: refraction of the live DOM through
  `backdrop-filter`, with body density and ink polarity following a measurement
  of the background, and the cursor response on the core's springs.
- **The pane can be thrown** into any of the four corners of the window, by
  dragging or with Alt+arrows. The chosen corner is remembered.
- Sends nothing outwards: no `<all_urls>`, no screenshots, no outbound network
  calls. Permissions: `storage`, `activeTab`, `scripting`.

### Known limitations

In full under "Honest limitations" in the README.

- MOBI is built to spec and parsed back in the tests, but unverified on a live Kindle 11.
- The markup for fanfics.me, fanfiction.net and wattpad.com is written against
  the known structure and was not exercised live.
- Images do not make it into the book — text only.

[1.3.0]: https://github.com/pruffit/VireBook/releases/tag/v1.3.0
[1.2.0]: https://github.com/pruffit/VireBook/releases/tag/v1.2.0
[1.1.1]: https://github.com/pruffit/VireBook/releases/tag/v1.1.1
[1.1.0]: https://github.com/pruffit/VireBook/releases/tag/v1.1.0
[1.0.0]: https://github.com/pruffit/VireBook/releases/tag/v1.0.0
