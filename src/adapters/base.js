// Общее для адаптеров. Каждое поле берётся списком кандидатов, а не одним
// селектором: сайты фанфиков переверстывают шапку чаще, чем тело главы.
(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  FK.adapters = FK.adapters || {};
  factory(FK);
  if (typeof module !== 'undefined' && module.exports) module.exports = FK;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
  const norm = (s) => FK.util.normalizeSpace(s);

  function pick(doc, selectors) {
    for (const sel of selectors) {
      try {
        const el = doc.querySelector(sel);
        if (el) return el;
      } catch {
        /* пропускаем селектор, который не понял текущий движок */
      }
    }
    return null;
  }

  function pickText(doc, selectors, max = 400) {
    const el = pick(doc, selectors);
    if (!el) return '';
    return norm(el.textContent).slice(0, max);
  }

  function pickAll(doc, selectors, limit = 60) {
    for (const sel of selectors) {
      try {
        const nodes = doc.querySelectorAll(sel);
        if (nodes.length) return Array.from(nodes).slice(0, limit);
      } catch {
        /* см. выше */
      }
    }
    return [];
  }

  function textList(doc, selectors, limit = 40) {
    return pickAll(doc, selectors, limit)
      .map((n) => norm(n.textContent))
      .filter((t) => t && t.length < 120);
  }

  function metaContent(doc, names) {
    for (const name of names) {
      const el =
        doc.querySelector(`meta[property="${name}"]`) || doc.querySelector(`meta[name="${name}"]`);
      if (el && el.getAttribute('content')) return norm(el.getAttribute('content'));
    }
    return '';
  }

  /** Плотность ссылок — главный признак, что блок является меню, а не текстом. */
  function linkDensity(el) {
    const total = (el.textContent || '').length || 1;
    let linked = 0;
    el.querySelectorAll('a').forEach((a) => (linked += (a.textContent || '').length));
    return linked / total;
  }

  const CONTENT_HINT = /(part[_-]?text|chapter[_-]?(inner|content|text)|story[_-]?text|userstuff|fic[_-]?text|reader[_-]?text|entry[_-]?content|post[_-]?body|article[_-]?body|\btext\b|content)/i;

  /** Readability-lite: ищем самый «текстовый» блок страницы. */
  function findMainContent(doc) {
    const candidates = Array.from(doc.querySelectorAll('div, article, section, td, main'));
    let best = null;
    let bestScore = 0;
    for (const el of candidates) {
      if (FK.html.isNoise(el)) continue;
      const text = el.textContent || '';
      if (text.length < 400) continue;
      const paragraphs = el.querySelectorAll('p, br').length;
      const density = linkDensity(el);
      if (density > 0.35) continue;
      let score = text.length * (1 - density) + paragraphs * 60;
      const idc = `${el.id || ''} ${typeof el.className === 'string' ? el.className : ''}`;
      if (CONTENT_HINT.test(idc)) score *= 1.6;
      // Глубже вложенный блок при равном тексте точнее: это тело, а не обёртка.
      const nested = el.querySelectorAll('div, article, section').length;
      if (nested > 30) score *= 0.8;
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best;
  }

  /** Собирает Book из уже разобранных кусков и добивает недостающее. */
  function finalize(book) {
    const chapters = (book.chapters || []).filter((c) => c && c.xhtml && c.xhtml.length > 20);
    const sampleText = chapters.slice(0, 2).map((c) => c.xhtml).join(' ').replace(/<[^>]+>/g, ' ');
    return Object.assign(
      {
        title: 'Фанфик',
        author: '',
        tags: [],
        language: FK.util.detectLanguage(`${book.title || ''} ${sampleText}`),
        uuid: FK.util.uuid(),
      },
      book,
      { chapters }
    );
  }

  FK.adapters.base = {
    pick, pickText, pickAll, textList, metaContent, linkDensity, findMainContent, finalize, norm,
  };
  return FK;
});
