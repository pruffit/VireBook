// The orchestrator: pick an adapter, assemble the book, hand over the file.
import type { Book, Format, NetworkError, Pacing, ParseContext, ProgressFn } from './types.ts';
import { siteLabel } from './adapters/base.ts';
import { generic, resolveAdapter } from './adapters/index.ts';
import * as epub from './lib/epub.ts';
import * as fb2 from './lib/fb2.ts';
import * as mobi from './lib/mobi.ts';
import * as txt from './lib/txt.ts';
import { createGoogleTranslator } from './translate/google.ts';
import { alreadyIn, translateBook, type TranslateReport } from './translate/book.ts';
import type { Translator } from './translate/types.ts';
import { abortError, backoffDelay, createRateLimiter, parseRetryAfter, safeFilename, sleep } from './lib/util.ts';
import {
  createOutage, decodeText, fetchFully, NET_TIMING, NETWORK_DOWN, netError, type Fetched, type NetTiming,
} from './lib/net.ts';

export { resolveAdapter };

// 520-525 are Cloudflare reporting that the origin behind it blinked; 526, 527 and 530 are not transient.
const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524, 525]);
const MAX_ATTEMPTS = 5;
const MAX_WAIT = 60000;
const SLOW_DOWN = new Set([429, 503]);

function httpMessage(status: number): string {
  if (status === 429) return 'The site limited the request rate. Wait a couple of minutes and try again.';
  if (status === 403) return 'The site refused the page (403) — check that the book opens in a normal tab.';
  if (status === 404) return 'Page not found (404) — the book may have been removed or hidden.';
  if (status >= 500) return `The site is answering with error ${status} — try later.`;
  return `HTTP ${status}`;
}

export interface ContextOptions {
  progress?: ProgressFn;
  signal?: AbortSignal;
  pacing?: Pacing;
  fetch?: typeof fetch;
  timing?: Partial<NetTiming>;
  /** First backoff step after an HTTP error, ms. */
  backoffBase?: number;
}

export function makeContext({ progress, signal, pacing, fetch: fetchFn, timing, backoffBase }: ContextOptions): ParseContext {
  const parser = new DOMParser();
  const report: ProgressFn = progress || (() => {});
  const net: NetTiming = { ...NET_TIMING, ...timing };
  const outage = createOutage(net.grace);
  const limiter = createRateLimiter({
    interval: pacing?.interval ?? 600,
    maxInterval: pacing?.maxInterval ?? 15000,
  });

  const aborted = (): boolean => Boolean(signal && signal.aborted);

  async function pause(attempt: number, floor: number, status: number): Promise<void> {
    const delay = backoffDelay(attempt, { base: backoffBase, floor, max: MAX_WAIT });
    // Otherwise, through a long pause the panel freezes on "Chapters fetched:
    // 3 of 40" and looks hung.
    if (SLOW_DOWN.has(status)) {
      report(`The site asked us to slow down — continuing in ${Math.ceil(delay / 1000)} s…`);
    }
    await sleep(delay, signal);
  }

  // A dropped network is retried for a stretch of time, not a count of attempts: a VPN
  // reconnect takes seconds. The pace is widened once per outage, not on every retry.
  async function request(url: string): Promise<Uint8Array> {
    let httpAttempt = 0;
    let netAttempt = 0;
    for (;;) {
      await limiter.acquire(signal);
      if (aborted()) throw abortError();

      let res: Fetched;
      try {
        res = await fetchFully(
          url,
          { credentials: 'same-origin', redirect: 'follow' },
          { idle: net.idle, signal, fetchFn },
        );
      } catch (err) {
        if (aborted()) throw err;
        if (outage.begin()) limiter.penalize(0);
        if (outage.over()) throw netError(NETWORK_DOWN);
        const delay = backoffDelay(netAttempt++, { base: net.backoff, max: net.maxBackoff });
        report(`The connection dropped — retrying in ${Math.ceil(delay / 1000)} s…`);
        await sleep(delay, signal);
        continue;
      }
      outage.end();
      netAttempt = 0;

      if (res.ok) {
        limiter.reward();
        return res.body;
      }
      if (!RETRY_STATUS.has(res.status)) throw netError(httpMessage(res.status));

      const floor = Math.min(MAX_WAIT, parseRetryAfter(res.headers.get('Retry-After')));
      limiter.penalize(floor);
      httpAttempt += 1;
      if (httpAttempt >= MAX_ATTEMPTS) throw netError(httpMessage(res.status));
      await pause(httpAttempt - 1, floor, res.status);
    }
  }

  async function fetchText(url: string): Promise<string> {
    return decodeText(await request(url));
  }

  async function fetchDoc(url: string): Promise<Document> {
    return parser.parseFromString(await fetchText(url), 'text/html');
  }

  function parseFragment(html: string): HTMLElement {
    return parser.parseFromString(`<body>${html}</body>`, 'text/html').body;
  }

  async function fetchBytes(url: string): Promise<Uint8Array> {
    return request(url);
  }

  return { fetchText, fetchDoc, fetchBytes, parseFragment, progress: report, signal };
}

