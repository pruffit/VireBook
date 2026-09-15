// Чистка глав и сериализация в XHTML. EPUB — это XML: невалидная разметка
// роняет книгу целиком, поэтому сериализуем обходом DOM, а не регулярками.
(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  factory(FK);
  if (typeof module !== 'undefined' && module.exports) module.exports = FK;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
  const KEEP = new Set([
    'p', 'br', 'hr', 'div', 'span', 'section', 'article', 'blockquote', 'pre',
    'em', 'i', 'strong', 'b', 'u', 's', 'strike', 'del', 'ins', 'mark', 'small',
    'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'dl',
    'dt', 'dd', 'a', 'img', 'figure', 'figcaption', 'center', 'table', 'thead',
    'tbody', 'tr', 'td', 'th', 'caption', 'code', 'cite', 'q', 'abbr',
  ]);

  const VOID = new Set(['br', 'hr', 'img']);
  const BLOCK = new Set([
    'p', 'div', 'section', 'article', 'blockquote', 'pre', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'hr', 'tr', 'figure', 'figcaption',
  ]);

  // Сворачиваем в span всё, что не в белом списке, но может нести текст.
  const UNWRAP = new Set(['font', 'tt', 'big', 'nobr', 'main', 'body', 'html', 'label']);

  const DROP = new Set([
    'script', 'style', 'noscript', 'iframe', 'object', 'embed', 'form', 'input',
    'button', 'select', 'textarea', 'svg', 'canvas', 'video', 'audio', 'nav',
    'aside', 'header', 'footer', 'template', 'link', 'meta',
  ]);

  // Мусор, который сайты подмешивают прямо в тело главы.
  const NOISE_PATTERN = /(^|[\s_-])(ads?|adv|advert|banner|promo|reclama|social|share|share-?bar|subscribe|donate|comment|comments|rating|like-?block|bookmark|toolbar|pagination|breadcrumb|cookie|popup|modal|paywall|recommend|related|author-?note-?toggle|hidden|visually-?hidden|sr-only|screen-?reader|landmark|skip-?link)([\s_-]|$)/i;

  function isNoise(el) {
    const cls = typeof el.className === 'string' ? el.className : '';
    const id = el.id || '';
    if (NOISE_PATTERN.test(cls) || NOISE_PATTERN.test(id)) return true;
    if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return true;
    if (el.hasAttribute && el.hasAttribute('hidden')) return true;
    const style = el.getAttribute && el.getAttribute('style');
    if (style && /display\s*:\s*none|visibility\s*:\s*hidden/i.test(style)) return true;
    return false;
  }

  function escapeText(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return escapeText(s).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  // Управляющие символы — XML их не принимает вообще, вычищаем до сериализации.
  function stripControl(s) {
    return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, '');
  }

  function absolutize(href, base) {
    try {
      return new URL(href, base).href;
    } catch {
      return null;
    }
  }

  /**
   * Обходит поддерево и собирает XHTML. Возвращает {xhtml, images}.
   * images — карта абсолютный URL → имя файла внутри книги (заполняет вызывающий).
   */
  function sanitize(rootNode, opts = {}) {
    const { baseUrl = '', keepImages = true, dropSelectors = [] } = opts;
    const images = [];
    const doc = rootNode.ownerDocument || rootNode;

    const working = rootNode.cloneNode(true);
    for (const sel of dropSelectors) {
      if (!sel) continue;
      try {
        working.querySelectorAll(sel).forEach((n) => n.remove());
      } catch {
        /* кривой селектор адаптера не должен ронять сборку */
      }
    }

    const out = [];

    function walk(node) {
      if (node.nodeType === 3) {
        const text = stripControl(node.nodeValue || '');
        if (text) out.push(escapeText(text));
        return;
      }
      if (node.nodeType !== 1) return;

      const tag = node.tagName.toLowerCase();
      if (DROP.has(tag)) return;
      if (node !== working && isNoise(node)) return;

      if (tag === 'img') {
        if (!keepImages) return;
        const src = node.getAttribute('src') || node.getAttribute('data-src');
        const abs = src ? absolutize(src, baseUrl) : null;
        if (!abs) return;
        const alt = node.getAttribute('alt') || '';
        images.push(abs);
        out.push(`<img src="${escapeAttr(abs)}" alt="${escapeAttr(alt)}"/>`);
        return;
      }

      if (UNWRAP.has(tag) || !KEEP.has(tag)) {
        for (const child of Array.from(node.childNodes)) walk(child);
        return;
      }

      if (VOID.has(tag)) {
        out.push(`<${tag}/>`);
        return;
      }

      let attrs = '';
      if (tag === 'a') {
        const href = (node.getAttribute('href') || '').trim();
        const abs = href ? absolutize(href, baseUrl) : null;
        // Якорь на ту же страницу в книге ведёт в никуда: разворачиваем в текст.
        const samePage =
          href.startsWith('#') ||
          (abs && baseUrl && abs.split('#')[0] === String(baseUrl).split('#')[0]);
        if (abs && !samePage && /^https?:/i.test(abs)) attrs = ` href="${escapeAttr(abs)}"`;
        else {
          for (const child of Array.from(node.childNodes)) walk(child);
          return;
        }
      }

      out.push(`<${tag}${attrs}>`);
      for (const child of Array.from(node.childNodes)) walk(child);
      out.push(`</${tag}>`);
    }

    for (const child of Array.from(working.childNodes)) walk(child);

    let xhtml = out.join('');
    // Пустые обёртки и хвосты пробелов — иначе в книге появляются рваные отступы.
    xhtml = xhtml
      .replace(/<(p|div|span|em|i|strong|b)>(\s|&#160;| )*<\/\1>/g, '')
      .replace(/(<br\/>\s*){3,}/g, '<br/><br/>')
      .replace(/\s+\n/g, '\n')
      .trim();

    if (!/<(p|div|h[1-6]|blockquote|ul|ol|pre)[\s>]/.test(xhtml) && xhtml) {
      xhtml = `<p>${xhtml}</p>`;
    }

    return { xhtml, images: Array.from(new Set(images)), doc };
  }

  function toPlainText(rootNode, dropSelectors = []) {
    const working = rootNode.cloneNode(true);
    for (const sel of dropSelectors) {
      try {
        working.querySelectorAll(sel).forEach((n) => n.remove());
      } catch {
        /* см. выше */
      }
    }
    const lines = [];
    let buffer = '';
    function flush() {
      const t = buffer.replace(/[ \t ]+/g, ' ').trim();
      if (t) lines.push(t);
      buffer = '';
    }
    function walk(node) {
      if (node.nodeType === 3) {
        buffer += node.nodeValue || '';
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      if (DROP.has(tag)) return;
      if (node !== working && isNoise(node)) return;
      if (tag === 'br') {
        flush();
        return;
      }
      const block = BLOCK.has(tag);
      if (block) flush();
      for (const child of Array.from(node.childNodes)) walk(child);
      if (block) flush();
    }
    walk(working);
    flush();
    return lines.join('\n\n');
  }

  FK.html = { sanitize, toPlainText, escapeText, escapeAttr, absolutize, stripControl, isNoise };
  return FK;
});
