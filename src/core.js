// Оркестратор: выбрать адаптер, собрать книгу, отдать файл.
(function (root, factory) {
  const VireBook = (root.VireBook = root.VireBook || {});
  factory(VireBook);
  if (typeof module !== 'undefined' && module.exports) module.exports = VireBook;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (VireBook) {
  const ORDER = ['ficbook', 'ao3', 'fanficsme', 'ffnet', 'wattpad', 'royalroad'];

  function resolveAdapter(url) {
    for (const id of ORDER) {
      const a = VireBook.adapters[id];
      if (!a) continue;
      try {
        if (a.match(url)) return a;
      } catch {
        /* битый URL — просто идём дальше */
      }
    }
    return VireBook.adapters.generic;
  }

  const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
  const MAX_ATTEMPTS = 5;
  const MAX_WAIT = 60000;
  const SLOW_DOWN = new Set([429, 503]);

  /** Помечаем сетевые отказы: на них откат в универсальный парсер бессмыслен. */
  function netError(message) {
    const err = new Error(message);
    err.network = true;
    return err;
  }

  function httpMessage(status) {
    if (status === 429) return 'Сайт ограничил частоту запросов. Подожди пару минут и попробуй снова.';
    if (status === 403) return 'Сайт не отдал страницу (403) — проверь, что фанфик открывается в обычной вкладке.';
    if (status === 404) return 'Страница не найдена (404) — возможно, фанфик удалён или скрыт.';
    if (status >= 500) return `Сайт отвечает ошибкой ${status} — попробуй позже.`;
    return `HTTP ${status}`;
  }

  function makeContext({ progress, signal, pacing }) {
    const parser = new DOMParser();
    const report = progress || (() => {});
    const limiter = VireBook.util.createRateLimiter({
      interval: (pacing && pacing.interval) || 600,
      maxInterval: (pacing && pacing.maxInterval) || 15000,
    });

    const aborted = () => Boolean(signal && signal.aborted);

    async function pause(attempt, floor, status) {
      const delay = VireBook.util.backoffDelay(attempt, { floor, max: MAX_WAIT });
      // Иначе на длинной паузе панель замирает на «Скачано глав: 3 из 40»
      // и выглядит зависшей.
      if (SLOW_DOWN.has(status)) {
        report(`Сайт просит сбавить темп — продолжу через ${Math.ceil(delay / 1000)} с…`);
      }
      await VireBook.util.sleep(delay, signal);
    }

    async function request(url) {
      let last = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        await limiter.acquire(signal);
        if (aborted()) throw VireBook.util.abortError();

        let res;
        try {
          res = await fetch(url, { credentials: 'same-origin', redirect: 'follow', signal });
        } catch (err) {
          if (aborted()) throw err;
          last = netError('Сеть не отвечает — проверь соединение.');
          limiter.penalize(0);
          if (attempt < MAX_ATTEMPTS - 1) await pause(attempt, 0, 0);
          continue;
        }

        if (res.ok) {
          limiter.reward();
          return res;
        }
        if (!RETRY_STATUS.has(res.status)) throw netError(httpMessage(res.status));

        const floor = Math.min(MAX_WAIT, VireBook.util.parseRetryAfter(res.headers.get('Retry-After')));
        last = netError(httpMessage(res.status));
        limiter.penalize(floor);
        if (attempt < MAX_ATTEMPTS - 1) await pause(attempt, floor, res.status);
      }
      throw last || netError('Запрос не удался');
    }

    async function fetchText(url) {
      return (await request(url)).text();
    }

    async function fetchDoc(url) {
      return parser.parseFromString(await fetchText(url), 'text/html');
    }

    function parseFragment(html) {
      return parser.parseFromString(`<body>${html}</body>`, 'text/html').body;
    }

    async function fetchBytes(url) {
      return new Uint8Array(await (await request(url)).arrayBuffer());
    }

    return { fetchText, fetchDoc, fetchBytes, parseFragment, progress: report, signal };
  }

  const BUILDERS = {
    epub: { build: (b) => VireBook.epub.build(b), ext: 'epub' },
    mobi: { build: (b) => VireBook.mobi.build(b), ext: 'mobi' },
    fb2: { build: (b) => VireBook.fb2.build(b), ext: 'fb2' },
    txt: { build: (b) => VireBook.txt.build(b), ext: 'txt' },
  };

  async function buildBook({ doc, url, format, progress, signal }) {
    const adapter = resolveAdapter(url);
    const ctx = makeContext({ progress, signal, pacing: adapter.pacing });

    progress(`Разбираю страницу (${adapter.name})…`, 2);
    let book;
    try {
      book = await adapter.parse(doc, url, ctx);
    } catch (err) {
      // Откат помогает только против переверстанной разметки. На сетевом отказе
      // он заново качает всю книгу — второй залп по тому же лимиту — и подменяет
      // внятное «сайт ограничил частоту» на «не нашёл текста».
      if (adapter.id === 'generic' || err.network || err.name === 'AbortError') throw err;
      progress('Разметка не совпала, пробую универсальный разбор…', 5);
      book = await VireBook.adapters.generic.parse(doc, url, ctx);
    }

    if (!book.chapters.length) throw new Error('Не нашёл ни одной главы с текстом');

    // Главы, чью разметку не удалось разобрать, отсеиваются молча. Неполная
    // книга, замеченная на середине чтения, — худший исход, чем честный отказ.
    const expected = book.expectedChapters || 0;
    const missing = Math.max(0, expected - book.chapters.length);
    if (missing > 1 && missing > expected * 0.1) {
      throw new Error(
        `Разобрал только ${book.chapters.length} глав из ${expected} — книга вышла бы неполной. Попробуй ещё раз.`
      );
    }

    const builder = BUILDERS[format] || BUILDERS.epub;
    progress(`Собираю ${builder.ext.toUpperCase()} (${book.chapters.length} гл.)…`, 90);
    const blob = await builder.build(book);
    const filename = VireBook.util.safeFilename(
      book.author ? `${book.title} — ${book.author}` : book.title,
      builder.ext
    );

    return { blob, filename, book, adapter: adapter.id, missing };
  }

  function saveBlob(blob, filename) {
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

  VireBook.core = { resolveAdapter, buildBook, saveBlob, makeContext, BUILDERS };
  return VireBook;
});
