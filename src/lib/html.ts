// Chapter cleanup and XHTML serialisation. EPUB is XML: invalid markup kills
// the whole book, so we serialise by walking the DOM rather than by regex.

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

// Anything not in the allow-list but capable of carrying text collapses to its children.
const UNWRAP = new Set(['font', 'tt', 'big', 'nobr', 'main', 'body', 'html', 'label']);

const DROP = new Set([
  'script', 'style', 'noscript', 'iframe', 'object', 'embed', 'form', 'input',
  'button', 'select', 'textarea', 'svg', 'canvas', 'video', 'audio', 'nav',
  'aside', 'header', 'footer', 'template', 'link', 'meta',
]);

// The junk sites mix straight into the body of a chapter.
const NOISE_PATTERN = /(^|[\s_-])(ads?|adv|advert|banner|promo|reclama|social|share|share-?bar|subscribe|donate|comment|comments|rating|like-?block|bookmark|toolbar|pagination|breadcrumb|cookie|popup|modal|paywall|recommend|related|author-?note-?toggle|hidden|visually-?hidden|sr-only|screen-?reader|landmark|skip-?link)([\s_-]|$)/i;

export function isNoise(el: Element): boolean {
  const cls = typeof el.className === 'string' ? el.className : '';
  const id = el.id || '';
  if (NOISE_PATTERN.test(cls) || NOISE_PATTERN.test(id)) return true;
  if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return true;
  if (el.hasAttribute && el.hasAttribute('hidden')) return true;
  const style = el.getAttribute && el.getAttribute('style');
  if (style && /display\s*:\s*none|visibility\s*:\s*hidden/i.test(style)) return true;
  return false;
}

export function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeAttr(s: string): string {
  return escapeText(s).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Control characters: XML does not accept them at all, so strip before serialising.
export function stripControl(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F￾￿]/g, '');
}

export function absolutize(href: string | null | undefined, base: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

export interface SanitizeOptions {
  baseUrl?: string;
  keepImages?: boolean;
  dropSelectors?: string[];
}

export interface SanitizeResult {
  xhtml: string;
  /** Absolute URLs of the images kept, for a caller that wants to embed them. */
  images: string[];
}

/** Walks a subtree and builds XHTML out of it. */
export function sanitize(rootNode: Element, opts: SanitizeOptions = {}): SanitizeResult {
  const { baseUrl = '', keepImages = true, dropSelectors = [] } = opts;
  const images: string[] = [];

  const working = rootNode.cloneNode(true) as Element;
  for (const sel of dropSelectors) {
    if (!sel) continue;
    try {
      working.querySelectorAll(sel).forEach((n) => n.remove());
    } catch {
      /* a malformed adapter selector must not bring the build down */
    }
  }

  const out: string[] = [];

  function walk(node: Node): void {
    if (node.nodeType === 3) {
      const text = stripControl(node.nodeValue || '');
      if (text) out.push(escapeText(text));
      return;
    }
    if (node.nodeType !== 1) return;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (DROP.has(tag)) return;
    if (el !== working && isNoise(el)) return;

    if (tag === 'img') {
      if (!keepImages) return;
      const src = el.getAttribute('src') || el.getAttribute('data-src');
      const abs = src ? absolutize(src, baseUrl) : null;
      if (!abs) return;
      const alt = el.getAttribute('alt') || '';
      images.push(abs);
      out.push(`<img src="${escapeAttr(abs)}" alt="${escapeAttr(alt)}"/>`);
      return;
    }

    if (UNWRAP.has(tag) || !KEEP.has(tag)) {
      for (const child of Array.from(el.childNodes)) walk(child);
      return;
    }

    if (VOID.has(tag)) {
      out.push(`<${tag}/>`);
      return;
    }

    let attrs = '';
    if (tag === 'a') {
      const href = (el.getAttribute('href') || '').trim();
      const abs = href ? absolutize(href, baseUrl) : null;
      // An anchor onto the same page leads nowhere inside a book: unwrap to text.
      const samePage =
        href.startsWith('#') ||
        (!!abs && !!baseUrl && abs.split('#')[0] === String(baseUrl).split('#')[0]);
      if (abs && !samePage && /^https?:/i.test(abs)) attrs = ` href="${escapeAttr(abs)}"`;
      else {
        for (const child of Array.from(el.childNodes)) walk(child);
        return;
      }
    }

    out.push(`<${tag}${attrs}>`);
    for (const child of Array.from(el.childNodes)) walk(child);
    out.push(`</${tag}>`);
  }

  for (const child of Array.from(working.childNodes)) walk(child);

  let xhtml = out.join('');
  // Empty wrappers and trailing whitespace, or the book gets ragged gaps.
  xhtml = xhtml
    .replace(/<(p|div|span|em|i|strong|b)>(\s|&#160;| )*<\/\1>/g, '')
    .replace(/(<br\/>\s*){3,}/g, '<br/><br/>')
    .replace(/\s+\n/g, '\n')
    .trim();

  if (!/<(p|div|h[1-6]|blockquote|ul|ol|pre)[\s>]/.test(xhtml) && xhtml) {
    xhtml = `<p>${xhtml}</p>`;
  }

  return { xhtml, images: Array.from(new Set(images)) };
}

export function toPlainText(rootNode: Element, dropSelectors: string[] = []): string {
  const working = rootNode.cloneNode(true) as Element;
  for (const sel of dropSelectors) {
    try {
      working.querySelectorAll(sel).forEach((n) => n.remove());
    } catch {
      /* see above */
    }
  }
  const lines: string[] = [];
  let buffer = '';

  function flush(): void {
    const t = buffer.replace(/[ \t ]+/g, ' ').trim();
    if (t) lines.push(t);
    buffer = '';
  }

  function walk(node: Node): void {
    if (node.nodeType === 3) {
      buffer += node.nodeValue || '';
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (DROP.has(tag)) return;
    if (el !== working && isNoise(el)) return;
    if (tag === 'br') {
      flush();
      return;
    }
    const block = BLOCK.has(tag);
    if (block) flush();
    for (const child of Array.from(el.childNodes)) walk(child);
    if (block) flush();
  }

  walk(working);
  flush();
  return lines.join('\n\n');
}
