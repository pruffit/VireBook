// Requests that survive a connection which dies without saying so.
import type { NetworkError } from '../types.ts';
import { abortError } from './util.ts';

export const NETWORK_DOWN = 'The network is not responding — check your connection.';

/** Mark network failures: falling back to the generic parser is pointless for them. */
export function netError(message: string): NetworkError {
  const err = new Error(message) as NetworkError;
  err.network = true;
  return err;
}

export const isNetworkError = (err: unknown): boolean => Boolean((err as NetworkError | null)?.network);

export interface NetTiming {
  /** Silence, ms, after which an attempt is given up: no headers and no body bytes. */
  idle: number;
  /** How long a download keeps retrying through a dead network, ms. */
  grace: number;
  /** First backoff step between network retries, ms. */
  backoff: number;
  /** Longest backoff step, ms: a network that is back should be noticed soon. */
  maxBackoff: number;
}

export const NET_TIMING: NetTiming = { idle: 20000, grace: 120000, backoff: 1000, maxBackoff: 8000 };

export interface Outage {
  /** A failed attempt; true when it is the one that opens the outage. */
  begin(): boolean;
  /** The network has been gone for longer than the grace window. */
  over(): boolean;
  /** Any answer at all: the network is back. */
  end(): void;
}

/** One clock per download, shared by every request: a long outage ends them all at once. */
export function createOutage(grace: number, now: () => number = () => performance.now()): Outage {
  let since = -1;
  return {
    begin() {
      if (since >= 0) return false;
      since = now();
      return true;
    },
    over: () => since >= 0 && now() - since >= grace,
    end() {
      since = -1;
    },
  };
}

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
    arm();
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
