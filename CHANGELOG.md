# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
the numbering [SemVer](https://semver.org/).

## [1.5.1] — 2026-10-17

### Fixed

- **ficbook credits only the people who wrote or translated the work.** The author list took every
  `/authors/` link on the page, so reward givers (rendered inside the work header) and the beta ended
  up in the file name and the book's metadata. Names now come from the role badges: author,
  co-author, translator, co-translator. The three-name cap is gone with the guesswork.
- **A brief network drop no longer freezes the download.** A request caught in a VPN reconnect could
  stay pending forever, and retries only ran when a request failed outright. Every request (headers
  and body) now gives up after 20 s of silence, and a dropped network is retried for up to two
  minutes with the panel saying so; only then does the download stop with an error. A body cut off
  halfway is fetched again. Translation waits out a drop the same way; if the network stays down past
  the window, the remaining chapters stay in the original, as a chapter the engine refuses does.

## [1.5.0] — 2026-10-16

### Added

- **Optional translation of the whole book.** A **Translate** control in the
  panel, above the formats — Off by default — takes one of thirteen target
  languages and translates the book between reading it and writing the file, so
  EPUB, MOBI, FB2 and TXT all get it. Chapters go out block by block with their
  inline markup (italics, bold, line breaks), and what comes back is sanitised
  again, so the writers still get well-formed XHTML; chapter titles, notes, the
  title and the summary are translated too, the author, tags and fandom are not,
  and the book's language becomes the target. A book already in that language is
  recognised from the first chapter (by the language Google reports, not by the
  site's label) and then left alone. Only chapter bodies vote, not notes or
  titles. A chapter the engine keeps refusing stays in the original language
  instead of failing the build, and the panel reports how many stayed that way. The choice is remembered in `chrome.storage.sync` as `translateTo`.

  The engine is Google Translate's unofficial web endpoint behind a small
  `Translator` interface (`src/translate/`), so another one is a single file.
  Requests are batched under a character budget, spaced out, retried with backoff
  on 429/5xx (honouring `Retry-After`) and stop on cancel; the stray space the
  engine leaves before punctuation after a closing tag is removed. No new
  permission and no new dependency.

  **This is the first thing the extension sends anywhere**, which is why it is
  opt-in: with translation on, chapter text goes to `translate.googleapis.com`.
  The panel says so under the control, and the README's privacy section is updated.
  With translation on, a site's own ready-made file (AO3's) is bypassed — it could
  not be translated.

## [1.4.0] — 2026-10-16

### Changed

- **VireGlass now comes from npm** — `vireglass@2.2.0`. It used to live in this
  repository as a generated file — `src/glass/vireglass.bundle.js`, built out of
  a private package in a monorepo nobody else had, committed ready-made so that
  the extension could be built without it. The package is
  [published](https://www.npmjs.com/package/vireglass) now, so the bundle, its
  hand-written types and `scripts/build-glass.mjs` are all gone, and the build
  resolves `vireglass` like any other dependency. The extension still installs
  as a folder with no `node_modules` in it: the package is bundled into `dist/`.

- **The material is the package's live-DOM renderer, not a WebGL canvas.**
  Version 2 moved glass-over-live-DOM into `vireglass/dom`, which is precisely
  what this panel was doing by hand, and turned the WebGL renderer into the
  lab's own opaque pipeline — it always draws its own backdrop now, so it could
  no longer serve as a transparent overlay. `src/glass.ts` is a port of the
  package's `attachGlass` into a shadow tree; the canvas, the hand-built
  displacement map, the hand-rolled body density and the estimate of background
  busyness are all gone, replaced by the package's own. The rim and the adaptive
  shadow are new here — they used to be drawn by the canvas that no longer
  exists.

  It stays a port, rather than a call to `attachGlass`, for two reasons: the
  pane answers a finger by moving — a transform on the whole widget, from a
  spring `GlassHandle` neither exposes nor lets anyone drive — and a drag here
  means "throw the panel into another corner", which only the widget can tell
  from a press. The morph is the other: `attachGlass` re-reads the backdrop and
  re-bakes the map at full device resolution on every resize, and a panel
  changing shape resizes every frame.

- **The body over a dark page is denser.** Not a decision made here: 2.2.0
  changed how `withPresence` reaches its minimum separation, and over a flat
  dark backdrop the density it asks for goes from 0.20 to 0.50. The panel stands
  apart from the chapter text now instead of nearly vanishing into it.

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

[1.5.0]: https://github.com/pruffit/VireBook/releases/tag/v1.5.0
[1.4.0]: https://github.com/pruffit/VireBook/releases/tag/v1.4.0
[1.3.0]: https://github.com/pruffit/VireBook/releases/tag/v1.3.0
[1.2.0]: https://github.com/pruffit/VireBook/releases/tag/v1.2.0
[1.1.1]: https://github.com/pruffit/VireBook/releases/tag/v1.1.1
[1.1.0]: https://github.com/pruffit/VireBook/releases/tag/v1.1.0
[1.0.0]: https://github.com/pruffit/VireBook/releases/tag/v1.0.0
