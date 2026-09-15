// fanfiction.net — разметка проверена по известной структуре, не на живой
// странице: сайт стоит за антибот-защитой. Селекторы там не менялись годами.
(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  FK.adapters = FK.adapters || {};
  factory(FK);
  if (typeof module !== 'undefined' && module.exports) module.exports = FK;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
  const B = FK.adapters.base;
  const DROP = ['.a-d', '#storytextp .lazy', 'ins', '.ad'];

  function storyId(url) {
    const m = url.match(/\/s\/(\d+)/);
    return m ? m[1] : null;
  }

  function chapterTitles(doc) {
    const select = doc.querySelector('#chap_select');
    if (!select) return [];
    return Array.from(select.querySelectorAll('option')).map((o) =>
      B.norm(o.textContent).replace(/^\d+\.\s*/, '')
    );
  }

  function extract(doc, url, fallbackTitle) {
    const body = B.pick(doc, ['#storytext', '#storytextp']) || B.findMainContent(doc);
    if (!body) return null;
    const { xhtml } = FK.html.sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
    if (xhtml.replace(/<[^>]+>/g, '').trim().length < 150) return null;
    return { title: fallbackTitle || 'Chapter', xhtml };
  }

  async function parse(doc, url, ctx) {
    const id = storyId(url);
    if (!id) throw new Error('Это не страница работы на fanfiction.net');

    const title = B.pickText(doc, ['#profile_top b.xcontrast_txt', '#profile_top b'], 300);
    const author = B.pickText(doc, ['#profile_top a.xcontrast_txt[href^="/u/"]', '#profile_top a[href^="/u/"]'], 120);
    const summaryText = B.pickText(doc, ['#profile_top div.xcontrast_txt', '#profile_top div'], 1200);

    const titles = chapterTitles(doc);
    const count = Math.max(1, titles.length);
    ctx.progress(`Глав в работе: ${count}`, 5);

    const indices = Array.from({ length: count }, (_, i) => i + 1);
    const parsed = await FK.util.mapLimit(
      indices,
      2,
      async (n) => {
        const chapterUrl = `https://www.fanfiction.net/s/${id}/${n}/`;
        const d = n === 1 && /\/s\/\d+\/1?\/?/.test(url) ? doc : await ctx.fetchDoc(chapterUrl);
        return extract(d, chapterUrl, titles[n - 1] || `Chapter ${n}`);
      },
      (done, total) => ctx.progress(`Скачано глав: ${done} из ${total}`, 5 + (done / total) * 80)
    );

    const chapters = parsed.filter(Boolean);
    if (!chapters.length) throw new Error('Не нашёл текст главы на fanfiction.net');

    return B.finalize({
      title: title || 'Story',
      author, summaryText,
      sourceUrl: `https://www.fanfiction.net/s/${id}/`,
      siteName: 'FanFiction.net',
      expectedChapters: count,
      chapters,
    });
  }

  FK.adapters.ffnet = {
    id: 'ffnet',
    name: 'FanFiction.net',
    match: (url) => /(^|\.)fanfiction\.net$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/s\/\d+/.test(url),
    parse,
  };
  return FK;
});
