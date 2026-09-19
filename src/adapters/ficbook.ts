// ficbook.net — selectors checked against the live page on 2026-09-15.
import type { Adapter, Book, Chapter, Pacing, ParseContext } from '../types.ts';
import { absolutize, sanitize, toPlainText } from '../lib/html.ts';
import { mapLimit } from '../lib/util.ts';
import * as B from './base.ts';

// Ficbook cuts you off by rate noticeably earlier than the rest: a 429 landed
// halfway through a book. The step stays wide; concurrency is only there to
// hide network latency, the limiter sets the pace regardless.
const PACING: Pacing = { interval: 800, maxInterval: 20000, concurrency: 2 };

const SITE = 'Ficbook';
const BODY = ['#content', '.js-part-text', '.part_text', '#part_content .part_text'];
const DROP = [
  '.fanfic-text-promo', '.js-part-text-promo', '.part-comment-form', '.ficbook-ad',
  '.adv-block', '.js-toggle-part-comments', '.part-actions', 'ins', '.mobile-hidden-ad',
];

function readMeta(doc: Document) {
  const fandom = B.textList(
    doc,
    ['.fanfic-hat a[href*="/fanfiction/"]', 'a[href*="/fanfiction/"]'],
    4,
  ).join(', ');
  const tags = B.textList(
    doc,
    ['.fanfic-hat a[href*="/tags/"]', '.tags a', 'a.tag', 'a[href*="/tags/"]'],
    30,
  );
  // Badges are marked by a class suffix: ds-label-rating-NC-17, ds-label-status-in-progress.
  const badge = (kind: string): string => {
    const el = doc.querySelector(
      `.fanfic-badges [class*="ds-label-${kind}"], [class*="ds-label-${kind}"]`,
    );
    if (!el) return '';
    const cls = typeof el.className === 'string' ? el.className : '';
    const m = cls.match(new RegExp(`ds-label-${kind}-([\\w-]+)`));
    const label = B.norm(el.textContent);
    // Badge text on this site is often empty or icon-only — then take the class.
    return label.length > 1 ? label : m ? m[1]!.replace(/-/g, ' ') : '';
  };
  const pairing = B.textList(
    doc,
    ['.fanfic-hat a[href*="/pairings/"]', 'a[href*="/pairings/"]'],
    6,
  ).join(', ');
  return { fandom, tags, rating: badge('rating'), status: badge('status'), size: badge('size'), pairing };
}

function readAuthor(doc: Document): string {
  const links = Array.from(
    doc.querySelectorAll('a[href^="/authors/"], a[href*="ficbook.net/authors/"]'),
  );
  const names = links
    .map((a) => B.norm(a.textContent))
    .filter((t) => t && t.length > 1 && t.length < 60);
  return Array.from(new Set(names)).slice(0, 3).join(', ');
}

function readSummary(doc: Document): { summaryXhtml: string; summaryText: string } {
  // itemprop gives the description itself; .description is the whole header
  // block together with the fandom and tags, so it is only a fallback.
  const el = B.pick(doc, [
    '[itemprop="description"]', '.js-public-beta-description',
    '.fanfic-hat-body .description', '.description', '.fanfic-description',
  ]);
  if (!el) return { summaryXhtml: '', summaryText: '' };
  const { xhtml } = sanitize(el, {
    baseUrl: 'https://ficbook.net/',
    keepImages: false,
    dropSelectors: DROP,
  });
  return { summaryXhtml: xhtml, summaryText: toPlainText(el, DROP).slice(0, 1200) };
}

function chapterLinks(doc: Document, baseUrl: string): { url: string; title: string }[] {
  const nodes = B.pickAll(
    doc,
    ['ul.list-of-fanfic-parts li.part a.part-link', 'li.part a.part-link', 'a.part-link'],
    400,
  );
  const seen = new Set<string>();
  const out: { url: string; title: string }[] = [];
  for (const a of nodes) {
    const url = absolutize(a.getAttribute('href'), baseUrl);
    if (!url) continue;
    const clean = url.split('#')[0]!;
    if (seen.has(clean)) continue;
    seen.add(clean);
    out.push({ url: clean, title: B.norm(a.textContent) || `Chapter ${out.length + 1}` });
  }
  return out;
}

function parseChapter(doc: Document, url: string, fallbackTitle: string): Chapter | null {
  const body = B.pick(doc, BODY);
  if (!body) return null;
  const title =
    B.pickText(doc, ['#part_content .title-area h2', '.title-area h2', '#part_content h2'], 200) ||
    fallbackTitle;
  const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
  return { title: title || 'Chapter', xhtml };
}

async function parse(doc: Document, url: string, ctx: ParseContext): Promise<Book> {
  const title =
    B.pickText(doc, ['h1.heading', '.fanfic-hat h1', 'h1'], 300) || B.metaContent(doc, ['og:title']);
  const meta = readMeta(doc);
  const summary = readSummary(doc);
  const author = readAuthor(doc);

  // A chapter page has no table of contents — for the list of parts we go to
  // the work's own page.
  let workDoc = doc;
  let workUrl = url;
  const partMatch = url.match(/^(https?:\/\/[^/]+\/readfic\/[^/?#]+)\/\d+/);
  if (partMatch) {
    workUrl = partMatch[1]!;
    workDoc = await ctx.fetchDoc(workUrl);
  }

  const links = chapterLinks(workDoc, workUrl);

  // A short work with no parts: the text sits right on the work page.
  if (!links.length) {
    const single = parseChapter(doc, url, title);
    if (single) {
      return B.finalize({
        title, author, sourceUrl: url, siteName: SITE,
        ...meta, ...summary, chapters: [{ ...single, title }],
      });
    }
    const onWork = parseChapter(workDoc, workUrl, title);
    if (onWork) {
      return B.finalize({
        title, author, sourceUrl: workUrl, siteName: SITE,
        ...meta, ...summary, chapters: [{ ...onWork, title }],
      });
    }
    throw new Error('Found neither a list of parts nor any text on the page');
  }

  ctx.progress(`Parts found: ${links.length}`, 5);

  const chapters = await mapLimit(
    links,
    PACING.concurrency ?? 2,
    async (link) => {
      if (link.url.split('#')[0] === url.split('#')[0]) return parseChapter(doc, url, link.title);
      const d = await ctx.fetchDoc(link.url);
      return parseChapter(d, link.url, link.title);
    },
    (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + (done / total) * 80),
  );

  return B.finalize({
    title: title || 'Book',
    author,
    sourceUrl: workUrl,
    siteName: SITE,
    ...meta,
    ...summary,
    expectedChapters: links.length,
    chapters,
  });
}

export const ficbook: Adapter = {
  id: 'ficbook',
  name: SITE,
  pacing: PACING,
  match: (url) => /(^|\.)ficbook\.net$/i.test(new URL(url).hostname),
  isWorkPage: (url) => /\/readfic\//.test(url),
  parse,
};
