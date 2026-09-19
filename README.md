<h1 align="center">VireBook</h1>

<p align="center">
  Browser extension: a whole book as EPUB, MOBI, FB2 or TXT — <b>in one press</b>.
</p>

<p align="center">
  <a href="https://github.com/pruffit/VireBook/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/pruffit/VireBook/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-informational"></a>
  <a href="CHANGELOG.md"><img alt="Version 1.1.1" src="https://img.shields.io/badge/version-1.1.1-success"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Chrome-Manifest%20V3-blue">
  <img alt="No runtime dependencies" src="https://img.shields.io/badge/runtime%20dependencies-none-brightgreen">
</p>

---

No "download → wait → pick a format → wait" chain: the book is assembled right
in the browser. The extension walks the chapters, pulls the text out of the HTML
and glues the file together locally. The site's server generates nothing, so
there is nothing to wait for.

The interface is a panel made of [VireGlass](#the-glass), the material of the
vire project: refraction of the live DOM, not a CSS shadow. The pane can be
thrown into any corner of the window.

| | |
|---|---|
| **Formats** | EPUB · MOBI · FB2 · TXT |
| **Sites** | ficbook.net · AO3 · fanfics.me · fanfiction.net · wattpad.com · royalroad.com · [any other](#which-sites) |
| **Sends outwards** | nothing — no `<all_urls>`, no screenshots, no network calls |
| **Licence** | [MIT](LICENSE) |

## Installing

1. Download the repository (Code → Download ZIP) and unpack it, or `git clone` it.
2. Open `chrome://extensions` (in Yandex Browser, `browser://extensions`).
3. Turn on **Developer mode** — the toggle at the top right.
4. Press **Load unpacked** and point at the repository folder (the one with
   `manifest.json` in it).
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

## If something breaks

Sites get restyled — that is normal and is fixed one file at a time.

- No button appeared → extension icon → "Show the button on this page".
- "No text found" → it almost always helps to open the page of the **whole
  work** rather than a single chapter.
- Downloaded empty or truncated → the chapter body selector changed. Fixed in
  `src/adapters/<site>.ts`, which holds a list of candidates — usually adding
  one new class is enough.

## The glass

The extension's panel is made of the **VireGlass** material from the vire
monorepo: the causes of the material (`ior`, thickness, bevel, roughness,
`legibility`, `presence`) are set by the core, and the consequences —
refraction, Fresnel, rim, highlight and shadow — are computed by its WebGL2
shaders.

What is worth knowing before changing anything here:

- **The refraction is of the live DOM, not of a snapshot.** The core's shader
  lens samples a scene the renderer drew itself — the extension has no raster of
  somebody else's page. The only way to get one is `captureVisibleTab`, which
  means `<all_urls>`, two frames a second, capturing the widget along with the
  page and going stale on any scroll. So the lens pass is off (`lens: false`) and
  the refraction is done by `backdrop-filter: url(#vg-refract)` —
  `feDisplacementMap` over a map built by `src/glass/entry.ts` out of the pane's
  shape and the optics values (`bevelDp × refraction`). Live, permission-free,
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

  Body density is computed by the core (`bodyDensityFor`/`bodyLuma`) and CSS only
  paints it: the lens is off, and "adaptation is impossible at the surface — it
  does not see the background" (`packages/vireglass/src/adapters.ts`). The
  busyness of the background, which the probe would have read off the scene, is
  estimated by walking sample points under the panel in `src/ui.ts`.

- **Ink polarity is the application's decision**, not the shader's:
  `shouldInkBeLight()` from the core, over a measurement of the background.
  Without it, over a light page the pane becomes a grey slab with unreadable
  text. The switch waits `CONFIRMATIONS` frames, so the paint loop keeps running
  until `settled()` says that density, body colour and polarity have all
  arrived: stopping earlier means freezing half-done on a slow machine.

- **The cursor response is part of the material.** The springs for press, pull
  and wave are computed by the core's `createDeform()`; only the gesture comes
  from here.

If WebGL2 is unavailable the panel falls back to a flat material and stays
usable — just without the glass.

## Development

```bash
npm install         # for tests and the build; there are no runtime dependencies
npm run build       # bundle src/ → dist/ (this is what the browser loads)
npm run typecheck   # tsc --noEmit, strict
npm test            # formats + adapters
npm run check       # all three of the above, in the order CI runs them
npm run demo        # serve test/ui-demo.html on localhost:5599 to look at the panel
npm run build:glass # rebuild the glass from the VireGlass core (needs the monorepo)
npm run icons       # redraw the icons
```

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

> **About `src/glass/vireglass.bundle.js`.** This is a generated artefact, built
> from the `@vire/vireglass` package, which lives in the vire monorepo and is
> **not published**. That is why the file is committed ready-made: without it
> the extension still works (see the fallback above), and it cannot be rebuilt
> without the monorepo. Its types are hand-written next to it, in
> `vireglass.bundle.d.ts`, and those are type-checked.
>
> ```bash
> VIRE_REPO=/path/to/vire npm run build:glass   # defaults to ../vire
> ```

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
src/adapters/          — one file per site, plus base.ts, generic.ts and the registry
src/glass/entry.ts     — source of the glass bundle: the bridge to @vire/vireglass
src/glass/*.bundle.*   — the GENERATED bundle and its hand-written types
src/core.ts            — choosing an adapter, fetching chapters, saving the file
src/ui.ts              — the floating panel (shadow DOM + the glass canvas)
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
**sends nothing anywhere**: neither the assembly nor the file leaves the machine.
There are no outbound network calls at all — verifiable by searching for `fetch`
and `XMLHttpRequest`. Downloading is for personal reading.

Permissions are the minimum: `storage` (the default format and the corner the
pane sits in), `activeTab` and `scripting` (the "show the button on this page"
action). No `<all_urls>`, no screenshots — the glass makes do with the live DOM.

## Licence

MIT, see [LICENSE](LICENSE).
