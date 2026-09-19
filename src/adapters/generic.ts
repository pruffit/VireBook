// The generic parser: what runs on a site no adapter covers. Three strategies
// in descending order of reliability — a chapter list on the page, walking the
// "next chapter" link, a single page.
import type { Adapter, Book, Chapter, ParseContext } from '../types.ts';
import { absolutize, sanitize } from '../lib/html.ts';
import { mapLimit } from '../lib/util.ts';
import * as B from './base.ts';

const MAX_CHAPTERS = 400;

const CHAPTER_TEXT =
  /^\s*(глава|глава\s*№|часть|раздел|chapter|ch\.?|part|episode|эпизод)\s*[.:№-]?\s*\d+/i;
const NEXT_TEXT = /(следующ|далее|вперёд|вперед|дальше|next\s*(chapter|part)?|→|»|&gt;&gt;)/i;
const PREV_TEXT = /(предыдущ|назад|previous|prev|←|«)/i;

interface Candidate {
  url: string;
  title: string;
  numbered: boolean;
}

function scoreChapterList(doc: Document, baseUrl: string): Candidate[] | null {
  const anchors = Array.from(doc.querySelectorAll('a[href]'));
  const byContainer = new Map<Element, Candidate[]>();

  for (const a of anchors) {
    const href = a.getAttribute('href');
    if (!href || /^(javascript:|mailto:|#)/i.test(href)) continue;
    const url = absolutize(href, baseUrl);
    if (!url) continue;
    if (new URL(url).hostname !== new URL(baseUrl).hostname) continue;
    const text = B.norm(a.textContent);
    if (!text || text.length > 160) continue;

    const parent = a.closest('ul, ol, table, nav, div, select') || doc.body;
    if (!byContainer.has(parent)) byContainer.set(parent, []);
    byContainer.get(parent)!.push({
      url: url.split('#')[0]!,
      title: text,
      numbered: CHAPTER_TEXT.test(text),
    });
  }

  // A site menu is also a set of links sharing one path shape. Without this
  // cut-off the parser goes off to download the whole navbar instead of chapters.
  const NAVISH =
    /(^|[\s_-])(nav|menu|footer|header|sidebar|aside|breadcrumb|pagination|pager|tags?|related|recommend|social|share)([\s_-]|$)/i;
  const TOCISH = /(toc|chapter|chapters|part|parts|content|contents|index|list|глав|част)/i;
  const containerHint = (el: Element): 'nav' | 'toc' | 'plain' => {
    const tag = (el.tagName || '').toLowerCase();
    const idc = `${el.id || ''} ${typeof el.className === 'string' ? el.className : ''}`;
    if (tag === 'nav' || tag === 'header' || tag === 'footer' || tag === 'aside') return 'nav';
    if (NAVISH.test(idc)) return 'nav';
    if (TOCISH.test(idc)) return 'toc';
    return 'plain';
  };

  let best: Candidate[] | null = null;
  let bestScore = 0;
  for (const [container, items] of byContainer) {
    if (items.length < 2) continue;
    const hint = containerHint(container);
    if (hint === 'nav') continue;
    const uniq: Candidate[] = [];
    const seen = new Set<string>();
    for (const it of items) {
      if (seen.has(it.url)) continue;
      seen.add(it.url);
      uniq.push(it);
    }
    if (uniq.length < 2) continue;
    const numbered = uniq.filter((i) => i.numbered).length;
    // Links in one list following one path shape are almost certainly chapters.
    const paths = uniq.map((i) => new URL(i.url).pathname.replace(/\d+/g, '#'));
    const sameShape = paths.filter((p) => p === paths[0]).length;
    const score = numbered * 3 + sameShape + uniq.length * 0.2 + (hint === 'toc' ? 5 : 0);
    // A shared path shape proves nothing by itself: we need either explicitly
    // numbered link text or a container that looks like a table of contents.
    const plausible =
      numbered >= 2 || (hint === 'toc' && sameShape >= Math.max(3, uniq.length * 0.8));
    if (score > bestScore && plausible) {
      bestScore = score;
      best = uniq;
    }
  }
  return best ? best.slice(0, MAX_CHAPTERS) : null;
}

function findNextLink(doc: Document, baseUrl: string): string | null {
  const anchors = Array.from(doc.querySelectorAll('a[href]'));
  for (const a of anchors) {
    const text = B.norm(a.textContent);
    const rel = a.getAttribute('rel') || '';
    const aria = a.getAttribute('title') || a.getAttribute('aria-label') || '';
    const hay = `${text} ${rel} ${aria}`;
    if (!NEXT_TEXT.test(hay) || PREV_TEXT.test(text)) continue;
    const url = absolutize(a.getAttribute('href'), baseUrl);
    if (!url || url.split('#')[0] === baseUrl.split('#')[0]) continue;
    if (new URL(url).hostname !== new URL(baseUrl).hostname) continue;
    return url.split('#')[0]!;
  }
  return null;
}

function extract(doc: Document, url: string, fallbackTitle: string): Chapter | null {
  const body = B.findMainContent(doc);
  if (!body) return null;
  const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false });
  if (!xhtml || xhtml.replace(/<[^>]+>/g, '').trim().length < 200) return null;
  const heading = B.pickText(doc, ['h1', 'h2', '.chapter-title', '[class*="chapter"] h2'], 200);
  return { title: heading || fallbackTitle || 'Chapter', xhtml };
}

