// The network failing the way a VPN reconnect makes it fail: requests that never
// settle, bodies that stop halfway, a connection that is gone for a while.
import { JSDOM } from 'jsdom';

import { makeContext } from '../src/core.ts';
import { fetchFully } from '../src/lib/net.ts';
import { createGoogleTranslator } from '../src/translate/google.ts';
import type { NetworkError } from '../src/types.ts';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;

let passed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passed += 1;
  } catch (err) {
    failures.push(`${name}: ${(err as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function assertEq<T>(a: T, b: T, msg: string): void {
  if (a !== b) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

async function rejects(p: Promise<unknown>, pattern: RegExp, msg: string): Promise<Error> {
  try {
    await p;
  } catch (err) {
    const e = err as Error;
    assert(pattern.test(e.message + e.name), `${msg}: wrong error ${e.message}`);
    return e;
  }
  throw new Error(`${msg}: did not throw`);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const enc = new TextEncoder();

/** Never settles and ignores its signal: the worst a dead connection can do. */
const hang: typeof fetch = () => new Promise<Response>(() => {});
const drop: typeof fetch = async () => {
  throw new TypeError('Failed to fetch');
};

/** Sends the first chunk, then goes silent. */
const stallMidBody: typeof fetch = async () =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode('<p>half'));
      },
    }),
  );

/** Chunks `gap` ms apart: slow, but never silent for long. */
const trickle = (parts: string[], gap: number): typeof fetch => async () =>
  new Response(
    new ReadableStream<Uint8Array>({
      async start(c) {
        for (const p of parts) {
          await wait(gap);
          c.enqueue(enc.encode(p));
        }
        c.close();
      },
    }),
  );

/** Plays the given fetches in order, one per attempt. */
function script(...steps: (typeof fetch)[]): { fn: typeof fetch; calls: () => number } {
  let n = 0;
  return {
    fn: (input, init) => steps[Math.min(n++, steps.length - 1)]!(input, init),
    calls: () => n,
  };
}

const page = (html: string): typeof fetch => async () => new Response(html, { status: 200 });
const FAST = { idle: 40, backoff: 1, maxBackoff: 5, grace: 2000 };

// ================== one attempt ==================

await test('a request that never settles fails after the idle timeout', async () => {
  const started = Date.now();
  await rejects(fetchFully('https://x/', {}, { idle: 40, fetchFn: hang }), /No answer/, 'hang');
  assert(Date.now() - started < 1000, 'it gave up on time');
});

await test('a body that stops halfway fails after the idle timeout', async () => {
  await rejects(fetchFully('https://x/', {}, { idle: 40, fetchFn: stallMidBody }), /No answer/, 'stall');
});

await test('a slow body that keeps arriving is not cut off: the timer is idle time, not total time', async () => {
  const res = await fetchFully('https://x/', {}, { idle: 120, fetchFn: trickle([...'abcdefgh'], 20) });
  assertEq(new TextDecoder().decode(res.body), 'abcdefgh', 'body');
});

await test('slow headers do not eat into the time for the body', async () => {
  const late: typeof fetch = async () => {
    await wait(90);
    return trickle(['x'], 90)('https://x/');
  };
  const res = await fetchFully('https://x/', {}, { idle: 150, fetchFn: late });
  assertEq(new TextDecoder().decode(res.body), 'x', 'body');
});

await test('cancelling stops a hung attempt at once, as a cancel and not a network error', async () => {
  const ac = new AbortController();
  setTimeout(() => ac.abort(), 10);
  await rejects(fetchFully('https://x/', {}, { idle: 5000, signal: ac.signal, fetchFn: hang }), /Abort|Cancelled/, 'abort');
});

// ================== the book's requests ==================

await test('a brief drop mid-download is ridden out: hang, refusal, then the page', async () => {
  const s = script(hang, drop, page('<p>chapter</p>'));
  const said: string[] = [];
  const ctx = makeContext({ fetch: s.fn, timing: FAST, pacing: { interval: 1 }, progress: (t) => said.push(t) });
  const text = await ctx.fetchText('https://ficbook.net/readfic/1/2');
  assertEq(text, '<p>chapter</p>', 'the page arrived');
  assertEq(s.calls(), 3, 'two failed attempts, one good');
  assert(said.some((t) => /connection dropped/.test(t)), `the panel was told: ${said.join(' | ')}`);
});

await test('a fetch failing with an AbortError the user did not ask for is retried, not taken for a cancel', async () => {
  // Browsers report our own idle abort this way; only the user's signal means "cancel".
  const aborted: typeof fetch = async () => {
    throw new DOMException('The operation was aborted.', 'AbortError');
  };
  const s = script(aborted, page('<p>after</p>'));
  const ctx = makeContext({ fetch: s.fn, timing: FAST, pacing: { interval: 1 } });
  assertEq(await ctx.fetchText('https://x/1'), '<p>after</p>', 'the retry arrived');
});

await test('a server error is still retried a bounded number of times', async () => {
  const s = script(async () => new Response('', { status: 503 }), page('<p>ok</p>'));
  const ctx = makeContext({ fetch: s.fn, timing: FAST, pacing: { interval: 1 } });
  assertEq(await ctx.fetchText('https://x/1'), '<p>ok</p>', 'the retry arrived');
  assertEq(s.calls(), 2, 'one 503, one good');
});

await test('one outage clock for the whole download: once it is over, the next request fails at once', async () => {
  const ctx = makeContext({ fetch: drop, timing: { ...FAST, grace: 400 }, pacing: { interval: 1 } });
  await rejects(ctx.fetchText('https://x/1'), /not responding/, 'first');
  const started = performance.now();
  await rejects(ctx.fetchText('https://x/2'), /not responding/, 'second');
  assert(performance.now() - started < 200, 'the second request did not wait out a new window');
});

await test('a body cut off by the drop is fetched again, not passed on half-read', async () => {
  const s = script(stallMidBody, page('<p>whole</p>'));
  const ctx = makeContext({ fetch: s.fn, timing: FAST, pacing: { interval: 1 } });
  assertEq(await ctx.fetchText('https://x/1'), '<p>whole</p>', 'the second answer');
});

await test('a network that stays down ends in a clear network error, not an endless wait', async () => {
  const ctx = makeContext({ fetch: drop, timing: { ...FAST, grace: 150 }, pacing: { interval: 1 } });
  const err = (await rejects(ctx.fetchText('https://x/1'), /not responding/, 'down')) as NetworkError;
  assert(err.network, 'marked as a network failure, so no generic re-parse is attempted');
});

await test('an HTTP refusal is still not retried', async () => {
  const s = script(async () => new Response('', { status: 404 }));
  const ctx = makeContext({ fetch: s.fn, timing: FAST, pacing: { interval: 1 } });
  await rejects(ctx.fetchText('https://x/1'), /404/, '404');
  assertEq(s.calls(), 1, 'one request');
});

await test('cancelling during a wait for the network stops at once', async () => {
  const ac = new AbortController();
  const ctx = makeContext({ fetch: drop, timing: { ...FAST, backoff: 5000, maxBackoff: 5000 }, signal: ac.signal });
  setTimeout(() => ac.abort(), 30);
  const started = Date.now();
  await rejects(ctx.fetchText('https://x/1'), /Abort|Cancelled/, 'abort');
  assert(Date.now() - started < 1000, 'no five-second wait');
});

// ================== translation ==================

await test('translation rides out a hung request too', async () => {
  const s = script(hang, async (_input, init) => {
    const q = (init?.body as URLSearchParams).getAll('q');
    return Response.json(q.map((t) => `RU ${t}`));
  });
  const engine = createGoogleTranslator({ fetch: s.fn, gap: 0, backoffBase: 1, timing: FAST });
  const said: string[] = [];
  const out = await engine.translate(['Hello'], 'en', 'ru', undefined, (t) => said.push(t));
  assertEq(out.texts[0], 'RU Hello', 'translated');
  assertEq(s.calls(), 2, 'one hung attempt, one good');
  assert(said.some((t) => /connection dropped/.test(t)), 'the wait was announced');
});

await test('translation: once the outage is over, the next chapter fails at once, as a network error', async () => {
  const engine = createGoogleTranslator({ fetch: drop, gap: 0, timing: { ...FAST, grace: 400 } });
  await rejects(engine.translate(['One'], 'en', 'ru'), /not responding/, 'first');
  const started = performance.now();
  const err = (await rejects(engine.translate(['Two'], 'en', 'ru'), /not responding/, 'second')) as NetworkError;
  assert(performance.now() - started < 200, 'no new window per chapter');
  assert(err.network, 'marked as a network failure');
});

await test('translation: cancelling during a hung request stops at once', async () => {
  const engine = createGoogleTranslator({ fetch: hang, gap: 0, timing: { ...FAST, idle: 5000 } });
  const ac = new AbortController();
  setTimeout(() => ac.abort(), 20);
  await rejects(engine.translate(['Hello'], 'en', 'ru', ac.signal), /Abort|Cancelled/, 'abort');
});

console.log(`\npassed: ${passed}, failed: ${failures.length}`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
