// Универсальный парсер: работает на сайте, под который адаптера нет.
// Три стратегии по убыванию надёжности — список глав на странице, обход по
// «следующей главе», одиночная страница.
(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  FK.adapters = FK.adapters || {};
  factory(FK);
  if (typeof module !== 'undefined' && module.exports) module.exports = FK;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
  const B = FK.adapters.base;
  const MAX_CHAPTERS = 400;

  const CHAPTER_TEXT = /^\s*(глава|глава\s*№|часть|раздел|chapter|ch\.?|part|episode|эпизод)\s*[.:№-]?\s*\d+/i;
  const NEXT_TEXT = /(следующ|далее|вперёд|вперед|дальше|next\s*(chapter|part)?|→|»|&gt;&gt;)/i;
  const PREV_TEXT = /(предыдущ|назад|previous|prev|←|«)/i;

  function scoreChapterList(doc, baseUrl) {
    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    const byContainer = new Map();

    for (const a of anchors) {
      const href = a.getAttribute('href');
      if (!href || /^(javascript:|mailto:|#)/i.test(href)) continue;
      const url = FK.html.absolutize(href, baseUrl);
      if (!url) continue;
      if (new URL(url).hostname !== new URL(baseUrl).hostname) continue;
      const text = B.norm(a.textContent);
      if (!text || text.length > 160) continue;

      const parent = a.closest('ul, ol, table, nav, div, select') || doc.body;
      if (!byContainer.has(parent)) byContainer.set(parent, []);
      byContainer.get(parent).push({ url: url.split('#')[0], title: text, numbered: CHAPTER_TEXT.test(text) });
    }

    // Меню сайта — тоже набор ссылок с одинаковым шаблоном пути. Без этой
    // отсечки парсер уходит качать весь навбар вместо глав.
    const NAVISH = /(^|[\s_-])(nav|menu|footer|header|sidebar|aside|breadcrumb|pagination|pager|tags?|related|recommend|social|share)([\s_-]|$)/i;
    const TOCISH = /(toc|chapter|chapters|part|parts|content|contents|index|list|глав|част)/i;
    const containerHint = (el) => {
      const tag = (el.tagName || '').toLowerCase();
      const idc = `${el.id || ''} ${typeof el.className === 'string' ? el.className : ''}`;
      if (tag === 'nav' || tag === 'header' || tag === 'footer' || tag === 'aside') return 'nav';
      if (NAVISH.test(idc)) return 'nav';
      if (TOCISH.test(idc)) return 'toc';
      return 'plain';
    };

    let best = null;
    let bestScore = 0;
    for (const [container, items] of byContainer) {
      if (items.length < 2) continue;
      const hint = containerHint(container);
      if (hint === 'nav') continue;
      const uniq = [];
      const seen = new Set();
      for (const it of items) {
        if (seen.has(it.url)) continue;
        seen.add(it.url);
        uniq.push(it);
      }
      if (uniq.length < 2) continue;
      const numbered = uniq.filter((i) => i.numbered).length;
      // Ссылки одного списка, ведущие по одному шаблону пути, — почти наверняка главы.
      const paths = uniq.map((i) => new URL(i.url).pathname.replace(/\d+/g, '#'));
      const sameShape = paths.filter((p) => p === paths[0]).length;
      const score = numbered * 3 + sameShape + uniq.length * 0.2 + (hint === 'toc' ? 5 : 0);
      // Одинаковый шаблон пути сам по себе ничего не доказывает: нужен либо
      // явно нумерованный текст ссылок, либо контейнер, похожий на оглавление.
      const plausible =
        numbered >= 2 || (hint === 'toc' && sameShape >= Math.max(3, uniq.length * 0.8));
      if (score > bestScore && plausible) {
        bestScore = score;
        best = uniq;
      }
    }
    return best ? best.slice(0, MAX_CHAPTERS) : null;
  }

  function findNextLink(doc, baseUrl) {
    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    for (const a of anchors) {
      const text = B.norm(a.textContent);
      const rel = a.getAttribute('rel') || '';
      const aria = a.getAttribute('title') || a.getAttribute('aria-label') || '';
      const hay = `${text} ${rel} ${aria}`;
      if (!NEXT_TEXT.test(hay) || PREV_TEXT.test(text)) continue;
      const url = FK.html.absolutize(a.getAttribute('href'), baseUrl);
      if (!url || url.split('#')[0] === baseUrl.split('#')[0]) continue;
      if (new URL(url).hostname !== new URL(baseUrl).hostname) continue;
      return url.split('#')[0];
    }
    return null;
  }

  function extract(doc, url, fallbackTitle) {
    const body = B.findMainContent(doc);
    if (!body) return null;
    const { xhtml } = FK.html.sanitize(body, { baseUrl: url, keepImages: false });
    if (!xhtml || xhtml.replace(/<[^>]+>/g, '').trim().length < 200) return null;
    const heading = B.pickText(doc, ['h1', 'h2', '.chapter-title', '[class*="chapter"] h2'], 200);
    return { title: heading || fallbackTitle || 'Глава', xhtml };
  }

  async function parse(doc, url, ctx) {
    const title =
      B.metaContent(doc, ['og:title', 'twitter:title']) ||
      B.pickText(doc, ['h1'], 300) ||
      B.norm(doc.title).split(/[|—–-]/)[0];
    const author =
      B.metaContent(doc, ['author', 'book:author', 'article:author']) ||
      B.pickText(doc, ['[rel="author"]', '.author a', 'a[href*="/author"]', 'a[href*="/user"]'], 120);
    const summaryText = B.metaContent(doc, ['og:description', 'description']).slice(0, 1200);

    const links = scoreChapterList(doc, url);
    let chapters = [];
    let expected = 0;

    if (links && links.length > 1) {
      expected = links.length;
      ctx.progress(`Похоже на список глав: ${links.length}`, 5);
      const parsed = await FK.util.mapLimit(
        links,
        3,
        async (link) => {
          const d = link.url.split('#')[0] === url.split('#')[0] ? doc : await ctx.fetchDoc(link.url);
          return extract(d, link.url, link.title);
        },
        (done, total) => ctx.progress(`Скачано глав: ${done} из ${total}`, 5 + (done / total) * 80)
      );
      chapters = parsed.filter(Boolean);
    }

    if (chapters.length < 2) {
      // Списка нет — идём по «следующей главе», пока она находится. Сколько их
      // всего, заранее неизвестно, так что сверять число не с чем.
      expected = 0;
      const visited = new Set();
      let cursor = url.split('#')[0];
      let current = doc;
      chapters = [];
      while (cursor && !visited.has(cursor) && chapters.length < MAX_CHAPTERS) {
        visited.add(cursor);
        const ch = extract(current, cursor, `Глава ${chapters.length + 1}`);
        if (ch) chapters.push(ch);
        const next = findNextLink(current, cursor);
        if (!next || visited.has(next)) break;
        ctx.progress(`Иду по главам: ${chapters.length}`, Math.min(80, 5 + chapters.length * 4));
        current = await ctx.fetchDoc(next);
        cursor = next;
      }
    }

    if (!chapters.length) throw new Error('Не нашёл текста: страница не похожа на главу фанфика');

    return B.finalize({
      title: title || 'Фанфик',
      author,
      summaryText,
      sourceUrl: url,
      siteName: new URL(url).hostname.replace(/^www\./, ''),
      expectedChapters: expected,
      chapters,
    });
  }

  FK.adapters.generic = {
    id: 'generic',
    name: 'Любой сайт',
    match: () => true,
    isWorkPage: () => true,
    parse,
  };
  return FK;
});
