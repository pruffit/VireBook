// Small shared helpers: identifiers, filenames, pacing and the worker pool.

export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < b.length; i += 1) b[i] = (Math.random() * 256) | 0;
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function translit(s: string): string {
  return String(s)
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => (c in TRANSLIT ? TRANSLIT[c]! : c));
}

// Filenames are not transliterated: Windows and Kindle both digest Cyrillic,
// and a latinised title reads worse than the original.
export function safeFilename(name: string, ext?: string, max = 80): string {
  let base = String(name || 'book')
    .replace(/[\x00-\x1F<>:"/\\|?*]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/, '')
    .trim();
  if (!base) base = 'book';
  if (base.length > max) base = base.slice(0, max).trim();
  return ext ? `${base}.${ext}` : base;
}

export function abortError(): Error {
  const e = new Error('Cancelled');
  e.name = 'AbortError';
  return e;
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(abortError());
    const finish = (settle: () => void) => {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
      settle();
    };
    const onAbort = () => finish(() => reject(abortError()));
    const timer = setTimeout(() => finish(resolve as () => void), ms);
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** `Retry-After` arrives either as a number of seconds or as an HTTP date. */
export function parseRetryAfter(value: string | null | undefined, now = Date.now()): number {
  if (!value) return 0;
  const raw = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) return Math.max(0, Number(raw) * 1000);
  const when = Date.parse(raw);
  return Number.isFinite(when) ? Math.max(0, when - now) : 0;
}

export interface BackoffOptions {
  base?: number;
  max?: number;
  floor?: number;
  random?: () => number;
}

/** Exponential with jitter: without the spread, parallel workers retry in a volley. */
export function backoffDelay(attempt: number, options: BackoffOptions = {}): number {
  const { base = 1200, max = 60000, floor = 0, random = Math.random } = options;
  const span = Math.min(max, base * 2 ** attempt);
  return Math.max(floor, Math.round(span * (0.5 + random() * 0.5)));
}

export interface RateLimiter {
  acquire(signal?: AbortSignal): Promise<void>;
  penalize(pauseMs?: number): number;
  reward(): void;
  readonly interval: number;
}

/**
 * The pace is held by a chain of promises rather than by comparing against
 * "the time of the previous request": under concurrency such a check lets the
 * whole batch through — every worker reads the same value before the first one
 * has managed to update it.
 */
export function createRateLimiter({ interval = 600, maxInterval = 15000 } = {}): RateLimiter {
  const base = interval;
  let current = interval;
  let nextSlot = 0;
  let chain: Promise<unknown> = Promise.resolve();
  let streak = 0;

  function acquire(signal?: AbortSignal): Promise<void> {
    const turn = chain.then(() => {
      const now = Date.now();
      const at = Math.max(now, nextSlot);
      nextSlot = at + current;
      return at > now ? sleep(at - now, signal) : undefined;
    });
    chain = turn.then(null, () => {});
    return turn;
  }

  /** The server asked us to slow down: widen the step and push the whole queue. */
  function penalize(pauseMs = 0): number {
    streak = 0;
    current = Math.min(maxInterval, Math.max(current * 2, base * 2));
    if (pauseMs > 0) nextSlot = Math.max(nextSlot, Date.now() + pauseMs);
    return current;
  }

  /** A run of successes — creep back towards the original pace. */
  function reward(): void {
    if (current > base && ++streak >= 5) {
      current = Math.max(base, Math.round(current / 2));
      streak = 0;
    }
  }

  return {
    acquire,
    penalize,
    reward,
    get interval() {
      return current;
    },
  };
}

/** Bounded concurrency: book sites do not enjoy thirty requests at once. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let index = 0;
  let done = 0;
  const workers = new Array(Math.max(0, Math.min(limit, items.length))).fill(0).map(async () => {
    for (;;) {
      const i = index++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
      done += 1;
      if (onProgress) onProgress(done, items.length);
    }
  });
  await Promise.all(workers);
  return results;
}

export function detectLanguage(text: string): string {
  const sample = String(text || '').slice(0, 4000);
  const cyr = (sample.match(/[а-яёА-ЯЁ]/g) || []).length;
  const lat = (sample.match(/[a-zA-Z]/g) || []).length;
  return cyr > lat ? 'ru' : 'en';
}

export function normalizeSpace(s: string | null | undefined): string {
  return String(s || '').replace(/\s+/g, ' ').trim();
}
