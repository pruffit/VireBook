// A local static server for previewing the widget: test/ui-demo.html.
// Development only — the extension needs nothing served.
//
// It also builds dist/ui-demo.js, the panel on its own: the demo drives the UI
// directly, without the adapters or the page-detection around it.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 5599);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const ctx = await build({
  entryPoints: [join(ROOT, 'src', 'ui.ts')],
  outfile: join(ROOT, 'dist', 'ui-demo.js'),
  bundle: true,
  format: 'iife',
  globalName: 'VireBookUI',
  target: 'chrome111',
  legalComments: 'none',
  logLevel: 'warning',
});
void ctx;

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
  const path = join(ROOT, rel === '' ? 'test/ui-demo.html' : rel);
  if (!path.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, {
      'content-type': TYPES[extname(path)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}/test/ui-demo.html`));
