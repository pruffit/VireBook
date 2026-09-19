// Adapters against fixtures taken from the structure of live pages.
// The prose in the fixtures is ours — what is under test is the markup, not
// somebody else's writing.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { JSDOM } from 'jsdom';

import type { ParseContext } from '../src/types.ts';
import { ao3, ficbook, generic } from '../src/adapters/index.ts';
import { resolveAdapter } from '../src/core.ts';
import { sanitize } from '../src/lib/html.ts';
import * as epub from '../src/lib/epub.ts';
import * as fb2 from '../src/lib/fb2.ts';
import * as mobi from '../src/lib/mobi.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = join(ROOT, 'test', 'fixtures');

// The adapters run against a DOM; in Node that DOM is jsdom.
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.Node = dom.window.Node;

let passed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
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

function assertEq<T>(a: T, b: T, msg: string): void {
  if (a !== b) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

const fixture = (name: string): string => readFileSync(join(FIXTURES, name), 'utf8');
const docOf = (html: string, url: string): Document => new JSDOM(html, { url }).window.document;

interface TestContext extends ParseContext {
  fetched: string[];
}

function makeCtx(routes: Record<string, string>): TestContext {
  const fetched: string[] = [];
  const route = (url: string): string => {
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) throw new Error(`no fixture defined for ${url}`);
    return routes[key]!;
  };
  return {
    fetched,
    progress: () => {},
    async fetchDoc(url: string) {
      fetched.push(url);
      return docOf(route(url), url);
    },
    async fetchText(url: string) {
      return route(url);
    },
    async fetchBytes() {
      throw new Error('fetchBytes is not used in these tests');
    },
    parseFragment: (html: string) => docOf(`<body>${html}</body>`, 'https://example.org/').body,
  };
}

function readZip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let i = 0;
  while (i + 30 <= buf.length && buf.readUInt32LE(i) === 0x04034b50) {
    const method = buf.readUInt16LE(i + 8);
    const packed = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.subarray(i + 30, i + 30 + nameLen).toString('utf8');
    const start = i + 30 + nameLen + extraLen;
    const payload = buf.subarray(start, start + packed);
    files.set(name, method === 8 ? inflateRawSync(payload) : payload);
    i = start + packed;
  }
  return files;
}

// ================== html.sanitize ==================

await test('sanitize throws out scripts, ads and hidden blocks', () => {
  const doc = docOf(
    `<div id="c">
      <script>alert(1)</script>
      <div class="fanfic-text-promo">реклама</div>
      <div class="sr-only">для скринридера</div>
      <div aria-hidden="true">спрятано</div>
      <div style="display:none">невидимо</div>
      <p>Настоящий текст.</p>
    </div>`,
    'https://example.org/a',
  );
  const { xhtml } = sanitize(doc.getElementById('c')!, {
    baseUrl: 'https://example.org/a',
    dropSelectors: ['.fanfic-text-promo'],
  });
  assert(!/alert|реклама|скринридера|спрятано|невидимо/.test(xhtml), `junk survived: ${xhtml}`);
  assert(xhtml.includes('Настоящий текст.'), 'the text was lost');
});

await test('sanitize yields valid XHTML and absolute links', () => {
  const doc = docOf(
    `<div id="c"><p>Текст <br> с <em>курсивом</em> и <a href="/rel">ссылкой</a> и &amp; амперсандом.</p>
     <img src="/pic.jpg" alt="картинка"></div>`,
    'https://example.org/dir/page',
  );
  const { xhtml } = sanitize(doc.getElementById('c')!, { baseUrl: 'https://example.org/dir/page' });
  assert(xhtml.includes('<br/>'), 'br must be self-closing');
  assert(xhtml.includes('href="https://example.org/rel"'), `link is not absolute: ${xhtml}`);
  assert(xhtml.includes('&amp;'), 'the ampersand is not escaped');
  assert(xhtml.includes('<img'), 'the img was lost');
});

await test('sanitize unwraps same-page anchors into plain text', () => {
  const doc = docOf(
    '<div id="c"><p>До <a href="#part_content">якорь</a> после.</p></div>',
    'https://ficbook.net/readfic/1',
  );
  const { xhtml } = sanitize(doc.getElementById('c')!, { baseUrl: 'https://ficbook.net/readfic/1' });
  assert(xhtml.includes('якорь'), 'the link text was lost');
  assert(!xhtml.includes('<a'), `the anchor stayed a link: ${xhtml}`);
});

