// fanfics.me — разметку сверить на живой странице не удалось: сайт отдаёт
// «недоступно в вашей стране» за пределами РФ. Селекторы заданы списком
// кандидатов, а при промахе подхватывает универсальный парсер.
(function (root, factory) {
  const VireBook = (root.VireBook = root.VireBook || {});
  VireBook.adapters = VireBook.adapters || {};
  factory(VireBook);
  if (typeof module !== 'undefined' && module.exports) module.exports = VireBook;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (VireBook) {
  const B = VireBook.adapters.base;
  const DROP = ['.Sidebar_NativeAd', '[class*="NativeAd"]', '.adv', '.banner', '#comments', '.comments'];

  const BODY = [
    '#content_text', '.FicPart_Text', '[class*="FicPart"] [class*="Text"]',
    '.fic_text', '#fic_text', '.chapter-text', '.text',
  ];

  function chapterLinks(doc, baseUrl) {
    const nodes = B.pickAll(doc, [
      '.FicTOC a[href]', '[class*="TOC"] a[href]', '.chapters a[href]',
      'a[href*="/fic"][href*="chapter"]', 'a[href*="/read"]',
    ], 400);
    const seen = new Set();
    const out = [];
    for (const a of nodes) {
      const url = VireBook.html.absolutize(a.getAttribute('href'), baseUrl);
      if (!url) continue;
      const clean = url.split('#')[0];
      if (seen.has(clean) || clean === baseUrl.split('#')[0]) continue;
      seen.add(clean);
      out.push({ url: clean, title: B.norm(a.textContent) || `Глава ${out.length + 1}` });
    }
    return out;
  }

  function extract(doc, url, fallbackTitle) {
    const body = B.pick(doc, BODY) || B.findMainContent(doc);
    if (!body) return null;
    const { xhtml } = VireBook.html.sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
    if (xhtml.replace(/<[^>]+>/g, '').trim().length < 150) return null;
    const heading = B.pickText(doc, ['.FicPart_Title', '[class*="PartTitle"]', 'h2'], 200);
    return { title: heading || fallbackTitle || 'Глава', xhtml };
  }

  async function parse(doc, url, ctx) {
    const title =
      B.pickText(doc, ['h1', '.FicTitle', '[class*="FicHead"] h1'], 300) ||
      B.metaContent(doc, ['og:title']);
    const author = B.textList(doc, ['a[href*="/user"]', '.author a', '[class*="Author"] a'], 3).join(', ');
    const summaryText = B.metaContent(doc, ['og:description', 'description']).slice(0, 1200);
    const tags = B.textList(doc, ['a[href*="/tag"]', '.tags a'], 25);
    const fandom = B.textList(doc, ['a[href*="/fandom"]', 'a[href*="/canon"]'], 4).join(', ');

    const links = chapterLinks(doc, url);
    let chapters;

    if (links.length > 1) {
      ctx.progress(`Найдено глав: ${links.length}`, 5);
      const parsed = await VireBook.util.mapLimit(
        links,
        3,
        async (link) => extract(await ctx.fetchDoc(link.url), link.url, link.title),
        (done, total) => ctx.progress(`Скачано глав: ${done} из ${total}`, 5 + (done / total) * 80)
      );
      chapters = parsed.filter(Boolean);
    } else {
      const solo = extract(doc, url, title);
      chapters = solo ? [solo] : [];
    }

    if (!chapters.length) throw new Error('Не нашёл текст главы на fanfics.me');

    return B.finalize({
      title: title || 'Фанфик',
      author, summaryText, tags, fandom,
      sourceUrl: url,
      siteName: 'Fanfics.me',
      expectedChapters: links.length > 1 ? links.length : 0,
      chapters,
    });
  }

  VireBook.adapters.fanficsme = {
    id: 'fanficsme',
    name: 'Fanfics.me',
    match: (url) => /(^|\.)fanfics\.me$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/fic\d+|\/read/.test(url),
    parse,
  };
  return VireBook;
});
