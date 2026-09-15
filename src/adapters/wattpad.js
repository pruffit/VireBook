// Wattpad — текст глав отдаётся отдельной ручкой storytext, а не лежит в HTML.
// Запрос идёт из контент-скрипта, то есть с кукой читателя: приватные и
// возрастные части так тоже открываются.
(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  FK.adapters = FK.adapters || {};
  factory(FK);
  if (typeof module !== 'undefined' && module.exports) module.exports = FK;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
  const B = FK.adapters.base;

  function partsFromNextData(doc) {
    const el = doc.getElementById('__NEXT_DATA__');
    if (!el) return null;
    try {
      const data = JSON.parse(el.textContent);
      const stack = [data];
      while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node.parts) && node.parts.length && node.parts[0] && node.parts[0].id) {
          return node.parts.map((p, i) => ({
            id: String(p.id),
            title: B.norm(p.title) || `Part ${i + 1}`,
          }));
        }
        for (const key of Object.keys(node)) stack.push(node[key]);
      }
    } catch {
      /* разметка страницы сменилась — уходим на разбор ссылок */
    }
    return null;
  }

  function partsFromDom(doc, baseUrl) {
    const out = [];
    const seen = new Set();
    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const m = href.match(/^\/?(\d{4,})-/);
      if (!m || seen.has(m[1])) return;
      seen.add(m[1]);
      out.push({ id: m[1], title: B.norm(a.textContent) || `Part ${out.length + 1}` });
    });
    return out;
  }

  async function fetchPartHtml(id, ctx) {
    const res = await ctx.fetchText(`https://www.wattpad.com/apiv2/storytext?id=${encodeURIComponent(id)}`);
    return res;
  }

  async function parse(doc, url, ctx) {
    const title =
      B.metaContent(doc, ['og:title', 'twitter:title']) || B.pickText(doc, ['h1'], 300);
    const author =
      B.metaContent(doc, ['author']) ||
      B.pickText(doc, ['a[href^="/user/"]', '.author-info a'], 120);
    const summaryText = B.metaContent(doc, ['og:description', 'description']).slice(0, 1200);

    const parts = partsFromNextData(doc) || partsFromDom(doc, url);
    if (!parts.length) throw new Error('Не нашёл список частей Wattpad');

    ctx.progress(`Частей: ${parts.length}`, 5);

    const parsed = await FK.util.mapLimit(
      parts,
      2,
      async (part) => {
        const html = await fetchPartHtml(part.id, ctx);
        if (!html) return null;
        const holder = ctx.parseFragment(html);
        const { xhtml } = FK.html.sanitize(holder, { baseUrl: url, keepImages: false });
        if (xhtml.replace(/<[^>]+>/g, '').trim().length < 60) return null;
        return { title: part.title, xhtml };
      },
      (done, total) => ctx.progress(`Скачано частей: ${done} из ${total}`, 5 + (done / total) * 80)
    );

    const chapters = parsed.filter(Boolean);
    if (!chapters.length) throw new Error('Wattpad не отдал текст частей');

    return B.finalize({
      title: title || 'Story',
      author, summaryText,
      sourceUrl: url,
      siteName: 'Wattpad',
      expectedChapters: parts.length,
      chapters,
    });
  }

  FK.adapters.wattpad = {
    id: 'wattpad',
    name: 'Wattpad',
    match: (url) => /(^|\.)wattpad\.com$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/story\/\d+|\/\d{4,}-/.test(url),
    parse,
  };
  return FK;
});
