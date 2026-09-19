// The orchestrator: pick an adapter, assemble the book, hand over the file.
import type { Book, Format, NetworkError, Pacing, ParseContext, ProgressFn } from './types.ts';
import { siteLabel } from './adapters/base.ts';
import { generic, resolveAdapter } from './adapters/index.ts';
import * as epub from './lib/epub.ts';
import * as fb2 from './lib/fb2.ts';
import * as mobi from './lib/mobi.ts';
import * as txt from './lib/txt.ts';
import { abortError, backoffDelay, createRateLimiter, parseRetryAfter, safeFilename, sleep } from './lib/util.ts';

export { resolveAdapter };

const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 5;
const MAX_WAIT = 60000;
const SLOW_DOWN = new Set([429, 503]);

/** Mark network failures: falling back to the generic parser is pointless for them. */
function netError(message: string): NetworkError {
  const err = new Error(message) as NetworkError;
  err.network = true;
  return err;
}

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
}

export function makeContext({ progress, signal, pacing }: ContextOptions): ParseContext {
  const parser = new DOMParser();
  const report: ProgressFn = progress || (() => {});
  const limiter = createRateLimiter({
    interval: pacing?.interval ?? 600,
    maxInterval: pacing?.maxInterval ?? 15000,
  });

  const aborted = (): boolean => Boolean(signal && signal.aborted);

  async function pause(attempt: number, floor: number, status: number): Promise<void> {
    const delay = backoffDelay(attempt, { floor, max: MAX_WAIT });
    // Otherwise, through a long pause the panel freezes on "Chapters fetched:
    // 3 of 40" and looks hung.
    if (SLOW_DOWN.has(status)) {
      report(`The site asked us to slow down — continuing in ${Math.ceil(delay / 1000)} s…`);
    }
    await sleep(delay, signal);
  }

  async function request(url: string): Promise<Response> {
    let last: Error | null = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      await limiter.acquire(signal);
      if (aborted()) throw abortError();

      let res: Response;
      try {
        res = await fetch(url, { credentials: 'same-origin', redirect: 'follow', signal });
      } catch (err) {
        if (aborted()) throw err;
        last = netError('The network is not responding — check your connection.');
        limiter.penalize(0);
        if (attempt < MAX_ATTEMPTS - 1) await pause(attempt, 0, 0);
        continue;
      }

      if (res.ok) {
        limiter.reward();
        return res;
      }
      if (!RETRY_STATUS.has(res.status)) throw netError(httpMessage(res.status));

      const floor = Math.min(MAX_WAIT, parseRetryAfter(res.headers.get('Retry-After')));
      last = netError(httpMessage(res.status));
      limiter.penalize(floor);
      if (attempt < MAX_ATTEMPTS - 1) await pause(attempt, floor, res.status);
    }
    throw last || netError('The request failed');
  }

  async function fetchText(url: string): Promise<string> {
    return (await request(url)).text();
  }

  async function fetchDoc(url: string): Promise<Document> {
    return parser.parseFromString(await fetchText(url), 'text/html');
  }

  function parseFragment(html: string): HTMLElement {
    return parser.parseFromString(`<body>${html}</body>`, 'text/html').body;
  }

  async function fetchBytes(url: string): Promise<Uint8Array> {
    return new Uint8Array(await (await request(url)).arrayBuffer());
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
}

export interface BuildResult {
  blob: Blob;
  filename: string;
  book: Book;
  adapter: string;
  missing: number;
}

export async function buildBook({ doc, url, format, progress, signal }: BuildRequest): Promise<BuildResult> {
  const adapter = resolveAdapter(url);
  const ctx = makeContext({ progress, signal, pacing: adapter.pacing });

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

  const builder = BUILDERS[format] || BUILDERS.epub;
  progress(`Assembling ${builder.ext.toUpperCase()} (${book.chapters.length} ch.)…`, 90);
  const blob = await builder.build(book);
  const filename = safeFilename(
    book.author ? `${book.title} — ${book.author}` : book.title,
    builder.ext,
  );

  return { blob, filename, book, adapter: adapter.id, missing };
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
