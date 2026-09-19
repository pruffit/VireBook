// fanfiction.net — markup verified against the known structure, not against a
// live page: the site sits behind bot protection. Those selectors have not
// moved in years.
import type { Adapter, Book, Chapter, ParseContext } from '../types.ts';
import { sanitize } from '../lib/html.ts';
import { mapLimit } from '../lib/util.ts';
import * as B from './base.ts';

const SITE = 'FanFiction.net';
const DROP = ['.a-d', '#storytextp .lazy', 'ins', '.ad'];

function storyId(url: string): string | null {
  const m = url.match(/\/s\/(\d+)/);
  return m ? m[1]! : null;
}

function chapterTitles(doc: Document): string[] {
  const select = doc.querySelector('#chap_select');
  if (!select) return [];
  return Array.from(select.querySelectorAll('option')).map((o) =>
    B.norm(o.textContent).replace(/^\d+\.\s*/, ''),
  );
}

function extract(doc: Document, url: string, fallbackTitle: string): Chapter | null {
  const body = B.pick(doc, ['#storytext', '#storytextp']) || B.findMainContent(doc);
  if (!body) return null;
  const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
  if (xhtml.replace(/<[^>]+>/g, '').trim().length < 150) return null;
  return { title: fallbackTitle || 'Chapter', xhtml };
}

async function parse(doc: Document, url: string, ctx: ParseContext): Promise<Book> {
  const id = storyId(url);
  if (!id) throw new Error('This is not a work page on fanfiction.net');

  const title = B.pickText(doc, ['#profile_top b.xcontrast_txt', '#profile_top b'], 300);
  const author = B.pickText(
    doc,
    ['#profile_top a.xcontrast_txt[href^="/u/"]', '#profile_top a[href^="/u/"]'],
    120,
  );
  const summaryText = B.pickText(doc, ['#profile_top div.xcontrast_txt', '#profile_top div'], 1200);

  const titles = chapterTitles(doc);
  const count = Math.max(1, titles.length);
  ctx.progress(`Chapters in this work: ${count}`, 5);

  const indices = Array.from({ length: count }, (_, i) => i + 1);
  const chapters = await mapLimit(
    indices,
    2,
    async (n) => {
      const chapterUrl = `https://www.fanfiction.net/s/${id}/${n}/`;
      const d = n === 1 && /\/s\/\d+\/1?\/?/.test(url) ? doc : await ctx.fetchDoc(chapterUrl);
      return extract(d, chapterUrl, titles[n - 1] || `Chapter ${n}`);
    },
    (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + (done / total) * 80),
  );

  if (!chapters.filter(Boolean).length) throw new Error('No chapter text found on fanfiction.net');

  return B.finalize({
    title: title || 'Story',
    author, summaryText,
    sourceUrl: `https://www.fanfiction.net/s/${id}/`,
    siteName: SITE,
    expectedChapters: count,
    chapters,
  });
}

export const ffnet: Adapter = {
  id: 'ffnet',
  name: SITE,
  match: (url) => /(^|\.)fanfiction\.net$/i.test(new URL(url).hostname),
  isWorkPage: (url) => /\/s\/\d+/.test(url),
  parse,
};