// ================== ficbook ==================

const FICBOOK_ROUTES: Record<string, string> = {
  '/readfic/10709016/27552317': fixture('ficbook-chapter.html'),
  '/readfic/10709016/27755433': fixture('ficbook-chapter.html'),
  '/readfic/10709016/27756597': fixture('ficbook-chapter.html'),
  '/readfic/10709016': fixture('ficbook-work.html'),
};

const FICBOOK_URL = 'https://ficbook.net/readfic/10709016';
const ficbookBook = () =>
  ficbook.parse(docOf(fixture('ficbook-work.html'), FICBOOK_URL), FICBOOK_URL, makeCtx(FICBOOK_ROUTES));

await test('ficbook: every part is collected from the work page', async () => {
  const book = await ficbookBook();
  assertEq(book.title, 'Дом у реки', 'title');
  assertEq(book.author, 'Тестовый Автор', 'author');
  assertEq(book.chapters.length, 3, 'chapter count');
  assertEq(book.language, 'ru', 'language');
  assertEq(book.siteName, 'Ficbook', 'source');
});

await test('ficbook: the header metadata is parsed', async () => {
  const book = await ficbookBook();
  assertEq(book.fandom, 'Гарри Поттер', 'fandom');
  assertEq(book.pairing, 'Анна и Борис', 'pairing');
  assertEq(book.rating, 'NC-17', 'rating');
  assertEq(book.status, 'В процессе', 'status');
  assert(book.tags.includes('Драма') && book.tags.includes('Флафф'), `tags: ${book.tags}`);
  assertEq(
    book.summaryText,
    'Короткая история про дом у реки и три дождливых дня.',
    'description',
  );
});

await test('ficbook: the promo block does not reach the chapter body', async () => {
  const book = await ficbookBook();
  const first = book.chapters[0]!;
  assertEq(first.title, 'Пилот', 'the chapter title comes from the chapter page');
  assert(!/Фикбук Плюс|premium/i.test(first.xhtml), `promo leaked in: ${first.xhtml.slice(0, 200)}`);
  assert(first.xhtml.includes('Дождь начался'), 'the chapter text was lost');
  assert(first.xhtml.includes('<em>') || first.xhtml.includes('<i>'), 'italics were lost');
});

await test('ficbook: from a chapter page the adapter goes to the work page for the contents', async () => {
  const url = 'https://ficbook.net/readfic/10709016/27552317';
  const ctx = makeCtx(FICBOOK_ROUTES);
  const book = await ficbook.parse(docOf(fixture('ficbook-chapter.html'), url), url, ctx);

  assertEq(book.chapters.length, 3, 'every part should be collected, not just one');
  assert(ctx.fetched.some((u) => u.endsWith('/readfic/10709016')), 'the work page was not requested');
  assertEq(book.sourceUrl, FICBOOK_URL, 'a link to the work, not to the chapter');
});

await test('ficbook: the already-open chapter is not downloaded again', async () => {
  const url = 'https://ficbook.net/readfic/10709016/27552317';
  const ctx = makeCtx(FICBOOK_ROUTES);
  await ficbook.parse(docOf(fixture('ficbook-chapter.html'), url), url, ctx);
  const repeats = ctx.fetched.filter((u) => u.includes('27552317')).length;
  assertEq(repeats, 0, 'the current chapter is taken from the open document');
});

// ================== AO3 ==================

const AO3_FULL = 'https://archiveofourown.org/works/85129446?view_full_work=true';

await test("AO3: the site's own download links are found", () => {
  const url = 'https://archiveofourown.org/works/85129446';
  const links = ao3.native!(docOf(fixture('ao3-full.html'), url));
  const formats = links.map((l) => l.format);
  for (const f of ['azw3', 'epub', 'mobi']) assert(formats.includes(f), `no ${f} format`);
  const epubLink = links.find((l) => l.format === 'epub')!;
  assert(
    epubLink.url!.startsWith('https://archiveofourown.org/downloads/'),
    `link is not absolute: ${epubLink.url}`,
  );
});

