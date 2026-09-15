// Сборка стеклянного слоя из ядра @vire/vireglass в самодостаточный src/lib/glass.js.
// Пакет приватный и отдаёт TS-исходники, поэтому путь к монорепо задаётся явно:
// VIRE_REPO, иначе соседняя папка ../vire.
import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VIRE = resolve(process.env.VIRE_REPO || join(ROOT, '..', 'vire'));
const PKG = join(VIRE, 'packages', 'vireglass', 'src');

if (!existsSync(PKG)) {
  console.error(`Не нашёл ядро VireGlass: ${PKG}\nУкажи путь к монорепо: VIRE_REPO=<путь> npm run build:glass`);
  process.exit(1);
}

await build({
  entryPoints: [join(ROOT, 'src', 'glass', 'entry.ts')],
  outfile: join(ROOT, 'src', 'lib', 'glass.js'),
  bundle: true,
  format: 'iife',
  globalName: 'FKGlass',
  target: 'chrome111',
  legalComments: 'none',
  alias: {
    '@vire/vireglass': join(PKG, 'index.ts'),
    '@vire/vireglass/web': join(PKG, 'web', 'index.ts'),
  },
  banner: { js: '// Сгенерировано: npm run build:glass. Источник — src/glass/entry.ts + @vire/vireglass.' },
});

console.log('src/lib/glass.js собран из', PKG);
