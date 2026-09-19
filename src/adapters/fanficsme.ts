// fanfics.me — the markup could not be checked against the live page: the site
// answers "unavailable in your country" outside Russia. Selectors are given as
// lists of candidates, and the generic parser picks up whatever they miss.
import type { Adapter, Book, Chapter, ParseContext } from '../types.ts';
import { absolutize, sanitize } from '../lib/html.ts';
import { mapLimit } from '../lib/util.ts';
import * as B from './base.ts';

const DROP = ['.Sidebar_NativeAd', '[class*="NativeAd"]', '.adv', '.banner', '#comments', '.comments'];

const BODY = [
  '#content_text', '.FicPart_Text', '[class*="FicPart"] [class*="Text"]',
  '.fic_text', '#fic_text', '.chapter-text', '.text',
];

function chapterLinks(doc: Document, baseUrl: string): { url: string; title: string }[] {
  const nodes = B.pickAll(
    doc,
    [
      '.FicTOC a[href]', '[class*="TOC"] a[href]', '.chapters a[href]',
      'a[href*="/fic"][href*="chapter"]', 'a[href*="/read"]',
    ],
    400,
  );
  const seen = new Set<string>();
  const out: { url: string; title: string }[] = [];
  for (const a of nodes) {
    const url = absolutize(a.getAttribute('href'), baseUrl);
    if (!url) continue;
    const clean = url.split('#')[0]!;
    if (seen.has(clean) || clean === baseUrl.split('#')[0]) continue;
    seen.add(clean);
    out.push({ url: clean, title: B.norm(a.textContent) || `Chapter ${out.length + 1}` });
  }
  return out;
}

function extract(doc: Document, url: string, fallbackTitle: string): Chapter | null {
  const body = B.pick(doc, BODY) || B.findMainContent(doc);
  if (!body) return null;
  const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
  if (xhtml.replace(/<[^>]+>/g, '').trim().length < 150) return null;
  const heading = B.pickText(doc, ['.FicPart_Title', '[class*="PartTitle"]', 'h2'], 200);
  return { title: heading || fallbackTitle || 'Chapter', xhtml };
}

async function parse(doc: Document, url: string, ctx: ParseContext): Promise<Book> {
  const title =
    B.pickText(doc, ['h1', '.FicTitle', '[class*="FicHead"] h1'], 300) ||
    B.metaContent(doc, ['og:title']);
  const author = B.textList(doc, ['a[href*="/user"]', '.author a', '[class*="Author"] a'], 3).join(', ');
  const summaryText = B.metaContent(doc, ['og:description', 'description']).slice(0, 1200);
  const tags = B.textList(doc, ['a[href*="/tag"]', '.tags a'], 25);
  const fandom = B.textList(doc, ['a[href*="/fandom"]', 'a[href*="/canon"]'], 4).join(', ');

  const links = chapterLinks(doc, url);
  let chapters: (Chapter | null)[];

  if (links.length > 1) {
    ctx.progress(`Chapters found: ${links.length}`, 5);
    chapters = await mapLimit(
      links,
      3,
      async (link) => extract(await ctx.fetchDoc(link.url), link.url, link.title),
      (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + (done / total) * 80),
    );
  } else {
    chapters = [extract(doc, url, title)];
  }

  if (!chapters.filter(Boolean).length) throw new Error('No chapter text found on fanfics.me');

  return B.finalize({
    title: title || 'Book',
    author, summaryText, tags, fandom,
    sourceUrl: url,
    siteName: B.siteLabel(url),
    expectedChapters: links.length > 1 ? links.length : 0,
    chapters,
  });
}

export const fanficsme: Adapter = {
  id: 'fanficsme',
  match: (url) => /(^|\.)fanfics\.me$/i.test(new URL(url).hostname),
  isWorkPage: (url) => /\/fic\d+|\/read/.test(url),
  parse,
};
