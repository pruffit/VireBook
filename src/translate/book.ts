// Translates an assembled Book. The text goes out block by block with its inline
// markup, and what comes back is run through `sanitize` again: the writers take
// XHTML that is well-formed, and an engine is not a thing to trust with that.
import type { Book, Chapter, ProgressFn } from '../types.ts';
import { LANGUAGES, type Translator } from './types.ts';
import { escapeText, sanitize } from '../lib/html.ts';
import { abortError, normalizeSpace } from '../lib/util.ts';

/** Where translation sits on the progress bar: after reading, before assembling. */
export const TRANSLATE_FROM = 40;
export const TRANSLATE_TO = 88;

const STRUCTURAL = new Set([
  'p', 'div', 'section', 'article', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'hr', 'tr', 'figure', 'figcaption', 'dl', 'dt', 'dd', 'center', 'table',
  'thead', 'tbody', 'td', 'th', 'caption',
]);
const STRUCTURAL_SELECTOR = [...STRUCTURAL].join(',');
const LETTER = /\p{L}/u;

const hasText = (html: string): boolean => LETTER.test(html.replace(/<[^>]*>/g, ''));

/** A literal stretch of the book, or a hole to be filled with the translation of `segments[seg]`. */
type Piece = string | { seg: number; open: string; close: string; original: string };

/**
 * Splits sanitised XHTML into blocks that go to the engine one by one, keeping
 * the wrapping elements out of the request. Blocks with nothing to read — a
 * scene break, an image — stay as they are.
 */
function plan(xhtml: string, segments: string[]): Piece[] {
  const doc = new DOMParser().parseFromString(`<body>${xhtml}</body>`, 'text/html');
  const out: Piece[] = [];

  function emit(nodes: Node[], open: string, close: string, keepEmpty: boolean): void {
    const holder = doc.createElement('div');
    for (const n of nodes) holder.append(n.cloneNode(true));
    const original = sanitize(holder, { wrapBare: false }).xhtml;
    if (!original && !keepEmpty) {
      if (holder.textContent?.includes('\n')) out.push('\n');
      return;
    }
    if (!hasText(holder.innerHTML)) {
      if (keepEmpty || /<img[\s>]/.test(original)) out.push(open + original + close);
      return;
    }
    out.push({ seg: segments.push(holder.innerHTML) - 1, open, close, original });
  }

  function walk(parent: Element, topLevel: boolean): void {
    let run: Node[] = [];
    const flush = (): void => {
      if (run.length) emit(run, topLevel ? '<p>' : '', topLevel ? '</p>' : '', false);
      run = [];
    };
    for (const node of Array.from(parent.childNodes)) {
      const tag = node.nodeType === 1 ? (node as Element).tagName.toLowerCase() : '';
      if (!STRUCTURAL.has(tag)) {
        run.push(node);
        continue;
      }
      flush();
      const el = node as Element;
      if (tag === 'hr') out.push('<hr/>');
      else if (el.querySelector(STRUCTURAL_SELECTOR)) {
        out.push(`<${tag}>`);
        walk(el, false);
        out.push(`</${tag}>`);
      } else emit(Array.from(el.childNodes), `<${tag}>`, `</${tag}>`, true);
    }
    flush();
  }

  walk(doc.body, true);
  return out;
}

function cleanInline(html: string): string {
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
  return sanitize(body, { wrapBare: false }).xhtml;
}

function render(pieces: Piece[], translated: string[]): string {
  return pieces
    .map((p) => {
      if (typeof p === 'string') return p;
      const clean = cleanInline(translated[p.seg] ?? '');
      return p.open + (clean || p.original) + p.close;
    })
    .join('');
}

/** Plain text goes out as HTML (the engine is asked for HTML), so it is escaped on the way and read back. */
const textSegment = (text: string): string => (hasText(text) ? escapeText(text) : '');

function textBack(translated: string | undefined, original: string): string {
  if (!translated) return original;
  const body = new DOMParser().parseFromString(`<body>${translated}</body>`, 'text/html').body;
  return normalizeSpace(body.textContent) || original;
}

const baseOf = (code: string): string => code.toLowerCase().split('-')[0]!;

export function alreadyIn(target: string): string {
  const name = LANGUAGES.find((l) => l.code === target)?.label ?? target;
  return `The book is already in ${name} — not translated.`;
}

/** Segments shorter than this say little about a language and must not outvote the prose. */
const MIN_VOTE = 20;

