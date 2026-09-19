// Bundles the TypeScript sources into dist/, which is what the browser loads.
//
// dist/ is committed on purpose. Installing is "load unpacked and you are
// done" — the readers this is for should not need node and npm to get a
// button on a page. A CI step rebuilds and checks that dist/ matches the
// sources, so a stale bundle cannot slip through.
import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist');
const watch = process.argv.includes('--watch');

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

/** One entry per execution context. They share code through imports, but the
 *  browser loads three independent files, so three bundles it is. */
const ENTRIES = [
  { in: 'src/content.ts', out: 'content' },
  { in: 'src/popup.ts', out: 'popup' },
  { in: 'src/background.ts', out: 'background' },
];

const options = {
  entryPoints: ENTRIES.map((e) => ({ in: join(ROOT, e.in), out: e.out })),
  outdir: OUT,
  bundle: true,
  // A content script is not a module: it is injected into the page as a plain
  // script, and top-level imports would throw there.
  format: 'iife',
  target: 'chrome111',
  platform: 'browser',
  legalComments: 'none',
  charset: 'utf8',
  logLevel: 'info',
};

if (watch) {
  const { context } = await import('esbuild');
  const ctx = await context(options);
  await ctx.watch();
  console.log('watching src/ → dist/');
} else {
  await build(options);
  await copyFile(join(ROOT, 'src', 'popup.html'), join(OUT, 'popup.html'));
  console.log('dist/ built');
}
