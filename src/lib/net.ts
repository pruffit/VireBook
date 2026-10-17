// Requests that survive a connection which dies without saying so.
import { abortError } from './util.ts';

export interface NetTiming {
  /** Silence, ms, after which an attempt is given up: no headers and no body bytes. */
  idle: number;
  /** How long one request keeps retrying through a dead network, ms. */
  grace: number;
  /** First backoff step between network retries, ms. */
  backoff: number;
  /** Longest backoff step, ms: a network that is back should be noticed soon. */
  maxBackoff: number;
}

export const NET_TIMING: NetTiming = { idle: 20000, grace: 120000, backoff: 1000, maxBackoff: 8000 };

export interface Fetched {
  ok: boolean;
  status: number;
  headers: Headers;
  body: Uint8Array;
}

/**
 * One attempt, headers and body under a single idle timer. A request caught in a
 * VPN reconnect can stay pending forever; only a timer turns it into a failure
 * the caller can retry.
 */
export async function fetchFully(
  url: string,
  init: RequestInit,
  { idle, signal, fetchFn = fetch }: { idle: number; signal?: AbortSignal; fetchFn?: typeof fetch },
): Promise<Fetched> {
  if (signal?.aborted) throw abortError();
  const ctl = new AbortController();
  let timedOut = false;
  // Raced against every await: a fetch that ignores its signal must not hang us either.
  const stopped = new Promise<never>((_, reject) => {
    ctl.signal.addEventListener(
      'abort',
      () => reject(timedOut ? new Error(`No answer for ${Math.round(idle / 1000)} s`) : abortError()),
      { once: true },
    );
  });
  stopped.catch(() => {});
  const cancel = () => ctl.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timedOut = true;
      ctl.abort();
    }, idle);
  };
  const guard = <T>(p: Promise<T>): Promise<T> => Promise.race([p, stopped]);

  try {
    arm();
    const res = await guard(fetchFn(url, { ...init, signal: ctl.signal }));
    if (!res.ok) {
      res.body?.cancel().catch(() => {});
      return { ok: false, status: res.status, headers: res.headers, body: new Uint8Array() };
    }
    const body = res.body
      ? await readBody(res.body.getReader(), guard, arm)
      : new Uint8Array(await guard(res.arrayBuffer()));
    return { ok: true, status: res.status, headers: res.headers, body };
  } catch (err) {
    if (signal?.aborted) throw abortError();
    throw err;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

async function readBody(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  guard: <T>(p: Promise<T>) => Promise<T>,
  onChunk: () => void,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await guard(reader.read());
      if (done) break;
      onChunk();
      chunks.push(value);
      size += value.length;
    }
  } catch (err) {
    reader.cancel().catch(() => {});
    throw err;
  }
  const body = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    body.set(c, at);
    at += c.length;
  }
  return body;
}

export const decodeText = (body: Uint8Array): string => new TextDecoder().decode(body);
