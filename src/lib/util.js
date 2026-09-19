(function (root, factory) {
  const VireBook = (root.VireBook = root.VireBook || {});
  factory(VireBook);
  if (typeof module !== 'undefined' && module.exports) module.exports = VireBook;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (VireBook) {
  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    const b = new Uint8Array(16);
    (typeof crypto !== 'undefined' ? crypto : { getRandomValues: (a) => a.forEach((_, i) => (a[i] = (Math.random() * 256) | 0)) }).getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  const TRANSLIT = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  function translit(s) {
    return String(s)
      .toLowerCase()
      .replace(/[а-яё]/g, (c) => (c in TRANSLIT ? TRANSLIT[c] : c));
  }

  // Имя файла не транслитерируем: Windows и Kindle оба переваривают кириллицу,
  // а латиница из «Гарри Поттера» читается хуже оригинала.
  function safeFilename(name, ext, max = 80) {
    let base = String(name || 'fanfic')
      .replace(/[\x00-\x1F<>:"/\\|?*]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[. ]+$/, '')
      .trim();
    if (!base) base = 'fanfic';
    if (base.length > max) base = base.slice(0, max).trim();
    return ext ? `${base}.${ext}` : base;
  }

  function abortError() {
    const e = new Error('Отменено');
    e.name = 'AbortError';
    return e;
  }

  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) return reject(abortError());
      const timer = setTimeout(() => finish(resolve), ms);
      const onAbort = () => finish(() => reject(abortError()));
      function finish(settle) {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        settle();
      }
      if (signal) signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  /** Retry-After приходит либо числом секунд, либо HTTP-датой. */
  function parseRetryAfter(value, now = Date.now()) {
    if (!value) return 0;
    const raw = String(value).trim();
    if (/^\d+(\.\d+)?$/.test(raw)) return Math.max(0, Number(raw) * 1000);
    const when = Date.parse(raw);
    return Number.isFinite(when) ? Math.max(0, when - now) : 0;
  }

  /** Экспонента с джиттером: без разброса параллельные воркеры повторяют залпом. */
  function backoffDelay(attempt, { base = 1200, max = 60000, floor = 0, random = Math.random } = {}) {
    const span = Math.min(max, base * 2 ** attempt);
    return Math.max(floor, Math.round(span * (0.5 + random() * 0.5)));
  }

  /**
   * Темп держится цепочкой промисов, а не сравнением с «временем прошлого
   * запроса»: под параллельностью такая проверка пропускает всю пачку разом —
   * воркеры читают одно значение до того, как первый успел его обновить.
   */
  function createRateLimiter({ interval = 600, maxInterval = 15000 } = {}) {
    const base = interval;
    let current = interval;
    let nextSlot = 0;
    let chain = Promise.resolve();
    let streak = 0;

    function acquire(signal) {
      const turn = chain.then(() => {
        const now = Date.now();
        const at = Math.max(now, nextSlot);
        nextSlot = at + current;
        return at > now ? sleep(at - now, signal) : undefined;
      });
      chain = turn.then(null, () => {});
      return turn;
    }

    /** Сервер попросил притормозить: растягиваем шаг и сдвигаем всю очередь. */
    function penalize(pauseMs = 0) {
      streak = 0;
      current = Math.min(maxInterval, Math.max(current * 2, base * 2));
      if (pauseMs > 0) nextSlot = Math.max(nextSlot, Date.now() + pauseMs);
      return current;
    }

    /** Серия удач — осторожно возвращаемся к исходному темпу. */
    function reward() {
      if (current > base && ++streak >= 5) {
        current = Math.max(base, Math.round(current / 2));
        streak = 0;
      }
    }

    return {
      acquire,
      penalize,
      reward,
      get interval() { return current; },
    };
  }

  /** Пул с ограниченной параллельностью: сайты фанфиков не любят 30 запросов разом. */
  async function mapLimit(items, limit, fn, onProgress) {
    const results = new Array(items.length);
    let index = 0;
    let done = 0;
    const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
      for (;;) {
        const i = index++;
        if (i >= items.length) return;
        results[i] = await fn(items[i], i);
        done++;
        if (onProgress) onProgress(done, items.length);
      }
    });
    await Promise.all(workers);
    return results;
  }

  function detectLanguage(text) {
    const sample = String(text || '').slice(0, 4000);
    const cyr = (sample.match(/[а-яёА-ЯЁ]/g) || []).length;
    const lat = (sample.match(/[a-zA-Z]/g) || []).length;
    return cyr > lat ? 'ru' : 'en';
  }

  function normalizeSpace(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  VireBook.util = {
    uuid, translit, safeFilename, sleep, mapLimit, detectLanguage, normalizeSpace,
    abortError, parseRetryAfter, backoffDelay, createRateLimiter,
  };
  return VireBook;
});
