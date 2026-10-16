// Translation, with no network: the engine runs against a fake fetch and the
// book layer against a fake engine. What is under test is what happens to the
// book — structure, inline markup, batching, retries — not Google's opinion
// of a sentence.
import { inflateRawSync } from 'node:zlib';
import { JSDOM } from 'jsdom';

import type { Book } from '../src/types.ts';
import { createGoogleTranslator } from '../src/translate/google.ts';
import { translateBook, TRANSLATE_FROM, TRANSLATE_TO } from '../src/translate/book.ts';
import { joinPieces, normalizeSpacing, planBatches, splitSegment } from '../src/translate/text.ts';
import { normalizeTarget, type TranslateResult, type Translator } from '../src/translate/types.ts';
import * as epub from '../src/lib/epub.ts';

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

async function rejects(p: Promise<unknown>, pattern: RegExp, msg: string): Promise<void> {
  try {
    await p;
  } catch (err) {
    assert(pattern.test((err as Error).message + (err as Error).name), `${msg}: wrong error ${(err as Error).message}`);
    return;
  }
  throw new Error(`${msg}: did not throw`);
}

const said = (texts: string[], lang = ''): TranslateResult => ({ texts, detected: texts.map(() => lang) });

// ---------- a stand-in for the endpoint ----------
interface Call {
  url: URL;
  q: string[];
}

/** Answers every query with "ПЕРЕВОД " in front of each text run, the way a translation changes text and leaves tags. */
const translateText = (html: string): string => html.replace(/(^|>)([^<>]*[A-Za-z][^<>]*)/g, '$1ПЕРЕВОД $2');

