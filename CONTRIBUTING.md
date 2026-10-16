# Contributing

The main place effort pays off is the **site adapters**: sites get restyled, and
that is fixed one file at a time, without knowing the rest of the code.

## Fix a broken site

Each site's selectors live in `src/adapters/<site>.ts` as lists of candidates
rather than single values: usually it is enough to add one new class to a list.
Check with `npm run check` and against the live page.

## Add a site

1. Copy `src/adapters/royalroad.ts` — it is the shortest.
2. Change `match`, `isWorkPage`, the selectors and the chapter parsing.
3. Register it **in two places**: `src/adapters/index.ts` (the `SITE_ADAPTERS`
   list) and `manifest.json` (`content_scripts[0].matches`). A test insists that
   every adapter's domain is present in `matches` — otherwise the button never
   appears by itself.
4. Add a fixture to `test/fixtures/` and a check to `test/adapters.ts`. The prose
   in fixtures is our own, not an author's: what we need is the structure, not
   somebody else's work.

An adapter must return `expectedChapters`: the core uses it to catch chapters
that went missing silently.

## House rules that will save a review round

- **There is exactly one runtime dependency**, [`vireglass`](https://github.com/pruffit/vireglass),
  and a second one is not being added. It is bundled into `dist/`, so what ships
  is still a folder you can load unpacked.
- **TypeScript under `strict`.** `npm run typecheck` must be clean. No `any`; if
  a type is genuinely unknown, `unknown` plus a narrowing check.
- **Comments say *why*.** Restating the code is not needed; a non-obvious
  invariant or a way around somebody else's bug is, in a line or two.
- **`dist/` is a build artefact**, but it is committed: run `npm run build` and
  commit the result along with the source. CI fails if the two disagree.
- **The material is not reimplemented here.** `src/glass.ts` is a port of
  `attachGlass` from `vireglass/dom` into a shadow tree, and every number in it
  is imported from the package. A constant copied out of it instead is a copy
  that will drift; see the README for what the port changes and why.
- Requests to sites go only through `ctx.fetchDoc` / `fetchText`: that is where
  the pacing, `Retry-After` and backoff live. A bare `fetch` in an adapter walks
  straight past them and into a 429.
- The interface is in English, and it says **book**, not anything narrower: the
  extension is not limited to one genre of site.

## Checks

```bash
npm run check   # typecheck + build + tests, the same order CI uses
```

The tests do not take "the file was built" for an answer: EPUB is unpacked and
checked for well-formed XML, MOBI is taken apart by PalmDB record and
decompressed again, table-of-contents offsets are verified against the anchors.
