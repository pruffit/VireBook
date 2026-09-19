// AO3 — селекторы сверены с живой страницей 15.09.2026.
// Особенность: ?view_full_work=true отдаёт все главы одним запросом, а сайт уже
// собирает EPUB/AZW3/MOBI сам, и делает это лучше нас (kindlegen). Поэтому
// адаптер сначала предлагает готовый файл и только потом собирает свой.
(function (root, factory) {
  const VireBook = (root.VireBook = root.VireBook || {});
  VireBook.adapters = VireBook.adapters || {};
  factory(VireBook);
  if (typeof module !== 'undefined' && module.exports) module.exports = VireBook;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (VireBook) {
  const B = VireBook.adapters.base;
  const DROP = ['h3.landmark', '.landmark', '#work-skin ~ *', '.kudos', '.comments'];

  function workId(url) {
    const m = url.match(/\/works\/(\d+)/);
    return m ? m[1] : null;
  }

  function native(doc) {
    const out = [];
    doc.querySelectorAll('li.download ul li a, #control_panel .download a').forEach((a) => {
      const href = a.getAttribute('href');
      // Берём распознанный формат, а не всю подпись: «Download EPUB» не должен
      // превратиться в формат, с которым потом ничего не сойдётся.
      const format = (B.norm(a.textContent).toLowerCase().match(/epub|azw3|mobi|pdf|html/) || [])[0];
      if (!href || !format) return;
      out.push({ format, url: VireBook.html.absolutize(href, 'https://archiveofourown.org/') });
    });
    return out;
  }

  function readMeta(doc) {
    const group = doc.querySelector('dl.work.meta.group');
    const readDd = (cls) => {
      if (!group) return [];
      const dt = group.querySelector(`dt.${cls}`);
      if (!dt) return [];
      const dd = dt.nextElementSibling;
      if (!dd) return [];
      return Array.from(dd.querySelectorAll('a, li'))
        .map((n) => B.norm(n.textContent))
        .filter((t) => t && t.length < 120);
    };
    const uniq = (a) => Array.from(new Set(a));
    return {
      fandom: uniq(readDd('fandom')).join(', '),
      pairing: uniq(readDd('relationship')).slice(0, 8).join(', '),
      rating: uniq(readDd('rating')).join(', '),
      tags: uniq([...readDd('freeform'), ...readDd('character')]).slice(0, 30),
    };
  }

  function parseChapterNode(node, url, index) {
    const body = node.querySelector('div[role="article"], div.userstuff');
    if (!body) return null;
    const titleEl = node.querySelector('h3.title');
    const title = titleEl ? B.norm(titleEl.textContent) : `Chapter ${index + 1}`;
    const { xhtml } = VireBook.html.sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP });
    const notesEl = node.querySelector('.notes .userstuff, .end.notes .userstuff');
    const notes = notesEl
      ? VireBook.html.sanitize(notesEl, { baseUrl: url, keepImages: false, dropSelectors: DROP }).xhtml
      : '';
    return { title: title || `Chapter ${index + 1}`, xhtml, notesXhtml: notes };
  }

  async function parse(doc, url, ctx) {
    const id = workId(url);
    let fullDoc = doc;
    let fullUrl = url;

    if (id && !/view_full_work=true/.test(url)) {
      fullUrl = `https://archiveofourown.org/works/${id}?view_full_work=true&view_adult=true`;
      ctx.progress('Запрашиваю все главы одним запросом…', 10);
      fullDoc = await ctx.fetchDoc(fullUrl);
    }

    const title =
      B.pickText(fullDoc, ['h2.title.heading', 'h2.title'], 300) || B.metaContent(fullDoc, ['og:title']);
    const author = B.textList(fullDoc, ['h3.byline.heading a[rel="author"]', 'h3.byline a'], 6).join(', ');

    const summaryEl = B.pick(fullDoc, ['div.summary.module blockquote.userstuff', 'div.summary blockquote']);
    const summaryXhtml = summaryEl
      ? VireBook.html.sanitize(summaryEl, { baseUrl: fullUrl, keepImages: false }).xhtml
      : '';
    const summaryText = summaryEl ? VireBook.html.toPlainText(summaryEl).slice(0, 1200) : '';

    const nodes = Array.from(fullDoc.querySelectorAll('#chapters > div.chapter'));
    let chapters;
    if (nodes.length) {
      chapters = nodes.map((n, i) => parseChapterNode(n, fullUrl, i)).filter(Boolean);
    } else {
      const solo = B.pick(fullDoc, ['#chapters div.userstuff', 'div#workskin div.userstuff', 'div.userstuff']);
      if (!solo) throw new Error('Не нашёл текст работы на странице AO3');
      const { xhtml } = VireBook.html.sanitize(solo, { baseUrl: fullUrl, keepImages: false, dropSelectors: DROP });
      chapters = [{ title: title || 'Работа', xhtml }];
    }

    ctx.progress(`Разобрано глав: ${chapters.length}`, 85);

    return B.finalize({
      title: title || 'Work',
      author,
      sourceUrl: id ? `https://archiveofourown.org/works/${id}` : url,
      siteName: 'Archive of Our Own',
      summaryXhtml,
      summaryText,
      ...readMeta(fullDoc),
      expectedChapters: nodes.length,
      chapters,
    });
  }

  VireBook.adapters.ao3 = {
    id: 'ao3',
    name: 'Archive of Our Own',
    match: (url) => /(^|\.)archiveofourown\.org$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/works\/\d+/.test(url),
    native,
    parse,
  };
  return VireBook;
});
