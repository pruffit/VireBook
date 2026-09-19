// RoyalRoad — English-language originals, stable and simple markup.
import type { Adapter, Book, Chapter, ParseContext } from '../types.ts';
import { absolutize, sanitize, toPlainText } from '../lib/html.ts';
import { mapLimit } from '../lib/util.ts';
import * as B from './base.ts';

const DROP = ['.portlet', '.ad', '.hidden', 'style', '.author-note-portlet'];

function chapterLinks(doc: Document, baseUrl: string): { url: string; title: string }[] {
  const rows = B.pickAll(doc, ['#chapters tbody tr td a[href]', 'table#chapters a[href]'], 2000);
  const seen = new Set<string>();
  const out: { url: string; title: string }[] = [];
  for (const a of rows) {
    const url = absolutize(a.getAttribute('href'), baseUrl);
    if (!url) continue;
    const clean = url.split('#')[0]!;
    if (seen.has(clean)) continue;
    seen.add(clean);
    out.push({ url: clean, title: B.norm(a.textContent) || `Chapter ${out.length + 1}` });
  }
  return out;
}

function extract(doc: Document, url: string, fallbackTitle: string): Chapter | null {
  const body = B.pick(doc, ['.chapter-inner.chapter-content', '.chapter-content', '.chapter-inner']);
  if (!body) return null;
  const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
  if (xhtml.replace(/<[^>]+>/g, '').trim().length < 100) return null;
  const heading = B.pickText(doc, ['h1.font-white', '.fic-header h1', 'h1'], 200);
  return { title: heading || fallbackTitle || 'Chapter', xhtml };
}

async function parse(doc: Document, url: string, ctx: ParseContext): Promise<Book> {
  let workDoc = doc;
  let workUrl = url;
  const fictionMatch = url.match(/^(https?:\/\/[^/]+\/fiction\/\d+\/[^/]+)/);
  if (fictionMatch && /\/chapter\//.test(url)) {
    workUrl = fictionMatch[1]!;
    workDoc = await ctx.fetchDoc(workUrl);
  }

  const title = B.pickText(workDoc, ['.fic-title h1', 'h1[property="name"]', 'h1'], 300);
  const author = B.pickText(workDoc, ['.fic-title h4 a', 'h4 span a', 'a[href^="/profile/"]'], 120);
  const summaryEl = B.pick(workDoc, ['.description .hidden-content', '.description']);
  const summaryText = summaryEl ? toPlainText(summaryEl).slice(0, 1200) : '';
  const tags = B.textList(workDoc, ['.tags a', 'a.fiction-tag'], 25);

  const links = chapterLinks(workDoc, workUrl);
  if (!links.length) {
    const solo = extract(doc, url, title);
    if (!solo) throw new Error('Found neither a chapter list nor any text on RoyalRoad');
    return B.finalize({
      title, author, summaryText, tags, sourceUrl: url, siteName: B.siteLabel(url), chapters: [solo],
    });
  }

  ctx.progress(`Chapters: ${links.length}`, 5);
  const chapters = await mapLimit(
    links,
    3,
    async (link) => extract(await ctx.fetchDoc(link.url), link.url, link.title),
    (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + (done / total) * 80),
  );

  if (!chapters.filter(Boolean).length) throw new Error('RoyalRoad returned no chapter text');

  return B.finalize({
    title: title || 'Fiction',
    author, summaryText, tags,
    sourceUrl: workUrl,
    siteName: B.siteLabel(workUrl),
    expectedChapters: links.length,
    chapters,
  });
}

export const royalroad: Adapter = {
  id: 'royalroad',
  match: (url) => /(^|\.)royalroad\.com$/i.test(new URL(url).hostname),
  isWorkPage: (url) => /\/fiction\/\d+/.test(url),
  parse,
};