async function parse(doc: Document, url: string, ctx: ParseContext): Promise<Book> {
  const title =
    B.metaContent(doc, ['og:title', 'twitter:title']) ||
    B.pickText(doc, ['h1'], 300) ||
    B.norm(doc.title).split(/[|—–-]/)[0]!;
  const author =
    B.metaContent(doc, ['author', 'book:author', 'article:author']) ||
    B.pickText(doc, ['[rel="author"]', '.author a', 'a[href*="/author"]', 'a[href*="/user"]'], 120);
  const summaryText = B.metaContent(doc, ['og:description', 'description']).slice(0, 1200);

  const links = scoreChapterList(doc, url);
  let chapters: Chapter[] = [];
  let expected = 0;

  if (links && links.length > 1) {
    expected = links.length;
    ctx.progress(`Looks like a chapter list: ${links.length}`, 5);
    const parsed = await mapLimit(
      links,
      3,
      async (link) => {
        const d = link.url.split('#')[0] === url.split('#')[0] ? doc : await ctx.fetchDoc(link.url);
        return extract(d, link.url, link.title);
      },
      (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + (done / total) * 80),
    );
    chapters = parsed.filter((c): c is Chapter => !!c);
  }

  if (chapters.length < 2) {
    // No list — follow "next chapter" for as long as one is found. How many
    // there are is unknown in advance, so there is nothing to check against.
    expected = 0;
    const visited = new Set<string>();
    let cursor: string | null = url.split('#')[0]!;
    let current = doc;
    chapters = [];
    while (cursor && !visited.has(cursor) && chapters.length < MAX_CHAPTERS) {
      visited.add(cursor);
      const ch = extract(current, cursor, `Chapter ${chapters.length + 1}`);
      if (ch) chapters.push(ch);
      const next = findNextLink(current, cursor);
      if (!next || visited.has(next)) break;
      ctx.progress(`Walking chapters: ${chapters.length}`, Math.min(80, 5 + chapters.length * 4));
      current = await ctx.fetchDoc(next);
      cursor = next;
    }
  }

  if (!chapters.length) {
    throw new Error('No text found: this page does not look like a chapter of a book');
  }

  return B.finalize({
    title: title || 'Book',
    author,
    summaryText,
    sourceUrl: url,
    siteName: B.siteLabel(url),
    expectedChapters: expected,
    chapters,
  });
}

export const generic: Adapter = {
  id: 'generic',
  match: () => true,
  isWorkPage: () => true,
  parse,
};
