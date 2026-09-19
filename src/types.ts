// The vocabulary every other module speaks. One book, many sites: an adapter's
// only job is to turn a page into a `Book`, and every writer's only job is to
// turn a `Book` into a file.

/** One chapter of the assembled book. `xhtml` is already sanitised. */
export interface Chapter {
  title: string;
  xhtml: string;
  /** End notes, kept apart so writers can set them in smaller type. */
  notesXhtml?: string;
}

export interface CoverImage {
  bytes: Uint8Array;
  mime?: string;
  ext?: string;
}

export interface Book {
  title: string;
  author: string;
  /** BCP-47-ish, guessed from the text when the site does not say. */
  language: string;
  uuid: string;
  chapters: Chapter[];
  tags: string[];
  fandom?: string;
  pairing?: string;
  rating?: string;
  status?: string;
  size?: string;
  summaryXhtml?: string;
  summaryText?: string;
  sourceUrl?: string;
  siteName?: string;
  /** How many chapters the site claims. Zero means "no idea" — see core. */
  expectedChapters?: number;
  cover?: CoverImage;
}

/** What an adapter hands to `finalize`: everything is optional but the chapters. */
export type BookDraft = Partial<Omit<Book, 'chapters'>> & {
  chapters: (Chapter | null | undefined)[];
};

/** `percent` is a hint for the progress bar, not a promise. */
export type ProgressFn = (text: string, percent?: number) => void;

/**
 * Everything an adapter is allowed to touch outside its own document.
 * Requests go through here and nowhere else: this is where the pacing,
 * `Retry-After` and backoff live, and a bare `fetch` would walk straight
 * into the rate limit they exist to avoid.
 */
export interface ParseContext {
  fetchText(url: string): Promise<string>;
  fetchDoc(url: string): Promise<Document>;
  fetchBytes(url: string): Promise<Uint8Array>;
  /** Parses an HTML fragment into a detached element, for APIs that return markup. */
  parseFragment(html: string): HTMLElement;
  progress: ProgressFn;
  signal?: AbortSignal;
}

/** How hard a site may be pushed. Some of them bite much earlier than others. */
export interface Pacing {
  interval?: number;
  maxInterval?: number;
  concurrency?: number;
}

/** A file the site itself offers — always better than one we assemble. */
export interface NativeDownload {
  format: string;
  url: string | null;
}

export interface Adapter {
  id: string;
  name: string;
  pacing?: Pacing;
  match(url: string): boolean;
  isWorkPage(url: string): boolean;
  native?(doc: Document): NativeDownload[];
  parse(doc: Document, url: string, ctx: ParseContext): Promise<Book>;
}

export type Format = 'epub' | 'mobi' | 'fb2' | 'txt';

/** A failure that came from the network, not from markup we failed to read. */
export interface NetworkError extends Error {
  network?: true;
}
