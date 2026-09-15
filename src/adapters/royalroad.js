// RoyalRoad — англоязычные ориджиналы, разметка стабильная и простая.
(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  FK.adapters = FK.adapters || {};
  factory(FK);
  if (typeof module !== 'undefined' && module.exports) module.exports = FK;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
  const B = FK.adapters.base;
  const DROP = ['.portlet', '.ad', '.hidden', 'style', '.author-note-portlet'];

  function chapterLinks(doc, baseUrl) {
    const rows = B.pickAll(doc, ['#chapters tbody tr td a[href]', 'table#chapters a[href]'], 2000);
    const seen = new Set();
    const out = [];
    for (const a of rows) {
      const url = FK.html.absolutize(a.getAttribute('href'), baseUrl);
      if (!url) continue;
      const clean = url.split('#')[0];
      if (seen.has(clean)) continue;
      seen.add(clean);
      out.push({ url: clean, title: B.norm(a.textContent) || `Chapter ${out.length + 1}` });
    }
    return out;
  }

  function extract(doc, url, fallbackTitle) {
    const body = B.pick(doc, ['.chapter-inner.chapter-content', '.chapter-content', '.chapter-inner']);
    if (!body) return null;
    const { xhtml } = FK.html.sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
    if (xhtml.replace(/<[^>]+>/g, '').trim().length < 100) return null;
    const heading = B.pickText(doc, ['h1.font-white', '.fic-header h1', 'h1'], 200);
    return { title: heading || fallbackTitle || 'Chapter', xhtml };
  }

  async function parse(doc, url, ctx) {
    let workDoc = doc;
    let workUrl = url;
    const fictionMatch = url.match(/^(https?:\/\/[^/]+\/fiction\/\d+\/[^/]+)/);
    if (fictionMatch && /\/chapter\//.test(url)) {
      workUrl = fictionMatch[1];
      workDoc = await ctx.fetchDoc(workUrl);
    }

    const title = B.pickText(workDoc, ['.fic-title h1', 'h1[property="name"]', 'h1'], 300);
    const author = B.pickText(workDoc, ['.fic-title h4 a', 'h4 span a', 'a[href^="/profile/"]'], 120);
    const summaryEl = B.pick(workDoc, ['.description .hidden-content', '.description']);
    const summaryText = summaryEl ? FK.html.toPlainText(summaryEl).slice(0, 1200) : '';
    const tags = B.textList(workDoc, ['.tags a', 'a.fiction-tag'], 25);

    const links = chapterLinks(workDoc, workUrl);
    if (!links.length) {
      const solo = extract(doc, url, title);
      if (!solo) throw new Error('Не нашёл ни списка глав, ни текста на RoyalRoad');
      return B.finalize({ title, author, summaryText, tags, sourceUrl: url, siteName: 'Royal Road', chapters: [solo] });
    }

    ctx.progress(`Глав: ${links.length}`, 5);
    const parsed = await FK.util.mapLimit(
      links,
      3,
      async (link) => extract(await ctx.fetchDoc(link.url), link.url, link.title),
      (done, total) => ctx.progress(`Скачано глав: ${done} из ${total}`, 5 + (done / total) * 80)
    );

    const chapters = parsed.filter(Boolean);
    if (!chapters.length) throw new Error('RoyalRoad не отдал текст глав');

    return B.finalize({
      title: title || 'Fiction',
      author, summaryText, tags,
      sourceUrl: workUrl,
      siteName: 'Royal Road',
      expectedChapters: links.length,
      chapters,
    });
  }

  FK.adapters.royalroad = {
    id: 'royalroad',
    name: 'Royal Road',
    match: (url) => /(^|\.)royalroad\.com$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/fiction\/\d+/.test(url),
    parse,
  };
  return FK;
});
