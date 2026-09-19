// AO3 — selectors checked against the live page on 2026-09-15.
// Two quirks: ?view_full_work=true returns every chapter in one request, and
// the site already builds EPUB/AZW3/MOBI itself, better than we do (kindlegen).
// So the adapter offers the ready-made file first and only then assembles its own.
import type { Adapter, Book, Chapter, NativeDownload, ParseContext } from '../types.ts';
import { absolutize, sanitize, toPlainText } from '../lib/html.ts';
import * as B from './base.ts';

const SITE = 'Archive of Our Own';
const DROP = ['h3.landmark', '.landmark', '#work-skin ~ *', '.kudos', '.comments'];

function workId(url: string): string | null {
  const m = url.match(/\/works\/(\d+)/);
  return m ? m[1]! : null;
}

function native(doc: Document): NativeDownload[] {
  const out: NativeDownload[] = [];
  doc.querySelectorAll('li.download ul li a, #control_panel .download a').forEach((a) => {
    const href = a.getAttribute('href');
    // Take the recognised format, not the whole caption: "Download EPUB" must
    // not turn into a format nothing downstream agrees with.
    const format = (B.norm(a.textContent).toLowerCase().match(/epub|azw3|mobi|pdf|html/) || [])[0];
    if (!href || !format) return;
    out.push({ format, url: absolutize(href, 'https://archiveofourown.org/') });
  });
  return out;
}

function readMeta(doc: Document) {
  const group = doc.querySelector('dl.work.meta.group');
  const readDd = (cls: string): string[] => {
    if (!group) return [];
    const dt = group.querySelector(`dt.${cls}`);
    if (!dt) return [];
    const dd = dt.nextElementSibling;
    if (!dd) return [];
    return Array.from(dd.querySelectorAll('a, li'))
      .map((n) => B.norm(n.textContent))
      .filter((t) => t && t.length < 120);
  };
  const uniq = (a: string[]): string[] => Array.from(new Set(a));
  return {
    fandom: uniq(readDd('fandom')).join(', '),
    pairing: uniq(readDd('relationship')).slice(0, 8).join(', '),
    rating: uniq(readDd('rating')).join(', '),
    tags: uniq([...readDd('freeform'), ...readDd('character')]).slice(0, 30),
  };
}

function parseChapterNode(node: Element, url: string, index: number): Chapter | null {
  const body = node.querySelector('div[role="article"], div.userstuff');
  if (!body) return null;
  const titleEl = node.querySelector('h3.title');
  const title = titleEl ? B.norm(titleEl.textContent) : `Chapter ${index + 1}`;
  const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
  const notesEl = node.querySelector('.notes .userstuff, .end.notes .userstuff');
  const notesXhtml = notesEl
    ? sanitize(notesEl, { baseUrl: url, keepImages: false, dropSelectors: DROP }).xhtml
    : '';
  return { title: title || `Chapter ${index + 1}`, xhtml, notesXhtml };
}

async function parse(doc: Document, url: string, ctx: ParseContext): Promise<Book> {
  const id = workId(url);
  let fullDoc = doc;
  let fullUrl = url;

  if (id && !/view_full_work=true/.test(url)) {
    fullUrl = `https://archiveofourown.org/works/${id}?view_full_work=true&view_adult=true`;
    ctx.progress('Requesting every chapter in one go…', 10);
    fullDoc = await ctx.fetchDoc(fullUrl);
  }

  const title =
    B.pickText(fullDoc, ['h2.title.heading', 'h2.title'], 300) ||
    B.metaContent(fullDoc, ['og:title']);
  const author = B.textList(
    fullDoc,
    ['h3.byline.heading a[rel="author"]', 'h3.byline a'],
    6,
  ).join(', ');

  const summaryEl = B.pick(fullDoc, [
    'div.summary.module blockquote.userstuff',
    'div.summary blockquote',
  ]);
  const summaryXhtml = summaryEl
    ? sanitize(summaryEl, { baseUrl: fullUrl, keepImages: false }).xhtml
    : '';
  const summaryText = summaryEl ? toPlainText(summaryEl).slice(0, 1200) : '';

  const nodes = Array.from(fullDoc.querySelectorAll('#chapters > div.chapter'));
  let chapters: (Chapter | null)[];
  if (nodes.length) {
    chapters = nodes.map((n, i) => parseChapterNode(n, fullUrl, i));
  } else {
    const solo = B.pick(fullDoc, [
      '#chapters div.userstuff',
      'div#workskin div.userstuff',
      'div.userstuff',
    ]);
    if (!solo) throw new Error('No work text found on the AO3 page');
    const { xhtml } = sanitize(solo, { baseUrl: fullUrl, keepImages: false, dropSelectors: DROP });
    chapters = [{ title: title || 'Work', xhtml }];
  }

  ctx.progress(`Chapters parsed: ${chapters.filter(Boolean).length}`, 85);

  return B.finalize({
    title: title || 'Work',
    author,
    sourceUrl: id ? `https://archiveofourown.org/works/${id}` : url,
    siteName: SITE,
    summaryXhtml,
    summaryText,
    ...readMeta(fullDoc),
    expectedChapters: nodes.length,
    chapters,
  });
}

export const ao3: Adapter = {
  id: 'ao3',
  name: SITE,
  match: (url) => /(^|\.)archiveofourown\.org$/i.test(new URL(url).hostname),
  isWorkPage: (url) => /\/works\/\d+/.test(url),
  native,
  parse,
};
