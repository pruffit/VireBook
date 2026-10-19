<h1 align="center">VireBook</h1>

<p align="center">
  Browser extension: a whole book as EPUB, MOBI, FB2 or TXT — <b>in one press</b>.
</p>

<p align="center">
  <a href="https://github.com/pruffit/VireBook/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/pruffit/VireBook/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-informational"></a>
  <a href="CHANGELOG.md"><img alt="Version 1.6.0" src="https://img.shields.io/badge/version-1.6.0-success"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Chrome-Manifest%20V3-blue">
  <img alt="No runtime dependencies" src="https://img.shields.io/badge/runtime%20dependencies-none-brightgreen">
</p>

---

No "download → wait → pick a format → wait" chain: the book is assembled right
in the browser. The extension walks the chapters, pulls the text out of the HTML
and glues the file together locally. The site's server generates nothing, so
there is nothing to wait for.

The interface is a panel made of [VireGlass](#the-glass): refraction of the live
DOM, not a CSS shadow. The pane can be thrown into any corner of the window.

| | |
|---|---|
| **Formats** | EPUB · MOBI · FB2 · TXT |
| **Sites** | ficbook.net · AO3 · fanfics.me · fanfiction.net · wattpad.com · royalroad.com · [any other](#which-sites) |
| **Sends outwards** | nothing by default — no `<all_urls>`, no screenshots. Only if you turn on [translation](#translating-a-book), chapter text goes to Google Translate |
| **Licence** | [MIT](LICENSE) |

## Installing

1. Download **VireBook-x.y.z.zip** from the [latest release](https://github.com/pruffit/VireBook/releases/latest)
   (not "Source code") and unpack it. Or `git clone` the repository.
2. Open `chrome://extensions` (in Yandex Browser, `browser://extensions`).
3. Turn on **Developer mode** — the toggle at the top right.
4. Press **Load unpacked** and point at the unpacked folder: `manifest.json` is
   right inside it. (A "Source code" archive nests the files one folder deeper,
   and the browser then says the manifest is missing.)
5. Done. The icon appears to the right of the address bar.

The same works in Chrome, Edge and Yandex Browser. No build step is needed:
`dist/` is committed ready to run.

> After installing, **do not delete or rename the folder**: the browser loads
> the extension from it on every start.

## Using it

On a book page a **Download book** button appears at the bottom right.
Press it → pick a format → the file downloads.

**The pane is in the way? Throw it somewhere else.** Drag it with the mouse and
let go: it lands in the nearest corner of the window. From the keyboard,
**Alt+arrows** do the same. The chosen corner is remembered and holds across all
sites until you change it again.

If the site is unknown and no button appeared, click the extension icon in the
toolbar and choose **Show the button on this page**.

The same popup is where the default format is set — it moves to the top of the list.

## Translating a book

Reading a book that is not in your language? In the panel, **Translate** (above the
formats) takes a target language — Русский, English, Українська, Deutsch, Français,
Español, Italiano, Português, Polski, Türkçe, 日本語, 中文, 한국어. It is **Off** by
default, and the choice is remembered.

With a language picked, the book is read as usual and then translated before the
file is written, so EPUB, MOBI, FB2 and TXT all get it: chapter text (paragraphs,
italics and bold intact), chapter titles, author's notes, the book's title and its
summary. The author, tags and fandom stay as they are, and the file's language is
set to the target. The first chapter is translated first, and if Google reports
that the chapter text was already in the target language, the rest is not sent and
the book is downloaded as it is. If Google keeps refusing some chapters, those stay
in the original language, the rest is translated, and the panel says how many.

**This is the one thing that leaves the machine.** The chapter text is sent to
Google Translate's public web endpoint, in batches, spaced out; nothing is sent
unless translation is on. The panel says so under the control. With
translation on, a site's own ready-made file (AO3's) is not used, since it cannot
be translated.

## Getting the file onto a Kindle 11

**EPUB is the main route.** Amazon converts it itself, and the table of contents
and italics survive:

- by mail: send the file as an attachment to an address like `name@kindle.com`
  (it is in the device settings on amazon.com → Manage Your Content and Devices
  → Preferences → Personal Document Settings). You must send it **from the
  address listed as approved in that same place**, otherwise the mail silently
  never arrives;
- or through Amazon's "Send to Kindle" web uploader — drag the file in the browser.

**MOBI is the cable route.** Plug the Kindle into the computer, copy the file
into the `documents` folder on the device, unplug.

**FB2** — for a phone and PocketBook; a Kindle does not read it.
**TXT** — if nothing else worked out.

## Which sites

| Site | How it works |
|---|---|
| **ficbook.net** | Own parser. Markup checked against the live page on 2026-09-15 |
| **archiveofourown.org** | Takes the **site's own ready-made file** (AO3 builds EPUB/AZW3/MOBI itself — instant and of higher quality) |
| **fanfics.me** | Own parser, markup **unverified** — see "Honest limitations" |
| **fanfiction.net** | Own parser against the known markup, not verified live |
| **wattpad.com** | Own parser, the text comes from the site's internal endpoint |
| **royalroad.com** | Own parser |
| **any other** | Generic reading: finds the most text-like block on the page, then either a table of contents or the "next chapter" links |

The generic reading is also the fallback: if a listed site is restyled and its
own parser misses, the extension moves over to it silently.

## Honest limitations

Worth knowing before you rely on it:

- **MOBI has not been verified on a live Kindle 11.** The format is built to
  spec and is parsed back in the tests (headers, table of contents, `filepos`
  offsets), but I do not own the device. Amazon lists MOBI among the formats
  supported for a cable upload; if it does not open, the working route is EPUB +
  Send to Kindle. **Best to check that in advance, on a single book.**
- **fanfics.me is unverified.** The site answers "unavailable in your country"
  outside Russia, so the markup could not be captured. The selectors are written
  speculatively, with the generic parser as the safety net. From Russia this
  takes a minute to check.
- **fanfiction.net and Wattpad** are written against the known structure and
  were not exercised live: the first has bot protection, the second keeps its
  text behind an internal API.
- **Images do not make it into the book** — text only. For most books that is
  what you want, and the file comes out lighter.
- **Paid and restricted chapters** download only if they are open in the
  browser: requests carry the reader's own cookies, that is, exactly what is
  already on their screen.

- **Translation is machine translation, over an unofficial endpoint.** It reads
  like Google Translate reads, and the endpoint has no key and no promise: Google
  can slow it down or turn it off, in which case the panel says it was refused —
  set Translate to Off to download the book as before. A long book takes a minute
  or two longer.

## If something breaks

Sites get restyled — that is normal and is fixed one file at a time.

- No button appeared → extension icon → "Show the button on this page".
- "No text found" → it almost always helps to open the page of the **whole
  work** rather than a single chapter.
- Downloaded empty or truncated → the chapter body selector changed. Fixed in
  `src/adapters/<site>.ts`, which holds a list of candidates — usually adding
  one new class is enough.

## The glass

The extension's panel is made of the **VireGlass** material, from the
[`vireglass`](https://github.com/pruffit/vireglass) package on npm: the causes
of the material (`ior`, thickness, bevel, roughness, `legibility`, `presence`)
are set by the model, and the consequences — refraction, rim, body, shadow and
the response to a finger — follow from them.

The package ships a renderer for exactly this case, `attachGlass` from
`vireglass/dom`, and `src/glass.ts` is a port of it rather than a second
implementation: every number is imported. What is worth knowing before changing
anything here:

- **Two things keep this a port instead of a call to `attachGlass`.** The first
  is the finger. The pane answers a touch by *moving* — it lags behind on the
  core's pull spring and sinks under a press — and that is a transform on the
  whole widget, which no material can apply for it; `GlassHandle` hands out
  neither the spring's state nor a way to drive it. The gesture has to be ours in
  any case, because on this pane a drag is not a drag of the material but a throw
  into another corner of the window, and only the widget knows which is which.
  The second is the morph: `attachGlass` re-reads the backdrop and re-bakes the
  map at full device resolution on every resize, which while the panel is
  changing shape means every frame. Here the map is built once for the shape the
  pane is travelling to and stretched over the live box until it lands.

  What is *not* a reason any more is the shadow DOM. Up to 2.1.0 `attachGlass`
  put its filter `<svg>` on `document.body` and its rim stylesheet on
  `document.head`, and a widget in a shadow root could use neither — a document
  stylesheet does not cross the boundary, and `backdrop-filter: url(#id)` used
  *from inside* a shadow tree resolves against **that** tree, so the filter is
  simply not found and the pane gets no backdrop at all, not even the blur
  fallback, because the reference itself is perfectly valid CSS. 2.2.0 finds the
  element's own root. The filter here still lives in the shadow tree for the same
  reason, just by our own hand.

- **The refraction is of the live DOM, not of a snapshot.** The browser never
  hands a page's pixels to script — that boundary is the whole reason
  `backdrop-filter` exists — so the displacement happens in the compositor:
  `backdrop-filter: url(#vg-refract)` over an `feDisplacementMap` whose map the
  package bakes from the pane's shape and its optics. Live, permission-free,
  never stale.

- **The filter must carry `color-interpolation-filters="sRGB"`.** By default SVG
  computes a filter in linearRGB, and that breaks both of its halves at once. The
  neutral middle of the map (128) reaches `feDisplacementMap` as 55 — a shift of
  a third of the scale, which means the **whole** backdrop under the pane slides
  diagonally by ~9 px and the rim drags in whatever lies outside it. The same
  linearRGB washes out the scattering: over a dark page the pane starts glowing
  instead of lying there. Remove the attribute and you get back exactly the rim
  artefacts it exists to prevent.

- **The refraction layer lives in a nested clip** (`.shell > .clip > .refract`)
  rather than on the shell itself. It is wider than the sheet by `--slack`: the
  blur and the displacement need something to gather under the edge. The slack
  must not be added to the filter *region* — then `backdrop-filter` spills the
  filtered background past the element's bounds and a rectangle shows around the
  rounded shape; here the spill is cut off by `overflow`. The separate `.clip` is
  needed for its own reason: while `backdrop-filter` sits directly in the shell,
  whose height is moving through a morph, and the sheet is pinned by its **top**,
  Chromium stops recomputing the position of the neighbouring layers — the
  panel's content stays lifted by a couple of dozen pixels.

- **The material is a sheet, not clear glass.** Roughness is taken at the
  ceiling of the model (`MATERIAL_RANGES.roughness[1]`): the sheet lies over a
  LIVE screen and must not be transparent — the page reads through it and argues
  with its own labels. The cause is roughness, not darkening. The rest of the
  causes come from `VIREGLASS_CONTROL_MATERIAL`: it is a control after all, and
  needs thickness, a bevel and presence.

  The body — how much medium stands between the page and the eye, and which way
  it tints — is `bodyLayer` from the package (one translucent layer, lighter than
  its surround on every backdrop), and CSS only paints what it returns. The rim is
  `rimGradientCss`: a thin line round the whole contour, stronger where the
  surround is light.

- **The backdrop is read from declared styles, not from pixels**, which is the
  package's documented limit and not a shortcut: the browser never hands a
  page's pixels to script. `probeBackdrop` walks the stacking order under a grid
  of points and composites what it finds, down to the canvas — which matters
  here, because a pane pinned to a window corner usually hangs past the end of
  the body box, where the only element beneath it is a transparent `<html>`.

- **Ink polarity is the application's decision**, not the material's:
  `shouldInkBeLight()` over that reading. Without it, over a light page the pane
  becomes a grey slab with unreadable text. The package's `CONFIRMATIONS` is
  deliberately **not** used: it counts readings and is sized for a renderer that
  takes them about five times a second, while this one reads on events — at
  mount, when a scroll stops, when the pane lands. Three of those can be a
  minute apart. The hysteresis inside `shouldInkBeLight` is what keeps a cover
  sliding under the edge from recolouring the panel.

- **The cursor response is part of the material, and it has to be let out.**
  The springs for press, pull and wave are the package's `createDeform()`; only
  the gesture comes from here. The map is rebuilt around the contact point every
  frame while a finger is down, and what the map cannot carry — the pane lagging
  behind the finger, the sink under a press — is handed back to the widget for
  the transform. A press makes the medium denser and cleaner: that is
  `activeMaterial`, and blur goes 12 → 3 while the bevel widens and the index
  rises. Deliberately **not** `raiseIntoGlass`, which the package's own DOM
  renderer uses here — that one is for a control which is *not* glass at rest and
  materialises into it, and it takes roughness to nothing at a full press. This
  pane is glass already and is lying over a page of text: clear it completely and
  the chapter comes through sharp behind the panel's own labels.

- **Dispersion is skipped when it would not show.** Per-channel refraction costs
  three displacement passes, three colour matrices and two composites, per frame.
  `refractionStrength` saturates at `n = 1.6` and this material sits at 1.69, so
  the shifted indices land on the same full strength and all three channels ask
  for the same scale — the single-pass picture, exactly, for three times the
  work. `src/glass.ts` builds the three-pass graph only when the ratios actually
  come out apart.

If `backdrop-filter` is missing entirely the panel falls back to a flat material
and stays usable — just without the glass. Where `backdrop-filter` works but a
filter *reference* does not (Firefox, older Safari), the package's own fallback
stands in: blur and saturation from the same optics.

## Development

```bash
npm install         # vireglass, plus the build and test tooling
npm run build       # bundle src/ → dist/ (this is what the browser loads)
npm run typecheck   # tsc --noEmit, strict
npm test            # formats + adapters
npm run check       # all three of the above, in the order CI runs them
npm run demo        # serve test/ui-demo.html on localhost:5599 to look at the panel
npm run pack        # release/VireBook-x.y.z.zip, the asset a release carries
npm run icons       # redraw the icons
```

There is one runtime dependency, [`vireglass`](https://www.npmjs.com/package/vireglass),
and it is bundled into `dist/` along with everything else — the extension still
installs as a folder with no `node_modules` in it.

The whole source tree is TypeScript under `strict`. Node 24 runs the sources and
the tests directly by stripping types, so there is no compile step for testing;
`tsc` is only ever asked whether we are wrong. The browser gets bundles from
esbuild.

The widget is looked at on `test/ui-demo.html`: a stand-in book page with three
backgrounds (light, dark, grid). The glass has to read on all three, and the
pane has to travel to all four corners.

> **About `dist/`.** It is committed on purpose. Installing should be "load
> unpacked and you are done" — the readers this is for should not need node and
> npm to get a button on a page. CI rebuilds `dist/` and fails if the result
> differs from what is committed, so a stale bundle cannot slip through. After
> changing anything in `src/`, run `npm run build` and commit the result.

The tests do not take "the file was built" for an answer: EPUB is unpacked and
checked for well-formed XML, MOBI is taken apart by PalmDB record and
decompressed again, table-of-contents offsets are verified against the anchors.
Adapters run against fixtures captured from the structure of live pages (the
prose in them is ours, not anybody else's).

### Layout

```
manifest.json          — MV3; points at dist/
src/types.ts           — Book, Chapter, Adapter, ParseContext: the shared vocabulary
src/chrome.d.ts        — the slice of the extension API we use, hand-written
src/lib/               — formats and utilities
  zip.ts               — ZIP (store + deflate-raw) for EPUB
  html.ts              — chapter cleanup and XHTML serialisation
  epub.ts  mobi.ts     — assembling the book
  fb2.ts   txt.ts
  util.ts              — pacing, backoff, filenames
src/translate/         — optional translation: the engine interface, the Google engine,
                         batching, and translating a whole Book
src/adapters/          — one file per site, plus base.ts, generic.ts and the registry
src/glass.ts           — the material: vireglass/dom's renderer, ported into a shadow tree
src/core.ts            — choosing an adapter, fetching chapters, saving the file
src/ui.ts              — the floating panel (shadow DOM, and the layers the glass writes into)
src/content.ts         — the entry point on a page
src/popup.ts           — the toolbar popup
src/background.ts      — the default format on install
dist/                  — the bundles the browser loads (committed, built by CI too)
```

## Contributing

The main place effort pays off is the **site adapters**: sites get restyled, and
that is fixed one file at a time, without knowing the rest of the code. How to
fix a broken site and how to add a new one is in [CONTRIBUTING.md](CONTRIBUTING.md).
Something broken, or a site you want added —
[open an issue](https://github.com/pruffit/VireBook/issues/new/choose).

Version history is in [CHANGELOG.md](CHANGELOG.md).

## Privacy

The extension reads exactly the pages that are already open in the browser and
**sends nothing anywhere by default**: neither the assembly nor the file leaves the
machine, and the only requests are to the book's own site. The exception is
translation, which is off until you turn it on: then the chapter text (and the
title and summary) goes to `translate.googleapis.com`, and nowhere else. Every
request is in `src/core.ts`, `src/translate/google.ts` and the adapters —
verifiable by searching for `fetch`. Downloading is for personal reading.

Permissions are the minimum: `storage` (the default format, the translation
language and the corner the pane sits in), `activeTab` and `scripting` (the "show the button on this page"
action). No `<all_urls>`, no screenshots — the glass makes do with the live DOM.

## Licence

MIT, see [LICENSE](LICENSE).
