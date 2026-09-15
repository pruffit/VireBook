// ficbook.net — селекторы сверены с живой страницей 15.09.2026.
(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  FK.adapters = FK.adapters || {};
  factory(FK);
  if (typeof module !== 'undefined' && module.exports) module.exports = FK;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
  const B = FK.adapters.base;

  // Фикбук отсекает по частоте заметно раньше остальных: 429 прилетал уже на
  // середине книги. Шаг держим широкий, параллельность — только чтобы прятать
  // задержку сети, темп всё равно задаёт ограничитель.
  const PACING = { interval: 800, maxInterval: 20000, concurrency: 2 };

  const BODY = ['#content', '.js-part-text', '.part_text', '#part_content .part_text'];
  const DROP = [
    '.fanfic-text-promo', '.js-part-text-promo', '.part-comment-form', '.ficbook-ad',
    '.adv-block', '.js-toggle-part-comments', '.part-actions', 'ins', '.mobile-hidden-ad',
  ];

  function readMeta(doc) {
    const fandom = B.textList(doc, ['.fanfic-hat a[href*="/fanfiction/"]', 'a[href*="/fanfiction/"]'], 4).join(', ');
    const tags = B.textList(doc, [
      '.fanfic-hat a[href*="/tags/"]', '.tags a', 'a.tag', 'a[href*="/tags/"]',
    ], 30);
    // Бейджи размечены классом-суффиксом: ds-label-rating-NC-17, ds-label-status-in-progress.
    const badge = (kind) => {
      const el = doc.querySelector(`.fanfic-badges [class*="ds-label-${kind}"], [class*="ds-label-${kind}"]`);
      if (!el) return '';
      const cls = typeof el.className === 'string' ? el.className : '';
      const m = cls.match(new RegExp(`ds-label-${kind}-([\\w-]+)`));
      const label = B.norm(el.textContent);
      // Текст бейджа на фикбуке часто пустой/иконочный — тогда берём сам класс.
      return label.length > 1 ? label : (m ? m[1].replace(/-/g, ' ') : '');
    };
    const rating = badge('rating');
    const status = badge('status');
    const size = badge('size');
    const pairing = B.textList(doc, ['.fanfic-hat a[href*="/pairings/"]', 'a[href*="/pairings/"]'], 6).join(', ');
    return { fandom, tags, rating, status, size, pairing };
  }

  function readAuthor(doc) {
    const links = Array.from(doc.querySelectorAll('a[href^="/authors/"], a[href*="ficbook.net/authors/"]'));
    const names = links
      .map((a) => B.norm(a.textContent))
      .filter((t) => t && t.length > 1 && t.length < 60);
    return Array.from(new Set(names)).slice(0, 3).join(', ');
  }

  function readSummary(doc) {
    // itemprop даёт само описание; .description — весь блок шапки вместе
    // с фэндомом и метками, поэтому он только запасной.
    const el = B.pick(doc, [
      '[itemprop="description"]', '.js-public-beta-description',
      '.fanfic-hat-body .description', '.description', '.fanfic-description',
    ]);
    if (!el) return { summaryXhtml: '', summaryText: '' };
    const { xhtml } = FK.html.sanitize(el, { baseUrl: 'https://ficbook.net/', keepImages: false, dropSelectors: DROP });
    const text = FK.html.toPlainText(el, DROP).slice(0, 1200);
    return { summaryXhtml: xhtml, summaryText: text };
  }

  function chapterLinks(doc, baseUrl) {
    const nodes = B.pickAll(doc, [
      'ul.list-of-fanfic-parts li.part a.part-link',
      'li.part a.part-link',
      'a.part-link',
    ], 400);
    const seen = new Set();
    const out = [];
    for (const a of nodes) {
      const href = a.getAttribute('href');
      if (!href) continue;
      const url = FK.html.absolutize(href, baseUrl);
      if (!url) continue;
      const clean = url.split('#')[0];
      if (seen.has(clean)) continue;
      seen.add(clean);
      out.push({ url: clean, title: B.norm(a.textContent) || `Глава ${out.length + 1}` });
    }
    return out;
  }

  function parseChapter(doc, url, fallbackTitle) {
    const body = B.pick(doc, BODY);
    if (!body) return null;
    const title =
      B.pickText(doc, ['#part_content .title-area h2', '.title-area h2', '#part_content h2'], 200) ||
      fallbackTitle;
    const { xhtml } = FK.html.sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
    return { title: title || 'Глава', xhtml };
  }

  async function parse(doc, url, ctx) {
    const title = B.pickText(doc, ['h1.heading', '.fanfic-hat h1', 'h1'], 300) || B.metaContent(doc, ['og:title']);
    const meta = readMeta(doc);
    const summary = readSummary(doc);
    const author = readAuthor(doc);

    // На странице главы оглавления нет — за списком частей идём на карточку фанфика.
    let workDoc = doc;
    let workUrl = url;
    const partMatch = url.match(/^(https?:\/\/[^/]+\/readfic\/[^/?#]+)\/\d+/);
    if (partMatch) {
      workUrl = partMatch[1];
      workDoc = await ctx.fetchDoc(workUrl);
    }

    let links = chapterLinks(workDoc, workUrl);

    // Мини без разбивки на части: текст лежит прямо на карточке.
    if (!links.length) {
      const single = parseChapter(doc, url, title);
      if (single) {
        return B.finalize({
          title, author, sourceUrl: url, siteName: 'Книга Фанфиков',
          ...meta, ...summary, chapters: [{ ...single, title }],
        });
      }
      const onWork = parseChapter(workDoc, workUrl, title);
      if (onWork) {
        return B.finalize({
          title, author, sourceUrl: workUrl, siteName: 'Книга Фанфиков',
          ...meta, ...summary, chapters: [{ ...onWork, title }],
        });
      }
      throw new Error('Не нашёл ни списка частей, ни текста на странице');
    }

    ctx.progress(`Найдено частей: ${links.length}`, 5);

    const chapters = await FK.util.mapLimit(
      links,
      PACING.concurrency,
      async (link, i) => {
        if (link.url.split('#')[0] === url.split('#')[0]) return parseChapter(doc, url, link.title);
        const d = await ctx.fetchDoc(link.url);
        return parseChapter(d, link.url, link.title);
      },
      (done, total) => ctx.progress(`Скачано глав: ${done} из ${total}`, 5 + (done / total) * 80)
    );

    return B.finalize({
      title: title || 'Фанфик',
      author,
      sourceUrl: workUrl,
      siteName: 'Книга Фанфиков',
      ...meta,
      ...summary,
      expectedChapters: links.length,
      chapters: chapters.filter(Boolean),
    });
  }

  FK.adapters.ficbook = {
    id: 'ficbook',
    name: 'Книга Фанфиков',
    pacing: PACING,
    match: (url) => /(^|\.)ficbook\.net$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/readfic\//.test(url),
    parse,
  };
  return FK;
});
