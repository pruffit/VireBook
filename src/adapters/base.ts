// Shared ground for adapters. Every field is taken from a list of candidates
// rather than a single selector: sites re-style the header far more often than
// the body of a chapter.
import type { Book, BookDraft, Chapter } from '../types.ts';
import { isNoise } from '../lib/html.ts';
import { detectLanguage, normalizeSpace, uuid } from '../lib/util.ts';

export const norm = normalizeSpace;

/**
 * What to call the site a book came from. Always the host, never a name an
 * adapter carries around: the extension runs on any site, and a hand-written
 * display name only exists for the handful that have an adapter — everywhere
 * else it degrades into something useless like "Any site". The host is right
 * on every site, needs no upkeep when one rebrands, and is what the reader
 * recognises anyway.
 */
export function siteLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function pick(doc: ParentNode, selectors: string[]): Element | null {
  for (const sel of selectors) {
    try {
      const el = doc.querySelector(sel);
      if (el) return el;
    } catch {
      /* skip a selector the current engine did not understand */
    }
  }
  return null;
}

export function pickText(doc: ParentNode, selectors: string[], max = 400): string {
  const el = pick(doc, selectors);
  if (!el) return '';
  return norm(el.textContent).slice(0, max);
}

export function pickAll(doc: ParentNode, selectors: string[], limit = 60): Element[] {
  for (const sel of selectors) {
    try {
      const nodes = doc.querySelectorAll(sel);
      if (nodes.length) return Array.from(nodes).slice(0, limit);
    } catch {
      /* see above */
    }
  }
  return [];
}

export function textList(doc: ParentNode, selectors: string[], limit = 40): string[] {
  return pickAll(doc, selectors, limit)
    .map((n) => norm(n.textContent))
    .filter((t) => t && t.length < 120);
}

export function metaContent(doc: Document, names: string[]): string {
  for (const name of names) {
    const el =
      doc.querySelector(`meta[property="${name}"]`) || doc.querySelector(`meta[name="${name}"]`);
    if (el && el.getAttribute('content')) return norm(el.getAttribute('content'));
  }
  return '';
}

/** Link density is the clearest sign a block is a menu rather than prose. */
export function linkDensity(el: Element): number {
  const total = (el.textContent || '').length || 1;
  let linked = 0;
  el.querySelectorAll('a').forEach((a) => {
    linked += (a.textContent || '').length;
  });
  return linked / total;
}

const CONTENT_HINT =
  /(part[_-]?text|chapter[_-]?(inner|content|text)|story[_-]?text|userstuff|fic[_-]?text|reader[_-]?text|entry[_-]?content|post[_-]?body|article[_-]?body|\btext\b|content)/i;

/** Readability-lite: find the most text-like block on the page. */
export function findMainContent(doc: Document): Element | null {
  const candidates = Array.from(doc.querySelectorAll('div, article, section, td, main'));
  let best: Element | null = null;
  let bestScore = 0;
  for (const el of candidates) {
    if (isNoise(el)) continue;
    const text = el.textContent || '';
    if (text.length < 400) continue;
    const paragraphs = el.querySelectorAll('p, br').length;
    const density = linkDensity(el);
    if (density > 0.35) continue;
    let score = text.length * (1 - density) + paragraphs * 60;
    const idc = `${el.id || ''} ${typeof el.className === 'string' ? el.className : ''}`;
    if (CONTENT_HINT.test(idc)) score *= 1.6;
    // At equal text, the deeper block is the more precise one: that is the body,
    // not the wrapper around it.
    const nested = el.querySelectorAll('div, article, section').length;
    if (nested > 30) score *= 0.8;
    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

/** Assembles a Book out of already-parsed pieces and fills in what is missing. */
export function finalize(draft: BookDraft): Book {
  const chapters = (draft.chapters || []).filter(
    (c): c is Chapter => !!c && !!c.xhtml && c.xhtml.length > 20,
  );
  const sampleText = chapters
    .slice(0, 2)
    .map((c) => c.xhtml)
    .join(' ')
    .replace(/<[^>]+>/g, ' ');
  return {
    title: 'Book',
    author: '',
    tags: [],
    language: detectLanguage(`${draft.title || ''} ${sampleText}`),
    uuid: uuid(),
    ...draft,
    chapters,
  };
}