interface Builder {
  build(book: Book): Blob | Promise<Blob>;
  ext: Format;
}

export const BUILDERS: Record<Format, Builder> = {
  epub: { build: epub.build, ext: 'epub' },
  mobi: { build: mobi.build, ext: 'mobi' },
  fb2: { build: fb2.build, ext: 'fb2' },
  txt: { build: txt.build, ext: 'txt' },
};

export interface BuildRequest {
  doc: Document;
  url: string;
  format: Format;
  progress: ProgressFn;
  signal?: AbortSignal;
  /** Language code to translate the book into; omitted means the book is left as it is. */
  translateTo?: string;
  /** Which engine to translate with; Google Translate when omitted. */
  translator?: Translator;
}

export interface BuildResult {
  blob: Blob;
  filename: string;
  book: Book;
  adapter: string;
  missing: number;
  /** Set when translation was asked for but did not (fully) happen: already in that language, or chapters the engine refused. */
  untranslated?: string;
}

export async function buildBook({
  doc,
  url,
  format,
  progress,
  signal,
  translateTo,
  translator,
}: BuildRequest): Promise<BuildResult> {
  const adapter = resolveAdapter(url);
  // Reading takes the first part of the bar and translation the next, so the bar never runs backwards.
  const reading: ProgressFn = translateTo
    ? (text, percent) => progress(text, percent === undefined ? undefined : percent * 0.4)
    : progress;
  const ctx = makeContext({ progress: reading, signal, pacing: adapter.pacing });

  progress(`Reading the page (${siteLabel(url)})…`, 2);
  let book: Book;
  try {
    book = await adapter.parse(doc, url, ctx);
  } catch (err) {
    // The fallback only helps against restyled markup. On a network failure it
    // re-downloads the whole book — a second volley into the same rate limit —
    // and replaces a clear "the site limited the rate" with "no text found".
    const e = err as NetworkError;
    if (adapter.id === 'generic' || e.network || e.name === 'AbortError') throw err;
    progress('The markup did not match, trying the generic parser…', 5);
    book = await generic.parse(doc, url, ctx);
  }

  if (!book.chapters.length) throw new Error('Not a single chapter with text was found');

  // Chapters whose markup could not be read are dropped silently. An incomplete
  // book noticed halfway through reading is a worse outcome than an honest refusal.
  const expected = book.expectedChapters || 0;
  const missing = Math.max(0, expected - book.chapters.length);
  if (missing > 1 && missing > expected * 0.1) {
    throw new Error(
      `Only ${book.chapters.length} of ${expected} chapters could be read — the book would come out incomplete. Try again.`,
    );
  }

  let untranslated: string | undefined;
  if (translateTo) {
    const before = book;
    const report: TranslateReport = {};
    book = await translateBook(book, translateTo, translator ?? createGoogleTranslator(), progress, signal, report);
    // Assembling replaces the progress label at once, so the reader is told in the result instead.
    if (book === before) untranslated = alreadyIn(translateTo);
    else if (report.failure) untranslated = report.failure;
  }

  const builder = BUILDERS[format] || BUILDERS.epub;
  progress(`Assembling ${builder.ext.toUpperCase()} (${book.chapters.length} ch.)…`, 90);
  const blob = await builder.build(book);
  const filename = safeFilename(
    book.author ? `${book.title} — ${book.author}` : book.title,
    builder.ext,
  );

  return { blob, filename, book, adapter: adapter.id, missing, untranslated };
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 20000);
}
