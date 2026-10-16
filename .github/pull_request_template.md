## What changes

<!-- One sentence. If a site is being fixed — which one, and what moved on it. -->

## Checked

- [ ] `npm run check` is green (typecheck + build + tests)
- [ ] `dist/` rebuilt and committed
- [ ] checked against the live page (link: )
- [ ] if an adapter was touched — a fixture was added to `test/fixtures/` and a check to `test/adapters.ts`
- [ ] if the panel was touched — looked at via `npm run demo` on all three backgrounds

<!--
House rules that save a review round (more in CONTRIBUTING.md):
  · one runtime dependency, vireglass, and no second one;
  · TypeScript under strict, no `any`;
  · comments say why;
  · requests to sites go only through ctx.fetchDoc / fetchText;
  · the interface is in English and says "book".
-->