/** The language the engine heard most of, by amount of text; '' when it heard none. */
function dominantLanguage(sent: string[], detected: string[]): string {
  const weight = new Map<string, number>();
  sent.forEach((html, i) => {
    const code = detected[i];
    const size = html.replace(/<[^>]*>/g, '').trim().length;
    if (code && size >= MIN_VOTE) weight.set(baseOf(code), (weight.get(baseOf(code)) ?? 0) + size);
  });
  let best = '';
  let most = 0;
  for (const [code, w] of weight) {
    if (w > most) {
      best = code;
      most = w;
    }
  }
  return best;
}

export interface TranslateReport {
  /** Chapters left in the original language because the engine kept failing. */
  failedChapters?: number;
  /** A sentence for the reader, set when some chapters stayed untranslated. */
  failure?: string;
}

const isAbort = (err: unknown, signal?: AbortSignal): boolean =>
  Boolean(signal?.aborted) || (err as Error)?.name === 'AbortError';

/**
 * The source language is not taken from `book.language`, which is a two-way guess
 * (ru or en): chapters are translated in order and the engine's own detection,
 * over the chapter bodies only, decides whether the book was in the target
 * language already. A chapter the engine keeps refusing stays as it was — hundreds
 * of requests are not thrown away over one — and `report` says how many.
 */
export async function translateBook(
  book: Book,
  target: string,
  translator: Translator,
  progress: ProgressFn,
  signal?: AbortSignal,
  report: TranslateReport = {},
): Promise<Book> {
  const check = (): void => {
    if (signal?.aborted) throw abortError();
  };
  const run = (segments: string[]) => translator.translate(segments, 'auto', target, signal);
  const band = (done: number, of: number): number =>
    TRANSLATE_FROM + (done / Math.max(1, of)) * (TRANSLATE_TO - TRANSLATE_FROM);
  const total = book.chapters.length;

  async function chapterAt(i: number): Promise<{ chapter: Chapter; vote: string }> {
    check();
    progress(`Translating chapter ${i + 1} of ${total}…`, band(i, total));
    const chapter = book.chapters[i]!;
    const segments: string[] = [];
    const titleSeg = segments.push(textSegment(chapter.title)) - 1;
    const body = plan(chapter.xhtml, segments);
    const bodyEnd = segments.length;
    const notes = chapter.notesXhtml ? plan(chapter.notesXhtml, segments) : null;
    const { texts, detected } = await run(segments);
    return {
      vote: dominantLanguage(segments.slice(titleSeg + 1, bodyEnd), detected.slice(titleSeg + 1, bodyEnd)),
      chapter: {
        ...chapter,
        title: textBack(texts[titleSeg], chapter.title),
        xhtml: render(body, texts),
        ...(notes ? { notesXhtml: render(notes, texts) } : {}),
      },
    };
  }

  async function frontMatter(): Promise<Pick<Book, 'title' | 'summaryXhtml' | 'summaryText'>> {
    check();
    progress('Translating the title and summary…', band(1, total));
    const front: string[] = [];
    const titleAt = front.push(textSegment(book.title)) - 1;
    const summaryTextAt = book.summaryText ? front.push(textSegment(book.summaryText)) - 1 : -1;
    const summaryPlan = book.summaryXhtml ? plan(book.summaryXhtml, front) : [];
    const out = (await run(front)).texts;
    return {
      title: textBack(out[titleAt], book.title),
      ...(book.summaryXhtml ? { summaryXhtml: render(summaryPlan, out) } : {}),
      ...(book.summaryText ? { summaryText: textBack(out[summaryTextAt], book.summaryText) } : {}),
    };
  }

  const chapters: Chapter[] = [];
  let decided = false;
  let front: Awaited<ReturnType<typeof frontMatter>> | null = null;
  let failed = 0;
  let firstError: Error | null = null;

  async function tryFront(): Promise<void> {
    try {
      front = await frontMatter();
    } catch (err) {
      if (isAbort(err, signal)) throw err;
    }
  }

  for (let i = 0; i < total; i += 1) {
    try {
      const { chapter, vote } = await chapterAt(i);
      chapters.push(chapter);
      if (!decided && vote) {
        if (vote === baseOf(target)) {
          progress(alreadyIn(target), TRANSLATE_TO);
          return book;
        }
        decided = true;
        await tryFront();
      }
    } catch (err) {
      if (isAbort(err, signal)) throw err;
      failed += 1;
      firstError ??= err as Error;
      chapters.push(book.chapters[i]!);
      progress(`Chapter ${i + 1} could not be translated, continuing…`, band(i + 1, total));
    }
  }
  if (failed === total) throw firstError!;
  if (!decided) await tryFront();

  if (failed) {
    report.failedChapters = failed;
    report.failure = `${failed} of ${total} chapters stayed untranslated — ${firstError!.message} Try again later for a full translation.`;
  }
  return { ...book, ...(front ?? {}), language: target, chapters };
}
