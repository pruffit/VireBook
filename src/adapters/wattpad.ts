// Wattpad — chapter text comes from a separate storytext endpoint rather than
// sitting in the HTML. The request goes out from the content script, i.e. with
// the reader's own cookie: private and age-gated parts open the same way.
import type { Adapter, Book, Chapter, ParseContext } from '../types.ts';
import { sanitize } from '../lib/html.ts';
import { mapLimit } from '../lib/util.ts';
import * as B from './base.ts';


interface Part {
  id: string;
  title: string;
}

function partsFromNextData(doc: Document): Part[] | null {
  const el = doc.getElementById('__NEXT_DATA__');
  if (!el) return null;
  try {
    const data: unknown = JSON.parse(el.textContent || '');
    const stack: unknown[] = [data];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      const rec = node as Record<string, unknown>;
      const parts = rec.parts;
      if (Array.isArray(parts) && parts.length && parts[0] && (parts[0] as Record<string, unknown>).id) {
        return parts.map((p: Record<string, unknown>, i) => ({
          id: String(p.id),
          title: B.norm(String(p.title ?? '')) || `Part ${i + 1}`,
        }));
      }
      for (const key of Object.keys(rec)) stack.push(rec[key]);
    }
  } catch {
    /* the page shape changed — fall through to scanning links */
  }
  return null;
}

function partsFromDom(doc: Document): Part[] {
  const out: Part[] = [];
  const seen = new Set<string>();
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const m = href.match(/^\/?(\d{4,})-/);
    if (!m || seen.has(m[1]!)) return;
    seen.add(m[1]!);
    out.push({ id: m[1]!, title: B.norm(a.textContent) || `Part ${out.length + 1}` });
  });
  return out;
}

async function parse(doc: Document, url: string, ctx: ParseContext): Promise<Book> {
  const title = B.metaContent(doc, ['og:title', 'twitter:title']) || B.pickText(doc, ['h1'], 300);
  const author =
    B.metaContent(doc, ['author']) ||
    B.pickText(doc, ['a[href^="/user/"]', '.author-info a'], 120);
  const summaryText = B.metaContent(doc, ['og:description', 'description']).slice(0, 1200);

  const parts = partsFromNextData(doc) || partsFromDom(doc);
  if (!parts.length) throw new Error('No list of Wattpad parts found');

  ctx.progress(`Parts: ${parts.length}`, 5);

  const chapters = await mapLimit(
    parts,
    2,
    async (part): Promise<Chapter | null> => {
      const html = await ctx.fetchText(
        `https://www.wattpad.com/apiv2/storytext?id=${encodeURIComponent(part.id)}`,
      );
      if (!html) return null;
      const holder = ctx.parseFragment(html);
      const { xhtml } = sanitize(holder, { baseUrl: url, keepImages: false });
      if (xhtml.replace(/<[^>]+>/g, '').trim().length < 60) return null;
      return { title: part.title, xhtml };
    },
    (done, total) => ctx.progress(`Parts fetched: ${done} of ${total}`, 5 + (done / total) * 80),
  );

  if (!chapters.filter(Boolean).length) throw new Error('Wattpad returned no part text');

  return B.finalize({
    title: title || 'Story',
    author, summaryText,
    sourceUrl: url,
    siteName: B.siteLabel(url),
    expectedChapters: parts.length,
    chapters,
  });
}

export const wattpad: Adapter = {
  id: 'wattpad',
  match: (url) => /(^|\.)wattpad\.com$/i.test(new URL(url).hostname),
  isWorkPage: (url) => /\/story\/\d+|\/\d{4,}-/.test(url),
  parse,
};