await test('AO3: chapters, notes and metadata', async () => {
  const book = await ao3.parse(docOf(fixture('ao3-full.html'), AO3_FULL), AO3_FULL, makeCtx({}));

  assertEq(book.title, 'River House', 'title');
  assertEq(book.author, 'TestAuthor', 'author');
  assertEq(book.chapters.length, 2, 'chapter count');
  assertEq(book.language, 'en', 'language');
  assert(book.chapters[0]!.title.includes('Chapter 1'), `chapter title: ${book.chapters[0]!.title}`);
  assert(
    book.chapters[1]!.notesXhtml!.includes('Thanks for reading'),
    "the second chapter's notes were lost",
  );
  assertEq(book.fandom, 'Original Work', 'fandom');
  assert(book.tags.includes('Slow Burn'), `tags: ${book.tags}`);
  assert(book.summaryText!.includes('house by the river'), 'summary');
});

await test('AO3: the landmark heading is cleaned out', async () => {
  const book = await ao3.parse(docOf(fixture('ao3-full.html'), AO3_FULL), AO3_FULL, makeCtx({}));
  assert(
    !/Chapter Text/.test(book.chapters[0]!.xhtml),
    `landmark survived: ${book.chapters[0]!.xhtml.slice(0, 160)}`,
  );
});

await test('AO3: without view_full_work the adapter requests the full version', async () => {
  const url = 'https://archiveofourown.org/works/85129446';
  const ctx = makeCtx({ 'view_full_work=true': fixture('ao3-full.html') });
  const book = await ao3.parse(docOf(fixture('ao3-full.html'), url), url, ctx);
  assertEq(ctx.fetched.length, 1, 'there should be exactly one request for all chapters');
  assert(ctx.fetched[0]!.includes('view_full_work=true'), 'the full view was not requested');
  assertEq(book.chapters.length, 2, 'chapters');
});

// ================== choosing an adapter ==================

await test('the adapter is chosen by domain', () => {
  const cases: [string, string][] = [
    ['https://ficbook.net/readfic/1', 'ficbook'],
    ['https://archiveofourown.org/works/1', 'ao3'],
    ['https://fanfics.me/fic123', 'fanficsme'],
    ['https://www.fanfiction.net/s/123/1/', 'ffnet'],
    ['https://www.wattpad.com/story/123-x', 'wattpad'],
    ['https://www.royalroad.com/fiction/123/x', 'royalroad'],
    ['https://example.org/some/story', 'generic'],
    ['https://notficbook.net.evil.com/x', 'generic'],
  ];
  for (const [url, expected] of cases) {
    assertEq(resolveAdapter(url).id, expected, `for ${url}`);
  }
});

// ================== the generic parser ==================

const GENERIC_CHAPTER = (n: number): string => `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
<title>Глава ${n}</title><meta property="og:title" content="Повесть о доме"></head><body>
<nav><a href="/">Главная</a><a href="/catalog">Каталог</a></nav>
<article class="chapter-content"><h1>Глава ${n}</h1>
<p>Первый абзац главы номер ${n}, достаточно длинный, чтобы пройти порог отсечки по объёму текста.</p>
<p>Второй абзац той же главы, тоже не короткий, потому что парсер отбрасывает блоки меньше двухсот символов и мы не хотим попасть под это правило.</p>
<p>Третий абзац добавлен ради объёма и связности, чтобы блок уверенно выигрывал у навигации по количеству текста.</p>
<p>Четвёртый абзац нужен, чтобы контейнер уверенно перевалил за порог в четыреста символов: настоящая глава всегда длиннее, и занижать порог ради теста было бы подгонкой.</p>
<p>Пятый абзац закрывает главу номер ${n} и добавляет ещё немного связного текста, чтобы запас над порогом был честным, а не впритык.</p>
</article></body></html>`;

