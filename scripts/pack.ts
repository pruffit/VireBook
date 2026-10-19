// The release asset: only what the browser loads, with manifest.json at the zip's root, so unpacking gives the
// folder to point "Load unpacked" at. A GitHub source archive nests everything one folder deeper.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zip } from '../src/lib/zip.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8')) as {
  version: string;
  icons?: Record<string, string>;
  action?: { default_popup?: string; default_icon?: Record<string, string> };
  background?: { service_worker?: string };
  content_scripts?: { js?: string[] }[];
};
const popup = manifest.action?.default_popup;
const names = new Set<string>([
  'manifest.json',
  'LICENSE',
  ...Object.values(manifest.icons ?? {}),
  ...Object.values(manifest.action?.default_icon ?? {}),
  ...(popup ? [popup, popup.replace(/\.html$/, '.js')] : []),
  ...(manifest.background?.service_worker ? [manifest.background.service_worker] : []),
  ...(manifest.content_scripts ?? []).flatMap((c) => c.js ?? []),
]);
const files = [...names].sort().map((name) => ({ name, data: new Uint8Array(readFileSync(join(ROOT, name))) }));
const blob = await zip(files);
const out = join(ROOT, 'release', `VireBook-${manifest.version}.zip`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, new Uint8Array(await blob.arrayBuffer()));
console.log(`${out}\n${files.map((f) => `  ${f.name}`).join('\n')}`);
