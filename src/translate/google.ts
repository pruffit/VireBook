// Google Translate's unofficial web endpoint. It is not an API anyone promised
// to keep: it needs no key, answers with CORS open, and can say no at any time.
import type { TranslateResult, Translator } from './types.ts';
import { joinPieces, normalizeSpacing, planBatches, splitSegment } from './text.ts';
import { abortError, backoffDelay, createRateLimiter, parseRetryAfter, sleep } from '../lib/util.ts';
import { decodeText, fetchFully, NET_TIMING, type Fetched, type NetTiming } from '../lib/net.ts';

const ENDPOINT = 'https://translate.googleapis.com/translate_a/t';
const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_WAIT = 60000;

export interface GoogleOptions {
  fetch?: typeof fetch;
  /** Characters of source text per request. */
  budget?: number;
  maxSegments?: number;
  /** Pause between requests, ms. */
  gap?: number;
  maxAttempts?: number;
  /** First backoff step, ms. */
  backoffBase?: number;
  timing?: Partial<NetTiming>;
}

function refusal(status: number): Error {
  if (status === 429) {
    return new Error('Google Translate is limiting requests. Wait a few minutes, or download without translation.');
  }
  return new Error(`Google Translate refused the request (HTTP ${status}). Try later, or download without translation.`);
}

/** One entry per query: a bare string, or `[text, detectedLanguage]` when the source is `auto`. */
function textsOf(data: unknown, expected: number): TranslateResult {
  if (Array.isArray(data)) {
    const texts = data.map((item) => (Array.isArray(item) ? item[0] : item));
    if (texts.length === expected && texts.every((t) => typeof t === 'string')) {
      const detected = data.map((item) => (Array.isArray(item) && typeof item[1] === 'string' ? item[1] : ''));
      return { texts: texts as string[], detected };
    }
  }
  throw new Error('Google Translate answered in a shape we do not understand.');
}

export function createGoogleTranslator(options: GoogleOptions = {}): Translator {
  const { budget = 4500, maxSegments = 40, gap = 350, maxAttempts = 5, backoffBase = 1200 } = options;
  const doFetch: typeof fetch = options.fetch ?? ((input, init) => fetch(input, init));
  const limiter = createRateLimiter({ interval: gap, maxInterval: 15000 });
  const net: NetTiming = { ...NET_TIMING, ...options.timing };

  async function send(queries: string[], from: string, to: string, signal?: AbortSignal): Promise<TranslateResult> {
    const url = `${ENDPOINT}?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&format=html`;
    const body = new URLSearchParams();
    for (const q of queries) body.append('q', q);

    let httpAttempt = 0;
    let netAttempt = 0;
    let downSince = 0;
    for (;;) {
      await limiter.acquire(signal);
      if (signal?.aborted) throw abortError();

      let res: Fetched;
      try {
        res = await fetchFully(url, { method: 'POST', body }, { idle: net.idle, signal, fetchFn: doFetch });
      } catch (err) {
        if (signal?.aborted) throw err;
        if (!downSince) {
          downSince = Date.now();
          limiter.penalize(0);
        }
        if (Date.now() - downSince >= net.grace) {
          throw new Error('The network is not responding — check your connection.');
        }
        await sleep(backoffDelay(netAttempt++, { base: backoffBase, max: net.maxBackoff }), signal);
        continue;
      }
      downSince = 0;
      netAttempt = 0;

      if (res.ok) {
        limiter.reward();
        return textsOf(JSON.parse(decodeText(res.body)), queries.length);
      }
      if (!RETRY_STATUS.has(res.status)) throw refusal(res.status);

      const floor = Math.min(MAX_WAIT, parseRetryAfter(res.headers.get('Retry-After')));
      limiter.penalize(floor);
      httpAttempt += 1;
      if (httpAttempt >= maxAttempts) throw refusal(res.status);
      await sleep(backoffDelay(httpAttempt - 1, { base: backoffBase, max: MAX_WAIT, floor }), signal);
    }
  }

  return {
    id: 'google',
    async translate(segments, from, to, signal) {
      // An empty query would be dropped by the server and shift every answer after it.
      const results = segments.map((s) => (s.trim() ? '' : s));
      const owners: number[] = [];
      const pieces: string[] = [];
      segments.forEach((s, i) => {
        if (!s.trim()) return;
        for (const piece of splitSegment(s, budget)) {
          owners.push(i);
          pieces.push(piece);
        }
      });

      const translated: string[] = new Array(pieces.length);
      const langs: string[] = new Array(pieces.length).fill('');
      for (const group of planBatches(pieces, budget, maxSegments)) {
        const answer = await send(group.map((i) => pieces[i]!), from || 'auto', to, signal);
        group.forEach((pieceIndex, k) => {
          translated[pieceIndex] = normalizeSpacing(answer.texts[k]!, to);
          langs[pieceIndex] = answer.detected[k]!;
        });
      }
      const detected = segments.map(() => '');

      segments.forEach((s, i) => {
        if (!s.trim()) return;
        const mine: string[] = [];
        owners.forEach((owner, k) => {
          if (owner === i) mine.push(translated[k]!);
        });
        results[i] = joinPieces(mine);
        detected[i] = langs[owners.indexOf(i)]!;
      });
      return { texts: results, detected };
    },
  };
}