function fakeFetch(handler: (call: Call, n: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fn: typeof fetch = async (input, init) => {
    const body = init?.body as URLSearchParams;
    const call = { url: new URL(String(input)), q: body.getAll('q') };
    calls.push(call);
    assertEq(init?.method, 'POST', 'the endpoint is called with POST');
    return handler(call, calls.length);
  };
  return { fn, calls };
}

const ok = (call: Call): Response => Response.json(call.q.map(translateText));
const engine = (f: typeof fetch, extra = {}): Translator =>
  createGoogleTranslator({ fetch: f, gap: 0, backoffBase: 1, ...extra });

// ================== text helpers ==================

await test('spacing: the stray space after a closing tag goes, other spaces stay', () => {
  assertEq(normalizeSpacing('<b>остался</b> .', 'ru'), '<b>остался</b>.', 'period');
  assertEq(normalizeSpacing('<i>да</i> , <i>нет</i> !', 'ru'), '<i>да</i>, <i>нет</i>!', 'comma and bang');
  assertEq(normalizeSpacing('<i>а</i> ? <i>б</i> ; <i>в</i> :', 'ru'), '<i>а</i>? <i>б</i>; <i>в</i>:', 'question, semicolon, colon');
  assertEq(normalizeSpacing('<i>«да»</i> ” и <b>(нет</b> )', 'ru'), '<i>«да»</i>” и <b>(нет</b>)', 'closing quote and bracket');
  assertEq(normalizeSpacing('слово . и <i>тире</i> — дальше', 'ru'), 'слово . и <i>тире</i> — дальше', 'no tag, no change');
  assertEq(normalizeSpacing('<b>он</b> и <i>она</i> .', 'ru'), '<b>он</b> и <i>она</i>.', 'only the space before punctuation');
});

await test('spacing: French keeps its space before ? ! : ;', () => {
  assertEq(normalizeSpacing('<i>Quoi</i> ? <b>Non</b> .', 'fr'), '<i>Quoi</i> ? <b>Non</b>.', 'fr');
});

await test('batches stay under the character budget and the segment cap', () => {
  const pieces = Array.from({ length: 50 }, (_, i) => 'x'.repeat(100 + (i % 7) * 40));
  const groups = planBatches(pieces, 1000, 6);
  assertEq(groups.flat().length, 50, 'every piece lands in a batch');
  assertEq(groups.flat().join(), Array.from({ length: 50 }, (_, i) => i).join(), 'order is kept');
  for (const g of groups) {
    assert(g.length <= 6, `a batch of ${g.length} segments`);
    const size = g.reduce((n, i) => n + pieces[i]!.length, 0);
    assert(size <= 1000 || g.length === 1, `a batch of ${size} characters`);
  }
  const huge = planBatches(['a', 'b'.repeat(5000), 'c'], 1000, 6);
  assertEq(huge.length, 3, 'an oversized piece travels alone');
});

await test('a long fragment is cut at sentence ends, never inside an inline tag', () => {
  const sentence = 'The rain kept falling on the old roof. ';
  const html = `<i>${sentence.repeat(30)}</i> ${sentence.repeat(30)}and <b>that</b> was it.`;
  const pieces = splitSegment(html, 400);
  assert(pieces.length > 1, 'it should have been cut');
  assertEq(pieces.join(''), html, 'nothing lost, nothing added');
  assert(pieces.every((p) => p.length <= 400 || p.startsWith('<i>')), 'a piece over the budget that is not the <i> stretch');
  for (const p of pieces) {
    assertEq((p.match(/<i>/g) || []).length, (p.match(/<\/i>/g) || []).length, 'a piece with an unclosed <i>');
  }
  assertEq(joinPieces(['One. ', 'Two.']), 'One. Two.', 'join keeps one space');
});

await test('only known language codes switch translation on', () => {
  assertEq(normalizeTarget('ru'), 'ru', 'ru');
  assertEq(normalizeTarget('zh-CN'), 'zh-CN', 'zh-CN');
  assertEq(normalizeTarget('klingon'), '', 'unknown');
  assertEq(normalizeTarget(undefined), '', 'missing');
});

// ================== the engine ==================

await test('google: one POST with several q, the right language pair, html format', async () => {
  const f = fakeFetch(ok);
  const out = (await engine(f.fn).translate(['<p>Hello <i>there</i></p>', 'Plain'], 'auto', 'ru')).texts;
  assertEq(f.calls.length, 1, 'requests');
  const u = f.calls[0]!.url;
  assertEq(u.origin + u.pathname, 'https://translate.googleapis.com/translate_a/t', 'endpoint');
  assertEq(u.searchParams.get('client'), 'gtx', 'client');
  assertEq(u.searchParams.get('sl'), 'auto', 'source');
  assertEq(u.searchParams.get('tl'), 'ru', 'target');
  assertEq(u.searchParams.get('format'), 'html', 'format');
  assertEq(f.calls[0]!.q.length, 2, 'q count');
  assertEq(out[0], '<p>ПЕРЕВОД Hello <i>ПЕРЕВОД there</i></p>', 'first');
  assertEq(out[1], 'ПЕРЕВОД Plain', 'second');
});

await test('google: pairs [text, detected language] are understood too', async () => {
  const f = fakeFetch((c) => Response.json(c.q.map((q) => [`T ${q}`, 'en'])));
  const out = (await engine(f.fn).translate(['a', 'b'], 'auto', 'de')).texts;
  assertEq(out.join('|'), 'T a|T b', 'answers');
});

await test('google: the detected source language is surfaced, empty when the engine does not say', async () => {
  const f = fakeFetch((c) => Response.json(c.q.map((q) => [`T ${q}`, 'uk'])));
  const r = await engine(f.fn).translate(['a', '', 'b'], 'auto', 'ru');
  assertEq(r.detected.join('|'), 'uk||uk', 'detected');
  const g = fakeFetch((c) => Response.json(c.q.map((q) => `T ${q}`)));
  assertEq((await engine(g.fn).translate(['a'], 'en', 'ru')).detected.join('|'), '', 'bare strings');
});

await test('google: requests respect the budget and the segment cap, and the order survives', async () => {
  const f = fakeFetch(ok);
  const segments = Array.from({ length: 95 }, (_, i) => `<p>Segment ${i} ${'word '.repeat(20)}</p>`);
  const out = (await engine(f.fn, { budget: 1500, maxSegments: 10 }).translate(segments, 'auto', 'ru')).texts;
  assertEq(out.length, 95, 'answers');
  assert(f.calls.length >= 10, `${f.calls.length} requests is too few for the cap`);
  for (const c of f.calls) {
    assert(c.q.length <= 10, `${c.q.length} segments in one request`);
    const size = c.q.reduce((n, q) => n + q.length, 0);
    assert(size <= 1500 || c.q.length === 1, `${size} characters in one request`);
  }
  out.forEach((o, i) => assert(o.includes(`Segment ${i} `), `segment ${i} came back out of order`));
});

await test('google: a segment over the budget is cut, translated in parts and put back together', async () => {
  const f = fakeFetch(ok);
  const long = `${'The night was long and quiet. '.repeat(60)}`;
  const out = (await engine(f.fn, { budget: 500 }).translate([long], 'auto', 'ru')).texts;
  assert(f.calls.length > 1, 'it should have taken several requests');
  assert(f.calls.every((c) => c.q.every((q) => q.length <= 500)), 'a piece over the budget');
  assertEq(out.length, 1, 'one answer for one segment');
  assert(out[0]!.startsWith('ПЕРЕВОД The night'), 'start');
  assertEq((out[0]!.match(/ПЕРЕВОД/g) || []).length, f.calls.reduce((n, c) => n + c.q.length, 0), 'every piece is in');
});

await test('google: empty segments are not sent and do not shift the answers', async () => {
  const f = fakeFetch(ok);
  const out = (await engine(f.fn).translate(['One', '', '  ', 'Two'], 'auto', 'ru')).texts;
  assertEq(f.calls[0]!.q.length, 2, 'only the two real ones go out');
  assertEq(out.join('|'), 'ПЕРЕВОД One||  |ПЕРЕВОД Two', 'places kept');
});

await test('google: 429 is retried and the retry succeeds', async () => {
  const f = fakeFetch((c, n) => (n === 1 ? new Response('', { status: 429, headers: { 'Retry-After': '0' } }) : ok(c)));
  const out = (await engine(f.fn).translate(['Hello'], 'auto', 'ru')).texts;
  assertEq(f.calls.length, 2, 'attempts');
  assertEq(out[0], 'ПЕРЕВОД Hello', 'answer');
});

await test('google: 503 and a dropped connection are retried as well', async () => {
  let n = 0;
  const f = fakeFetch((c) => {
    n += 1;
    if (n === 1) return new Response('', { status: 503 });
    if (n === 2) throw new TypeError('Failed to fetch');
    return ok(c);
  });
  const out = (await engine(f.fn).translate(['Hello'], 'auto', 'ru')).texts;
  assertEq(out[0], 'ПЕРЕВОД Hello', 'answer');
  assertEq(f.calls.length, 3, 'attempts');
});

await test('google: a persistent refusal ends in a clear error', async () => {
  const f = fakeFetch(() => new Response('', { status: 429, headers: { 'Retry-After': '0' } }));
  await rejects(engine(f.fn, { maxAttempts: 3 }).translate(['Hello'], 'auto', 'ru'), /limiting requests/, '429');
  assertEq(f.calls.length, 3, 'it gave up after the allowed attempts');
  const g = fakeFetch(() => new Response('', { status: 403 }));
  await rejects(engine(g.fn).translate(['Hello'], 'auto', 'ru'), /HTTP 403/, '403');
  assertEq(g.calls.length, 1, 'a 403 is not retried');
});

await test('google: an answer of the wrong length is refused, not misaligned', async () => {
  const f = fakeFetch(() => Response.json(['only one']));
  await rejects(engine(f.fn).translate(['a', 'b'], 'auto', 'ru'), /shape/, 'mismatch');
});

await test('google: an aborted signal stops it before and between requests', async () => {
  const f = fakeFetch(ok);
  const ac = new AbortController();
  ac.abort();
  await rejects(engine(f.fn).translate(['Hello'], 'auto', 'ru', ac.signal), /Abort|Cancelled/, 'before');
  assertEq(f.calls.length, 0, 'no request after abort');

  const g = fakeFetch(ok);
  const mid = new AbortController();
  const slow: typeof fetch = async (input, init) => {
    const res = await g.fn(input, init);
    mid.abort();
    return res;
  };
  const many = Array.from({ length: 6 }, (_, i) => `Seg ${i} ${'x'.repeat(50)}`);
  await rejects(
    engine(slow, { budget: 100, maxSegments: 1 }).translate(many, 'auto', 'ru', mid.signal),
    /Abort|Cancelled/,
    'between',
  );
  assertEq(g.calls.length, 1, 'it stopped after the first request');
});

// ================== the book ==================

function makeBook(): Book {
  return {
    title: 'River & House',
    author: 'TestAuthor',
    language: 'en',
    uuid: '11111111-2222-3333-4444-555555555555',
    tags: ['Slow Burn', 'AU'],
    fandom: 'Original Work',
    summaryText: 'A house by the river.',
    summaryXhtml: '<p>A house by the <em>river</em>.</p>',
    chapters: [
      {
        title: 'Chapter 1: Arrival',
        xhtml:
          '<p>She said, <i>"Don\'t go."</i> And he <b>stayed</b>.</p>' +
          '<p>* * *</p>' +
          '<blockquote><p>Quoted <em>line</em>.</p></blockquote>' +
          '<ul><li>One <em>item</em></li><li>Two</li></ul>' +
          '<hr/><h3>Scene</h3><p>Fish &amp; chips.<br/>Second line.</p>',
        notesXhtml: '<p>Thanks for <i>reading</i>.</p>',
      },
      { title: 'Chapter 2', xhtml: '<p>The rain had started.</p>' },
    ],
  };
}

function recorder(lang = ''): { tr: Translator; sent: string[]; to: string[] } {
  const sent: string[] = [];
  const to: string[] = [];
  const tr: Translator = {
    id: 'fake',
    async translate(segments, _from, target) {
      sent.push(...segments);
      to.push(target);
      return said(segments.map(translateText), lang);
    },
  };
  return { tr, sent, to };
}

await test('translateBook: blocks and inline markup survive, the wrappers stay', async () => {
  const { tr, sent } = recorder();
  const out = await translateBook(makeBook(), 'ru', tr, () => {});
  const c1 = out.chapters[0]!.xhtml;
  assert(c1.startsWith('<p>ПЕРЕВОД She said, <i>'), `paragraph: ${c1.slice(0, 200)}`);
  assert(/<i>ПЕРЕВОД "Don't go\."<\/i>/.test(c1), `italic: ${c1}`);
  assert(/<b>ПЕРЕВОД stayed<\/b>/.test(c1), 'bold');
  assert(/<blockquote><p>ПЕРЕВОД Quoted <em>ПЕРЕВОД line<\/em>.<\/p><\/blockquote>/.test(c1), `blockquote: ${c1}`);
  assert(/<ul><li>ПЕРЕВОД One <em>ПЕРЕВОД item<\/em><\/li><li>ПЕРЕВОД Two<\/li><\/ul>/.test(c1), `list: ${c1}`);
  assert(c1.includes('<hr/>'), 'the rule');
  assert(c1.includes('<h3>ПЕРЕВОД Scene</h3>'), 'the heading stays a heading');
  assert(c1.includes('<p>* * *</p>'), 'a scene break is left as it was');
  assert(/<p>ПЕРЕВОД Fish &amp; chips\.<br\/>ПЕРЕВОД Second line\.<\/p>/.test(c1), `br and entity: ${c1}`);
  assert(!sent.some((s) => s === '* * *' || s.includes('<p>')), 'wrappers and letterless blocks do not go out');
  assert(sent.includes('Fish &amp; chips.<br>Second line.'), `the block goes out with its inline markup: ${JSON.stringify(sent)}`);
  assert(out.chapters[0]!.notesXhtml!.includes('<i>ПЕРЕВОД reading</i>'), 'notes');
});

await test('translateBook: titles, summary and language change; author, tags and fandom do not', async () => {
  const { tr } = recorder();
  const book = makeBook();
  const out = await translateBook(book, 'ru', tr, () => {});
  assertEq(out.title, 'ПЕРЕВОД River & House', 'title (read back as text, not as markup)');
  assertEq(out.chapters[0]!.title, 'ПЕРЕВОД Chapter 1: Arrival', 'chapter title');
  assertEq(out.summaryText, 'ПЕРЕВОД A house by the river.', 'summary text');
  assertEq(out.summaryXhtml, '<p>ПЕРЕВОД A house by the <em>ПЕРЕВОД river</em>.</p>', 'summary markup');
  assertEq(out.language, 'ru', 'language');
  assertEq(out.author, 'TestAuthor', 'author');
  assertEq(out.tags.join(), 'Slow Burn,AU', 'tags');
  assertEq(out.fandom, 'Original Work', 'fandom');
  assertEq(book.language, 'en', 'the input book is not mutated');
  assertEq(book.chapters[0]!.title, 'Chapter 1: Arrival', 'nor its chapters');
});

await test('translateBook: output is well-formed even when the engine returns loose markup', async () => {
  const sloppy: Translator = {
    id: 'sloppy',
    async translate(segments) {
      return said(segments.map((s) => `<font color="red"><script>x()</script>${s} <b>unclosed<br>tail</font>`));
    },
  };
  const out = await translateBook(makeBook(), 'ru', sloppy, () => {});
  const xml = `<body>${out.chapters[0]!.xhtml}</body>`;
  const parsed = new dom.window.DOMParser().parseFromString(`<root>${xml}</root>`, 'application/xml');
  assert(!parsed.querySelector('parsererror'), `not well-formed: ${out.chapters[0]!.xhtml.slice(0, 300)}`);
  assert(!/<script|<font|color=/.test(out.chapters[0]!.xhtml), 'disallowed markup came through');
});

await test('translateBook: a block the engine returns empty keeps its original text', async () => {
  const dropper: Translator = { id: 'drop', async translate(s) { return said(s.map(() => '')); } };
  const out = await translateBook(makeBook(), 'ru', dropper, () => {});
  assert(out.chapters[1]!.xhtml.includes('The rain had started.'), 'text lost');
  assertEq(out.title, 'River & House', 'title falls back');
});

await test('translateBook: a Ukrainian book labelled ru is still translated into Russian', async () => {
  const { tr } = recorder('uk');
  const book = makeBook();
  book.language = 'ru';
  const out = await translateBook(book, 'ru', tr, () => {});
  assert(out !== book, 'the book was skipped');
  assertEq(out.title, 'ПЕРЕВОД River & House', 'title translated');
  assert(out.chapters[1]!.xhtml.includes('ПЕРЕВОД The rain'), 'second chapter translated');
  assertEq(out.language, 'ru', 'language set to the target');
});

await test('translateBook: a book already in the target language is skipped after the first chapter', async () => {
  const { tr, sent } = recorder('en');
  const lines: string[] = [];
  const book = makeBook();
  const out = await translateBook(book, 'en', tr, (t) => lines.push(t));
  assertEq(out, book, 'the very same book');
  assert(!sent.includes('River &amp; House') && !sent.some((x) => x.includes('rain had started')), `only chapter 1 was sent: ${JSON.stringify(sent)}`);
  assert(sent.some((x) => x.includes('Fish &amp; chips')), 'chapter 1 was sent');
  assert(lines.some((l) => /already in English/.test(l)), `progress: ${lines}`);
  assert(!lines.some((l) => /title and summary|chapter 2/.test(l)), 'it went on after deciding');
});

await test('translateBook: subtags compare by primary language (zh vs zh-CN, pt-BR vs pt)', async () => {
  for (const [detected, target] of [['zh', 'zh-CN'], ['pt-BR', 'pt'], ['zh-CN', 'zh-CN']]) {
    const book = makeBook();
    const out = await translateBook(book, target!, recorder(detected).tr, () => {});
    assertEq(out, book, `${detected} → ${target} should be skipped`);
  }
});

await test('translateBook: short and minority segments do not flip the decision', async () => {
  // Long prose is English; titles and one-liners are guessed as Russian.
  const byLength: Translator = {
    id: 'len',
    async translate(segments) {
      return { texts: segments.map(translateText), detected: segments.map((x) => (x.length > 30 ? 'en' : 'ru')) };
    },
  };
  const book = makeBook();
  assertEq(await translateBook(book, 'en', byLength, () => {}), book, 'English prose wins: skipped for en');
  const out = await translateBook(book, 'ru', byLength, () => {});
  assert(out !== book && out.language === 'ru', 'English prose wins: translated for ru');
});

await test('translateBook: no detection from the engine means no skip', async () => {
  const book = makeBook();
  book.language = 'en';
  const out = await translateBook(book, 'en', recorder().tr, () => {});
  assert(out !== book, 'skipped without any evidence');
});

const detectScript: Translator = {
  id: 'script',
  async translate(segments) {
    return { texts: segments.map(translateText), detected: segments.map((x) => (/[а-яё]/i.test(x) ? 'ru' : 'en')) };
  },
};

const LONG_EN = '<p>She walked down to the river and watched the water for a long while.</p>';
const LONG_RU = '<p>Спасибо всем, кто читает эту историю и оставляет свои отзывы под главами.</p>';

await test('translateBook: author notes in another language do not decide the vote', async () => {
  const book = makeBook();
  book.chapters = [{ title: 'One', xhtml: LONG_EN, notesXhtml: LONG_RU.repeat(3) }];
  const out = await translateBook(book, 'ru', detectScript, () => {});
  assert(out !== book, 'the Russian notes made it look like a Russian book');
  assert(out.chapters[0]!.xhtml.includes('ПЕРЕВОД She walked'), 'body translated');
});

await test('translateBook: a first chapter too small to vote hands the decision to the next one', async () => {
  const book = makeBook();
  book.chapters = [
    { title: 'One', xhtml: '<p>Hi there.</p>' },
    { title: 'Two', xhtml: LONG_EN },
  ];
  assertEq(await translateBook(book, 'en', detectScript, () => {}), book, 'chapter 2 says English: skipped');
  const out = await translateBook(book, 'ru', detectScript, () => {});
  assert(out !== book && out.chapters[0]!.xhtml.includes('ПЕРЕВОД Hi there'), 'translated, small chapter included');
});

await test('translateBook: when no chapter is big enough to vote, everything is translated', async () => {
  const book = makeBook();
  book.chapters = [{ title: 'One', xhtml: '<p>Hi.</p>' }, { title: 'Two', xhtml: '<p>Bye.</p>' }];
  const out = await translateBook(book, 'en', detectScript, () => {});
  assert(out !== book && out.language === 'en', 'skipped on no evidence');
  assert(out.chapters[1]!.xhtml.includes('ПЕРЕВОД Bye'), 'second chapter translated');
});

function threeChapters(): Book {
  const book = makeBook();
  book.chapters = ['One', 'Two', 'Three'].map((t) => ({ title: t, xhtml: LONG_EN.replace('river', 'river ' + t) }));
  return book;
}

/** An engine that refuses whatever mentions `marker`, the way a persistent 429 refuses a request. */
function refusing(marker: string, error = new Error('Google Translate is limiting requests.')): Translator {
  return {
    id: 'refusing',
    async translate(segments) {
      if (segments.some((x) => x.includes(marker))) throw error;
      return said(segments.map(translateText));
    },
  };
}

await test('translateBook: a chapter the engine keeps refusing stays original, the rest is translated and counted', async () => {
  const report: { failedChapters?: number; failure?: string } = {};
  const out = await translateBook(threeChapters(), 'ru', refusing('river Two'), () => {}, undefined, report);
  assert(out.chapters[0]!.xhtml.includes('ПЕРЕВОД She walked'), 'chapter 1 translated');
  assert(out.chapters[1]!.xhtml.includes('She walked down to the river Two'), 'chapter 2 original');
  assert(!out.chapters[1]!.xhtml.includes('ПЕРЕВОД'), 'chapter 2 half-translated');
  assert(out.chapters[2]!.xhtml.includes('ПЕРЕВОД She walked'), 'chapter 3 translated');
  assertEq(out.language, 'ru', 'language');
  assertEq(report.failedChapters, 1, 'count');
  assert(/1 of 3 chapters stayed untranslated/.test(report.failure ?? '') && /limiting requests/.test(report.failure ?? ''), `message: ${report.failure}`);
});

await test('translateBook: a failed front matter keeps the original title and summary', async () => {
  const out = await translateBook(makeBook(), 'ru', refusing('River &amp; House'), () => {});
  assertEq(out.title, 'River & House', 'title');
  assertEq(out.summaryText, 'A house by the river.', 'summary');
  assert(out.chapters[1]!.xhtml.includes('ПЕРЕВОД The rain'), 'chapters translated');
});

await test('translateBook: with every chapter refused it throws, not a book with no translation', async () => {
  await rejects(translateBook(threeChapters(), 'ru', refusing('river'), () => {}), /limiting requests/, 'all refused');
});

await test('translateBook: an abort is never swallowed as a failed chapter', async () => {
  const err = new Error('Cancelled');
  err.name = 'AbortError';
  await rejects(translateBook(threeChapters(), 'ru', refusing('river Two', err), () => {}), /Cancelled|Abort/, 'abort');
});

await test('translateBook: progress counts chapters inside its band, before assembling', async () => {
  const { tr } = recorder();
  const seen: [string, number | undefined][] = [];
  await translateBook(makeBook(), 'ru', tr, (t, p) => seen.push([t, p]));
  const chapters = seen.filter(([t]) => /^Translating chapter/.test(t));
  assertEq(chapters.map(([t]) => t).join('|'), 'Translating chapter 1 of 2…|Translating chapter 2 of 2…', 'labels');
  for (const [, p] of seen) {
    assert(p !== undefined && p >= TRANSLATE_FROM && p < TRANSLATE_TO, `percent ${p} is outside the band`);
  }
  assert(TRANSLATE_TO < 90, 'the band must end before "Assembling…"');
  assert(chapters[1]![1]! > chapters[0]![1]!, 'the bar moves forward');
});

await test('translateBook: abort stops the work between chapters', async () => {
  const ac = new AbortController();
  let calls = 0;
  const tr: Translator = {
    id: 'abort',
    async translate(segments) {
      calls += 1;
      if (calls === 2) ac.abort();
      return said(segments.map(translateText));
    },
  };
  await rejects(translateBook(makeBook(), 'ru', tr, () => {}, ac.signal), /Abort|Cancelled/, 'abort');
  assertEq(calls, 2, 'front matter, chapter 1, and then it stopped');
});

// ================== a file built from a translated book ==================

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

await test('EPUB from a translated book: translated text, target dc:language, well-formed', async () => {
  const f = fakeFetch(ok);
  const out = await translateBook(makeBook(), 'ru', engine(f.fn), () => {});
  const files = readZip(Buffer.from(await (await epub.build(out)).arrayBuffer()));
  const opf = files.get('OEBPS/content.opf')!.toString('utf8');
  assert(opf.includes('<dc:language>ru</dc:language>'), 'dc:language is not ru');
  assert(opf.includes('ПЕРЕВОД River &amp; House'), 'translated title in the package');

  const ch = files.get('OEBPS/ch001.xhtml')!.toString('utf8');
  assert(ch.includes('ПЕРЕВОД She said'), 'chapter text is not translated');
  assert(ch.includes('<i>ПЕРЕВОД "Don\'t go."</i>'), 'italics lost');
  for (const [name, bytes] of files) {
    if (!/\.(xhtml|opf|ncx)$/.test(name)) continue;
    const parsed = new dom.window.DOMParser().parseFromString(bytes.toString('utf8'), 'application/xml');
    assert(!parsed.querySelector('parsererror'), `${name} is not well-formed XML`);
  }
});

console.log(`\npassed: ${passed}, failed: ${failures.length}`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
