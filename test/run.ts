// Assembled files are checked by taking them apart again: ZIP is unpacked, MOBI
// is split into records and decompressed. Otherwise "the book was built" means
// nothing at all.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

import type { Book } from '../src/types.ts';
import { SITE_ADAPTERS } from '../src/adapters/index.ts';
import * as epub from '../src/lib/epub.ts';
import * as fb2 from '../src/lib/fb2.ts';
import * as mobi from '../src/lib/mobi.ts';
import * as txt from '../src/lib/txt.ts';
import * as util from '../src/lib/util.ts';
import { zip } from '../src/lib/zip.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failures.push(`${name}: ${(err as Error).message}`);
  }
}

async function checkAsync(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed += 1;
  } catch (err) {
    failures.push(`${name}: ${(err as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function assertEq<T>(actual: T, expected: T, msg: string): void {
  if (actual !== expected) throw new Error(`${msg}: expected ${expected}, got ${actual}`);
}

// ---------- a minimal ZIP reader ----------
interface ZipRecord {
  method: number;
  raw: number;
  bytes: Buffer;
}

function readZip(buf: Buffer): Map<string, ZipRecord> {
  const files = new Map<string, ZipRecord>();
  let i = 0;
  while (i + 30 <= buf.length) {
    if (buf.readUInt32LE(i) !== 0x04034b50) break;
    const method = buf.readUInt16LE(i + 8);
    const packed = buf.readUInt32LE(i + 18);
    const raw = buf.readUInt32LE(i + 22);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.subarray(i + 30, i + 30 + nameLen).toString('utf8');
    const start = i + 30 + nameLen + extraLen;
    const payload = buf.subarray(start, start + packed);
    files.set(name, { method, raw, bytes: method === 8 ? inflateRawSync(payload) : payload });
    i = start + packed;
  }
  return files;
}

// ---------- checking XML is balanced ----------
function assertWellFormed(xml: string, label: string): void {
  const stack: string[] = [];
  const re = /<(\/?)([a-zA-Z_][\w.:-]*)([^>]*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const [, closing, tag, attrs, selfClose] = m;
    if (xml.startsWith('<?', m.index) || xml.startsWith('<!', m.index)) continue;
    if (selfClose === '/') continue;
    if (closing === '/') {
      const top = stack.pop();
      if (top !== tag) throw new Error(`${label}: closed <${tag}> but <${top}> was open`);
    } else {
      stack.push(tag!);
    }
    if (/=[^"'\s>]/.test(attrs!)) throw new Error(`${label}: unquoted attribute in <${tag}>`);
  }
  if (stack.length) throw new Error(`${label}: unclosed tags ${stack.join(', ')}`);

  const bare = xml.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, '');
  if (bare.includes('&')) throw new Error(`${label}: a bare & outside an entity`);
}

// ---------- PalmDOC: decompress back ----------
function palmDocDecompress(bytes: Buffer): Buffer {
  const out: number[] = [];
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++]!;
    if (b === 0) out.push(0);
    else if (b <= 8) for (let k = 0; k < b; k += 1) out.push(bytes[i++]!);
    else if (b <= 0x7f) out.push(b);
    else if (b <= 0xbf) {
      const v = (b << 8) | bytes[i++]!;
      const dist = (v >> 3) & 0x7ff;
      const len = (v & 7) + 3;
      const from = out.length - dist;
      for (let k = 0; k < len; k += 1) out.push(out[from + k]!);
    } else {
      out.push(0x20, b ^ 0x80);
    }
  }
  return Buffer.from(out);
}

function readPalmDb(buf: Buffer) {
  const count = buf.readUInt16BE(76);
  const offsets: number[] = [];
  for (let i = 0; i < count; i += 1) offsets.push(buf.readUInt32BE(78 + i * 8));
  const records = offsets.map((off, i) =>
    buf.subarray(off, i + 1 < count ? offsets[i + 1] : buf.length),
  );
  return { count, records, name: buf.subarray(0, 32).toString('latin1').replace(/\0+$/, '') };
}

// ---------- the test book ----------
// The text is Cyrillic on purpose: it is the case that breaks MOBI compression,
// filename handling and XML escaping all at once.
const CH1 =
  '<p>Первая глава. Дождь шёл третий день подряд, и крыша течёт.</p><p>Кавычки «ёлочки» и тире — тоже текст.</p>';
const CH2 =
  '<p>Вторая глава с <em>наклонным</em> и <strong>жирным</strong>.</p><p>Amp &amp; lt &lt; gt &gt; уже экранированы.</p>';

function makeBook(n = 2): Book {
  const chapters = [];
  for (let i = 0; i < n; i += 1) {
    chapters.push({
      title: `Глава ${i + 1}: «начало»`,
      xhtml: (i % 2 === 0 ? CH1 : CH2).repeat(6),
    });
  }
  return {
    title: 'Тест & проверка <тегов>',
    author: 'Автор Тестовый',
    summaryText: 'Аннотация с «кавычками» и символом &.',
    fandom: 'Ориджинал',
    tags: ['драма', 'AU & прочее'],
    language: 'ru',
    sourceUrl: 'https://example.org/readfic/1',
    siteName: 'Test site',
    uuid: '11111111-2222-3333-4444-555555555555',
    chapters,
  };
}

const toBuf = async (blob: Blob): Promise<Buffer> => Buffer.from(await blob.arrayBuffer());

// ================= tests =================

check('util.safeFilename strips forbidden characters', () => {
  const name = util.safeFilename('Имя: с/плохими\\символами?*', 'epub');
  assert(!/[\\/:*?"<>|]/.test(name), `forbidden character left: ${name}`);
  assert(name.endsWith('.epub'), 'no extension');
});

check('util.detectLanguage tells ru from en', () => {
  assertEq(util.detectLanguage('Привет, это русский текст'), 'ru', 'ru');
  assertEq(util.detectLanguage('Hello this is english text'), 'en', 'en');
});

await checkAsync('the limiter spaces parallel requests instead of letting a batch through', async () => {
  const STEP = 50;
  const limiter = util.createRateLimiter({ interval: STEP });
  const at: number[] = [];
  // This is exactly the case the old throttle got wrong: workers read "the time
  // of the previous request" in a single tick, all saw the same value and started
  // together.
  await Promise.all(
    [0, 1, 2, 3, 4].map(async () => {
      await limiter.acquire();
      at.push(Date.now());
    }),
  );
  assertEq(at.length, 5, 'not every slot was handed out');

  // Slots are reserved in absolute time, so a single gap after an overslept
  // timer compensates itself — the guarantee here is the average pace.
  const span = at[at.length - 1]! - at[0]!;
  assert(
    span >= STEP * 4 * 0.9,
    `five slots fitted into ${span} ms instead of ${STEP * 4} — the pace was not held`,
  );
  for (let i = 1; i < at.length; i += 1) {
    const gap = at[i]! - at[i - 1]!;
    assert(gap >= STEP * 0.4, `slot ${i} handed out after ${gap} ms — looks like a volley`);
  }
});

check('the limiter widens its step after a 429 and comes back after a run of successes', () => {
  const limiter = util.createRateLimiter({ interval: 100, maxInterval: 800 });
  assertEq(limiter.interval, 100, 'starting step');
  limiter.penalize(0);
  assertEq(limiter.interval, 200, 'the step must double after the first 429');
  limiter.penalize(0);
  assertEq(limiter.interval, 400, 'after the second 429');
  for (let i = 0; i < 4; i += 1) limiter.reward();
  assertEq(limiter.interval, 400, 'four successes are not enough to speed up');
  limiter.reward();
  assertEq(limiter.interval, 200, 'after five successes the step shrinks');
  for (let i = 0; i < 20; i += 1) limiter.penalize(0);
  assertEq(limiter.interval, 800, 'the step must not go above maxInterval');
});

check('parseRetryAfter understands both seconds and an HTTP date', () => {
  const now = Date.parse('2026-09-15T12:00:00Z');
  assertEq(util.parseRetryAfter('30', now), 30000, 'seconds');
  assertEq(util.parseRetryAfter('  7 ', now), 7000, 'seconds with spaces');
  assertEq(util.parseRetryAfter('Tue, 15 Sep 2026 12:00:45 GMT', now), 45000, 'HTTP date');
  assertEq(util.parseRetryAfter('Tue, 15 Sep 2026 11:59:00 GMT', now), 0, 'a past date — no wait');
  assertEq(util.parseRetryAfter('', now), 0, 'empty');
  assertEq(util.parseRetryAfter(null, now), 0, 'no header');
  assertEq(util.parseRetryAfter('soon', now), 0, 'junk does not break parsing');
});

check('backoffDelay grows with jitter, respects Retry-After and the ceiling', () => {
  const lo = { random: () => 0 };
  const hi = { random: () => 1 };
  assertEq(util.backoffDelay(0, { base: 1000, ...lo }), 500, 'lower jitter bound');
  assertEq(util.backoffDelay(0, { base: 1000, ...hi }), 1000, 'upper jitter bound');
  assertEq(util.backoffDelay(3, { base: 1000, ...hi }), 8000, 'exponent');
  assertEq(util.backoffDelay(9, { base: 1000, max: 4000, ...hi }), 4000, 'ceiling');
  assertEq(util.backoffDelay(0, { base: 1000, floor: 9000, ...hi }), 9000, 'Retry-After as a lower bound');
  const spread = new Set(
    [0.1, 0.4, 0.9].map((r) => util.backoffDelay(2, { base: 1000, random: () => r })),
  );
  assertEq(spread.size, 3, 'jitter has to spread the workers out');
});

await checkAsync('sleep is interrupted by an abort signal', async () => {
  const ac = new AbortController();
  const started = Date.now();
  setTimeout(() => ac.abort(), 20);
  let name = '';
  try {
    await util.sleep(5000, ac.signal);
  } catch (err) {
    name = (err as Error).name;
  }
  assertEq(name, 'AbortError', 'an abort must interrupt the wait');
  assert(Date.now() - started < 1000, 'the wait did not break — "Cancel" would look broken');
});

check('palmDoc round-trip on Cyrillic', () => {
  const text = Buffer.from(('Дождь шёл третий день подряд. ' + CH1).repeat(8), 'utf8');
  const packed = mobi.palmDocCompress(new Uint8Array(text));
  assert(palmDocDecompress(Buffer.from(packed)).equals(text), 'decompressed did not match the source');
});

check('palmDoc round-trip on Latin text with repeats', () => {
  const text = Buffer.from('abcabcabc '.repeat(200) + 'the quick brown fox '.repeat(50), 'utf8');
  const packed = mobi.palmDocCompress(new Uint8Array(text));
  assert(packed.length < text.length / 2, `no compression: ${packed.length} out of ${text.length}`);
  assert(palmDocDecompress(Buffer.from(packed)).equals(text), 'round-trip is broken');
});

check('palmDoc round-trip on random bytes', () => {
  const text = Buffer.alloc(3000);
  for (let i = 0; i < text.length; i += 1) text[i] = (i * 2654435761) & 0xff;
  const packed = mobi.palmDocCompress(new Uint8Array(text));
  assert(palmDocDecompress(Buffer.from(packed)).equals(text), 'round-trip broken on binary data');
});

await checkAsync('EPUB: structure and the mandatory files', async () => {
  const buf = await toBuf(await epub.build(makeBook(3)));
  const files = readZip(buf);

  const first = [...files.keys()][0];
  assertEq(first, 'mimetype', 'mimetype must come first');
  assertEq(files.get('mimetype')!.method, 0, 'mimetype must be stored uncompressed');
  assertEq(files.get('mimetype')!.bytes.toString(), 'application/epub+zip', 'mimetype content');

  for (const need of [
    'META-INF/container.xml', 'OEBPS/content.opf', 'OEBPS/nav.xhtml',
    'OEBPS/toc.ncx', 'OEBPS/style.css',
  ]) {
    assert(files.has(need), `missing file ${need}`);
  }
  for (let i = 1; i <= 3; i += 1) {
    assert(files.has(`OEBPS/ch00${i}.xhtml`), `missing chapter ${i}`);
  }
});

await checkAsync('EPUB: every XML is well formed and special characters are escaped', async () => {
  const buf = await toBuf(await epub.build(makeBook(2)));
  const files = readZip(buf);
  for (const [name, entry] of files) {
    if (!/\.(xhtml|opf|ncx|xml)$/.test(name)) continue;
    assertWellFormed(entry.bytes.toString('utf8'), name);
  }
  const opf = files.get('OEBPS/content.opf')!.bytes.toString('utf8');
  assert(opf.includes('Тест &amp; проверка &lt;тегов&gt;'), 'the title is not escaped in the OPF');
  assert(opf.includes('<dc:language>ru</dc:language>'), 'the language is not set');
});

await checkAsync('EPUB: the table of contents lists every chapter', async () => {
  const buf = await toBuf(await epub.build(makeBook(5)));
  const files = readZip(buf);
  const nav = files.get('OEBPS/nav.xhtml')!.bytes.toString('utf8');
  const toc = files.get('OEBPS/toc.ncx')!.bytes.toString('utf8');
  for (let i = 1; i <= 5; i += 1) {
    assert(nav.includes(`ch00${i}.xhtml`), `nav without chapter ${i}`);
    assert(toc.includes(`ch00${i}.xhtml`), `ncx without chapter ${i}`);
  }
  assertEq((toc.match(/<navPoint/g) || []).length, 6, 'navPoint: 5 chapters + the title page');
});

await checkAsync('MOBI: the PalmDB reads back and the text is recovered', async () => {
  const book = makeBook(4);
  const buf = await toBuf(mobi.build(book));
  const db = readPalmDb(buf);

  assertEq(buf.subarray(60, 68).toString('latin1'), 'BOOKMOBI', 'type/creator signature');

  const r0 = db.records[0]!;
  assertEq(r0.readUInt16BE(0), 2, 'compression must be PalmDOC');
  const textLength = r0.readUInt32BE(4);
  const textRecordCount = r0.readUInt16BE(8);
  assertEq(r0.readUInt16BE(10), 4096, 'record size');
  assertEq(r0.subarray(16, 20).toString('latin1'), 'MOBI', 'no MOBI header');
  assertEq(r0.readUInt32BE(20), 232, 'MOBI header length');
  assertEq(r0.readUInt32BE(28), 65001, 'the encoding must be UTF-8');

  const parts: Buffer[] = [];
  for (let i = 1; i <= textRecordCount; i += 1) parts.push(palmDocDecompress(db.records[i]!));
  const text = Buffer.concat(parts);
  assertEq(text.length, textLength, 'the text length disagrees with the header');
  assert(text.toString('utf8').includes('Глава 4'), 'the last chapter did not make it into the text');
});

await checkAsync('MOBI: EXTH and the housekeeping records are in place', async () => {
  const buf = await toBuf(mobi.build(makeBook(2)));
  const db = readPalmDb(buf);
  const r0 = db.records[0]!;

  assertEq(r0.readUInt32BE(16 + 112), 0x40, 'the EXTH-present flag');
  const exthAt = 16 + 232;
  assertEq(r0.subarray(exthAt, exthAt + 4).toString('latin1'), 'EXTH', 'no EXTH');

  const textRecordCount = r0.readUInt16BE(8);
  assertEq(r0.readUInt16BE(16 + 176), 1, 'first content record');
  assertEq(r0.readUInt16BE(16 + 178), textRecordCount, 'last content record');

  const flis = db.records[textRecordCount + 1]!;
  const fcis = db.records[textRecordCount + 2]!;
  assertEq(flis.subarray(0, 4).toString('latin1'), 'FLIS', 'no FLIS');
  assertEq(fcis.subarray(0, 4).toString('latin1'), 'FCIS', 'no FCIS');
  assertEq(db.records[textRecordCount + 3]!.toString('hex'), 'e98e0d0a', 'no end-of-file marker');

  const fullNameOffset = r0.readUInt32BE(16 + 68);
  const fullNameLength = r0.readUInt32BE(16 + 72);
  assertEq(
    r0.subarray(fullNameOffset, fullNameOffset + fullNameLength).toString('utf8'),
    'Тест & проверка <тегов>',
    'the book name in record 0',
  );
});

check('MOBI: filepos points exactly at the start of a chapter', () => {
  const book = makeBook(3);
  const html = mobi.buildHtml(book);
  const bytes = mobi.patchFilepos(html, 3);
  const text = Buffer.from(bytes);
  const str = text.toString('utf8');

  assert(!/FPOS/.test(str), 'unreplaced placeholders are left');

  const links = [...str.matchAll(/<a filepos=(\d{10})>/g)].map((m) => Number(m[1]));
  assertEq(links.length, 3, 'there should be three contents links');

  links.forEach((offset, i) => {
    const anchor = Buffer.from(`<a name="vbc0000${i + 1}">`, 'utf8');
    assert(offset > 0, `zero offset for chapter ${i + 1}`);
    assert(
      text.subarray(offset, offset + anchor.length).equals(anchor),
      `filepos of chapter ${i + 1} points past the anchor`,
    );
  });

  const tocPos = Number(str.match(/type="toc"[^>]*filepos=(\d{10})/)![1]);
  const tocAnchor = Buffer.from('<a name="vbtoc">', 'utf8');
  assert(
    text.subarray(tocPos, tocPos + tocAnchor.length).equals(tocAnchor),
    'guide/toc points past the anchor',
  );
});

check('MOBI: no self-closing tags are left in the markup', () => {
  const html = mobi.buildHtml({
    ...makeBook(1),
    chapters: [
      { title: 'Глава', xhtml: '<p>Текст<br/>строка</p><hr/><img src="x.jpg" alt=""/>' },
    ],
  });
  assert(!/<br\s*\/>/.test(html), '<br/> is left');
  assert(!/<hr\s*\/>/.test(html), '<hr/> is left');
  assert(!/<img[^>]*\/>/.test(html), 'a self-closing <img/> is left');
});

await checkAsync('FB2: the XML is well formed and the chapters are there', async () => {
  const xml = (await toBuf(fb2.build(makeBook(3)))).toString('utf8');
  assertWellFormed(xml, 'fb2');
  assertEq((xml.match(/<section>/g) || []).length, 3, 'one section per chapter');
  assert(xml.includes('<book-title>Тест &amp; проверка &lt;тегов&gt;</book-title>'), 'title');
  assert(!/<(div|span|em|b|i)[\s>]/.test(xml), 'HTML tags leaked into the FB2');
  assert(xml.includes('<emphasis>'), 'italics were not turned into emphasis');
});

await checkAsync('TXT: BOM, headings and chapter text', async () => {
  const buf = await toBuf(txt.build(makeBook(2)));
  assertEq(buf.subarray(0, 3).toString('hex'), 'efbbbf', 'no BOM');
  const text = buf.toString('utf8');
  assert(text.includes('Глава 1'), 'no first chapter');
  assert(text.includes('Глава 2'), 'no second chapter');
  assert(!/<[a-z]/i.test(text), 'tags are left');
  assert(text.includes('Amp & lt < gt >'), 'entities were not unescaped');
});

await checkAsync('ZIP: deflate really compresses and the CRC is computed', async () => {
  const payload = 'повторяющийся текст '.repeat(500);
  const buf = await toBuf(await zip([{ name: 'a.txt', data: payload }]));
  const files = readZip(buf);
  assertEq(files.get('a.txt')!.method, 8, 'should be deflate');
  assertEq(files.get('a.txt')!.bytes.toString('utf8'), payload, 'content did not match');
  assert(buf.length < Buffer.byteLength(payload) / 3, 'no compression happened');
});

await checkAsync('a 60-chapter book builds into every format', async () => {
  const book = makeBook(60);
  const epubBuf = await toBuf(await epub.build(book));
  const mobiBuf = await toBuf(mobi.build(book));
  assert(epubBuf.length > 5000, 'suspiciously small EPUB');
  assert(mobiBuf.length > 5000, 'suspiciously small MOBI');

  const files = readZip(epubBuf);
  assert(files.has('OEBPS/ch060.xhtml'), 'the sixtieth chapter went missing');

  const db = readPalmDb(mobiBuf);
  const r0 = db.records[0]!;
  const count = r0.readUInt16BE(8);
  const parts: Buffer[] = [];
  for (let i = 1; i <= count; i += 1) parts.push(palmDocDecompress(db.records[i]!));
  assertEq(Buffer.concat(parts).length, r0.readUInt32BE(4), 'text length disagrees on a big book');
});

// ---------- packaging ----------

interface Manifest {
  version: string;
  background: { service_worker: string };
  action: { default_popup: string };
  icons: Record<string, string>;
  content_scripts: { js: string[]; matches: string[] }[];
}

const manifest: Manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));

check('the manifest and the popup inject the same bundle', () => {
  const fromManifest = manifest.content_scripts[0]!.js;
  const popup = readFileSync(join(ROOT, 'src', 'popup.ts'), 'utf8');
  const block = popup.match(/const SCRIPTS = \[([\s\S]*?)\];/);
  assert(block, 'no SCRIPTS list found in popup.ts');
  const fromPopup = [...block![1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
  assertEq(
    fromPopup.join('|'),
    fromManifest.join('|'),
    'the lists diverged — the manual launch on an unknown site would break',
  );
});

check('the manifest version matches package.json', () => {
  // They diverge silently: npm version edits package.json, while what ships to
  // the browser is the manifest — and the release ends up labelled wrong.
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string };
  assertEq(manifest.version, pkg.version, 'the versions diverged');
  assert(/^\d+\.\d+\.\d+$/.test(manifest.version), `version is not X.Y.Z: ${manifest.version}`);
});

check('every file the manifest names exists', () => {
  // dist/ is committed, so this also catches "forgot to run the build".
  const paths = [
    ...manifest.content_scripts[0]!.js,
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
  ];
  for (const p of paths) {
    assert(existsSync(join(ROOT, p)), `missing file ${p}`);
  }
});

check('the browser can actually load the built bundles', () => {
  // Chromium reads extension files through IsStringUTF8(), which rejects Unicode
  // non-characters and lone surrogates, and then refuses the WHOLE extension:
  // "Could not load file for content script. It isn't UTF-8 encoded." That
  // happens at install time, where no other test looks — and it really happened,
  // over the U+FFFE/U+FFFF that used to sit as raw characters in the
  // control-character regex in lib/html.ts. A bundler copies regex literals
  // through verbatim, so the only defence is not writing those bytes at all.
  for (const file of ['dist/content.js', 'dist/popup.js', 'dist/background.js', 'dist/popup.html']) {
    const bytes = readFileSync(join(ROOT, file));
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (err) {
      throw new Error(`${file} is not valid UTF-8: ${(err as Error).message}`);
    }
    for (const ch of text) {
      const c = ch.codePointAt(0)!;
      const nonCharacter = c === 0xfffe || c === 0xffff || (c >= 0xfdd0 && c <= 0xfdef);
      const loneSurrogate = c >= 0xd800 && c <= 0xdfff;
      assert(
        !nonCharacter && !loneSurrogate,
        `${file}: U+${c.toString(16).toUpperCase()} — Chromium will reject the extension over it`,
      );
    }
  }
});

check('every site adapter has its domain in the manifest matches', () => {
  const matches = manifest.content_scripts[0]!.matches.join(' ');
  const domains: Record<string, string> = {
    ficbook: 'ficbook.net', ao3: 'archiveofourown.org', fanficsme: 'fanfics.me',
    ffnet: 'fanfiction.net', wattpad: 'wattpad.com', royalroad: 'royalroad.com',
  };
  for (const adapter of SITE_ADAPTERS) {
    const domain = domains[adapter.id];
    assert(domain, `adapter ${adapter.id} is not described in this test`);
    assert(
      matches.includes(domain!),
      `${domain} is missing from matches — the button will not appear by itself`,
    );
  }
});

console.log(`\npassed: ${passed}, failed: ${failures.length}`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