await test('generic: a chapter list is recognised and walked', async () => {
  const url = 'https://example.org/book/1';
  const index = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
  <meta property="og:title" content="Повесть о доме"><meta name="author" content="Кто-то"></head><body>
  <nav><a href="/">Главная</a></nav>
  <ul class="toc">
    <li><a href="/book/1/chapter/1">Глава 1</a></li>
    <li><a href="/book/1/chapter/2">Глава 2</a></li>
    <li><a href="/book/1/chapter/3">Глава 3</a></li>
  </ul></body></html>`;

  const ctx = makeCtx({
    '/chapter/1': GENERIC_CHAPTER(1),
    '/chapter/2': GENERIC_CHAPTER(2),
    '/chapter/3': GENERIC_CHAPTER(3),
  });
  const book = await generic.parse(docOf(index, url), url, ctx);

  assertEq(book.chapters.length, 3, 'chapter count');
  assertEq(book.title, 'Повесть о доме', 'title');
  assert(book.chapters[1]!.xhtml.includes('главы номер 2'), 'the chapter order is scrambled');
});

await test('generic: with no list it follows the "next chapter" link', async () => {
  const withNext = (n: number, next: string | null): string => `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
  <title>Глава ${n}</title></head><body>
  <article class="chapter-content"><h1>Глава ${n}</h1>
  <p>Первый абзац главы номер ${n}, достаточно длинный, чтобы пройти порог отсечки по объёму текста в парсере.</p>
  <p>Второй абзац той же главы, тоже не короткий, потому что парсер отбрасывает блоки меньше двухсот символов подряд.</p>
  <p>Третий абзац добавлен ради объёма: реальная глава заведомо длиннее порога, и занижать порог ради теста было бы подгонкой под ответ.</p>
  <p>Четвёртый абзац главы номер ${n} закрывает текст и оставляет честный запас над порогом в четыреста символов.</p>
  </article>
  ${next ? `<a href="${next}">Следующая глава →</a>` : '<span>Конец</span>'}
  </body></html>`;

  const url = 'https://example.org/read/1';
  const ctx = makeCtx({
    '/read/2': withNext(2, '/read/3'),
    '/read/3': withNext(3, null),
  });
  const book = await generic.parse(docOf(withNext(1, '/read/2'), url), url, ctx);
  assertEq(book.chapters.length, 3, 'it should walk the chain to the end');
});

await test('generic: a menu and a footer are not mistaken for chapter text', async () => {
  const url = 'https://example.org/page';
  const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Стр</title></head><body>
  <nav class="menu">${Array.from({ length: 40 }, (_, i) => `<a href="/l${i}">Ссылка номер ${i}</a>`).join(' ')}</nav>
  <div class="chapter-content"><p>${'Настоящий связный текст главы. '.repeat(30)}</p></div>
  </body></html>`;
  const book = await generic.parse(docOf(html, url), url, makeCtx({}));
  assert(book.chapters[0]!.xhtml.includes('Настоящий связный текст'), 'the wrong block was taken');
  assert(!book.chapters[0]!.xhtml.includes('Ссылка номер'), 'the menu got into the chapter');
});

// ================== end to end ==================

await test('end to end: ficbook → EPUB contains the text of every chapter', async () => {
  const book = await ficbookBook();
  const buf = Buffer.from(await (await epub.build(book)).arrayBuffer());
  const files = readZip(buf);

  assertEq(files.get('mimetype')!.toString(), 'application/epub+zip', 'mimetype');
  const opf = files.get('OEBPS/content.opf')!.toString('utf8');
  assert(opf.includes('<dc:title>Дом у реки</dc:title>'), 'the title in the OPF');
  assert(opf.includes('Тестовый Автор'), 'the author in the OPF');

  for (let i = 1; i <= 3; i += 1) {
    const ch = files.get(`OEBPS/ch00${i}.xhtml`)!.toString('utf8');
    assert(ch.includes('Дождь начался'), `chapter ${i} has no text`);
    assert(!ch.includes('Фикбук Плюс'), `an ad is left in chapter ${i}`);
  }
});

await test('end to end: ficbook → MOBI assembles and the text is recoverable', async () => {
  const book = await ficbookBook();
  const buf = Buffer.from(await mobi.build(book).arrayBuffer());

  assertEq(buf.subarray(60, 68).toString('latin1'), 'BOOKMOBI', 'signature');
  const count = buf.readUInt16BE(76);
  const offsets: number[] = [];
  for (let i = 0; i < count; i += 1) offsets.push(buf.readUInt32BE(78 + i * 8));
  const r0 = buf.subarray(offsets[0], offsets[1]);
  assertEq(r0.readUInt16BE(10), 4096, 'record size');
  assert(r0.readUInt32BE(4) > 500, 'the text is suspiciously short');
});

await test('end to end: AO3 → FB2 with no HTML left over', async () => {
  const book = await ao3.parse(docOf(fixture('ao3-full.html'), AO3_FULL), AO3_FULL, makeCtx({}));
  const xml = Buffer.from(await fb2.build(book).arrayBuffer()).toString('utf8');

  assertEq((xml.match(/<section>/g) || []).length, 2, 'one section per chapter');
  assert(xml.includes('<book-title>River House</book-title>'), 'title');
  assert(!/<(div|span|p class)/.test(xml), 'HTML leaked through');
  assert(xml.includes('rain had started'), 'the chapter text was lost');
});

console.log(`\npassed: ${passed}, failed: ${failures.length}`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
