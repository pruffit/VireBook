"use strict";
(() => {
  // src/lib/html.ts
  var KEEP = /* @__PURE__ */ new Set([
    "p",
    "br",
    "hr",
    "div",
    "span",
    "section",
    "article",
    "blockquote",
    "pre",
    "em",
    "i",
    "strong",
    "b",
    "u",
    "s",
    "strike",
    "del",
    "ins",
    "mark",
    "small",
    "sub",
    "sup",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "dl",
    "dt",
    "dd",
    "a",
    "img",
    "figure",
    "figcaption",
    "center",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
    "caption",
    "code",
    "cite",
    "q",
    "abbr"
  ]);
  var VOID = /* @__PURE__ */ new Set(["br", "hr", "img"]);
  var BLOCK = /* @__PURE__ */ new Set([
    "p",
    "div",
    "section",
    "article",
    "blockquote",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "hr",
    "tr",
    "figure",
    "figcaption"
  ]);
  var UNWRAP = /* @__PURE__ */ new Set(["font", "tt", "big", "nobr", "main", "body", "html", "label"]);
  var DROP = /* @__PURE__ */ new Set([
    "script",
    "style",
    "noscript",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
    "select",
    "textarea",
    "svg",
    "canvas",
    "video",
    "audio",
    "nav",
    "aside",
    "header",
    "footer",
    "template",
    "link",
    "meta"
  ]);
  var NOISE_PATTERN = /(^|[\s_-])(ads?|adv|advert|banner|promo|reclama|social|share|share-?bar|subscribe|donate|comment|comments|rating|like-?block|bookmark|toolbar|pagination|breadcrumb|cookie|popup|modal|paywall|recommend|related|author-?note-?toggle|hidden|visually-?hidden|sr-only|screen-?reader|landmark|skip-?link)([\s_-]|$)/i;
  function isNoise(el) {
    const cls = typeof el.className === "string" ? el.className : "";
    const id = el.id || "";
    if (NOISE_PATTERN.test(cls) || NOISE_PATTERN.test(id)) return true;
    if (el.getAttribute && el.getAttribute("aria-hidden") === "true") return true;
    if (el.hasAttribute && el.hasAttribute("hidden")) return true;
    const style = el.getAttribute && el.getAttribute("style");
    if (style && /display\s*:\s*none|visibility\s*:\s*hidden/i.test(style)) return true;
    return false;
  }
  function escapeText(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(s) {
    return escapeText(s).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  var CONTROL = new RegExp("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\uFFFE\\uFFFF]", "g");
  function stripControl(s) {
    return s.replace(CONTROL, "");
  }
  function absolutize(href, base) {
    if (!href) return null;
    try {
      return new URL(href, base).href;
    } catch {
      return null;
    }
  }
  function sanitize(rootNode, opts = {}) {
    const { baseUrl = "", keepImages = true, dropSelectors = [], wrapBare = true } = opts;
    const images = [];
    const working = rootNode.cloneNode(true);
    for (const sel of dropSelectors) {
      if (!sel) continue;
      try {
        working.querySelectorAll(sel).forEach((n) => n.remove());
      } catch {
      }
    }
    const out = [];
    function walk(node) {
      if (node.nodeType === 3) {
        const text = stripControl(node.nodeValue || "");
        if (text) out.push(escapeText(text));
        return;
      }
      if (node.nodeType !== 1) return;
      const el = node;
      const tag = el.tagName.toLowerCase();
      if (DROP.has(tag)) return;
      if (el !== working && isNoise(el)) return;
      if (tag === "img") {
        if (!keepImages) return;
        const src = el.getAttribute("src") || el.getAttribute("data-src");
        const abs = src ? absolutize(src, baseUrl) : null;
        if (!abs) return;
        const alt = el.getAttribute("alt") || "";
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
      let attrs = "";
      if (tag === "a") {
        const href = (el.getAttribute("href") || "").trim();
        const abs = href ? absolutize(href, baseUrl) : null;
        const samePage = href.startsWith("#") || !!abs && !!baseUrl && abs.split("#")[0] === String(baseUrl).split("#")[0];
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
    let xhtml = out.join("");
    xhtml = xhtml.replace(/<(p|div|span|em|i|strong|b)>(\s|&#160;| )*<\/\1>/g, "").replace(/(<br\/>\s*){3,}/g, "<br/><br/>").replace(/\s+\n/g, "\n").trim();
    if (wrapBare && !/<(p|div|h[1-6]|blockquote|ul|ol|pre)[\s>]/.test(xhtml) && xhtml) {
      xhtml = `<p>${xhtml}</p>`;
    }
    return { xhtml, images: Array.from(new Set(images)) };
  }
  function toPlainText(rootNode, dropSelectors = []) {
    const working = rootNode.cloneNode(true);
    for (const sel of dropSelectors) {
      try {
        working.querySelectorAll(sel).forEach((n) => n.remove());
      } catch {
      }
    }
    const lines = [];
    let buffer = "";
    function flush() {
      const t = buffer.replace(/[ \t ]+/g, " ").trim();
      if (t) lines.push(t);
      buffer = "";
    }
    function walk(node) {
      if (node.nodeType === 3) {
        buffer += node.nodeValue || "";
        return;
      }
      if (node.nodeType !== 1) return;
      const el = node;
      const tag = el.tagName.toLowerCase();
      if (DROP.has(tag)) return;
      if (el !== working && isNoise(el)) return;
      if (tag === "br") {
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
    return lines.join("\n\n");
  }

  // src/lib/util.ts
  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    const b = new Uint8Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(b);
    else for (let i = 0; i < b.length; i += 1) b[i] = Math.random() * 256 | 0;
    b[6] = b[6] & 15 | 64;
    b[8] = b[8] & 63 | 128;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  function safeFilename(name, ext, max = 80) {
    let base = String(name || "book").replace(/[\x00-\x1F<>:"/\\|?*]/g, " ").replace(/\s+/g, " ").replace(/[. ]+$/, "").trim();
    if (!base) base = "book";
    if (base.length > max) base = base.slice(0, max).trim();
    return ext ? `${base}.${ext}` : base;
  }
  function abortError() {
    const e = new Error("Cancelled");
    e.name = "AbortError";
    return e;
  }
  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) return reject(abortError());
      const finish = (settle) => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onAbort);
        settle();
      };
      const onAbort = () => finish(() => reject(abortError()));
      const timer = setTimeout(() => finish(resolve), ms);
      if (signal) signal.addEventListener("abort", onAbort, { once: true });
    });
  }
  function parseRetryAfter(value, now = Date.now()) {
    if (!value) return 0;
    const raw = String(value).trim();
    if (/^\d+(\.\d+)?$/.test(raw)) return Math.max(0, Number(raw) * 1e3);
    const when = Date.parse(raw);
    return Number.isFinite(when) ? Math.max(0, when - now) : 0;
  }
  function backoffDelay(attempt, options = {}) {
    const { base = 1200, max = 6e4, floor = 0, random = Math.random } = options;
    const span = Math.min(max, base * 2 ** attempt);
    return Math.max(floor, Math.round(span * (0.5 + random() * 0.5)));
  }
  function createRateLimiter({ interval = 600, maxInterval = 15e3 } = {}) {
    const base = interval;
    let current = interval;
    let nextSlot = 0;
    let chain = Promise.resolve();
    let streak = 0;
    function acquire(signal) {
      const turn = chain.then(() => {
        const now = Date.now();
        const at = Math.max(now, nextSlot);
        nextSlot = at + current;
        return at > now ? sleep(at - now, signal) : void 0;
      });
      chain = turn.then(null, () => {
      });
      return turn;
    }
    function penalize(pauseMs = 0) {
      streak = 0;
      current = Math.min(maxInterval, Math.max(current * 2, base * 2));
      if (pauseMs > 0) nextSlot = Math.max(nextSlot, Date.now() + pauseMs);
      return current;
    }
    function reward() {
      if (current > base && ++streak >= 5) {
        current = Math.max(base, Math.round(current / 2));
        streak = 0;
      }
    }
    return {
      acquire,
      penalize,
      reward,
      get interval() {
        return current;
      }
    };
  }
  async function mapLimit(items, limit, fn, onProgress) {
    const results = new Array(items.length);
    let index = 0;
    let done = 0;
    const workers = new Array(Math.max(0, Math.min(limit, items.length))).fill(0).map(async () => {
      for (; ; ) {
        const i = index++;
        if (i >= items.length) return;
        results[i] = await fn(items[i], i);
        done += 1;
        if (onProgress) onProgress(done, items.length);
      }
    });
    await Promise.all(workers);
    return results;
  }
  function detectLanguage(text) {
    const sample = String(text || "").slice(0, 4e3);
    const cyr = (sample.match(/[а-яёА-ЯЁ]/g) || []).length;
    const lat = (sample.match(/[a-zA-Z]/g) || []).length;
    return cyr > lat ? "ru" : "en";
  }
  function normalizeSpace(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }

  // src/adapters/base.ts
  var norm = normalizeSpace;
  function siteLabel(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }
  function pick(doc, selectors) {
    for (const sel of selectors) {
      try {
        const el = doc.querySelector(sel);
        if (el) return el;
      } catch {
      }
    }
    return null;
  }
  function pickText(doc, selectors, max = 400) {
    const el = pick(doc, selectors);
    if (!el) return "";
    return norm(el.textContent).slice(0, max);
  }
  function pickAll(doc, selectors, limit = 60) {
    for (const sel of selectors) {
      try {
        const nodes = doc.querySelectorAll(sel);
        if (nodes.length) return Array.from(nodes).slice(0, limit);
      } catch {
      }
    }
    return [];
  }
  function textList(doc, selectors, limit = 40) {
    return pickAll(doc, selectors, limit).map((n) => norm(n.textContent)).filter((t) => t && t.length < 120);
  }
  function metaContent(doc, names) {
    for (const name of names) {
      const el = doc.querySelector(`meta[property="${name}"]`) || doc.querySelector(`meta[name="${name}"]`);
      if (el && el.getAttribute("content")) return norm(el.getAttribute("content"));
    }
    return "";
  }
  function linkDensity(el) {
    const total = (el.textContent || "").length || 1;
    let linked = 0;
    el.querySelectorAll("a").forEach((a) => {
      linked += (a.textContent || "").length;
    });
    return linked / total;
  }
  var CONTENT_HINT = /(part[_-]?text|chapter[_-]?(inner|content|text)|story[_-]?text|userstuff|fic[_-]?text|reader[_-]?text|entry[_-]?content|post[_-]?body|article[_-]?body|\btext\b|content)/i;
  function findMainContent(doc) {
    const candidates = Array.from(doc.querySelectorAll("div, article, section, td, main"));
    let best = null;
    let bestScore = 0;
    for (const el of candidates) {
      if (isNoise(el)) continue;
      const text = el.textContent || "";
      if (text.length < 400) continue;
      const paragraphs = el.querySelectorAll("p, br").length;
      const density = linkDensity(el);
      if (density > 0.35) continue;
      let score = text.length * (1 - density) + paragraphs * 60;
      const idc = `${el.id || ""} ${typeof el.className === "string" ? el.className : ""}`;
      if (CONTENT_HINT.test(idc)) score *= 1.6;
      const nested = el.querySelectorAll("div, article, section").length;
      if (nested > 30) score *= 0.8;
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best;
  }
  function finalize(draft) {
    const chapters = (draft.chapters || []).filter(
      (c) => !!c && !!c.xhtml && c.xhtml.length > 20
    );
    const sampleText = chapters.slice(0, 2).map((c) => c.xhtml).join(" ").replace(/<[^>]+>/g, " ");
    return {
      title: "Book",
      author: "",
      tags: [],
      language: detectLanguage(`${draft.title || ""} ${sampleText}`),
      uuid: uuid(),
      ...draft,
      chapters
    };
  }

  // src/adapters/ao3.ts
  var DROP2 = ["h3.landmark", ".landmark", "#work-skin ~ *", ".kudos", ".comments"];
  function workId(url) {
    const m = url.match(/\/works\/(\d+)/);
    return m ? m[1] : null;
  }
  function native(doc) {
    const out = [];
    doc.querySelectorAll("li.download ul li a, #control_panel .download a").forEach((a) => {
      const href = a.getAttribute("href");
      const format = (norm(a.textContent).toLowerCase().match(/epub|azw3|mobi|pdf|html/) || [])[0];
      if (!href || !format) return;
      out.push({ format, url: absolutize(href, "https://archiveofourown.org/") });
    });
    return out;
  }
  function readMeta(doc) {
    const group = doc.querySelector("dl.work.meta.group");
    const readDd = (cls) => {
      if (!group) return [];
      const dt = group.querySelector(`dt.${cls}`);
      if (!dt) return [];
      const dd = dt.nextElementSibling;
      if (!dd) return [];
      return Array.from(dd.querySelectorAll("a, li")).map((n) => norm(n.textContent)).filter((t) => t && t.length < 120);
    };
    const uniq = (a) => Array.from(new Set(a));
    return {
      fandom: uniq(readDd("fandom")).join(", "),
      pairing: uniq(readDd("relationship")).slice(0, 8).join(", "),
      rating: uniq(readDd("rating")).join(", "),
      tags: uniq([...readDd("freeform"), ...readDd("character")]).slice(0, 30)
    };
  }
  function parseChapterNode(node, url, index) {
    const body = node.querySelector('div[role="article"], div.userstuff');
    if (!body) return null;
    const titleEl = node.querySelector("h3.title");
    const title = titleEl ? norm(titleEl.textContent) : `Chapter ${index + 1}`;
    const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP2 });
    const notesEl = node.querySelector(".notes .userstuff, .end.notes .userstuff");
    const notesXhtml = notesEl ? sanitize(notesEl, { baseUrl: url, keepImages: false, dropSelectors: DROP2 }).xhtml : "";
    return { title: title || `Chapter ${index + 1}`, xhtml, notesXhtml };
  }
  async function parse(doc, url, ctx) {
    const id = workId(url);
    let fullDoc = doc;
    let fullUrl = url;
    if (id && !/view_full_work=true/.test(url)) {
      fullUrl = `https://archiveofourown.org/works/${id}?view_full_work=true&view_adult=true`;
      ctx.progress("Requesting every chapter in one go\u2026", 10);
      fullDoc = await ctx.fetchDoc(fullUrl);
    }
    const title = pickText(fullDoc, ["h2.title.heading", "h2.title"], 300) || metaContent(fullDoc, ["og:title"]);
    const author = textList(
      fullDoc,
      ['h3.byline.heading a[rel="author"]', "h3.byline a"],
      6
    ).join(", ");
    const summaryEl = pick(fullDoc, [
      "div.summary.module blockquote.userstuff",
      "div.summary blockquote"
    ]);
    const summaryXhtml = summaryEl ? sanitize(summaryEl, { baseUrl: fullUrl, keepImages: false }).xhtml : "";
    const summaryText = summaryEl ? toPlainText(summaryEl).slice(0, 1200) : "";
    const nodes = Array.from(fullDoc.querySelectorAll("#chapters > div.chapter"));
    let chapters;
    if (nodes.length) {
      chapters = nodes.map((n, i) => parseChapterNode(n, fullUrl, i));
    } else {
      const solo = pick(fullDoc, [
        "#chapters div.userstuff",
        "div#workskin div.userstuff",
        "div.userstuff"
      ]);
      if (!solo) throw new Error("No work text found on the AO3 page");
      const { xhtml } = sanitize(solo, { baseUrl: fullUrl, keepImages: false, dropSelectors: DROP2 });
      chapters = [{ title: title || "Work", xhtml }];
    }
    ctx.progress(`Chapters parsed: ${chapters.filter(Boolean).length}`, 85);
    return finalize({
      title: title || "Work",
      author,
      sourceUrl: id ? `https://archiveofourown.org/works/${id}` : url,
      siteName: siteLabel(fullUrl),
      summaryXhtml,
      summaryText,
      ...readMeta(fullDoc),
      expectedChapters: nodes.length,
      chapters
    });
  }
  var ao3 = {
    id: "ao3",
    match: (url) => /(^|\.)archiveofourown\.org$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/works\/\d+/.test(url),
    native,
    parse
  };

  // src/adapters/fanficsme.ts
  var DROP3 = [".Sidebar_NativeAd", '[class*="NativeAd"]', ".adv", ".banner", "#comments", ".comments"];
  var BODY = [
    "#content_text",
    ".FicPart_Text",
    '[class*="FicPart"] [class*="Text"]',
    ".fic_text",
    "#fic_text",
    ".chapter-text",
    ".text"
  ];
  function chapterLinks(doc, baseUrl) {
    const nodes = pickAll(
      doc,
      [
        ".FicTOC a[href]",
        '[class*="TOC"] a[href]',
        ".chapters a[href]",
        'a[href*="/fic"][href*="chapter"]',
        'a[href*="/read"]'
      ],
      400
    );
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const a of nodes) {
      const url = absolutize(a.getAttribute("href"), baseUrl);
      if (!url) continue;
      const clean = url.split("#")[0];
      if (seen.has(clean) || clean === baseUrl.split("#")[0]) continue;
      seen.add(clean);
      out.push({ url: clean, title: norm(a.textContent) || `Chapter ${out.length + 1}` });
    }
    return out;
  }
  function extract(doc, url, fallbackTitle) {
    const body = pick(doc, BODY) || findMainContent(doc);
    if (!body) return null;
    const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP3 });
    if (xhtml.replace(/<[^>]+>/g, "").trim().length < 150) return null;
    const heading = pickText(doc, [".FicPart_Title", '[class*="PartTitle"]', "h2"], 200);
    return { title: heading || fallbackTitle || "Chapter", xhtml };
  }
  async function parse2(doc, url, ctx) {
    const title = pickText(doc, ["h1", ".FicTitle", '[class*="FicHead"] h1'], 300) || metaContent(doc, ["og:title"]);
    const author = textList(doc, ['a[href*="/user"]', ".author a", '[class*="Author"] a'], 3).join(", ");
    const summaryText = metaContent(doc, ["og:description", "description"]).slice(0, 1200);
    const tags = textList(doc, ['a[href*="/tag"]', ".tags a"], 25);
    const fandom = textList(doc, ['a[href*="/fandom"]', 'a[href*="/canon"]'], 4).join(", ");
    const links = chapterLinks(doc, url);
    let chapters;
    if (links.length > 1) {
      ctx.progress(`Chapters found: ${links.length}`, 5);
      chapters = await mapLimit(
        links,
        3,
        async (link) => extract(await ctx.fetchDoc(link.url), link.url, link.title),
        (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + done / total * 80)
      );
    } else {
      chapters = [extract(doc, url, title)];
    }
    if (!chapters.filter(Boolean).length) throw new Error("No chapter text found on fanfics.me");
    return finalize({
      title: title || "Book",
      author,
      summaryText,
      tags,
      fandom,
      sourceUrl: url,
      siteName: siteLabel(url),
      expectedChapters: links.length > 1 ? links.length : 0,
      chapters
    });
  }
  var fanficsme = {
    id: "fanficsme",
    match: (url) => /(^|\.)fanfics\.me$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/fic\d+|\/read/.test(url),
    parse: parse2
  };

  // src/adapters/ffnet.ts
  var DROP4 = [".a-d", "#storytextp .lazy", "ins", ".ad"];
  function storyId(url) {
    const m = url.match(/\/s\/(\d+)/);
    return m ? m[1] : null;
  }
  function chapterTitles(doc) {
    const select = doc.querySelector("#chap_select");
    if (!select) return [];
    return Array.from(select.querySelectorAll("option")).map(
      (o) => norm(o.textContent).replace(/^\d+\.\s*/, "")
    );
  }
  function extract2(doc, url, fallbackTitle) {
    const body = pick(doc, ["#storytext", "#storytextp"]) || findMainContent(doc);
    if (!body) return null;
    const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP4 });
    if (xhtml.replace(/<[^>]+>/g, "").trim().length < 150) return null;
    return { title: fallbackTitle || "Chapter", xhtml };
  }
  async function parse3(doc, url, ctx) {
    const id = storyId(url);
    if (!id) throw new Error("This is not a work page on fanfiction.net");
    const title = pickText(doc, ["#profile_top b.xcontrast_txt", "#profile_top b"], 300);
    const author = pickText(
      doc,
      ['#profile_top a.xcontrast_txt[href^="/u/"]', '#profile_top a[href^="/u/"]'],
      120
    );
    const summaryText = pickText(doc, ["#profile_top div.xcontrast_txt", "#profile_top div"], 1200);
    const titles = chapterTitles(doc);
    const count = Math.max(1, titles.length);
    ctx.progress(`Chapters in this work: ${count}`, 5);
    const indices = Array.from({ length: count }, (_, i) => i + 1);
    const chapters = await mapLimit(
      indices,
      2,
      async (n) => {
        const chapterUrl = `https://www.fanfiction.net/s/${id}/${n}/`;
        const d = n === 1 && /\/s\/\d+\/1?\/?/.test(url) ? doc : await ctx.fetchDoc(chapterUrl);
        return extract2(d, chapterUrl, titles[n - 1] || `Chapter ${n}`);
      },
      (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + done / total * 80)
    );
    if (!chapters.filter(Boolean).length) throw new Error("No chapter text found on fanfiction.net");
    return finalize({
      title: title || "Story",
      author,
      summaryText,
      sourceUrl: `https://www.fanfiction.net/s/${id}/`,
      siteName: siteLabel(url),
      expectedChapters: count,
      chapters
    });
  }
  var ffnet = {
    id: "ffnet",
    match: (url) => /(^|\.)fanfiction\.net$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/s\/\d+/.test(url),
    parse: parse3
  };

  // src/adapters/ficbook.ts
  var PACING = { interval: 800, maxInterval: 2e4, concurrency: 2 };
  var BODY2 = ["#content", ".js-part-text", ".part_text", "#part_content .part_text"];
  var DROP5 = [
    ".fanfic-text-promo",
    ".js-part-text-promo",
    ".part-comment-form",
    ".ficbook-ad",
    ".adv-block",
    ".js-toggle-part-comments",
    ".part-actions",
    "ins",
    ".mobile-hidden-ad"
  ];
  function readMeta2(doc) {
    const fandom = textList(
      doc,
      ['.fanfic-hat a[href*="/fanfiction/"]', 'a[href*="/fanfiction/"]'],
      4
    ).join(", ");
    const tags = textList(
      doc,
      ['.fanfic-hat a[href*="/tags/"]', ".tags a", "a.tag", 'a[href*="/tags/"]'],
      30
    );
    const badge = (kind) => {
      const el = doc.querySelector(
        `.fanfic-badges [class*="ds-label-${kind}"], [class*="ds-label-${kind}"]`
      );
      if (!el) return "";
      const cls = typeof el.className === "string" ? el.className : "";
      const m = cls.match(new RegExp(`ds-label-${kind}-([\\w-]+)`));
      const label = norm(el.textContent);
      return label.length > 1 ? label : m ? m[1].replace(/-/g, " ") : "";
    };
    const pairing = textList(
      doc,
      ['.fanfic-hat a[href*="/pairings/"]', 'a[href*="/pairings/"]'],
      6
    ).join(", ");
    return { fandom, tags, rating: badge("rating"), status: badge("status"), size: badge("size"), pairing };
  }
  var AUTHOR_ROLE = /^(со)?(автор|переводчик)|^(co-?)?(author|translator)/i;
  function readAuthor(doc) {
    const credited = Array.from(doc.querySelectorAll(".fanfic-hat .ds-badge")).filter((badge) => AUTHOR_ROLE.test(norm(badge.textContent))).map((badge) => badge.parentElement?.querySelector('a[href*="/authors/"]')).filter((a) => !!a);
    const links = credited.length ? credited : Array.from(doc.querySelectorAll('a[itemprop="author"]'));
    const names = links.map((a) => norm(a.textContent)).filter((t) => t && t.length > 1 && t.length < 60);
    return Array.from(new Set(names)).join(", ");
  }
  function readSummary(doc) {
    const el = pick(doc, [
      '[itemprop="description"]',
      ".js-public-beta-description",
      ".fanfic-hat-body .description",
      ".description",
      ".fanfic-description"
    ]);
    if (!el) return { summaryXhtml: "", summaryText: "" };
    const { xhtml } = sanitize(el, {
      baseUrl: "https://ficbook.net/",
      keepImages: false,
      dropSelectors: DROP5
    });
    return { summaryXhtml: xhtml, summaryText: toPlainText(el, DROP5).slice(0, 1200) };
  }
  function chapterLinks2(doc, baseUrl) {
    const nodes = pickAll(
      doc,
      ["ul.list-of-fanfic-parts li.part a.part-link", "li.part a.part-link", "a.part-link"],
      400
    );
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const a of nodes) {
      const url = absolutize(a.getAttribute("href"), baseUrl);
      if (!url) continue;
      const clean = url.split("#")[0];
      if (seen.has(clean)) continue;
      seen.add(clean);
      out.push({ url: clean, title: norm(a.textContent) || `Chapter ${out.length + 1}` });
    }
    return out;
  }
  function parseChapter(doc, url, fallbackTitle) {
    const body = pick(doc, BODY2);
    if (!body) return null;
    const title = pickText(doc, ["#part_content .title-area h2", ".title-area h2", "#part_content h2"], 200) || fallbackTitle;
    const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP5 });
    return { title: title || "Chapter", xhtml };
  }
  async function parse4(doc, url, ctx) {
    const title = pickText(doc, ["h1.heading", ".fanfic-hat h1", "h1"], 300) || metaContent(doc, ["og:title"]);
    const meta = readMeta2(doc);
    const summary = readSummary(doc);
    const author = readAuthor(doc);
    let workDoc = doc;
    let workUrl = url;
    const partMatch = url.match(/^(https?:\/\/[^/]+\/readfic\/[^/?#]+)\/\d+/);
    if (partMatch) {
      workUrl = partMatch[1];
      workDoc = await ctx.fetchDoc(workUrl);
    }
    const links = chapterLinks2(workDoc, workUrl);
    if (!links.length) {
      const single = parseChapter(doc, url, title);
      if (single) {
        return finalize({
          title,
          author,
          sourceUrl: url,
          siteName: siteLabel(url),
          ...meta,
          ...summary,
          chapters: [{ ...single, title }]
        });
      }
      const onWork = parseChapter(workDoc, workUrl, title);
      if (onWork) {
        return finalize({
          title,
          author,
          sourceUrl: workUrl,
          siteName: siteLabel(workUrl),
          ...meta,
          ...summary,
          chapters: [{ ...onWork, title }]
        });
      }
      throw new Error("Found neither a list of parts nor any text on the page");
    }
    ctx.progress(`Parts found: ${links.length}`, 5);
    const chapters = await mapLimit(
      links,
      PACING.concurrency ?? 2,
      async (link) => {
        if (link.url.split("#")[0] === url.split("#")[0]) return parseChapter(doc, url, link.title);
        const d = await ctx.fetchDoc(link.url);
        return parseChapter(d, link.url, link.title);
      },
      (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + done / total * 80)
    );
    return finalize({
      title: title || "Book",
      author,
      sourceUrl: workUrl,
      siteName: siteLabel(workUrl),
      ...meta,
      ...summary,
      expectedChapters: links.length,
      chapters
    });
  }
  var ficbook = {
    id: "ficbook",
    pacing: PACING,
    match: (url) => /(^|\.)ficbook\.net$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/readfic\//.test(url),
    parse: parse4
  };

  // src/adapters/generic.ts
  var MAX_CHAPTERS = 400;
  var CHAPTER_TEXT = /^\s*(глава|глава\s*№|часть|раздел|chapter|ch\.?|part|episode|эпизод)\s*[.:№-]?\s*\d+/i;
  var NEXT_TEXT = /(следующ|далее|вперёд|вперед|дальше|next\s*(chapter|part)?|→|»|&gt;&gt;)/i;
  var PREV_TEXT = /(предыдущ|назад|previous|prev|←|«)/i;
  function scoreChapterList(doc, baseUrl) {
    const anchors = Array.from(doc.querySelectorAll("a[href]"));
    const byContainer = /* @__PURE__ */ new Map();
    for (const a of anchors) {
      const href = a.getAttribute("href");
      if (!href || /^(javascript:|mailto:|#)/i.test(href)) continue;
      const url = absolutize(href, baseUrl);
      if (!url) continue;
      if (new URL(url).hostname !== new URL(baseUrl).hostname) continue;
      const text = norm(a.textContent);
      if (!text || text.length > 160) continue;
      const parent = a.closest("ul, ol, table, nav, div, select") || doc.body;
      if (!byContainer.has(parent)) byContainer.set(parent, []);
      byContainer.get(parent).push({
        url: url.split("#")[0],
        title: text,
        numbered: CHAPTER_TEXT.test(text)
      });
    }
    const NAVISH = /(^|[\s_-])(nav|menu|footer|header|sidebar|aside|breadcrumb|pagination|pager|tags?|related|recommend|social|share)([\s_-]|$)/i;
    const TOCISH = /(toc|chapter|chapters|part|parts|content|contents|index|list|глав|част)/i;
    const containerHint = (el) => {
      const tag = (el.tagName || "").toLowerCase();
      const idc = `${el.id || ""} ${typeof el.className === "string" ? el.className : ""}`;
      if (tag === "nav" || tag === "header" || tag === "footer" || tag === "aside") return "nav";
      if (NAVISH.test(idc)) return "nav";
      if (TOCISH.test(idc)) return "toc";
      return "plain";
    };
    let best = null;
    let bestScore = 0;
    for (const [container, items] of byContainer) {
      if (items.length < 2) continue;
      const hint = containerHint(container);
      if (hint === "nav") continue;
      const uniq = [];
      const seen = /* @__PURE__ */ new Set();
      for (const it of items) {
        if (seen.has(it.url)) continue;
        seen.add(it.url);
        uniq.push(it);
      }
      if (uniq.length < 2) continue;
      const numbered = uniq.filter((i) => i.numbered).length;
      const paths = uniq.map((i) => new URL(i.url).pathname.replace(/\d+/g, "#"));
      const sameShape = paths.filter((p) => p === paths[0]).length;
      const score = numbered * 3 + sameShape + uniq.length * 0.2 + (hint === "toc" ? 5 : 0);
      const plausible = numbered >= 2 || hint === "toc" && sameShape >= Math.max(3, uniq.length * 0.8);
      if (score > bestScore && plausible) {
        bestScore = score;
        best = uniq;
      }
    }
    return best ? best.slice(0, MAX_CHAPTERS) : null;
  }
  function findNextLink(doc, baseUrl) {
    const anchors = Array.from(doc.querySelectorAll("a[href]"));
    for (const a of anchors) {
      const text = norm(a.textContent);
      const rel = a.getAttribute("rel") || "";
      const aria = a.getAttribute("title") || a.getAttribute("aria-label") || "";
      const hay = `${text} ${rel} ${aria}`;
      if (!NEXT_TEXT.test(hay) || PREV_TEXT.test(text)) continue;
      const url = absolutize(a.getAttribute("href"), baseUrl);
      if (!url || url.split("#")[0] === baseUrl.split("#")[0]) continue;
      if (new URL(url).hostname !== new URL(baseUrl).hostname) continue;
      return url.split("#")[0];
    }
    return null;
  }
  function extract3(doc, url, fallbackTitle) {
    const body = findMainContent(doc);
    if (!body) return null;
    const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false });
    if (!xhtml || xhtml.replace(/<[^>]+>/g, "").trim().length < 200) return null;
    const heading = pickText(doc, ["h1", "h2", ".chapter-title", '[class*="chapter"] h2'], 200);
    return { title: heading || fallbackTitle || "Chapter", xhtml };
  }
  async function parse5(doc, url, ctx) {
    const title = metaContent(doc, ["og:title", "twitter:title"]) || pickText(doc, ["h1"], 300) || norm(doc.title).split(/[|—–-]/)[0];
    const author = metaContent(doc, ["author", "book:author", "article:author"]) || pickText(doc, ['[rel="author"]', ".author a", 'a[href*="/author"]', 'a[href*="/user"]'], 120);
    const summaryText = metaContent(doc, ["og:description", "description"]).slice(0, 1200);
    const links = scoreChapterList(doc, url);
    let chapters = [];
    let expected = 0;
    if (links && links.length > 1) {
      expected = links.length;
      ctx.progress(`Looks like a chapter list: ${links.length}`, 5);
      const parsed = await mapLimit(
        links,
        3,
        async (link) => {
          const d = link.url.split("#")[0] === url.split("#")[0] ? doc : await ctx.fetchDoc(link.url);
          return extract3(d, link.url, link.title);
        },
        (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + done / total * 80)
      );
      chapters = parsed.filter((c) => !!c);
    }
    if (chapters.length < 2) {
      expected = 0;
      const visited = /* @__PURE__ */ new Set();
      let cursor = url.split("#")[0];
      let current = doc;
      chapters = [];
      while (cursor && !visited.has(cursor) && chapters.length < MAX_CHAPTERS) {
        visited.add(cursor);
        const ch = extract3(current, cursor, `Chapter ${chapters.length + 1}`);
        if (ch) chapters.push(ch);
        const next = findNextLink(current, cursor);
        if (!next || visited.has(next)) break;
        ctx.progress(`Walking chapters: ${chapters.length}`, Math.min(80, 5 + chapters.length * 4));
        current = await ctx.fetchDoc(next);
        cursor = next;
      }
    }
    if (!chapters.length) {
      throw new Error("No text found: this page does not look like a chapter of a book");
    }
    return finalize({
      title: title || "Book",
      author,
      summaryText,
      sourceUrl: url,
      siteName: siteLabel(url),
      expectedChapters: expected,
      chapters
    });
  }
  var generic = {
    id: "generic",
    match: () => true,
    isWorkPage: () => true,
    parse: parse5
  };

  // src/adapters/royalroad.ts
  var DROP6 = [".portlet", ".ad", ".hidden", "style", ".author-note-portlet"];
  function chapterLinks3(doc, baseUrl) {
    const rows = pickAll(doc, ["#chapters tbody tr td a[href]", "table#chapters a[href]"], 2e3);
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const a of rows) {
      const url = absolutize(a.getAttribute("href"), baseUrl);
      if (!url) continue;
      const clean = url.split("#")[0];
      if (seen.has(clean)) continue;
      seen.add(clean);
      out.push({ url: clean, title: norm(a.textContent) || `Chapter ${out.length + 1}` });
    }
    return out;
  }
  function extract4(doc, url, fallbackTitle) {
    const body = pick(doc, [".chapter-inner.chapter-content", ".chapter-content", ".chapter-inner"]);
    if (!body) return null;
    const { xhtml } = sanitize(body, { baseUrl: url, keepImages: false, dropSelectors: DROP6 });
    if (xhtml.replace(/<[^>]+>/g, "").trim().length < 100) return null;
    const heading = pickText(doc, ["h1.font-white", ".fic-header h1", "h1"], 200);
    return { title: heading || fallbackTitle || "Chapter", xhtml };
  }
  async function parse6(doc, url, ctx) {
    let workDoc = doc;
    let workUrl = url;
    const fictionMatch = url.match(/^(https?:\/\/[^/]+\/fiction\/\d+\/[^/]+)/);
    if (fictionMatch && /\/chapter\//.test(url)) {
      workUrl = fictionMatch[1];
      workDoc = await ctx.fetchDoc(workUrl);
    }
    const title = pickText(workDoc, [".fic-title h1", 'h1[property="name"]', "h1"], 300);
    const author = pickText(workDoc, [".fic-title h4 a", "h4 span a", 'a[href^="/profile/"]'], 120);
    const summaryEl = pick(workDoc, [".description .hidden-content", ".description"]);
    const summaryText = summaryEl ? toPlainText(summaryEl).slice(0, 1200) : "";
    const tags = textList(workDoc, [".tags a", "a.fiction-tag"], 25);
    const links = chapterLinks3(workDoc, workUrl);
    if (!links.length) {
      const solo = extract4(doc, url, title);
      if (!solo) throw new Error("Found neither a chapter list nor any text on RoyalRoad");
      return finalize({
        title,
        author,
        summaryText,
        tags,
        sourceUrl: url,
        siteName: siteLabel(url),
        chapters: [solo]
      });
    }
    ctx.progress(`Chapters: ${links.length}`, 5);
    const chapters = await mapLimit(
      links,
      3,
      async (link) => extract4(await ctx.fetchDoc(link.url), link.url, link.title),
      (done, total) => ctx.progress(`Chapters fetched: ${done} of ${total}`, 5 + done / total * 80)
    );
    if (!chapters.filter(Boolean).length) throw new Error("RoyalRoad returned no chapter text");
    return finalize({
      title: title || "Fiction",
      author,
      summaryText,
      tags,
      sourceUrl: workUrl,
      siteName: siteLabel(workUrl),
      expectedChapters: links.length,
      chapters
    });
  }
  var royalroad = {
    id: "royalroad",
    match: (url) => /(^|\.)royalroad\.com$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/fiction\/\d+/.test(url),
    parse: parse6
  };

  // src/adapters/wattpad.ts
  function partsFromNextData(doc) {
    const el = doc.getElementById("__NEXT_DATA__");
    if (!el) return null;
    try {
      const data = JSON.parse(el.textContent || "");
      const stack = [data];
      while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== "object") continue;
        const rec = node;
        const parts = rec.parts;
        if (Array.isArray(parts) && parts.length && parts[0] && parts[0].id) {
          return parts.map((p, i) => ({
            id: String(p.id),
            title: norm(String(p.title ?? "")) || `Part ${i + 1}`
          }));
        }
        for (const key of Object.keys(rec)) stack.push(rec[key]);
      }
    } catch {
    }
    return null;
  }
  function partsFromDom(doc) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    doc.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const m = href.match(/^\/?(\d{4,})-/);
      if (!m || seen.has(m[1])) return;
      seen.add(m[1]);
      out.push({ id: m[1], title: norm(a.textContent) || `Part ${out.length + 1}` });
    });
    return out;
  }
  async function parse7(doc, url, ctx) {
    const title = metaContent(doc, ["og:title", "twitter:title"]) || pickText(doc, ["h1"], 300);
    const author = metaContent(doc, ["author"]) || pickText(doc, ['a[href^="/user/"]', ".author-info a"], 120);
    const summaryText = metaContent(doc, ["og:description", "description"]).slice(0, 1200);
    const parts = partsFromNextData(doc) || partsFromDom(doc);
    if (!parts.length) throw new Error("No list of Wattpad parts found");
    ctx.progress(`Parts: ${parts.length}`, 5);
    const chapters = await mapLimit(
      parts,
      2,
      async (part) => {
        const html = await ctx.fetchText(
          `https://www.wattpad.com/apiv2/storytext?id=${encodeURIComponent(part.id)}`
        );
        if (!html) return null;
        const holder = ctx.parseFragment(html);
        const { xhtml } = sanitize(holder, { baseUrl: url, keepImages: false });
        if (xhtml.replace(/<[^>]+>/g, "").trim().length < 60) return null;
        return { title: part.title, xhtml };
      },
      (done, total) => ctx.progress(`Parts fetched: ${done} of ${total}`, 5 + done / total * 80)
    );
    if (!chapters.filter(Boolean).length) throw new Error("Wattpad returned no part text");
    return finalize({
      title: title || "Story",
      author,
      summaryText,
      sourceUrl: url,
      siteName: siteLabel(url),
      expectedChapters: parts.length,
      chapters
    });
  }
  var wattpad = {
    id: "wattpad",
    match: (url) => /(^|\.)wattpad\.com$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/story\/\d+|\/\d{4,}-/.test(url),
    parse: parse7
  };

  // src/adapters/index.ts
  var SITE_ADAPTERS = [ficbook, ao3, fanficsme, ffnet, wattpad, royalroad];
  function resolveAdapter(url) {
    for (const adapter of SITE_ADAPTERS) {
      try {
        if (adapter.match(url)) return adapter;
      } catch {
      }
    }
    return generic;
  }

  // src/lib/zip.ts
  var CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let c = i;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 4294967295;
    for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ c >>> 8;
    return (c ^ 4294967295) >>> 0;
  }
  var enc = new TextEncoder();
  var toBytes = (v) => typeof v === "string" ? enc.encode(v) : v;
  async function deflateRaw(bytes) {
    if (typeof CompressionStream === "undefined") return null;
    try {
      const cs = new CompressionStream("deflate-raw");
      const stream = new Blob([bytes]).stream().pipeThrough(cs);
      const buf = await new Response(stream).arrayBuffer();
      return new Uint8Array(buf);
    } catch {
      return null;
    }
  }
  function dosDateTime(date) {
    const y = Math.max(1980, date.getFullYear());
    return {
      time: date.getHours() << 11 | date.getMinutes() << 5 | date.getSeconds() >> 1,
      date: y - 1980 << 9 | date.getMonth() + 1 << 5 | date.getDate()
    };
  }
  var ByteSink = class {
    parts = [];
    length = 0;
    push(bytes) {
      this.parts.push(bytes);
      this.length += bytes.length;
    }
    u16(v) {
      const b = new Uint8Array(2);
      new DataView(b.buffer).setUint16(0, v, true);
      this.push(b);
    }
    u32(v) {
      const b = new Uint8Array(4);
      new DataView(b.buffer).setUint32(0, v >>> 0, true);
      this.push(b);
    }
    blob(type) {
      return new Blob(this.parts, { type });
    }
  };
  async function zip(files, { mimetype = "application/zip", date = /* @__PURE__ */ new Date() } = {}) {
    const stamp = dosDateTime(date);
    const out = new ByteSink();
    const central = [];
    for (const file of files) {
      const nameBytes = enc.encode(file.name);
      const raw = toBytes(file.data);
      const crc = crc32(raw);
      let method = 0;
      let payload = raw;
      if (!file.store) {
        const packed = await deflateRaw(raw);
        if (packed && packed.length < raw.length) {
          method = 8;
          payload = packed;
        }
      }
      const offset = out.length;
      out.push(enc.encode("PK"));
      out.u16(method === 8 ? 20 : 10);
      out.u16(0);
      out.u16(method);
      out.u16(stamp.time);
      out.u16(stamp.date);
      out.u32(crc);
      out.u32(payload.length);
      out.u32(raw.length);
      out.u16(nameBytes.length);
      out.u16(0);
      out.push(nameBytes);
      out.push(payload);
      central.push({ nameBytes, method, crc, packed: payload.length, raw: raw.length, offset });
    }
    const centralStart = out.length;
    for (const e of central) {
      out.push(enc.encode("PK"));
      out.u16(798);
      out.u16(e.method === 8 ? 20 : 10);
      out.u16(0);
      out.u16(e.method);
      out.u16(stamp.time);
      out.u16(stamp.date);
      out.u32(e.crc);
      out.u32(e.packed);
      out.u32(e.raw);
      out.u16(e.nameBytes.length);
      out.u16(0);
      out.u16(0);
      out.u16(0);
      out.u16(0);
      out.u32(0);
      out.u32(e.offset);
      out.push(e.nameBytes);
    }
    const centralSize = out.length - centralStart;
    out.push(enc.encode("PK"));
    out.u16(0);
    out.u16(0);
    out.u16(central.length);
    out.u16(central.length);
    out.u32(centralSize);
    out.u32(centralStart);
    out.u16(0);
    return out.blob(mimetype);
  }

  // src/lib/epub.ts
  var esc = (s) => escapeText(String(s == null ? "" : s));
  var escA = (s) => escapeAttr(String(s == null ? "" : s));
  var pad = (n, w = 3) => String(n).padStart(w, "0");
  var STYLE = `@charset "utf-8";
body { margin: 0 5%; font-family: serif; line-height: 1.5; text-align: justify; }
h1, h2, h3 { font-family: serif; font-weight: bold; text-align: left; line-height: 1.25; }
h1 { font-size: 1.6em; margin: 1.2em 0 0.6em; }
h2 { font-size: 1.25em; margin: 1em 0 0.8em; page-break-before: always; }
p { margin: 0; text-indent: 1.2em; orphans: 2; widows: 2; }
p:first-of-type, h1 + p, h2 + p, h3 + p, blockquote p:first-child { text-indent: 0; }
blockquote { margin: 1em 1.5em; font-style: italic; }
hr { border: 0; border-top: 1px solid currentColor; width: 35%; margin: 1.5em auto; opacity: 0.4; }
img { max-width: 100%; height: auto; }
.vb-meta { font-size: 0.85em; line-height: 1.6; text-indent: 0; margin: 0.35em 0; }
.vb-meta-key { font-weight: bold; }
.vb-title { text-align: center; margin-top: 18%; }
.vb-title h1 { text-align: center; font-size: 1.8em; }
.vb-author { text-align: center; font-size: 1.1em; margin: 0.4em 0 2em; text-indent: 0; }
.vb-summary { margin: 1.5em 0; font-style: italic; }
.vb-source { font-size: 0.8em; opacity: 0.75; text-indent: 0; margin-top: 2em; }
.vb-notes { font-size: 0.9em; border-top: 1px solid currentColor; margin-top: 1.5em; padding-top: 0.8em; }
nav#toc ol { list-style: none; padding-left: 0; }
nav#toc li { margin: 0.4em 0; }`;
  function page(title, bodyXhtml, lang) {
    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escA(lang)}" lang="${escA(lang)}">
<head>
<meta charset="utf-8"/>
<title>${esc(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
${bodyXhtml}
</body>
</html>`;
  }
  function metaRow(key, value) {
    if (!value) return "";
    return `<p class="vb-meta"><span class="vb-meta-key">${esc(key)}:</span> ${esc(value)}</p>`;
  }
  function titlePage(book) {
    const meta = [
      metaRow("Fandom", book.fandom),
      metaRow("Pairing", book.pairing),
      metaRow("Rating", book.rating),
      metaRow("Status", book.status),
      metaRow("Length", book.size),
      metaRow("Tags", (book.tags || []).join(", "))
    ].join("\n");
    const summary = book.summaryXhtml ? `<div class="vb-summary">${book.summaryXhtml}</div>` : "";
    return page(
      book.title,
      `<div class="vb-title">
<h1>${esc(book.title)}</h1>
<p class="vb-author">${esc(book.author || "Unknown author")}</p>
</div>
${summary}
${meta}
<p class="vb-source">Source: ${esc(book.siteName || "")} \u2014 ${esc(book.sourceUrl || "")}<br/>
Downloaded ${esc((/* @__PURE__ */ new Date()).toISOString().slice(0, 10))}</p>`,
      book.language
    );
  }
  function navPage(book, chapters) {
    const items = chapters.map((c, i) => `<li><a href="ch${pad(i + 1)}.xhtml">${esc(c.title)}</a></li>`).join("\n");
    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escA(book.language)}" lang="${escA(book.language)}">
<head><meta charset="utf-8"/><title>Contents</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<nav epub:type="toc" id="toc">
<h1>Contents</h1>
<ol>
<li><a href="title.xhtml">${esc(book.title)}</a></li>
${items}
</ol>
</nav>
<nav epub:type="landmarks" hidden="hidden">
<ol>
<li><a epub:type="toc" href="nav.xhtml">Contents</a></li>
<li><a epub:type="bodymatter" href="ch001.xhtml">Start</a></li>
</ol>
</nav>
</body>
</html>`;
  }
  function ncx(book, chapters, uid) {
    const points = [{ title: book.title, href: "title.xhtml" }].concat(chapters.map((c, i) => ({ title: c.title, href: `ch${pad(i + 1)}.xhtml` }))).map(
      (p, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}">
<navLabel><text>${esc(p.title)}</text></navLabel>
<content src="${escA(p.href)}"/>
</navPoint>`
    ).join("\n");
    return `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head>
<meta name="dtb:uid" content="${escA(uid)}"/>
<meta name="dtb:depth" content="1"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${esc(book.title)}</text></docTitle>
<navMap>
${points}
</navMap>
</ncx>`;
  }
  function opf(book, chapters, uid, cover) {
    const manifest = [
      '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
      '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
      '<item id="style" href="style.css" media-type="text/css"/>',
      '<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>'
    ];
    const spine = ['<itemref idref="title"/>', '<itemref idref="nav"/>'];
    if (cover) {
      manifest.push(
        `<item id="cover-image" href="${escA(cover.name)}" media-type="${escA(cover.mime)}" properties="cover-image"/>`
      );
      manifest.push('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>');
      spine.unshift('<itemref idref="cover"/>');
    }
    chapters.forEach((_c, i) => {
      const id = `ch${pad(i + 1)}`;
      manifest.push(`<item id="${id}" href="${id}.xhtml" media-type="application/xhtml+xml"/>`);
      spine.push(`<itemref idref="${id}"/>`);
    });
    const subjects = (book.tags || []).concat(book.fandom ? [book.fandom] : []).slice(0, 24).map((t) => `<dc:subject>${esc(t)}</dc:subject>`).join("\n");
    return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${escA(book.language)}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">${esc(uid)}</dc:identifier>
<dc:title>${esc(book.title)}</dc:title>
<dc:language>${esc(book.language)}</dc:language>
<dc:creator id="author">${esc(book.author || "Unknown author")}</dc:creator>
<meta refines="#author" property="role" scheme="marc:relators">aut</meta>
${book.summaryText ? `<dc:description>${esc(book.summaryText.slice(0, 1800))}</dc:description>` : ""}
${book.siteName ? `<dc:publisher>${esc(book.siteName)}</dc:publisher>` : ""}
${book.sourceUrl ? `<dc:source>${esc(book.sourceUrl)}</dc:source>` : ""}
${subjects}
<meta property="dcterms:modified">${(/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z")}</meta>
${cover ? '<meta name="cover" content="cover-image"/>' : ""}
</metadata>
<manifest>
${manifest.join("\n")}
</manifest>
<spine toc="ncx">
${spine.join("\n")}
</spine>
</package>`;
  }
  async function build(book) {
    const chapters = book.chapters || [];
    const uid = `urn:uuid:${book.uuid || uuid()}`;
    const lang = book.language || "en";
    const withLang = { ...book, language: lang };
    const files = [
      { name: "mimetype", data: "application/epub+zip", store: true },
      {
        name: "META-INF/container.xml",
        data: `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
      },
      { name: "OEBPS/style.css", data: STYLE },
      { name: "OEBPS/title.xhtml", data: titlePage(withLang) },
      { name: "OEBPS/nav.xhtml", data: navPage(withLang, chapters) },
      { name: "OEBPS/toc.ncx", data: ncx(withLang, chapters, uid) }
    ];
    let cover = null;
    if (book.cover && book.cover.bytes && book.cover.bytes.length) {
      cover = { name: `cover.${book.cover.ext || "jpg"}`, mime: book.cover.mime || "image/jpeg" };
      files.push({ name: `OEBPS/${cover.name}`, data: book.cover.bytes });
      files.push({
        name: "OEBPS/cover.xhtml",
        data: page(
          "Cover",
          `<div style="text-align:center;margin:0;padding:0;"><img src="${escA(cover.name)}" alt="${escA(book.title)}"/></div>`,
          lang
        )
      });
    }
    chapters.forEach((c, i) => {
      const notes = c.notesXhtml ? `<div class="vb-notes">${c.notesXhtml}</div>` : "";
      files.push({
        name: `OEBPS/ch${pad(i + 1)}.xhtml`,
        data: page(c.title, `<h2>${esc(c.title)}</h2>
${c.xhtml}
${notes}`, lang)
      });
    });
    files.push({ name: "OEBPS/content.opf", data: opf(withLang, chapters, uid, cover) });
    return zip(files, { mimetype: "application/epub+zip" });
  }

  // src/lib/fb2.ts
  var esc2 = (s) => escapeText(String(s == null ? "" : s));
  function toFb2Body(xhtml) {
    let s = String(xhtml || "");
    s = s.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "<subtitle>$1</subtitle>").replace(/<blockquote[^>]*>/gi, "<cite>").replace(/<\/blockquote>/gi, "</cite>").replace(/<(em|i)\b[^>]*>/gi, "<emphasis>").replace(/<\/(em|i)>/gi, "</emphasis>").replace(/<(strong|b)\b[^>]*>/gi, "<strong>").replace(/<\/(strong|b)>/gi, "</strong>").replace(/<br\s*\/?>/gi, "</p><p>").replace(/<hr\s*\/?>/gi, "<empty-line/>").replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1").replace(/<img\b[^>]*\/?>/gi, "").replace(
      /<\/?(div|span|section|article|figure|figcaption|small|sup|sub|u|s|strike|del|ins|mark|code|cite\s|pre|table|thead|tbody|tr|td|th|caption|dl|dt|dd|center|abbr|q)\b[^>]*>/gi,
      ""
    ).replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, "").replace(/<li[^>]*>/gi, "<p>\u2022 ").replace(/<\/li>/gi, "</p>").replace(/<p><\/p>/g, "").replace(/<p>\s*<\/p>/g, "");
    if (!/<p[\s>]/.test(s) && s.trim()) s = `<p>${s}</p>`;
    return s.trim();
  }
  function build2(book) {
    const chapters = book.chapters || [];
    const author = String(book.author || "Unknown author").trim();
    const parts = author.split(/\s+/);
    const firstName = parts.length > 1 ? parts[0] : "";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : author;
    const bodySections = chapters.map(
      (c) => `<section>
<title><p>${esc2(c.title)}</p></title>
${toFb2Body(c.xhtml)}
</section>`
    ).join("\n");
    const genres = ["nonf_publicism"];
    const keywords = (book.tags || []).slice(0, 20).join(", ");
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
<description>
<title-info>
${genres.map((g) => `<genre>${g}</genre>`).join("")}
<author>${firstName ? `<first-name>${esc2(firstName)}</first-name>` : ""}<last-name>${esc2(lastName)}</last-name></author>
<book-title>${esc2(book.title)}</book-title>
${book.summaryText ? `<annotation><p>${esc2(book.summaryText)}</p></annotation>` : ""}
${keywords ? `<keywords>${esc2(keywords)}</keywords>` : ""}
<lang>${esc2(book.language || "en")}</lang>
</title-info>
<document-info>
<author><nickname>VireBook</nickname></author>
<date value="${today}">${today}</date>
${book.sourceUrl ? `<src-url>${esc2(book.sourceUrl)}</src-url>` : ""}
<id>${esc2(book.uuid || uuid())}</id>
<version>1.0</version>
</document-info>
</description>
<body>
<title><p>${esc2(book.title)}</p></title>
${bodySections}
</body>
</FictionBook>`;
    return new Blob([xml], { type: "application/x-fictionbook+xml" });
  }

  // src/lib/mobi.ts
  var RECORD_SIZE = 4096;
  var enc2 = new TextEncoder();
  var esc3 = (s) => escapeText(String(s == null ? "" : s));
  var Writer = class {
    buf;
    view;
    pos = 0;
    constructor(size) {
      this.buf = new Uint8Array(size);
      this.view = new DataView(this.buf.buffer);
    }
    u8(v) {
      this.view.setUint8(this.pos, v);
      this.pos += 1;
      return this;
    }
    u16(v) {
      this.view.setUint16(this.pos, v >>> 0, false);
      this.pos += 2;
      return this;
    }
    u32(v) {
      this.view.setUint32(this.pos, v >>> 0, false);
      this.pos += 4;
      return this;
    }
    bytes(b) {
      this.buf.set(b, this.pos);
      this.pos += b.length;
      return this;
    }
    ascii(s, width) {
      const b = enc2.encode(s);
      const n = width == null ? b.length : Math.min(b.length, width);
      this.buf.set(b.subarray(0, n), this.pos);
      this.pos += width == null ? n : width;
      return this;
    }
    zeros(n) {
      this.pos += n;
      return this;
    }
    at(p) {
      this.pos = p;
      return this;
    }
  };
  function indexOfBytes(haystack, needle, from = 0) {
    const first = needle[0];
    const limit = haystack.length - needle.length;
    outer: for (let i = from; i <= limit; i += 1) {
      if (haystack[i] !== first) continue;
      for (let j = 1; j < needle.length; j += 1) if (haystack[i + j] !== needle[j]) continue outer;
      return i;
    }
    return -1;
  }
  function palmDocCompress(chunk) {
    const n = chunk.length;
    const out = new Uint8Array(n * 2 + 16);
    let o = 0;
    const head = /* @__PURE__ */ new Map();
    const prev = new Int32Array(n).fill(-1);
    const key = (i2) => chunk[i2] << 16 | chunk[i2 + 1] << 8 | chunk[i2 + 2];
    let i = 0;
    while (i < n) {
      let bestLen = 0;
      let bestDist = 0;
      if (i + 2 < n) {
        const k = key(i);
        let cand = head.has(k) ? head.get(k) : -1;
        const maxLen = Math.min(10, n - i);
        let guard = 0;
        while (cand >= 0 && guard++ < 64) {
          const dist = i - cand;
          if (dist > 2047) break;
          let len = 0;
          while (len < maxLen && chunk[cand + len] === chunk[i + len]) len += 1;
          if (len > bestLen) {
            bestLen = len;
            bestDist = dist;
            if (len === maxLen) break;
          }
          cand = prev[cand];
        }
      }
      if (bestLen >= 3) {
        for (let k = 0; k < bestLen; k += 1) {
          const p = i + k;
          if (p + 2 < n) {
            const h = key(p);
            prev[p] = head.has(h) ? head.get(h) : -1;
            head.set(h, p);
          }
        }
        const m = 32768 | bestDist << 3 & 16376 | bestLen - 3;
        out[o++] = m >> 8 & 255;
        out[o++] = m & 255;
        i += bestLen;
        continue;
      }
      if (i + 2 < n) {
        const h = key(i);
        prev[i] = head.has(h) ? head.get(h) : -1;
        head.set(h, i);
      }
      const b = chunk[i];
      if (b === 32 && i + 1 < n && chunk[i + 1] >= 64 && chunk[i + 1] <= 127) {
        out[o++] = chunk[i + 1] ^ 128;
        i += 2;
        continue;
      }
      if (b === 0 || b >= 9 && b <= 127) {
        out[o++] = b;
        i += 1;
        continue;
      }
      let run = 0;
      while (i + run < n && run < 8) {
        const c = chunk[i + run];
        if (c === 0 || c >= 9 && c <= 127) break;
        run += 1;
      }
      out[o++] = run;
      for (let k = 0; k < run; k += 1) out[o++] = chunk[i + k];
      i += run;
    }
    return out.subarray(0, o);
  }
  function buildHtml(book) {
    const chapters = book.chapters || [];
    const parts = [];
    parts.push("<html><head>");
    parts.push('<guide><reference type="toc" title="Contents" filepos=FPOSTOC001 /></guide>');
    parts.push("</head><body>");
    parts.push('<a name="vbstart"></a>');
    parts.push(`<h1 align="center">${esc3(book.title)}</h1>`);
    parts.push(`<p align="center"><i>${esc3(book.author || "Unknown author")}</i></p>`);
    if (book.summaryText) {
      parts.push(`<blockquote><p><i>${esc3(book.summaryText)}</i></p></blockquote>`);
    }
    const meta = [
      ["Fandom", book.fandom],
      ["Pairing", book.pairing],
      ["Rating", book.rating],
      ["Status", book.status],
      ["Tags", (book.tags || []).join(", ")]
    ];
    for (const [k, v] of meta) {
      if (v) parts.push(`<p><small><b>${esc3(k)}:</b> ${esc3(v)}</small></p>`);
    }
    if (book.sourceUrl) parts.push(`<p><small>Source: ${esc3(book.sourceUrl)}</small></p>`);
    parts.push("<mbp:pagebreak/>");
    parts.push('<a name="vbtoc"></a>');
    parts.push("<h1>Contents</h1>");
    chapters.forEach((c, i) => {
      parts.push(`<p><a filepos=FPOSC${String(i + 1).padStart(5, "0")}>${esc3(c.title)}</a></p>`);
    });
    chapters.forEach((c, i) => {
      parts.push("<mbp:pagebreak/>");
      parts.push(`<a name="vbc${String(i + 1).padStart(5, "0")}"></a>`);
      parts.push(`<h2>${esc3(c.title)}</h2>`);
      parts.push(mobifyXhtml(c.xhtml));
      if (c.notesXhtml) parts.push(`<hr/><small>${mobifyXhtml(c.notesXhtml)}</small>`);
    });
    parts.push("</body></html>");
    return parts.join("\n");
  }
  function mobifyXhtml(xhtml) {
    return String(xhtml || "").replace(/<br\s*\/>/g, "<br>").replace(/<hr\s*\/>/g, "<hr>").replace(/<img([^>]*?)\/>/g, "<img$1>").replace(/<\/?(section|article|figure|figcaption|mark|ins|del)>/g, "").replace(/<span[^>]*>/g, "").replace(/<\/span>/g, "");
  }
  function patchFilepos(html, chapterCount) {
    const bytes = enc2.encode(html);
    const offsetOf = (anchorName) => {
      const needle = enc2.encode(`<a name="${anchorName}">`);
      const at = indexOfBytes(bytes, needle);
      return at < 0 ? 0 : at;
    };
    const targets = [["FPOSTOC001", offsetOf("vbtoc")]];
    for (let i = 1; i <= chapterCount; i += 1) {
      targets.push([`FPOSC${String(i).padStart(5, "0")}`, offsetOf(`vbc${String(i).padStart(5, "0")}`)]);
    }
    for (const [token, offset] of targets) {
      const needle = enc2.encode(token);
      const at = indexOfBytes(bytes, needle);
      if (at < 0) continue;
      const digits = enc2.encode(String(offset).padStart(10, "0"));
      bytes.set(digits, at);
    }
    return bytes;
  }
  function exthHeader(book) {
    const records = [];
    const add = (type, value) => {
      if (!value) return;
      records.push({ type, data: enc2.encode(String(value)) });
    };
    add(100, book.author || "Unknown author");
    add(101, book.siteName || "VireBook");
    add(103, (book.summaryText || "").slice(0, 1800));
    add(105, (book.tags || []).slice(0, 12).join(", "));
    add(109, book.sourceUrl || "");
    add(503, book.title);
    add(501, "EBOK");
    let size = 12;
    for (const r of records) size += 8 + r.data.length;
    const padding = (4 - size % 4) % 4;
    const total = size + padding;
    const w = new Writer(total);
    w.ascii("EXTH");
    w.u32(total);
    w.u32(records.length);
    for (const r of records) {
      w.u32(r.type);
      w.u32(8 + r.data.length);
      w.bytes(r.data);
    }
    return w.buf;
  }
  function flisRecord() {
    const w = new Writer(36);
    w.ascii("FLIS").u32(8).u16(65).u16(0).u32(0).u32(4294967295).u16(1).u16(3).u32(3).u32(1).u32(4294967295);
    return w.buf;
  }
  function fcisRecord(textLength) {
    const w = new Writer(44);
    w.ascii("FCIS").u32(20).u32(16).u32(1).u32(0).u32(textLength).u32(0).u32(32).u32(8).u16(1).u16(1).u32(0);
    return w.buf;
  }
  function build3(book) {
    const chapters = book.chapters || [];
    const textBytes = patchFilepos(buildHtml(book), chapters.length);
    const textRecords = [];
    for (let off = 0; off < textBytes.length; off += RECORD_SIZE) {
      textRecords.push(
        palmDocCompress(textBytes.subarray(off, Math.min(off + RECORD_SIZE, textBytes.length)))
      );
    }
    if (!textRecords.length) textRecords.push(new Uint8Array([0]));
    const lastText = textRecords.length;
    const flisNum = lastText + 1;
    const fcisNum = lastText + 2;
    const exth = exthHeader(book);
    const titleBytes = enc2.encode(book.title || "Book");
    const mobiHeaderLength = 232;
    const fullNameOffset = 16 + mobiHeaderLength + exth.length;
    const record0Raw = fullNameOffset + titleBytes.length + 2;
    const record0Size = record0Raw + (4 - record0Raw % 4) % 4;
    const r0 = new Writer(record0Size);
    r0.u16(2).u16(0).u32(textBytes.length).u16(textRecords.length).u16(RECORD_SIZE).u16(0).u16(0);
    r0.ascii("MOBI");
    r0.u32(mobiHeaderLength);
    r0.u32(2);
    r0.u32(65001);
    r0.u32(Math.random() * 268435455 >>> 0);
    r0.u32(6);
    for (let i = 0; i < 10; i += 1) r0.u32(4294967295);
    r0.u32(flisNum);
    r0.u32(fullNameOffset);
    r0.u32(titleBytes.length);
    r0.u32(book.language === "ru" ? 25 : 9);
    r0.u32(0);
    r0.u32(0);
    r0.u32(6);
    r0.u32(flisNum);
    r0.u32(0).u32(0).u32(0).u32(0);
    r0.u32(64);
    r0.zeros(32);
    r0.u32(4294967295);
    r0.u32(4294967295).u32(0).u32(0).u32(0);
    r0.zeros(8);
    r0.u16(1);
    r0.u16(lastText);
    r0.u32(1);
    r0.u32(fcisNum).u32(1);
    r0.u32(flisNum).u32(1);
    r0.zeros(8);
    r0.u32(4294967295);
    r0.u32(0);
    r0.u32(4294967295);
    r0.u32(4294967295);
    r0.u32(0);
    r0.u32(4294967295);
    r0.at(16 + mobiHeaderLength).bytes(exth);
    r0.at(fullNameOffset).bytes(titleBytes);
    const records = [
      r0.buf,
      ...textRecords,
      flisRecord(),
      fcisRecord(textBytes.length),
      new Uint8Array([233, 142, 13, 10])
    ];
    const headerSize = 78 + records.length * 8 + 2;
    const header = new Writer(headerSize);
    const dbName = (book.title || "book").replace(/[^\x20-\x7e]/g, "_").slice(0, 31);
    header.ascii(dbName, 32);
    header.u16(0).u16(0);
    const palmEpoch = Math.floor(Date.now() / 1e3) + 2082844800;
    header.u32(palmEpoch).u32(palmEpoch).u32(0).u32(0).u32(0).u32(0);
    header.ascii("BOOK").ascii("MOBI");
    header.u32(Math.random() * 268435455 >>> 0).u32(0);
    header.u16(records.length);
    let offset = headerSize;
    for (let i = 0; i < records.length; i += 1) {
      header.u32(offset);
      header.u8(0);
      header.u8(0).u8(i >> 8 & 255).u8(i & 255);
      offset += records[i].length;
    }
    header.u16(0);
    return new Blob([header.buf, ...records], {
      type: "application/x-mobipocket-ebook"
    });
  }

  // src/lib/txt.ts
  function stripTags(xhtml) {
    return String(xhtml || "").replace(/<(br|\/p|\/div|\/h[1-6]|hr)\s*\/?>/gi, "\n").replace(/<\/?[^>]+>/g, "").replace(/&nbsp;|&#160;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/[ \t ]+/g, " ").replace(/\n{3,}/g, "\n\n").split("\n").map((l) => l.trim()).join("\n").trim();
  }
  function build4(book) {
    const rule = "\u2014".repeat(40);
    const head = [
      book.title,
      book.author ? `Author: ${book.author}` : "",
      book.fandom ? `Fandom: ${book.fandom}` : "",
      (book.tags || []).length ? `Tags: ${book.tags.join(", ")}` : "",
      book.sourceUrl ? `Source: ${book.sourceUrl}` : ""
    ].filter(Boolean).join("\n");
    const summary = book.summaryText ? `

${book.summaryText}` : "";
    const body = (book.chapters || []).map((c) => `

${rule}
${c.title}
${rule}

${stripTags(c.xhtml)}`).join("\n");
    return new Blob(["\uFEFF", head, summary, body, "\n"], { type: "text/plain;charset=utf-8" });
  }

  // src/translate/text.ts
  var VOID2 = /* @__PURE__ */ new Set(["br", "hr", "img"]);
  var SENTENCE_END = /[.!?…。！？]["'»”’)\]」』]*\s+/g;
  function splitSegment(html, budget) {
    if (html.length <= budget) return [html];
    const atoms = [];
    let cur = "";
    let depth = 0;
    for (const token of html.match(/<[^>]*>|[^<]+/g) ?? []) {
      if (token.startsWith("<")) {
        const m = /^<(\/?)([a-z0-9]+)/i.exec(token);
        const name = m ? m[2].toLowerCase() : "";
        cur += token;
        if (m && !VOID2.has(name) && !token.endsWith("/>")) depth = Math.max(0, depth + (m[1] ? -1 : 1));
        else if (name === "br" && depth === 0) {
          atoms.push(cur);
          cur = "";
        }
        continue;
      }
      if (depth > 0) {
        cur += token;
        continue;
      }
      let from = 0;
      for (const m of token.matchAll(SENTENCE_END)) {
        const end = m.index + m[0].length;
        atoms.push(cur + token.slice(from, end));
        cur = "";
        from = end;
      }
      cur += token.slice(from);
    }
    if (cur) atoms.push(cur);
    const pieces = [];
    let piece = "";
    for (const atom of atoms) {
      if (piece && piece.length + atom.length > budget) {
        pieces.push(piece);
        piece = "";
      }
      piece += atom;
    }
    if (piece) pieces.push(piece);
    return pieces;
  }
  function joinPieces(pieces) {
    let out = "";
    for (const piece of pieces) {
      if (!out) out = piece;
      else if (/<br\s*\/?>\s*$/i.test(out)) out += piece;
      else out = `${out.replace(/\s+$/, "")} ${piece.replace(/^\s+/, "")}`;
    }
    return out;
  }
  function planBatches(pieces, budget, maxSegments) {
    const groups = [];
    let group = [];
    let size = 0;
    pieces.forEach((piece, i) => {
      if (group.length && (group.length >= maxSegments || size + piece.length > budget)) {
        groups.push(group);
        group = [];
        size = 0;
      }
      group.push(i);
      size += piece.length;
    });
    if (group.length) groups.push(group);
    return groups;
  }
  var STRAY = /(<\/[a-z0-9]+>) +(?=[.,…)\]}。、！？；：」』!?;:»”’])/gi;
  var STRAY_FRENCH = /(<\/[a-z0-9]+>) +(?=[.,…)\]}])/gi;
  function normalizeSpacing(html, target) {
    return html.replace(target.toLowerCase().startsWith("fr") ? STRAY_FRENCH : STRAY, "$1");
  }

  // src/lib/net.ts
  var NET_TIMING = { idle: 2e4, grace: 12e4, backoff: 1e3, maxBackoff: 8e3 };
  async function fetchFully(url, init, { idle, signal, fetchFn = fetch }) {
    if (signal?.aborted) throw abortError();
    const ctl = new AbortController();
    let timedOut = false;
    const stopped = new Promise((_, reject) => {
      ctl.signal.addEventListener(
        "abort",
        () => reject(timedOut ? new Error(`No answer for ${Math.round(idle / 1e3)} s`) : abortError()),
        { once: true }
      );
    });
    stopped.catch(() => {
    });
    const cancel = () => ctl.abort();
    signal?.addEventListener("abort", cancel, { once: true });
    let timer;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timedOut = true;
        ctl.abort();
      }, idle);
    };
    const guard = (p) => Promise.race([p, stopped]);
    try {
      arm();
      const res = await guard(fetchFn(url, { ...init, signal: ctl.signal }));
      if (!res.ok) {
        res.body?.cancel().catch(() => {
        });
        return { ok: false, status: res.status, headers: res.headers, body: new Uint8Array() };
      }
      const body = res.body ? await readBody(res.body.getReader(), guard, arm) : new Uint8Array(await guard(res.arrayBuffer()));
      return { ok: true, status: res.status, headers: res.headers, body };
    } catch (err) {
      if (signal?.aborted) throw abortError();
      throw err;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
    }
  }
  async function readBody(reader, guard, onChunk) {
    const chunks = [];
    let size = 0;
    try {
      for (; ; ) {
        const { done, value } = await guard(reader.read());
        if (done) break;
        onChunk();
        chunks.push(value);
        size += value.length;
      }
    } catch (err) {
      reader.cancel().catch(() => {
      });
      throw err;
    }
    const body = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) {
      body.set(c, at);
      at += c.length;
    }
    return body;
  }
  var decodeText = (body) => new TextDecoder().decode(body);

  // src/translate/google.ts
  var ENDPOINT = "https://translate.googleapis.com/translate_a/t";
  var RETRY_STATUS = /* @__PURE__ */ new Set([408, 425, 429, 500, 502, 503, 504]);
  var MAX_WAIT = 6e4;
  function refusal(status) {
    if (status === 429) {
      return new Error("Google Translate is limiting requests. Wait a few minutes, or download without translation.");
    }
    return new Error(`Google Translate refused the request (HTTP ${status}). Try later, or download without translation.`);
  }
  function textsOf(data, expected) {
    if (Array.isArray(data)) {
      const texts = data.map((item) => Array.isArray(item) ? item[0] : item);
      if (texts.length === expected && texts.every((t) => typeof t === "string")) {
        const detected = data.map((item) => Array.isArray(item) && typeof item[1] === "string" ? item[1] : "");
        return { texts, detected };
      }
    }
    throw new Error("Google Translate answered in a shape we do not understand.");
  }
  function createGoogleTranslator(options = {}) {
    const { budget = 4500, maxSegments = 40, gap = 350, maxAttempts = 5, backoffBase = 1200 } = options;
    const doFetch = options.fetch ?? ((input, init) => fetch(input, init));
    const limiter = createRateLimiter({ interval: gap, maxInterval: 15e3 });
    const net = { ...NET_TIMING, ...options.timing };
    async function send(queries, from, to, signal) {
      const url = `${ENDPOINT}?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&format=html`;
      const body = new URLSearchParams();
      for (const q of queries) body.append("q", q);
      let httpAttempt = 0;
      let netAttempt = 0;
      let downSince = 0;
      for (; ; ) {
        await limiter.acquire(signal);
        if (signal?.aborted) throw abortError();
        let res;
        try {
          res = await fetchFully(url, { method: "POST", body }, { idle: net.idle, signal, fetchFn: doFetch });
        } catch (err) {
          if (signal?.aborted) throw err;
          if (!downSince) {
            downSince = Date.now();
            limiter.penalize(0);
          }
          if (Date.now() - downSince >= net.grace) {
            throw new Error("The network is not responding \u2014 check your connection.");
          }
          await sleep(backoffDelay(netAttempt++, { base: backoffBase, max: net.maxBackoff }), signal);
          continue;
        }
        downSince = 0;
        netAttempt = 0;
        if (res.ok) {
          limiter.reward();
          return textsOf(JSON.parse(decodeText(res.body)), queries.length);
        }
        if (!RETRY_STATUS.has(res.status)) throw refusal(res.status);
        const floor = Math.min(MAX_WAIT, parseRetryAfter(res.headers.get("Retry-After")));
        limiter.penalize(floor);
        httpAttempt += 1;
        if (httpAttempt >= maxAttempts) throw refusal(res.status);
        await sleep(backoffDelay(httpAttempt - 1, { base: backoffBase, max: MAX_WAIT, floor }), signal);
      }
    }
    return {
      id: "google",
      async translate(segments, from, to, signal) {
        const results = segments.map((s) => s.trim() ? "" : s);
        const owners = [];
        const pieces = [];
        segments.forEach((s, i) => {
          if (!s.trim()) return;
          for (const piece of splitSegment(s, budget)) {
            owners.push(i);
            pieces.push(piece);
          }
        });
        const translated = new Array(pieces.length);
        const langs = new Array(pieces.length).fill("");
        for (const group of planBatches(pieces, budget, maxSegments)) {
          const answer = await send(group.map((i) => pieces[i]), from || "auto", to, signal);
          group.forEach((pieceIndex, k) => {
            translated[pieceIndex] = normalizeSpacing(answer.texts[k], to);
            langs[pieceIndex] = answer.detected[k];
          });
        }
        const detected = segments.map(() => "");
        segments.forEach((s, i) => {
          if (!s.trim()) return;
          const mine = [];
          owners.forEach((owner, k) => {
            if (owner === i) mine.push(translated[k]);
          });
          results[i] = joinPieces(mine);
          detected[i] = langs[owners.indexOf(i)];
        });
        return { texts: results, detected };
      }
    };
  }

  // src/translate/types.ts
  var LANGUAGES = [
    { code: "ru", label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
    { code: "en", label: "English" },
    { code: "uk", label: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430" },
    { code: "de", label: "Deutsch" },
    { code: "fr", label: "Fran\xE7ais" },
    { code: "es", label: "Espa\xF1ol" },
    { code: "it", label: "Italiano" },
    { code: "pt", label: "Portugu\xEAs" },
    { code: "pl", label: "Polski" },
    { code: "tr", label: "T\xFCrk\xE7e" },
    { code: "ja", label: "\u65E5\u672C\u8A9E" },
    { code: "zh-CN", label: "\u4E2D\u6587" },
    { code: "ko", label: "\uD55C\uAD6D\uC5B4" }
  ];
  function normalizeTarget(value) {
    return LANGUAGES.some((l) => l.code === value) ? value : "";
  }

  // src/translate/book.ts
  var TRANSLATE_FROM = 40;
  var TRANSLATE_TO = 88;
  var STRUCTURAL = /* @__PURE__ */ new Set([
    "p",
    "div",
    "section",
    "article",
    "blockquote",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "hr",
    "tr",
    "figure",
    "figcaption",
    "dl",
    "dt",
    "dd",
    "center",
    "table",
    "thead",
    "tbody",
    "td",
    "th",
    "caption"
  ]);
  var STRUCTURAL_SELECTOR = [...STRUCTURAL].join(",");
  var LETTER = new RegExp("\\p{L}", "u");
  var hasText = (html) => LETTER.test(html.replace(/<[^>]*>/g, ""));
  function plan(xhtml, segments) {
    const doc = new DOMParser().parseFromString(`<body>${xhtml}</body>`, "text/html");
    const out = [];
    function emit(nodes, open, close, keepEmpty) {
      const holder = doc.createElement("div");
      for (const n of nodes) holder.append(n.cloneNode(true));
      const original = sanitize(holder, { wrapBare: false }).xhtml;
      if (!original && !keepEmpty) {
        if (holder.textContent?.includes("\n")) out.push("\n");
        return;
      }
      if (!hasText(holder.innerHTML)) {
        if (keepEmpty || /<img[\s>]/.test(original)) out.push(open + original + close);
        return;
      }
      out.push({ seg: segments.push(holder.innerHTML) - 1, open, close, original });
    }
    function walk(parent, topLevel) {
      let run = [];
      const flush = () => {
        if (run.length) emit(run, topLevel ? "<p>" : "", topLevel ? "</p>" : "", false);
        run = [];
      };
      for (const node of Array.from(parent.childNodes)) {
        const tag = node.nodeType === 1 ? node.tagName.toLowerCase() : "";
        if (!STRUCTURAL.has(tag)) {
          run.push(node);
          continue;
        }
        flush();
        const el = node;
        if (tag === "hr") out.push("<hr/>");
        else if (el.querySelector(STRUCTURAL_SELECTOR)) {
          out.push(`<${tag}>`);
          walk(el, false);
          out.push(`</${tag}>`);
        } else emit(Array.from(el.childNodes), `<${tag}>`, `</${tag}>`, true);
      }
      flush();
    }
    walk(doc.body, true);
    return out;
  }
  function cleanInline(html) {
    const body = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;
    return sanitize(body, { wrapBare: false }).xhtml;
  }
  function render(pieces, translated) {
    return pieces.map((p) => {
      if (typeof p === "string") return p;
      const clean = cleanInline(translated[p.seg] ?? "");
      return p.open + (clean || p.original) + p.close;
    }).join("");
  }
  var textSegment = (text) => hasText(text) ? escapeText(text) : "";
  function textBack(translated, original) {
    if (!translated) return original;
    const body = new DOMParser().parseFromString(`<body>${translated}</body>`, "text/html").body;
    return normalizeSpace(body.textContent) || original;
  }
  var baseOf = (code) => code.toLowerCase().split("-")[0];
  function alreadyIn(target) {
    const name = LANGUAGES.find((l) => l.code === target)?.label ?? target;
    return `The book is already in ${name} \u2014 not translated.`;
  }
  var MIN_VOTE = 20;
  function dominantLanguage(sent, detected) {
    const weight = /* @__PURE__ */ new Map();
    sent.forEach((html, i) => {
      const code = detected[i];
      const size = html.replace(/<[^>]*>/g, "").trim().length;
      if (code && size >= MIN_VOTE) weight.set(baseOf(code), (weight.get(baseOf(code)) ?? 0) + size);
    });
    let best = "";
    let most = 0;
    for (const [code, w] of weight) {
      if (w > most) {
        best = code;
        most = w;
      }
    }
    return best;
  }
  var isAbort = (err, signal) => Boolean(signal?.aborted) || err?.name === "AbortError";
  async function translateBook(book, target, translator, progress, signal, report = {}) {
    const check = () => {
      if (signal?.aborted) throw abortError();
    };
    const run = (segments) => translator.translate(segments, "auto", target, signal);
    const band = (done, of) => TRANSLATE_FROM + done / Math.max(1, of) * (TRANSLATE_TO - TRANSLATE_FROM);
    const total = book.chapters.length;
    async function chapterAt(i) {
      check();
      progress(`Translating chapter ${i + 1} of ${total}\u2026`, band(i, total));
      const chapter = book.chapters[i];
      const segments = [];
      const titleSeg = segments.push(textSegment(chapter.title)) - 1;
      const body = plan(chapter.xhtml, segments);
      const bodyEnd = segments.length;
      const notes = chapter.notesXhtml ? plan(chapter.notesXhtml, segments) : null;
      const { texts, detected } = await run(segments);
      return {
        vote: dominantLanguage(segments.slice(titleSeg + 1, bodyEnd), detected.slice(titleSeg + 1, bodyEnd)),
        chapter: {
          ...chapter,
          title: textBack(texts[titleSeg], chapter.title),
          xhtml: render(body, texts),
          ...notes ? { notesXhtml: render(notes, texts) } : {}
        }
      };
    }
    async function frontMatter() {
      check();
      progress("Translating the title and summary\u2026", band(1, total));
      const front2 = [];
      const titleAt = front2.push(textSegment(book.title)) - 1;
      const summaryTextAt = book.summaryText ? front2.push(textSegment(book.summaryText)) - 1 : -1;
      const summaryPlan = book.summaryXhtml ? plan(book.summaryXhtml, front2) : [];
      const out = (await run(front2)).texts;
      return {
        title: textBack(out[titleAt], book.title),
        ...book.summaryXhtml ? { summaryXhtml: render(summaryPlan, out) } : {},
        ...book.summaryText ? { summaryText: textBack(out[summaryTextAt], book.summaryText) } : {}
      };
    }
    const chapters = [];
    let decided = false;
    let front = null;
    let failed = 0;
    let firstError = null;
    async function tryFront() {
      try {
        front = await frontMatter();
      } catch (err) {
        if (isAbort(err, signal)) throw err;
      }
    }
    for (let i = 0; i < total; i += 1) {
      try {
        const { chapter, vote } = await chapterAt(i);
        chapters.push(chapter);
        if (!decided && vote) {
          if (vote === baseOf(target)) {
            progress(alreadyIn(target), TRANSLATE_TO);
            return book;
          }
          decided = true;
          await tryFront();
        }
      } catch (err) {
        if (isAbort(err, signal)) throw err;
        failed += 1;
        firstError ??= err;
        chapters.push(book.chapters[i]);
        progress(`Chapter ${i + 1} could not be translated, continuing\u2026`, band(i + 1, total));
      }
    }
    if (failed === total) throw firstError;
    if (!decided) await tryFront();
    if (failed) {
      report.failedChapters = failed;
      report.failure = `${failed} of ${total} chapters stayed untranslated \u2014 ${firstError.message} Try again later for a full translation.`;
    }
    return { ...book, ...front ?? {}, language: target, chapters };
  }

  // src/core.ts
  var RETRY_STATUS2 = /* @__PURE__ */ new Set([408, 425, 429, 500, 502, 503, 504]);
  var MAX_ATTEMPTS = 5;
  var MAX_WAIT2 = 6e4;
  var SLOW_DOWN = /* @__PURE__ */ new Set([429, 503]);
  function netError(message) {
    const err = new Error(message);
    err.network = true;
    return err;
  }
  function httpMessage(status) {
    if (status === 429) return "The site limited the request rate. Wait a couple of minutes and try again.";
    if (status === 403) return "The site refused the page (403) \u2014 check that the book opens in a normal tab.";
    if (status === 404) return "Page not found (404) \u2014 the book may have been removed or hidden.";
    if (status >= 500) return `The site is answering with error ${status} \u2014 try later.`;
    return `HTTP ${status}`;
  }
  function makeContext({ progress, signal, pacing, fetch: fetchFn, timing }) {
    const parser = new DOMParser();
    const report = progress || (() => {
    });
    const net = { ...NET_TIMING, ...timing };
    const limiter = createRateLimiter({
      interval: pacing?.interval ?? 600,
      maxInterval: pacing?.maxInterval ?? 15e3
    });
    const aborted = () => Boolean(signal && signal.aborted);
    async function pause(attempt, floor, status) {
      const delay = backoffDelay(attempt, { floor, max: MAX_WAIT2 });
      if (SLOW_DOWN.has(status)) {
        report(`The site asked us to slow down \u2014 continuing in ${Math.ceil(delay / 1e3)} s\u2026`);
      }
      await sleep(delay, signal);
    }
    async function request(url) {
      let httpAttempt = 0;
      let netAttempt = 0;
      let downSince = 0;
      for (; ; ) {
        await limiter.acquire(signal);
        if (aborted()) throw abortError();
        let res;
        try {
          res = await fetchFully(
            url,
            { credentials: "same-origin", redirect: "follow" },
            { idle: net.idle, signal, fetchFn }
          );
        } catch (err) {
          if (aborted()) throw err;
          if (!downSince) {
            downSince = Date.now();
            limiter.penalize(0);
          }
          if (Date.now() - downSince >= net.grace) {
            throw netError("The network is not responding \u2014 check your connection.");
          }
          const delay = backoffDelay(netAttempt++, { base: net.backoff, max: net.maxBackoff });
          report(`The connection dropped \u2014 retrying in ${Math.ceil(delay / 1e3)} s\u2026`);
          await sleep(delay, signal);
          continue;
        }
        downSince = 0;
        netAttempt = 0;
        if (res.ok) {
          limiter.reward();
          return res.body;
        }
        if (!RETRY_STATUS2.has(res.status)) throw netError(httpMessage(res.status));
        const floor = Math.min(MAX_WAIT2, parseRetryAfter(res.headers.get("Retry-After")));
        limiter.penalize(floor);
        httpAttempt += 1;
        if (httpAttempt >= MAX_ATTEMPTS) throw netError(httpMessage(res.status));
        await pause(httpAttempt - 1, floor, res.status);
      }
    }
    async function fetchText(url) {
      return decodeText(await request(url));
    }
    async function fetchDoc(url) {
      return parser.parseFromString(await fetchText(url), "text/html");
    }
    function parseFragment(html) {
      return parser.parseFromString(`<body>${html}</body>`, "text/html").body;
    }
    async function fetchBytes(url) {
      return request(url);
    }
    return { fetchText, fetchDoc, fetchBytes, parseFragment, progress: report, signal };
  }
  var BUILDERS = {
    epub: { build, ext: "epub" },
    mobi: { build: build3, ext: "mobi" },
    fb2: { build: build2, ext: "fb2" },
    txt: { build: build4, ext: "txt" }
  };
  async function buildBook({
    doc,
    url,
    format,
    progress,
    signal,
    translateTo,
    translator
  }) {
    const adapter = resolveAdapter(url);
    const reading = translateTo ? (text, percent) => progress(text, percent === void 0 ? void 0 : percent * 0.4) : progress;
    const ctx = makeContext({ progress: reading, signal, pacing: adapter.pacing });
    progress(`Reading the page (${siteLabel(url)})\u2026`, 2);
    let book;
    try {
      book = await adapter.parse(doc, url, ctx);
    } catch (err) {
      const e = err;
      if (adapter.id === "generic" || e.network || e.name === "AbortError") throw err;
      progress("The markup did not match, trying the generic parser\u2026", 5);
      book = await generic.parse(doc, url, ctx);
    }
    if (!book.chapters.length) throw new Error("Not a single chapter with text was found");
    const expected = book.expectedChapters || 0;
    const missing = Math.max(0, expected - book.chapters.length);
    if (missing > 1 && missing > expected * 0.1) {
      throw new Error(
        `Only ${book.chapters.length} of ${expected} chapters could be read \u2014 the book would come out incomplete. Try again.`
      );
    }
    let untranslated;
    if (translateTo) {
      const before = book;
      const report = {};
      book = await translateBook(book, translateTo, translator ?? createGoogleTranslator(), progress, signal, report);
      if (book === before) untranslated = alreadyIn(translateTo);
      else if (report.failure) untranslated = report.failure;
    }
    const builder = BUILDERS[format] || BUILDERS.epub;
    progress(`Assembling ${builder.ext.toUpperCase()} (${book.chapters.length} ch.)\u2026`, 90);
    const blob = await builder.build(book);
    const filename = safeFilename(
      book.author ? `${book.title} \u2014 ${book.author}` : book.title,
      builder.ext
    );
    return { blob, filename, book, adapter: adapter.id, missing, untranslated };
  }
  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 2e4);
  }

  // node_modules/vireglass/dist/chunk-MMPK6DCK.js
  var RIM = {
    /**
     * The key-light lobe's exponent. Two opposing arcs come out of one expression, which is why
     * they are opposed rather than placed: `pow(max(facing, 0), n) + 0.45 * pow(max(-facing, 0), n)`.
     *
     * MEASURED off two close-ups of real end caps, frames/crops/cap158-left and cap158-right. The
     * bright arc's full width at half its peak is 53 degrees in the first and 30 in the second; this
     * exponent's own width is `2·acos(0.5^(1/n))`, so they imply 6 and 20. It was 3, whose arc is 75
     * degrees wide — broader than either measurement, and the error is in the same direction in both.
     *
     * 6 is the conservative end: it reproduces the wider crop exactly, and a broader arc is the more
     * forgiving error. One exponent cannot serve both, and that is not noise — a specular lobe's
     * width depends on the light's angular size as well as the surface, and those are two different
     * scenes. The model has no term for the light's size.
     */
    lobeExponent: 6,
    /** The far arc, weaker than the one facing the light (§2). */
    opposingArc: 0.45,
    /**
     * The dark edge along the whole silhouette, as a multiplicative darkening. iOS 27 made it a
     * layer of its own, and it does not rule out the highlight sitting on top of it (§2).
     */
    darkEdge: 0.22,
    /** Width of the hairline, CSS px. "About a point, not a band and not a bevel" (§2). */
    widthPx: 1
  };
  var BODY3 = {
    /** Lightness ceiling for the body when legibility is loose. */
    capLoose: 0.62,
    /** …and when it is strict. The model is calibrated at these two, not in between (E-43). */
    capTight: 0.38,
    /** The two ends the body tints toward. Glass has no colour of its own (HIG "Color"). */
    tintDark: 0.07,
    tintLight: 0.94,
    /** How far the backdrop's spread reaches past its mean when deciding what the ink needs. */
    busyEdge: 0.75,
    /** Fine texture the body has to stop being a window for. */
    groundSpan: 0.06,
    /** Where the tint flips direction, by the element's AVERAGE lightness — a local threshold cuts
     *  a diagonal step across the body on a gradient. */
    darkSideFrom: 0.42,
    darkSideTo: 0.58,
    /** Ceiling on any single demand, so one requirement cannot make the glass opaque on its own. */
    maxDemand: 0.92,
    /**
     * And a tighter one for presence specifically. It is a FLOOR on visibility, not a licence to go
     * opaque: wherever the body's tint sits close to the backdrop, the density that would deliver the
     * separation is the ceiling, and glass at `maxDemand` has stopped being a window. Better to
     * separate as far as transparency allows and no further. UNMEASURED.
     */
    presenceDemand: 0.5
  };
  var SHADOW = {
    /**
     * Measured off reference frames 711–723: 4.0% over a flat light backdrop, 19.9% over text.
     *
     * REPRODUCED independently off frames/verify/m-707 and m-711 — the same capsule in the same scene
     * at the same scale, once below the text over plain background and once scrolled up over it.
     * Comparing the rows under the capsule against the same rows far to either side, so the
     * background's own gradient cancels: 3.5% and 19.2%, peaking about 140 px below the capsule.
     * Two passes, different frames and a different method, agreeing to within 0.7 of a point.
     */
    alphaFlat: 0.04,
    alphaBusy: 0.199
  };
  var DISPERSION = {
    /** Red bends less than the base index, blue more — and not symmetrically. */
    redShift: -0.4,
    blueShift: 0.6
  };
  var TOUCH = {
    /**
     * The element grows under pressure (M 3:51; HIG: interactive "expands").
     *
     * CHECKED, not measured: across frames/knob/switch-press, a 4x5 sheet of one switch being
     * pressed, the control's extent runs 764 px in the three settled frames and 787 to 822 under the
     * finger — 3 to 8 per cent. This value sits inside that, which is a consistency check and not a
     * derivation: the measurement cannot separate the knob stretching from the track growing, and the
     * settled frames agreeing to the pixel is the only part of it that is tight.
     */
    pressGrow: 0.06,
    /** The ridge around the contact blob: material displaced from under the finger ends up
     *  somewhere. Without it the shape balloons, and a dense medium does not do that. */
    ridge: 0.42,
    /** How far press pulls the field toward the finger. */
    pressPull: 0.16,
    /** Wavelength and decay of the ripple, as fractions of its span. Short and quick: in a dense
     *  medium ripples are frequent and small; long shallow swells are water. */
    waveLength: 0.17,
    waveDecay: 0.7,
    /** The ripple's span, as a multiple of the contact radius. It has to reach the far edge, or it
     *  reads as jitter under the finger rather than a wave across the surface. */
    waveSpan: 2,
    /**
     * Contact radius as a fraction of the element's half-size. UNMEASURED: §5 says the response has
     * to be visible UNDER the finger, which is why the blob is wide, but gives no figure.
     */
    radiusOfHalfSize: 1.1,
    /**
     * Wave impulse as a fraction of the travel limit. UNMEASURED: the core carries the ripple's
     * decay and frequency, but nothing says how hard a finger strikes it.
     */
    waveOfTravel: 0.18,
    /** The lift-off ring is weaker than the one from touching down (§5). UNMEASURED ratio. */
    releaseWave: 0.6,
    /**
     * How far a glow reaches past the element it started on, as a multiple of that element's
     * half-size. UNMEASURED: §5 says the glow spreads "onto any Liquid Glass elements nearby" and
     * names no distance. This is the reach at which a neighbour in a tab bar still lights and one
     * across the screen does not.
     */
    glowReach: 3,
    /**
     * How much of an element's "active" state a touch alone raises — the fraction the glow and the
     * ink lift ride on when nothing else is driving them. UNMEASURED.
     *
     * It was a private constant on the Android surface whose comment said it matched the web's, and
     * nothing enforced that: the web renderer takes `active` from the host as a field and has no
     * constant to match. Two renderers agreeing by a comment is exactly what this file is for.
     */
    activeOnTouch: 0.3
  };
  var BEVEL = {
    sphere: 0.94,
    floor: 0.02,
    slopeMax: 3.2
  };
  var EPSILON = 1e-5;
  var MEDIUM = {
    /** The lightness content under the glass is pulled toward, and how hard. The medium both removes
     *  light and mixes scattered light back in: over a light backdrop the body darkens, over a dark
     *  one it lightens. A layer that only ADDED light pushed the body the wrong way over light
     *  backdrops (M 2:35). */
    luma: 0.4,
    pull: 0.07,
    /** Ambient light reaching the body on top of that pull. */
    ambientSpill: 0.01,
    /** Glass concentrates light: the body is a touch lighter than what lies beneath it (M 2:29). */
    concentrate: 0.01,
    /** Scattered light on a frosted element is an ADDITION over the backdrop, not a fraction of the
     *  way to the tint — a fraction goes to zero once the backdrop reaches the tint's lightness and
     *  darkens past it (docs/benchmarks.md). */
    matteLift: 0.1,
    /** How far scattering reaches, as a fraction of the gather radius, over a busy backdrop under
     *  ink. Set against the reference: structure under the capsule fades by a factor of nine or ten
     *  there, not thirty (M 11:47). */
    scatterMax: 0.2,
    scatterBase: 0.1,
    /** The response to structure saturates early: what competes with the ink is not the AREA of
     *  foreign text but the fact of it — a line under a tile measures about 0.12 of busy. */
    structureGain: 20,
    /** Tint density in the flat middle; the bevel multiplies it by the edge density. */
    bodyDensityFlat: 0.19
  };
  var LENS = {
    /** Backdrop compression at the rim goes to infinity at the silhouette, so the radius correction
     *  is capped. */
    footprintMax: 1.8,
    /** Same reason, for the profile's slope. */
    slopeMax: 40,
    /** Every thin film on glass sits around this index. */
    filmIor: 1.35,
    /** Reference channel wavelengths in nm — red, green, blue — for diffraction and interference. */
    lambdaR: 610,
    lambdaG: 550,
    lambdaB: 460
  };
  var SHADOW_GAP = {
    /** How much weaker the shadow is right at the outline than under the middle of the gap, and what
     *  fraction of the offset it takes to reach full depth. In the reference the shadow's minimum
     *  sits BELOW the rim, not at it. */
    light: 0.76,
    reach: 0.2,
    /** Fraction of the ambient hue the shadow carries. It has to stay a shadow, not a coloured blob. */
    tint: 1
  };
  var SPECTRAL = {
    /** How far into the bevel the fringes reach, as a fraction of it measured from the silhouette.
     *  Diffraction is an EDGE effect; past this the bevel is plain glass. */
    diffractionOnset: 0.45,
    /**
     * The same window for interference, which had none. §2 puts the iridescence on the opposing ARC —
     * "the opposing arc carries an iridescent fringe" — and a fringe is a thing at an edge.
     *
     * Without it the term applies wherever the surface angle puts it, and across the inner bevel the
     * angle barely changes, so a film that should read as a fringe reads as a flat colour filter.
     * Measured on a 680x64 bar with the default preset: a multiplier of 1.68, 1.26, 0.05 held CONSTANT
     * from a third of the way through the bevel to its inner edge — red boosted by two thirds and blue
     * removed outright. UNMEASURED window; wider than diffraction's because interference reaches
     * further in than the fringes do.
     */
    iridescenceOnset: 0.25,
    /** Fringes across the bevel. Denser as the bevel sharpens, which is what the phase term does. */
    diffractionFringes: 4,
    /** The channel the hue is measured against, nm. Green is the eye's own reference. */
    referenceLambda: 550
  };
  var ACCENT = {
    /** The tone the colour takes over a dark backdrop and over a light one. "A range of tones mapped
     *  to content brightness underneath", rather than one flat colour. */
    deep: 0.88,
    light: 1.08,
    /** How much of the medium the colour occupies by default. Short of one, because the content has
     *  to keep coming through: a fill "breaks the visual character of Liquid Glass" (@17:03). */
    amount: 0.8
  };
  var ACCESSIBILITY = {
    /** Frost floor under reduced transparency: the glass gets "frostier" (§9). */
    frostMinDp: 14,
    /**
     * Body floor under reduced transparency. B @10:07 is the stricter statement of the two — a bar
     * "gets a background when reduce transparency is enabled" — so this is a background, not a
     * thicker haze. UNMEASURED: neither source gives a figure.
     */
    obscureMin: 0.82,
    /** Under increased contrast the element is "predominantly black or white" (§9): the body goes to
     *  whichever pole its ink already points at, at a density that leaves it reading as that pole. */
    contrastDensity: 0.94,
    /** …and separates from the backdrop on its own, whatever is behind it. */
    contrastPresence: 0.5,
    /**
     * The contrasting border §9 asks for, in units of lightness away from the body's own pole. The
     * rim stops taking its colour from the environment and takes it from the element instead — an
     * ambient hairline is not a contrasting border. UNMEASURED.
     */
    contrastRim: 0.85,
    /**
     * Press that survives reduced motion. §9 "decreases the intensity of some effects and disables
     * any elastic properties": the spring and the ripple are elastic and go to zero, the press is an
     * ease that carries the element's light, so it is damped rather than removed — an element that
     * stops answering a finger altogether is not reduced motion, it is no feedback. UNMEASURED.
     */
    stillPress: 0.6
  };
  var DERIVE = {
    /** Physical 4% reflectance into the render's working range. UNMEASURED. */
    fresnelGain: 17.5,
    /** Schlick's exponent. A constant of the approximation, not a knob. */
    fresnelExponent: 5,
    /** The index at which ray bending is at full strength, measured from air. UNMEASURED. */
    iorFullBend: 0.6,
    /** Magnification behind a plane-parallel plate, per dp of thickness. UNMEASURED. */
    magnifyPerDp: 6e-3,
    /** In ordinary glasses the Abbe number falls as the index rises, so dispersion grows with it.
     *  UNMEASURED slope. */
    dispersionPerIor: 1.1,
    /** Index spread between the red and blue channels. The physical value (~0.01 at an Abbe number
     *  of 55) is at the threshold of visibility. UNMEASURED. */
    iorSpreadPerDispersion: 0.045,
    /** Beer–Lambert absorption per dp of path. UNMEASURED. */
    absorbPerDp: 0.017,
    /** Ceiling on how much denser the bevel may read than the body. The rim's ray travels further
     *  through the medium; past this the rim is milk rather than glass. UNMEASURED. */
    edgeDensityMax: 4,
    /**
     * Frost ceiling, dp. Deliberately low: blur is a SUPPORTING device here, and past about a dozen
     * dp letters under the glass stop being letters. Separating content from ink is the body's job.
     *
     * UNMEASURED, and an attempt is recorded here so the next one does not repeat it.
     * frames/verify/m-711 has the same paragraph sharp beside the capsule and behind it, which looks
     * like the measurement: match the blur that takes the sharp patch's detail down to the glassed
     * one's. It gives 2 to 3 px at that frame's scale, and the figure is not trustworthy. Detail is
     * lost to three things at once there — the frost, the magnification (`refractionScale` lowers the
     * text's spatial frequency without blurring anything), and the body veiling its contrast — and
     * the method cannot separate them. What it does bound is the total: the text behind the glass
     * keeps 68% of the detail it has beside it.
     *
     * A clean measurement needs a frame where the glass does not magnify, or a feature of known size
     * behind it to normalise the magnification out.
     */
    blurMaxDp: 12,
    /** Highlight width from a smooth surface and from a fully rough one, as a specular exponent.
     *  UNMEASURED. */
    specularPowerSmooth: 160,
    specularPowerRough: 8,
    /** How much roughness damps the highlight's brightness. UNMEASURED. */
    specularRoughDamping: 0.6,
    /**
     * The medium's own hue by density. Water absorbs red and skews cool, ordinary glass is nearly
     * neutral with a faint green, dense high-index media skew warm. Glass has no colour of its own
     * (HIG "Color"), so this is never set by hand — it is tied to the index.
     */
    hueCool: [0.86, 1, 1.08],
    hueNeutral: [1, 1.02, 0.99],
    hueWarm: [1.08, 1, 0.88],
    /** The index range the hue sweeps across, and where it starts. UNMEASURED. */
    hueFromIor: 1.2,
    hueSpan: 0.55,
    /** Body lightness follows reflectance: the denser the medium, the more of its surroundings it
     *  returns. UNMEASURED base and slope. */
    bodyLiftBase: 0.34,
    bodyLiftPerF0: 2.4,
    /**
     * How far past the bevel the rim gathers its surroundings, as a multiple of the bevel. At a
     * grazing angle the eye receives the vicinity rather than what is under the glass, and without
     * this, glass on an empty black background has no source at all. UNMEASURED.
     */
    gatherPerBevel: 4,
    /** Floor and ceiling on that radius, dp. Unbounded, a wide bevel gathers from fifty dp away and
     *  a READABLE copy of the neighbourhood appears inside the glass — eight samples cannot blur a
     *  disc that large (E-33, E-37). */
    gatherMinDp: 4,
    gatherMaxDp: 28,
    /** The body's own density from absorption through its thickness. Small: the body only moves
     *  toward the tint under the legibility requirement, otherwise it dims the content. UNMEASURED. */
    bodyDensity: 0.05,
    /**
     * Rim light on the physical scale rather than the rim highlight's. `fresnelGain` saturates at one
     * for dense media, and applying it here too would raise body lightness harder than the glass had
     * just separated it from the ink — eating its own legibility work. UNMEASURED.
     */
    edgeLightGain: 6,
    /**
     * Iridescence rides the REFLECTED ray, so it is tied to Fresnel and has no knob of its own.
     *
     * MEASURED against how coloured a real rim is. In frames/crops the brightest rim pixels have a
     * channel spread — (max − min) / max — of 13% in cap158-left and 20% in cap158-right, against
     * their own backdrops' 14.6% and 14.3%. So the rim is no more coloured than the scene it stands
     * in: §2's "iridescent fringe" adds a few points at most, and in one of the two crops it adds
     * nothing measurable.
     *
     * At 1.6 this put ordinary glass at 0.945 iridescence and the spectral multiplier reached a 97%
     * channel spread — red boosted by two thirds and blue removed. Rendered over a coloured page that
     * is a neon tube around every control, which is what sent me to measure it.
     */
    iridescencePerFresnel: 0.042,
    /** Edge diffraction shares dispersion's λ-dependence, at the stylised amplitude: at the physical
     *  one the fringes are not visible at all. MEASURED with the same crops and the same target as
     *  iridescence — on its own it was reaching a 93% channel spread. */
    diffractionPerDispersion: 0.05,
    /** Multiple internal reflection — the denser the medium, the more light it circulates and the
     *  more it is tinted by its surroundings. UNMEASURED slope. */
    colorPickupPerFresnel: 0.9,
    /**
     * The ceiling, which keeps it a medium rather than a fill.
     *
     * MEASURED, frames/concentric/shadow-zoom: the same sidebar twice, over a yellow cover and over a
     * pink one, so the difference between the panels is the pickup with the sidebar's own colour
     * subtracted out. Sampling a band of rows clear of the text, the bar's hue offset against the
     * cover's own reaches 0.31 of it at the edge nearest the content in the yellow panel and 0.28 in
     * the pink one. It was 0.42, which nothing measured.
     *
     * Reality is not uniform: the bleed falls to nothing about ninety pixels in, and both panels show
     * the same falloff. The DOM path has one backdrop sample per element and cannot reproduce that,
     * so it applies the ceiling across the whole body — right at the edge, too strong in the middle.
     * That limit is in docs/dom.md rather than papered over with a lower number.
     */
    colorPickupMax: 0.3
  };
  var SIZE = {
    /** Half-size at which bevel and thickness are specified as given; they grow as its square root
     *  from there. UNMEASURED reference size. */
    referenceDp: 24,
    /** Floor and ceiling on that growth. UNMEASURED. */
    gainMin: 0.8,
    gainMax: 2.4,
    /** A bevel wider than this fraction of the half-size breaks the SDF — the roundings converge in
     *  the middle. A property of the geometry, not a taste. */
    maxBevelFraction: 0.65
  };
  var SHADOW_DENSITY = {
    /** Over a flat background. */
    flat: 0.8,
    /** How fast it rises with structure behind the element, and how far it may rise. */
    busyGain: 6,
    busyRise: 1.2,
    /** Quantisation of the emitted value: a shadow that changes on every pixel of scroll re-lays-out
     *  the native view every frame. */
    step: 0.05
  };
  var SPRING = {
    /** Stiffness and damping while the finger is down. UNMEASURED. */
    holdStiffness: 260,
    holdDamping: 46,
    /** …and after it lifts. Stiffer, and damped hard: a dense medium snaps back without ringing. */
    releaseStiffness: 420,
    releaseDamping: 34,
    /** Time constants for the press dent, in and out, seconds. UNMEASURED. */
    pressAttack: 0.07,
    pressRelease: 0.16,
    /** How fast the touch point catches up to the finger. Not instant: an instant jump tears the
     *  deformation, and on rapid taps that reads as jitter. */
    pointFollow: 0.045,
    /** …and how fast the element registers as being touched at all, which is what the glow rides. */
    activeFollow: 0.09,
    /** The ripple decays within a quarter second rather than oscillating: in a viscous medium ripples
     *  are short and weak. UNMEASURED. */
    waveDecay: 0.22,
    waveTurnsPerSecond: 3,
    /** Ceilings on the accumulated ripple, as multiples of a single impulse. Impulses add up rather
     *  than restart — restarting cuts a running wave mid-period, which is what jolts on rapid taps. */
    waveCapOnGrab: 1.6,
    waveCapOnRelease: 2
  };
  var SCALE = {
    /** Where on the scale the material stays exactly as it is by default. */
    default: 0.35,
    /** Body density at the fully tinted end: content under the glass has to be hidden. UNMEASURED. */
    tintedDensity: 0.9
  };
  var SCROLL_EDGE = {
    /** How far the content has to slide under the panel for the effect to fully engage, dp. */
    engageDp: 24,
    /**
     * How far the blur reaches BELOW the bar's lower lip, as a multiple of the bar's own height.
     *
     * MEASURED, frames/scroll-edge/z576 at 320x413. High-frequency energy (mean |laplacian| per row,
     * which a brightness gradient in the content cannot fake) reads 1.4 through the zone under the
     * bar and 14 in the sharp content below — a factor of ten. The bar's lip is at y≈45 and the zone
     * runs to y≈130, so the reach is about 1.9 times the bar's own height.
     *
     * The same frame confirms 219 @9:22 in passing: the floating title sits inside that zone at 32,
     * twenty times its surroundings. Titles stay crisp while everything behind them dissolves, which
     * is why the effect belongs behind the glass in the stack rather than over the content.
     */
    reachOfBarHeight: 1.9,
    /** The blur the content dissolves into at the edge, dp. This is the effect itself — the content
     *  goes out of focus into the background rather than being covered by anything. UNMEASURED. */
    dissolveBlurDp: 10,
    /**
     * Over dark content the glass turns dark and 219 @9:33 switches the effect "to apply a subtle
     * dimming instead". Dimming is a reduction in luminance: dark content under dark glass merges
     * with it, and pushing the content down is what lets the glass sit above it. UNMEASURED.
     */
    dimAlpha: 0.1,
    /** A pinned view under the panel (column headers) gets a flat band instead of a gradual fade
     *  (219 @9:41) — "a stronger, more opaque boundary" (356 @12:12). UNMEASURED. */
    hardBlurDp: 14,
    hardAlpha: 0.18
  };

  // node_modules/vireglass/dist/chunk-SLRPHDV7.js
  var roundedRectGeometry = (width, height, cornerRadius) => ({ width, height, cornerRadius });
  var halfMinDp = (g) => Math.max(Math.min(g.width, g.height) / 2, 1);
  var MAX_STRETCH = 0.34;
  var sizeDp = (g) => Math.sqrt(halfMinDp(g) * Math.max(Math.sqrt(g.width * g.height) / 2, 1));
  var sizeGain = (g) => {
    const raw = Math.sqrt(sizeDp(g) / SIZE.referenceDp);
    if (raw <= SIZE.gainMin) return SIZE.gainMin;
    const span = SIZE.gainMax - SIZE.gainMin;
    return SIZE.gainMin + span * (1 - Math.exp(-(raw - SIZE.gainMin) / span));
  };
  var MAX_BEVEL_FRACTION = SIZE.maxBevelFraction;
  var bevelFraction = (g, o) => Math.min(MAX_BEVEL_FRACTION, o.bevelDp * sizeGain(g) / halfMinDp(g));
  var bevelDp = (g, o) => Math.max(bevelFraction(g, o) * halfMinDp(g), 1);
  var thicknessDp = (g, o) => o.thicknessDp * sizeGain(g);
  var RIM_FRACTION = 0.85;
  var rimDp = (g, o) => thicknessDp(g, o) * RIM_FRACTION;
  var shadowReachDp = (g) => Math.min(Math.max(halfMinDp(g) * 0.65, 6), 36);
  function shadowOpacity(busy) {
    return SHADOW_DENSITY.flat + Math.min(Math.max(busy, 0) * SHADOW_DENSITY.busyGain, SHADOW_DENSITY.busyRise);
  }
  function shadowOpacityFrom(sample) {
    return Math.round(shadowOpacity(sample.busy) / SHADOW_DENSITY.step) * SHADOW_DENSITY.step;
  }

  // node_modules/vireglass/dist/chunk-H5QTBF67.js
  var clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  var clamp01 = (v) => clamp(v, 0, 1);
  var fresnelF0 = (ior) => ((ior - 1) / (ior + 1)) ** 2;
  var fresnelStrength = (ior) => clamp01(fresnelF0(ior) * DERIVE.fresnelGain);
  var FRESNEL_EXPONENT = DERIVE.fresnelExponent;
  var refractionStrength = (ior) => clamp01((ior - 1) / DERIVE.iorFullBend);
  var refractionScale = (ior, thicknessDp2) => 1 + DERIVE.magnifyPerDp * thicknessDp2 * (1 - 1 / Math.max(ior, 1));
  var dispersion = (ior) => clamp01((ior - 1) * DERIVE.dispersionPerIor);
  var iorSpread = (ior) => dispersion(ior) * DERIVE.iorSpreadPerDispersion;
  var absorption = (pathDp) => 1 - Math.exp(-DERIVE.absorbPerDp * Math.max(pathDp, 0));
  var edgeDensity = (thicknessDp2, bevelDp2) => {
    const body = absorption(thicknessDp2);
    if (body <= 0) return 1;
    return clamp(absorption(thicknessDp2 + bevelDp2) / body, 1, DERIVE.edgeDensityMax);
  };
  var blur = (roughness) => clamp01(roughness) * DERIVE.blurMaxDp;
  var specularPower = (roughness) => DERIVE.specularPowerSmooth - clamp01(roughness) * (DERIVE.specularPowerSmooth - DERIVE.specularPowerRough);
  var specularStrength = (ior, roughness) => clamp01(fresnelStrength(ior) * (1 - clamp01(roughness) * DERIVE.specularRoughDamping));
  var mixHue = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
  function mediumTint(ior) {
    const t = clamp01((ior - DERIVE.hueFromIor) / DERIVE.hueSpan);
    const hue = t < 0.5 ? mixHue(DERIVE.hueCool, DERIVE.hueNeutral, t * 2) : mixHue(DERIVE.hueNeutral, DERIVE.hueWarm, (t - 0.5) * 2);
    const lift = DERIVE.bodyLiftBase + fresnelF0(ior) * DERIVE.bodyLiftPerF0;
    return { r: clamp01(hue[0] * lift), g: clamp01(hue[1] * lift), b: clamp01(hue[2] * lift) };
  }
  var gatherRadius = (bevelDp2) => clamp(Math.max(bevelDp2, 1) * DERIVE.gatherPerBevel, DERIVE.gatherMinDp, DERIVE.gatherMaxDp);
  var bodyDensity = (thicknessDp2) => DERIVE.bodyDensity * absorption(thicknessDp2);
  var edgeLight = (ior) => clamp01(fresnelF0(ior) * DERIVE.edgeLightGain);
  var iridescence = (ior, filmNm) => filmNm <= 0 ? 0 : clamp01(fresnelStrength(ior) * DERIVE.iridescencePerFresnel);
  var diffraction = (ior) => clamp01(dispersion(ior) * DERIVE.diffractionPerDispersion);
  var colorPickup = (ior) => clamp(fresnelStrength(ior) * DERIVE.colorPickupPerFresnel, 0, DERIVE.colorPickupMax);
  var MATERIAL_RANGES = {
    ior: [1, 2],
    thickness: [0, 60],
    bevel: [0, 40],
    roughness: [0, 1],
    environment: [0, 1],
    legibility: [0, 1],
    dimming: [0, 0.5],
    ink: [0, 1],
    presence: [0, 0.6],
    film: [0, 900]
  };
  var ADAPT_RADIUS = 22;
  var clamp2 = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  var VIREGLASS_MATERIAL_V4 = {
    ior: 1.33,
    thickness: 14,
    bevel: 5,
    roughness: 0.05,
    environment: 0.27,
    legibility: 0.26,
    dimming: 0,
    ink: 1,
    presence: 0.05,
    film: 340
  };
  var VIREGLASS_MATERIAL_V5 = {
    ior: 1.5,
    thickness: 28,
    bevel: 6,
    roughness: 0.06,
    environment: 0.27,
    legibility: 0.26,
    dimming: 0,
    ink: 1,
    presence: 0.05,
    film: 340
  };
  var VIREGLASS_SHEET_MATERIAL = {
    ...VIREGLASS_MATERIAL_V5,
    roughness: 0.85
  };
  var VIREGLASS_LYRICS_MATERIAL = {
    ...VIREGLASS_MATERIAL_V5,
    legibility: 0.95
  };
  var VIREGLASS_CONTROL_MATERIAL = {
    ...VIREGLASS_MATERIAL_V5,
    ior: 1.69,
    thickness: 44,
    bevel: 8,
    roughness: 0.035,
    presence: 0.176
  };
  var VIREGLASS_MATERIAL = VIREGLASS_MATERIAL_V5;
  function materialForInk(material, carriesInk) {
    if (material.dimming > 0) return material;
    return { ...material, legibility: carriesInk ? VIREGLASS_LYRICS_MATERIAL.legibility : 0 };
  }
  var VIREGLASS_CLEAR_MATERIAL = {
    ...VIREGLASS_MATERIAL,
    legibility: 0,
    presence: 0,
    // Apple's own numbers: 0.35 in the HIG Materials text, 0.3 in its own sample code. We take the
    // lower one — it comes from working code, not from prose, and Clear has to stay a window.
    dimming: 0.3
  };
  function activeMaterial(material, on) {
    const k = Math.min(Math.max(on, 0), 1);
    return {
      ...material,
      ior: material.ior + 0.35 * k,
      thickness: material.thickness * (1 + 0.9 * k),
      bevel: material.bevel * (1 + 1.8 * k),
      roughness: material.roughness * (1 - 0.75 * k),
      presence: material.presence + 0.12 * k
    };
  }
  function resolveMaterial(patch = {}) {
    const m = { ...VIREGLASS_MATERIAL, ...patch };
    const out = { ...m };
    for (const key of Object.keys(MATERIAL_RANGES)) {
      const [lo, hi] = MATERIAL_RANGES[key];
      out[key] = clamp2(out[key], lo, hi);
    }
    return out;
  }
  function resolveOptics(patch = {}) {
    const m = resolveMaterial(patch);
    return {
      blur: blur(m.roughness),
      refraction: refractionStrength(m.ior),
      refractionScale: refractionScale(m.ior, m.thickness),
      bevelDp: m.bevel,
      gatherRadiusDp: gatherRadius(m.bevel),
      fresnel: fresnelStrength(m.ior),
      fresnelPower: FRESNEL_EXPONENT,
      specular: specularStrength(m.ior, m.roughness),
      specularPower: specularPower(m.roughness),
      dispersion: dispersion(m.ior),
      tint: mediumTint(m.ior),
      tintStrength: absorption(m.thickness),
      edgeDensity: edgeDensity(m.thickness, m.bevel),
      environment: m.environment,
      legibility: m.legibility,
      dimming: m.dimming,
      ink: m.ink,
      presence: m.presence,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: bodyDensity(m.thickness),
      edgeLight: edgeLight(m.ior),
      film: m.film,
      iridescence: iridescence(m.ior, m.film),
      diffraction: diffraction(m.ior),
      colorPickup: colorPickup(m.ior),
      ior: m.ior,
      thicknessDp: m.thickness,
      iorSpread: iorSpread(m.ior)
    };
  }
  var LEGACY_OPTICS = {
    "v3-manual": {
      blur: 4.32,
      refraction: 0.49,
      refractionScale: 1.05,
      bevelDp: 12.6,
      gatherRadiusDp: 40,
      fresnel: 0.77,
      fresnelPower: 2.86,
      specular: 0.3,
      specularPower: 74.58,
      dispersion: 0.54,
      tint: { r: 0.4, g: 0.4, b: 0.44 },
      tintStrength: 0.35,
      edgeDensity: 1.5,
      environment: 0.27,
      legibility: 0.55,
      dimming: 0,
      ink: 1,
      presence: 0,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: 0.14,
      edgeLight: 0.35,
      film: 0,
      iridescence: 0,
      diffraction: 0,
      colorPickup: 0,
      ior: 1.5,
      thicknessDp: 16,
      iorSpread: 0
    },
    "v2": {
      blur: 5,
      refraction: 0.95,
      refractionScale: 1.34,
      bevelDp: 14,
      gatherRadiusDp: 40,
      fresnel: 0.72,
      fresnelPower: 2.4,
      specular: 0.38,
      specularPower: 46,
      dispersion: 0.3,
      tint: { r: 0.4, g: 0.4, b: 0.44 },
      tintStrength: 0.1,
      edgeDensity: 3.63,
      environment: 0,
      legibility: 0,
      dimming: 0,
      ink: 1,
      presence: 0,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: 0.14,
      edgeLight: 0.35,
      film: 0,
      iridescence: 0,
      diffraction: 0,
      colorPickup: 0,
      ior: 1.5,
      thicknessDp: 16,
      iorSpread: 0
    },
    "v1": {
      blur: 12,
      refraction: 0.55,
      refractionScale: 1.14,
      bevelDp: 10,
      gatherRadiusDp: 40,
      fresnel: 0.5,
      fresnelPower: 3.2,
      specular: 0.42,
      specularPower: 58,
      dispersion: 0.22,
      tint: { r: 0.4, g: 0.4, b: 0.44 },
      tintStrength: 0.16,
      edgeDensity: 3.63,
      environment: 0,
      legibility: 0,
      dimming: 0,
      ink: 1,
      presence: 0,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: 0.14,
      edgeLight: 0.35,
      film: 0,
      iridescence: 0,
      diffraction: 0,
      colorPickup: 0,
      ior: 1.5,
      thicknessDp: 16,
      iorSpread: 0
    }
  };
  var LEGACY_NAMES = Object.keys(LEGACY_OPTICS);
  var MATERIAL_PRESETS = {
    water: VIREGLASS_MATERIAL_V4,
    glass: { ...VIREGLASS_MATERIAL_V4, ior: 1.45, thickness: 25, bevel: 12.6, roughness: 0.17 },
    crystal: { ...VIREGLASS_MATERIAL_V4, ior: 1.7, thickness: 30, bevel: 16, roughness: 0.02 },
    frosted: { ...VIREGLASS_MATERIAL_V4, roughness: 0.55 },
    thick: { ...VIREGLASS_MATERIAL_V4, thickness: 48, bevel: 22 },
    thin: { ...VIREGLASS_MATERIAL_V4, thickness: 4, bevel: 3 },
    iridescent: { ...VIREGLASS_MATERIAL_V4, ior: 1.5, thickness: 8, bevel: 6, film: 620 }
  };
  var PRESET_NAMES = Object.keys(MATERIAL_PRESETS);
  var EFFECTS = [
    "backdrop",
    "blur",
    "refraction",
    "fresnel",
    "bevel",
    "specular",
    "dispersion",
    "tint",
    "environment",
    "legibility",
    "interference",
    "diffraction"
  ];
  var ALL_EFFECTS_ON = EFFECTS.reduce(
    (acc, e) => ({ ...acc, [e]: true }),
    {}
  );
  var VG_TAU = 6.28318530718;
  var VG_SDF = `
float vgRoundRect(float2 p, float2 halfSize, float corner) {
  float2 q = abs(p) - halfSize + corner;
  return min(max(q.x, q.y), 0.0) + length(max(q, float2(0.0))) - corner;
}

float vgSmin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// A scene is a single shape, and when k > 0 a smooth union with one or two neighbors. A third
// shape exists to break the control into pieces (docs/reference.md \xA75): there are two bridges
// there. It's turned off with a zero size, not its own k: the fused body shares one bridge.
float vgScene(float2 p, float2 halfSize, float corner,
              float2 offsetB, float2 halfB, float cornerB, float k,
              float2 offsetC, float2 halfC, float cornerC) {
  float a = vgRoundRect(p, halfSize, corner);
  if (k <= 0.0) { return a; }
  float ab = vgSmin(a, vgRoundRect(p - offsetB, halfB, cornerB), k);
  if (halfC.x <= 0.0) { return ab; }
  return vgSmin(ab, vgRoundRect(p - offsetC, halfC, cornerC), k);
}

// Response to a finger. It's the FIELD around the touch point that deforms, not the shape's
// bounding box: scaling width to pull the right edge would also pull the left one \u2014 liquid
// doesn't behave that way. Here the displacement falls off with distance from the finger, so the
// far edge stays put.
//
// The order of the terms matters: drag shifts the field, press pulls it toward the finger, the
// wave rides on top of the already-shifted field \u2014 otherwise the ripple decouples from the
// deformation and lives a life of its own.
float2 vgTouchWarp(float2 p, float2 touch, float2 pull, float press, float radius,
                   float waveAmp, float wavePhase) {
  if (radius <= 0.0) { return p; }
  // Under the finger the whole element grows (M 3:51; HIG: interactive "expands").
  p /= 1.0 + ${TOUCH.pressGrow} * press;
  float2 d = p - touch;
  float r = length(d);

  // The finger is a BLOB, not a point, but not a hard stamp either: a wide peak, soft edges. A
  // flat plateau with a sharp cutoff at the edge shifts the region as a block, and a straight
  // line under the glass breaks into a step \u2014 the deformation reads as rectangular even though
  // the finger is round. A double smoothstep gives the same contact width without that step.
  //
  // The influence cuts off at the radius rather than fading into an infinite tail like a
  // Gaussian: with a tail the deformation spreads into a "rubber mattress" bulge.
  float k = clamp((radius - r) / radius, 0.0, 1.0);
  float s = k * k * (3.0 - 2.0 * k);
  float core = s * s * (3.0 - 2.0 * s);
  // A ring around the blob: material displaced from under the finger has to end up somewhere.
  // Without this ridge the shape just balloons, and a dense medium doesn't behave that way.
  float rim = k * k * (1.0 - k) * 4.0;

  float2 q = p - pull * (core - ${TOUCH.ridge} * rim);
  q -= d * (press * ${TOUCH.pressPull} * core);

  // The wave has its own scale, twice the drag radius: the ripple has to reach the far edge,
  // otherwise it reads as jitter under the finger rather than a wave across the surface. The
  // wavelength is short: in a dense medium ripples are frequent and small, long shallow swells
  // are water.
  if (waveAmp > 0.0 && r > 0.0001) {
    float span = radius * ${TOUCH.waveSpan}.0;
    float ring = sin(r / (span * ${TOUCH.waveLength}) - wavePhase * ${VG_TAU}) * exp(-r / (span * ${TOUCH.waveDecay}));
    q -= (d / r) * ring * waveAmp;
  }
  return q;
}

// Analytical normal of a single shape: radial on the rounded part, axis-aligned on the straight
// segments.
float2 vgRoundRectNormal(float2 p, float2 halfSize, float corner) {
  float2 q = abs(p) - halfSize + corner;
  float2 g = (q.x > 0.0 && q.y > 0.0)
    ? normalize(max(q, float2(0.0001)))
    : (q.x > q.y ? float2(1.0, 0.0) : float2(0.0, 1.0));
  return g * sign(p);
}

// Normal of the union \u2014 ANALYTICAL, no more finite differences here.
//
// Derivation: smin has two terms, mix(b,a,h) and \u2212k\xB7h\xB7(1\u2212h). Their derivatives with respect to h
// contain a factor of (1\u22122h) with opposite signs and cancel exactly, because h is linear in
// (b\u2212a)/k. What's left is mix(\u2207b, \u2207a, h) \u2014 that is, the two shapes' normals, blended with the
// same weight that blends the distances themselves.
//
// The previous version took four ADDITIONAL scene evaluations per pixel (each one \u2014 two shapes
// plus smin) and was still an approximation. Here there are two shapes, exactly.
float2 vgSceneNormal(float2 p, float2 halfSize, float corner,
                     float2 offsetB, float2 halfB, float cornerB, float k,
                     float2 offsetC, float2 halfC, float cornerC) {
  float2 na = vgRoundRectNormal(p, halfSize, corner);
  if (k <= 0.0) { return na; }
  float2 q = p - offsetB;
  float a = vgRoundRect(p, halfSize, corner);
  float b = vgRoundRect(q, halfB, cornerB);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  float2 nab = normalize(mix(vgRoundRectNormal(q, halfB, cornerB), na, h) + float2(${EPSILON}, ${EPSILON}));
  if (halfC.x <= 0.0) { return nab; }
  // Same derivation as for the pair: normals blend with the same weight as the distances.
  float2 qc = p - offsetC;
  float ab = vgSmin(a, b, k);
  float c = vgRoundRect(qc, halfC, cornerC);
  float hc = clamp(0.5 + 0.5 * (c - ab) / k, 0.0, 1.0);
  return normalize(mix(vgRoundRectNormal(qc, halfC, cornerC), nab, hc) + float2(${EPSILON}, ${EPSILON}));
}

// Position within the bevel: 0 is the flat middle, 1 is the very edge. This one value feeds the
// mask, thickness, refraction, aberrations and the width of the light rim.
float vgBevelT(float sd, float bevel) {
  return clamp((sd + bevel) / bevel, 0.0, 1.0);
}

// Slope of the bevel profile \u2014 spherical: t / sqrt(1 - t\xB2), like a spherical cap. The previous t\xB2
// kept the slope near zero through almost the whole bevel and then shot up right at the edge, so
// all the optics bunched into a narrow ring and the element read as a PUCK \u2014 a flat top and a
// wall around the rim. Here curvature is spread across the bevel, and the rim stops being a line.
//
// This still doesn't control the field of view: only the bevel bends, the middle stays flat,
// otherwise the surface reads as a soap bubble.
float vgBevelSlope(float t) {
  return min(t * inversesqrt(max(1.0 - t * t * ${BEVEL.sphere}, ${BEVEL.floor})), ${BEVEL.slopeMax});
}

// PROGRESS FRACTION. Progress is an active state turned into a FIELD: to the left of the boundary
// the element is active, to the right it stays regular glass, and the boundary moves. A negative
// value turns the field off entirely \u2014 zero is taken by the start of the track and can't also
// mean off.
//
// The boundary is SOFT. A hard seam reads as two different materials glued together rather than
// two states of one; the transition width is a fraction of the half-width, so it doesn't read as
// a thread on a large element and doesn't swallow a small one whole.
float vgProgress(float2 p, float2 halfSize, float progress) {
  if (progress < 0.0) { return 0.0; }
  float edge = mix(-halfSize.x, halfSize.x, clamp(progress, 0.0, 1.0));
  float soft = max(halfSize.x * 0.05, 1.0);
  return 1.0 - smoothstep(edge - soft, edge + soft, p.x);
}
`;
  function sdfRoundedRect(x, y, w, h, r) {
    const qx = Math.abs(x) - w / 2 + r;
    const qy = Math.abs(y) - h / 2 + r;
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
  }
  function sdfRoundedRectGradient(x, y, w, h, r) {
    const qx = Math.abs(x) - w / 2 + r;
    const qy = Math.abs(y) - h / 2 + r;
    let gx;
    let gy;
    if (qx > 0 && qy > 0) {
      const cx = Math.max(qx, 1e-4);
      const cy = Math.max(qy, 1e-4);
      const len = Math.hypot(cx, cy);
      gx = cx / len;
      gy = cy / len;
    } else if (qx > qy) {
      gx = 1;
      gy = 0;
    } else {
      gx = 0;
      gy = 1;
    }
    return [gx * Math.sign(x), gy * Math.sign(y)];
  }
  function smin(a, b, k) {
    const h = Math.min(Math.max(0.5 + 0.5 * (b - a) / k, 0), 1);
    return b + (a - b) * h - k * h * (1 - h);
  }
  function sceneDistance(x, y, w, h, r, smoothing = 0, ...shapes2) {
    let d = sdfRoundedRect(x, y, w, h, r);
    if (smoothing <= 0) return d;
    for (const s of shapes2) {
      if (!s || s.width <= 0) continue;
      d = smin(d, sdfRoundedRect(x - s.offsetX, y - s.offsetY, s.width, s.height, s.cornerRadius), smoothing);
    }
    return d;
  }
  function sceneGradient(x, y, w, h, r, smoothing = 0, ...shapes2) {
    let d = sdfRoundedRect(x, y, w, h, r);
    let [gx, gy] = sdfRoundedRectGradient(x, y, w, h, r);
    let blended = false;
    if (smoothing > 0) {
      for (const s of shapes2) {
        if (!s || s.width <= 0) continue;
        const sx = x - s.offsetX;
        const sy = y - s.offsetY;
        const ds = sdfRoundedRect(sx, sy, s.width, s.height, s.cornerRadius);
        const weight = Math.min(Math.max(0.5 + 0.5 * (ds - d) / smoothing, 0), 1);
        const [nx, ny] = sdfRoundedRectGradient(sx, sy, s.width, s.height, s.cornerRadius);
        gx = nx + (gx - nx) * weight;
        gy = ny + (gy - ny) * weight;
        d = smin(d, ds, smoothing);
        blended = true;
      }
    }
    if (!blended) return [gx, gy];
    gx += EPSILON;
    gy += EPSILON;
    const len = Math.hypot(gx, gy) || 1;
    return [gx / len, gy / len];
  }
  function touchWarp(x, y, t) {
    if (t.radius <= 0) return [x, y];
    const grow = 1 + TOUCH.pressGrow * t.press;
    let px = x / grow;
    let py = y / grow;
    const dx = px - t.x;
    const dy = py - t.y;
    const r = Math.hypot(dx, dy);
    const k = Math.min(Math.max((t.radius - r) / t.radius, 0), 1);
    const s = k * k * (3 - 2 * k);
    const core = s * s * (3 - 2 * s);
    const rim = k * k * (1 - k) * 4;
    px -= t.pullX * (core - TOUCH.ridge * rim);
    py -= t.pullY * (core - TOUCH.ridge * rim);
    px -= dx * (t.press * TOUCH.pressPull * core);
    py -= dy * (t.press * TOUCH.pressPull * core);
    if (t.waveAmp > 0 && r > 1e-4) {
      const span = t.radius * TOUCH.waveSpan;
      const ring = Math.sin(r / (span * TOUCH.waveLength) - t.wavePhase * VG_TAU) * Math.exp(-r / (span * TOUCH.waveDecay));
      px -= dx / r * ring * t.waveAmp;
      py -= dy / r * ring * t.waveAmp;
    }
    return [px, py];
  }
  var LENS_SHADER = `
uniform shader content;

// Known only to the view itself: its own size and its own place on screen.
uniform float2 u_center;
uniform float  u_reach;
uniform float2 u_contentMin;
uniform float2 u_contentMax;
// Backdrop estimate UNDER the glass from the native probe: lightness, variegation and average
// color, already smoothed over time. Negative lightness means the probe hasn't reported yet \u2014
// fall back to our own samples.
uniform float  u_probeLuma;
uniform float  u_probeBusy;
// The endpoints of the lightness range under the glass: right at a black/white border the
// average reads as a gray that says "everything's fine," while the ink drowns over the light
// half.
uniform float2 u_probeRange;
// Slope of lightness across the surface, fraction per half-size: tinting is a gradient \u2014 one
// density per element wouldn't separate the ink from both halves of the backdrop.
uniform float2 u_probeSlope;
uniform float3 u_probe;

// Material \u2014 over the shared channel from JS, already in device pixels.
uniform float2 u_halfSize;
uniform float  u_corner;
uniform float  u_bevel;
uniform float  u_thick;
uniform float  u_rim;
uniform float  u_ior;
uniform float  u_iorSpread;
uniform float2 u_light;
uniform float  u_appear;
uniform float4 u_accent;
uniform float  u_frost;
uniform float  u_ink;
uniform float  u_legibility;
uniform float  u_dim;
uniform float  u_presence;
uniform float  u_progress;
uniform float  u_adaptRadius;
uniform float  u_bodyDensity;
uniform float  u_edgeLight;
uniform float  u_fresnel;
uniform float  u_specular;
uniform float  u_reflectReach;
uniform float  u_film;
uniform float  u_iridescence;
uniform float  u_diffraction;
uniform float  u_colorPickup;
uniform float2 u_morphOffset;
uniform float2 u_morphHalf;
uniform float  u_morphCorner;
uniform float  u_morphK;
uniform float2 u_morph2Offset;
uniform float2 u_morph2Half;
uniform float  u_morph2Corner;
uniform float  u_debug;
uniform float2 u_touch;
uniform float2 u_pull;
uniform float  u_touchPress;
uniform float  u_touchRadius;
uniform float2 u_wave;

${VG_SDF}

// Sample count for the disc gather: fewer than this reads as a staircase of copies at a sharp edge.
const int   VG_FROST_TAPS = 20;
// The sample count grows with the disc's area: estimator noise is the spread under the glass
// divided by the square root of the sample count. The ceiling is cost: texture sampling is the
// most expensive thing here.
const int   VG_FROST_TAPS_MAX = 64;
// The radius correction for backdrop compression at the rim is capped: at the silhouette it goes
// to infinity.
const float VG_FOOTPRINT_MAX = ${LENS.footprintMax};
const float VG_TAU = 6.28318530718;
// Ceiling on body lightness under light ink (and the mirrored floor under dark ink). This is a
// ceiling, not a difference: "0.14 darker than white" is a lightness of 0.86, at which white text
// is invisible.
const float VG_BODY_CAP_LOOSE = ${BODY3.capLoose};
const float VG_BODY_CAP_TIGHT = ${BODY3.capTight};
// Tint lightness in both directions: real glass is never coal-black or paper-white.
const float VG_TINT_DARK = ${BODY3.tintDark};
const float VG_TINT_LIGHT = ${BODY3.tintLight};
// Reference channel wavelengths, nm \u2014 for diffraction and interference.
const float3 VG_LAMBDA = float3(${LENS.lambdaR}.0, ${LENS.lambdaG}.0, ${LENS.lambdaB}.0);
// Film index of refraction: every thin film on glass sits around this value.
const float VG_FILM_IOR = ${LENS.filmIor};
// Ceiling on the profile's slope right at the silhouette: it goes to infinity there.
const float VG_SLOPE_MAX = ${LENS.slopeMax}.0;
// Fraction of the gather radius that scattering reaches over a busy backdrop under ink (M 11:47).
// Set against the reference: there, structure under the capsule fades by a factor of 9-10, not
// thirty.
const float VG_SCATTER_MAX = ${MEDIUM.scatterMax};
const float VG_SCATTER_BASE = ${MEDIUM.scatterBase};
// The response to structure under the glass saturates early: what competes with the ink isn't
// the area of foreign text but the mere fact that it's there (a line under a tile gives a busy
// of about 0.12).
const float VG_STRUCTURE_GAIN = ${MEDIUM.structureGain}.0;
// How much denser the body with ink gets over a BUSY backdrop than over a calm one. There's no
// flat floor here: legibility picks up its own targeted requirement further down, and base
// frosting comes from VG_MATTE_LIFT.
const float VG_GROUND_SPAN = ${BODY3.groundSpan};
// Scattered light on a frosted element is an ADDITION on top of the backdrop, not a fraction of
// the way to the tint: the fraction goes to zero once the canvas reaches the tint's lightness,
// and darkens past it (docs/benchmarks.md).
const float VG_MATTE_LIFT = ${MEDIUM.matteLift};
// The fraction of backdrop spread that survives through to the body past scattering: the
// legibility requirement is computed from this edge, not from the spot's average lightness.
const float VG_BUSY_EDGE = ${BODY3.busyEdge};
// Light concentration: the body is a touch lighter than what's beneath it (M 2:29).
const float VG_CONCENTRATE = ${MEDIUM.concentrate};
// The lightness the medium pulls content under the glass toward, and the strength of that pull.
// The medium both removes light and mixes in scattered light: over a light backdrop the body
// darkens, over a dark one it lightens.
const float VG_MEDIUM_LUMA = ${MEDIUM.luma};
const float VG_MEDIUM_PULL = ${MEDIUM.pull};
// How much ambient light reaches the body on top of the pull.
const float VG_AMBIENT_SPILL = ${MEDIUM.ambientSpill};

float vgLuma(float3 c) { return dot(c, float3(0.2126, 0.7152, 0.0722)); }

// Un-premultiply into ordinary color. One division, done in float: near zero, half's step is too
// coarse, and several divisions in a row raise noise.
float3 vgUnpack(half4 c) {
  float a = float(c.a);
  return a > 0.004 ? float3(c.rgb) / a : float3(0.0);
}

// The capture ends at the screen edge: samples are clamped to the rectangle where content
// actually exists, otherwise full-width glass picked up a band of emptiness along its edges.
float2 vgInContent(float2 q) { return clamp(q, u_contentMin, u_contentMax); }

// Hue without lightness. Below the threshold the color has no hue, and the division blows up.
float3 vgHue(float3 c) {
  float l = vgLuma(c);
  if (l < 0.02) { return float3(1.0); }
  return clamp(c / l, float3(0.0), float3(2.0));
}

// Edge profile \u2014 a convex squircle: x = 0 at the silhouette, 1 where the rounding turns flat.
float vgRimQ(float x) {
  float k = 1.0 - x;
  return sqrt(sqrt(max(1.0 - k * k * k * k, 0.0)));
}

float vgRimQd(float x) {
  float k = 1.0 - x;
  return k * k * k / pow(max(1.0 - k * k * k * k, 1e-5), 0.75);
}

// Glass height above the content at distance e from the silhouette.
float vgHeight(float e, float w) {
  return mix(u_rim, u_thick, vgRimQ(clamp(e / w, 0.0, 1.0)));
}

// Slope of the top face at the same point: the derivative of height with respect to distance
// from the silhouette.
float vgSlope(float e, float w) {
  if (e >= w) { return 0.0; }
  return min((u_thick - u_rim) / w * vgRimQd(clamp(e / w, 0.0, 1.0)), VG_SLOPE_MAX);
}

// Where a ray falling from above lands on a face with normal N: Snell's law refraction, then a
// path of length z through the medium to the content. The convex face bends the ray toward the
// normal \u2014 that is, inward relative to the shape.
float2 vgShift(float3 N, float z, float ior) {
  float3 T = refract(float3(0.0, 0.0, -1.0), N, 1.0 / ior);
  return z * T.xy / max(-T.z, 0.05);
}

// Thin-film interference: optical path difference 2\xB7n\xB7d\xB7cos\u03B8t, each channel with its own \u03BB.
// Returns a hue normalized to its own average \u2014 it colors, but doesn't lighten.
float3 vgInterference(float cosI) {
  float sinT2 = (1.0 - cosI * cosI) / (VG_FILM_IOR * VG_FILM_IOR);
  float cosT = sqrt(max(1.0 - sinT2, 0.0));
  float opd = 2.0 * VG_FILM_IOR * u_film * cosT;
  float3 i = 0.5 + 0.5 * cos(VG_TAU * opd / VG_LAMBDA + 3.14159265);
  return i / max((i.r + i.g + i.b) / 3.0, 0.001);
}

// Edge diffraction: fringes get denser the sharper the bevel. Also a hue, not a brightness.
float3 vgDiffraction(float distFromEdge, float bevel) {
  float phase = VG_TAU * ${SPECTRAL.diffractionFringes}.0 * distFromEdge / max(bevel, 1.0);
  float3 d = 0.5 + 0.5 * cos(phase * (${SPECTRAL.referenceLambda}.0 / VG_LAMBDA));
  return d / max((d.r + d.g + d.b) / 3.0, 0.001);
}

float vgHash(float2 p) {
  return fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453);
}

// Soft compression instead of a hard clamp: over a white backdrop, additions used to knock a
// channel to one, and the glass turned into a flat blob with no detail.
float3 vgSoftClip(float3 c) {
  float3 over = max(c - 0.86, float3(0.0));
  return min(c, float3(0.86)) + over * 0.14 / (0.14 + over);
}

// Our own blur: the capture is left clean, the shader does the blurring \u2014 averaging in float
// smooths banding on its own and adds no noise of its own. A golden-angle spiral, rotated to its
// own angle at every pixel: with a shared angle, neighboring pixels took the same samples, and
// texture under the glass read in clumps. Accumulated premultiplied \u2014 one shared un-premultiply
// at the end.
float4 vgGather(float2 q, float radius, float2 seed) {
  float4 acc = float4(content.eval(vgInContent(q)));
  if (radius <= 0.25) { return acc; }
  if (radius < 4.0) {
    float r = radius * 0.7;
    acc += float4(content.eval(vgInContent(q + float2(r, 0.0))))
      + float4(content.eval(vgInContent(q - float2(r, 0.0))))
      + float4(content.eval(vgInContent(q + float2(0.0, r))))
      + float4(content.eval(vgInContent(q - float2(0.0, r))));
    return acc * 0.2;
  }
  float ca = cos(2.39996323);
  float sa = sin(2.39996323);
  float a0 = vgHash(seed) * 6.28318530718;
  float2 dir = float2(cos(a0), sin(a0));
  float wide = radius * 0.5;
  int taps = int(clamp(float(VG_FROST_TAPS) * wide * wide, float(VG_FROST_TAPS), float(VG_FROST_TAPS_MAX)));
  for (int i = 1; i <= VG_FROST_TAPS_MAX; i++) {
    if (i > taps) { break; }
    dir = float2(dir.x * ca - dir.y * sa, dir.x * sa + dir.y * ca);
    float r = radius * sqrt(float(i) / float(taps));
    acc += float4(content.eval(vgInContent(q + dir * r)));
  }
  return acc / float(taps + 1);
}

half4 main(float2 xy) {
  float2 p = vgTouchWarp(xy - u_center, u_touch, u_pull, u_touchPress, u_touchRadius, u_wave.x, u_wave.y);
  float sd = vgScene(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK,
                u_morph2Offset, u_morph2Half, u_morph2Corner);
  // There's nothing outside the glass \u2014 except the light it spills onto the backdrop under the
  // finger (M 3:38): the same concentrated ambient as inside, so no white halo appears over a
  // dark backdrop.
  if (sd > 1.0) {
    float spill = u_touchPress * exp(-sd / max(min(u_halfSize.x, u_halfSize.y) * 0.5, 4.0)) * 0.5 * u_appear;
    if (spill < 0.004) { return half4(0.0); }
    float3 lit = clamp((u_probeLuma >= 0.0 ? u_probe : float3(0.35)) * 1.6 + float3(0.1), float3(0.0), float3(1.0));
    return half4(half3(lit * spill), half(spill));
  }

  float bevel = max(u_bevel, 1.0);
  float e = max(-sd, 0.0);
  // 0 in the flat middle, 1 at the silhouette.
  float t = 1.0 - clamp(e / bevel, 0.0, 1.0);
  float2 n = vgSceneNormal(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK,
                u_morph2Offset, u_morph2Half, u_morph2Corner);

  // "backdrop" mode hands back the content as-is \u2014 a reference point for comparing the optics.
  float on = u_debug > 5.5 && u_debug < 6.5 ? 0.0 : 1.0;
  float lens = on * u_appear;

  float z = vgHeight(e, bevel);
  float slope = vgSlope(e, bevel);
  float3 N = normalize(float3(n * slope, 1.0));
  float2 shift = vgShift(N, z, u_ior) * lens;
  float2 s = u_center + p + shift;

  // The area the lens gathers into one pixel: a one-pixel step inward on screen, measured
  // against the sampling step. At the silhouette it's large \u2014 a stripe of backdrop is compressed
  // into a line there, and a point sample gives grain.
  float e1 = e + 1.0;
  float3 N1 = normalize(float3(n * vgSlope(e1, bevel), 1.0));
  float2 shift1 = vgShift(N1, vgHeight(e1, bevel), u_ior) * lens;
  float footprint = length(shift1 - shift - n);
  float spread = max(footprint - 1.0, 0.0) * 0.5 * on;

  // Dispersion: the same ray with each channel's own index. Blue bends more than red.
  float2 dR = vgShift(N, z, u_ior + ${DISPERSION.redShift} * u_iorSpread) * lens - shift;
  float2 dB = vgShift(N, z, u_ior + ${DISPERSION.blueShift} * u_iorSpread) * lens - shift;
  float chroma = length(dB - dR);

  float3 rgb;
  float srcA;

  if (chroma + spread < 0.25) {
    // In the flat body all the samples would land at the same point, and the body is almost the
    // whole area of the glass.
    half4 c = content.eval(vgInContent(s));
    srcA = float(c.a);
    rgb = srcA > 0.004 ? float3(c.rgb) / srcA : float3(0.0);
  } else {
    // Accumulate premultiplied and divide once per pair: channels from different points with
    // different alpha would otherwise produce a colored fringe at content edges that isn't
    // really there.
    float2 ev = n * spread;
    half4 c0 = content.eval(vgInContent(s + dR - ev));
    half4 c1 = content.eval(vgInContent(s + dR + ev));
    half4 c2 = content.eval(vgInContent(s - ev));
    half4 c3 = content.eval(vgInContent(s + ev));
    half4 c4 = content.eval(vgInContent(s + dB - ev));
    half4 c5 = content.eval(vgInContent(s + dB + ev));

    float aR = float(c0.a + c1.a) * 0.5;
    float aG = float(c2.a + c3.a) * 0.5;
    float aB = float(c4.a + c5.a) * 0.5;
    rgb = float3(
      aR > 0.004 ? float(c0.r + c1.r) * 0.5 / aR : 0.0,
      aG > 0.004 ? float(c2.g + c3.g) * 0.5 / aG : 0.0,
      aB > 0.004 ? float(c4.b + c5.b) * 0.5 / aB : 0.0);
    srcA = (aR + aG + aB) / 3.0;
  }

  // "backdrop" mode checks the CAPTURE, not a simplified version of the optics. What follows are
  // layers that aren't tied to the lens (body, medium, scattering), and they used to conflate
  // "did the pixels arrive" with "how did we process them." Here the element must DISAPPEAR: a
  // visible silhouette means a capture loss.
  if (u_debug > 5.5 && u_debug < 6.5) {
    float bypass = srcA * (1.0 - smoothstep(-1.0, 1.0, sd));
    return half4(half3(clamp(rgb, float3(0.0), float3(1.0)) * bypass), half(bypass));
  }

  // The transparent variant's dimming layer holds legibility instead of the body. A
  // multiplication, not a tint: the content has to stay visible, just quieter.
  rgb *= 1.0 - u_dim * u_appear;

  // REFLECTION. Fresnel from the face's actual slope: at the silhouette the view is grazing and
  // reflection is nearly total, which is why the rim reads as a thin line on its own. What's
  // reflected is the element's surroundings and the key light.
  float cosT = clamp(N.z, 0.0, 1.0);
  float f0 = (u_ior - 1.0) / (u_ior + 1.0);
  f0 *= f0;
  float fres = (f0 + (1.0 - f0) * pow(1.0 - cosT, 5.0)) * u_fresnel * lens;

  float lineW = clamp(min(u_halfSize.x, u_halfSize.y) * 0.03, 1.5, 5.0);
  float3 refl;
  if (e < lineW * 2.0 || fres > 0.01) {
    float2 around = u_center + p + n * (u_reflectReach * mix(0.35, 1.0, clamp(slope / 3.2, 0.0, 1.0)));
    // Two rings of eight samples total: a single offset sample is an undistorted COPY of
    // neighboring content inside the glass (docs/material-lab.md E-33).
    float p1 = u_reflectReach * 0.75;
    float p2 = u_reflectReach * 0.4;
    float d = 0.7071;
    float4 rsum = float4(content.eval(vgInContent(around + float2(p1, 0.0))))
      + float4(content.eval(vgInContent(around - float2(p1, 0.0))))
      + float4(content.eval(vgInContent(around + float2(0.0, p1))))
      + float4(content.eval(vgInContent(around - float2(0.0, p1))))
      + float4(content.eval(vgInContent(around + float2(p2, p2) * d)))
      + float4(content.eval(vgInContent(around + float2(-p2, p2) * d)))
      + float4(content.eval(vgInContent(around + float2(p2, -p2) * d)))
      + float4(content.eval(vgInContent(around + float2(-p2, -p2) * d)));
    float ra = rsum.a * 0.125;
    refl = ra > 0.004 ? rsum.rgb * 0.125 / ra : float3(0.0);
  } else {
    refl = u_probeLuma >= 0.0 ? u_probe : rgb;
  }

  // Light reaching the body is the same across the whole element: blending with the surroundings
  // over the bevel's band used to paint a ring-shaped seam on the body.
  float3 ambient = u_probeLuma >= 0.0 ? u_probe : rgb;

  // Light comes from wherever the surroundings are brighter (M 11:04): the lightness slope under
  // the element pulls the key light toward itself, and over a flat backdrop it stays at rest.
  float2 bright = u_probeLuma >= 0.0 ? u_probeSlope : float2(0.0);
  float brightLen = length(bright);
  float2 L = normalize(mix(u_light, bright / max(brightLen, 1e-4), smoothstep(0.03, 0.2, brightLen)) + float2(1e-5));
  // The key light's reflection uses the face's actual normal: at the flat top it points straight
  // up, and there's nothing there for direction to depend on. Using the SDF normal instead
  // painted the body as a cone.
  float facing = dot(N.xy, L);
  float key = u_specular * (pow(max(facing, 0.0), ${RIM.lobeExponent}.0) + ${RIM.opposingArc} * pow(max(-facing, 0.0), ${RIM.lobeExponent}.0));
  float rimFacing = dot(n, L);
  float rimKey = u_specular * (pow(max(rimFacing, 0.0), ${RIM.lobeExponent}.0) + ${RIM.opposingArc} * pow(max(-rimFacing, 0.0), ${RIM.lobeExponent}.0));
  // Wherever the key light doesn't fall, the face reflects its shaded surroundings \u2014 hence the
  // dark outline.
  float3 env = refl * (0.55 + 0.45 * min(key, 1.0)) + float3(1.2 * key);

  // Interference and diffraction live in the reflected ray at a grazing angle \u2014 a single hue
  // multiplier applied to the reflection, no extra samples.
  float3 spectral = float3(1.0);
  if (u_iridescence > 0.001) {
    spectral *= mix(float3(1.0), vgInterference(cosT), u_iridescence);
  }
  if (u_diffraction > 0.001) {
    float w = u_diffraction * smoothstep(${SPECTRAL.diffractionOnset}, 1.0, t);
    spectral *= mix(float3(1.0), vgDiffraction(e, bevel), w);
  }

  // The BACKDROP ESTIMATE arrives from the probe as one value per surface: computing it here
  // from samples isn't an option \u2014 a kink in density used to turn the estimate's discreteness
  // into ghost copies of text.
  float3 wide;
  float busy;
  if (u_probeLuma >= 0.0) {
    wide = u_probe;
    busy = u_probeBusy;
  } else {
    // The probe hasn't reported yet (first frames) \u2014 fall back to our own samples.
    float2 wx = float2(u_adaptRadius, 0.0);
    float2 wy = float2(0.0, u_adaptRadius);
    float3 w0 = vgUnpack(content.eval(vgInContent(s + wx)));
    float3 w1 = vgUnpack(content.eval(vgInContent(s - wx)));
    float3 w2 = vgUnpack(content.eval(vgInContent(s + wy)));
    float3 w3 = vgUnpack(content.eval(vgInContent(s - wy)));
    wide = (w0 + w1 + w2 + w3) * 0.25;
    float lw = vgLuma(wide);
    // The same statistic the probe uses (twice the mean deviation): both blur and the ink's
    // contrast margin depend on it, and the two paths' scales must not diverge.
    busy = clamp(0.5 * (abs(vgLuma(w0) - lw) + abs(vgLuma(w1) - lw)
      + abs(vgLuma(w2) - lw) + abs(vgLuma(w3) - lw)), 0.0, 1.0);
  }
  // Lightness AT THIS SPOT on the surface: the probe's plane, clamped to the measured range.
  float2 nrm = p / max(u_halfSize, float2(1.0));
  float local = u_probeLuma >= 0.0
    ? clamp(u_probeLuma + dot(u_probeSlope, nrm), u_probeRange.x, u_probeRange.y)
    : vgLuma(wide);
  float mean = u_probeLuma >= 0.0 ? u_probeLuma : vgLuma(wide);

  // SCATTERING. Regular mutes foreign structure under its own ink with blur, not a fill (M
  // 11:47): text under a capsule turns into blotches. Uniform across the whole lens; the radius
  // is measured in backdrop space \u2014 the lens compresses it at the silhouette.
  float structure = 1.0 - exp(-busy * VG_STRUCTURE_GAIN);
  // Under ink, Regular always scatters the backdrop; over a busy one, more strongly.
  float adaptBlur = max(
    (structure * VG_SCATTER_MAX + VG_SCATTER_BASE) * u_legibility * u_adaptRadius
      * min(max(footprint, 1.0), VG_FOOTPRINT_MAX),
    u_frost) * u_appear;
  if (adaptBlur > 0.5) {
    float reach = max(u_reach - length(p), 1.0);
    float4 g = vgGather(s, min(adaptBlur, reach), xy);
    float ga = g.a;
    float3 blurred = ga > 0.004 ? g.rgb / ga : float3(0.0);
    rgb = mix(rgb, blurred, smoothstep(0.5, 2.0, adaptBlur));
  }

  // AFTER scattering, not before: scattering is a property of TRANSMITTED light and replaces rgb
  // wholesale, so doing it the other way around erased the reflection over the whole element
  // (issue #106).
  rgb = mix(rgb, env * spectral, fres);

  // BODY. Tint and dynamic range under the glass compress just enough for ink over it to stay
  // legible (M 6:42). u_ink is ink POLARITY (1 light, 0 dark): the requirements are computed at
  // the two ends and blended by it, otherwise the glass dips toward the middle during a recolor.
  float strict = clamp(u_legibility * 2.0, 0.0, 1.0);
  float capLight = mix(VG_BODY_CAP_LOOSE, VG_BODY_CAP_TIGHT, strict);
  float floorDark = 1.0 - capLight;
  float pol = clamp(u_ink, 0.0, 1.0);
  // The requirement fades together with legibility: an element with no ink is promised
  // transparent glass by the model.
  float demand = clamp(u_legibility * 4.0, 0.0, 1.0);

  // Where there's no ink, the glass tints away from the backdrop. The direction is chosen by the
  // average lightness under the element, not the local spot's lightness: otherwise on a gradient
  // the threshold cuts across the body as a diagonal step.
  float darkSide = smoothstep(${BODY3.darkSideFrom}, ${BODY3.darkSideTo}, mean);
  float away = mix(VG_TINT_LIGHT, VG_TINT_DARK, darkSide);
  float tintLuma = mix(away, mix(VG_TINT_LIGHT, VG_TINT_DARK, pol), demand);

  // How much medium it takes to push lightness under the ink past the threshold \u2014 locally.
  // Computed from whichever edge of the backdrop's spread is closer to the ink: a light ink
  // drowns in a light spot right beneath it, and the spot's average lightness knows nothing
  // about that spot.
  float edge = busy * VG_BUSY_EDGE;
  float inkHi = min(local + edge, 1.0);
  float inkLo = max(local - edge, 0.0);
  float needForLight = inkHi > capLight
    ? clamp((inkHi - capLight) / max(inkHi - VG_TINT_DARK, 1e-4), 0.0, ${BODY3.maxDemand})
    : 0.0;
  float needForDark = inkLo < floorDark
    ? clamp((floorDark - inkLo) / max(VG_TINT_LIGHT - inkLo, 1e-4), 0.0, ${BODY3.maxDemand})
    : 0.0;
  float needForInk = mix(needForDark, needForLight, pol) * demand;

  float ground = structure * u_legibility * VG_GROUND_SPAN;
  float density = max(max(u_bodyDensity, ground), needForInk);

  // PRESENCE (\xA73). Over a uniform backdrop there is nothing to refract, and an element that is
  // only a rim honestly disappears \u2014 right for a piece of background, wrong for a control.
  //
  // This used to live on the rim line alone, as lit = max(rimKey, u_presence x 2), while the
  // DOM path has always implemented it as a floor on the BODY. Two renderers, one field, two
  // meanings. Measured on Apple's own control over a flat page (frames/verify/m-707), the body
  // carries 16 levels of separation there and the rim 11.6 \u2014 so the body is where it belongs,
  // and the rim's reading was the wrong one.
  // The separation asked for is capped by the range that is left: over a backdrop at 0.96 there
  // is no room to go 0.05 lighter. And what it is DIVIDED by is the distance to the tint's own
  // end, not to the tint the body currently sits at \u2014 dividing by the latter explodes wherever
  // the two are close, which is how the first version of this drove density to its ceiling at
  // both extremes and took the window down to 7%.
  bool lighter = local < 0.5;
  float target = lighter ? min(local + u_presence, 1.0) : max(local - u_presence, 0.0);
  float separation = abs(target - local);
  float reached = abs(tintLuma - local) * density;
  if (u_presence > 0.0 && reached < separation) {
    float toEnd = abs((lighter ? VG_TINT_LIGHT : VG_TINT_DARK) - local);
    density = max(density, min(separation / max(toEnd, 1e-4), ${BODY3.maxDemand}));
  }

  // Glass has no color of its own \u2014 only the color of what's beneath it (HIG "Color").
  float3 tintHue = mix(float3(1.0), vgHue(wide * 0.5 + ambient * 0.5), u_colorPickup);
  // The element appears by the lens and body building up, not by fading in (M 2:55): at
  // u_appear = 0 it's indistinguishable from the backdrop beneath it.
  rgb = mix(rgb, tintHue * tintLuma, density * u_appear);
  rgb += tintHue * (u_legibility * VG_MATTE_LIFT * u_appear);

  // TINTING \u2014 colored glass, not a fill (M 16:31, 17:03): the backdrop's lightness drives the
  // tone \u2014 deeper over dark, lighter over light \u2014 and the content's texture still shows through
  // the color.
  if (u_accent.a > 0.0) {
    float3 tone = u_accent.rgb * mix(${ACCENT.deep}, ${ACCENT.light}, local);
    float3 through = tone * (0.85 + 0.3 * vgLuma(rgb));
    rgb = mix(rgb, clamp(through, float3(0.0), float3(1.0)), u_accent.a * u_appear);
  }

  // CONTRAST COMPRESSION. The medium removes some light and mixes in scattered light, so content
  // under the glass moves toward the middle rather than simply getting lighter (M 2:35). The
  // previous layer only added light and, over a light backdrop, pushed the body the opposite way
  // from the reference.
  rgb = mix(rgb, vgHue(ambient) * VG_MEDIUM_LUMA, VG_MEDIUM_PULL * u_appear);
  // Ambient light reaches the body the same way across the whole element.
  rgb += ambient * u_edgeLight * VG_AMBIENT_SPILL * u_appear;
  // Glass concentrates light; the played portion is the segment where there's more of it.
  float glow = VG_CONCENTRATE + 0.08 * vgProgress(p, u_halfSize, u_progress);
  rgb += (1.0 - rgb) * glow * lens;

  // Under the finger and during morphing, glass concentrates light into a spot (M 4:56, 5:11).
  // This is a CONCENTRATION of the surroundings, not the glass's own whiteness: over a dark
  // backdrop the element lightens but never turns white, and ink over it stays legible.
  if (u_touchPress > 0.001) {
    float2 fromTouch = p - u_touch;
    float spotR = max(min(u_halfSize.x, u_halfSize.y) * 1.2, 1.0);
    float spot = u_touchPress * (0.3 + 0.55 * exp(-dot(fromTouch, fromTouch) / (spotR * spotR)));
    rgb = mix(rgb, clamp(ambient * 1.6 + float3(0.1), float3(0.0), float3(1.0)), spot * lens);
  }

  // RIM LIGHT \u2014 a separate layer, a line about 1 pt wide along the silhouette (M 2:36, 11:04):
  // brighter where the face faces the key light, weaker opposite it; where no light falls, a
  // dark outline. This line is what holds the element's presence, not a fill on the body: over a
  // flat backdrop a control is visible along its whole silhouette because of it.
  float line = (1.0 - smoothstep(0.0, lineW, e)) * lens;
  float outline = (1.0 - smoothstep(0.0, lineW * 0.6, e)) * lens;
  float lit = clamp(max(rimKey * 1.4, u_presence * 2.0), 0.0, 1.0);
  // The dark rim is its own layer around the whole silhouette, and the highlight sits ON TOP of
  // it (iOS 27). While the outline used to fade via a (1 \u2212 lit) multiplier, the silhouette read
  // as a single arc: highlight OR shadow.
  rgb *= 1.0 - ${RIM.darkEdge} * outline;
  rgb = mix(rgb, mix(refl, float3(1.0), 0.75), line * lit);

  if (u_debug > 9.5 && u_debug < 10.5) { rgb = spectral * 0.5; }
  if (u_debug > 10.5 && u_debug < 11.5) { rgb = float3(density, needForInk, structure); }
  // WHAT THE PROBE SAID ABOUT THE BACKDROP \u2014 three values that drive all the tinting: the
  // average lightness under the element, the vertical lightness slope, and the lightness AT THIS
  // SPOT. The slope is shown offset and squeezed by half: it's signed and rarely exceeds a
  // magnitude of one half.
  if (u_debug > 11.5) { rgb = float3(max(u_probeLuma, 0.0), 0.5 + u_probeSlope.y * 0.5, local); }

  rgb = vgSoftClip(rgb);

  // Sample alpha has to survive to the result: un-premultiplying color by its original alpha and
  // then returning it with a different one (the shape mask) would make a transparent backdrop
  // opaque and blow it out.
  float alpha = srcA * (1.0 - smoothstep(-1.0, 1.0, sd));
  return half4(half3(clamp(rgb, float3(0.0), float3(1.0)) * alpha), half(alpha));
}
`;
  var ACCENT_AMOUNT = ACCENT.amount;
  var REST_LIGHT = [-0.577, -0.817];

  // node_modules/vireglass/dist/chunk-JNRZNMJJ.js
  var AMBIENT_STEP = 32;
  function ambientFrom(sample) {
    const step = (v) => Math.round(Math.min(Math.max(v, 0), 1) * AMBIENT_STEP) / AMBIENT_STEP;
    return [step(sample.r), step(sample.g), step(sample.b)];
  }
  function shouldInkBeLight(sample, wasLight) {
    return decisiveLuma(sample) < (wasLight ? FLIP_LUMA : RETURN_LUMA);
  }
  var decisiveLuma = (sample) => sample.luma * 0.75 + (sample.hi ?? sample.luma) * 0.25;
  var FLIP_LUMA = 0.62;
  var RETURN_LUMA = 0.5;

  // node_modules/vireglass/dist/chunk-CTTZNZFV.js
  var LUMA = [0.2126, 0.7152, 0.0722];
  var luma = (c) => c[0] * LUMA[0] + c[1] * LUMA[1] + c[2] * LUMA[2];
  function shadowTint(ambient) {
    const peak = Math.max(ambient[0], ambient[1], ambient[2], 1e-3);
    const hue = [ambient[0] / peak, ambient[1] / peak, ambient[2] / peak];
    const grey = luma(hue);
    const available = luma(ambient);
    return [(hue[0] - grey) * available, (hue[1] - grey) * available, (hue[2] - grey) * available];
  }
  function createDeform(options = {}) {
    let elastic = options.elastic !== false;
    let pressCeiling = elastic ? 1 : ACCESSIBILITY.stillPress;
    let touchX = 0;
    let touchY = 0;
    let targetTouchX = 0;
    let targetTouchY = 0;
    let pullX = 0;
    let pullY = 0;
    let vx = 0;
    let vy = 0;
    let targetX = 0;
    let targetY = 0;
    let held = false;
    let press = 0;
    let active = 0;
    let waveAmp = 0;
    let wavePhase = 0;
    function grab(x, y, waveStart) {
      const atRest = idle();
      held = true;
      targetTouchX = x;
      targetTouchY = y;
      if (atRest) {
        touchX = x;
        touchY = y;
      }
      targetX = 0;
      targetY = 0;
      if (elastic) waveAmp = Math.min(waveAmp + waveStart, waveStart * SPRING.waveCapOnGrab);
    }
    function drag(dx, dy, limit) {
      if (!held || !elastic) return;
      const len = Math.hypot(dx, dy);
      const scale = len > 1e-3 ? limit * Math.tanh(len / limit) / len : 0;
      targetX = dx * scale;
      targetY = dy * scale;
    }
    function release(waveStart) {
      held = false;
      targetX = 0;
      targetY = 0;
      if (elastic) waveAmp = Math.min(waveAmp + waveStart, waveStart * SPRING.waveCapOnRelease);
    }
    function integrate(dt) {
      const k = held ? SPRING.holdStiffness : SPRING.releaseStiffness;
      const c = held ? SPRING.holdDamping : SPRING.releaseDamping;
      vx += (k * (targetX - pullX) - c * vx) * dt;
      vy += (k * (targetY - pullY) - c * vy) * dt;
      pullX += vx * dt;
      pullY += vy * dt;
      const pressTarget = held ? pressCeiling : 0;
      const tau = held ? SPRING.pressAttack : SPRING.pressRelease;
      press += (pressTarget - press) * (1 - Math.exp(-dt / tau));
      active += (pressTarget - active) * (1 - Math.exp(-dt / SPRING.activeFollow));
      const follow = 1 - Math.exp(-dt / SPRING.pointFollow);
      touchX += (targetTouchX - touchX) * follow;
      touchY += (targetTouchY - touchY) * follow;
      wavePhase += dt * SPRING.waveTurnsPerSecond;
      waveAmp *= Math.exp(-dt / SPRING.waveDecay);
      if (waveAmp < 0.01) waveAmp = 0;
    }
    function step(dt) {
      let rest = Math.min(Math.max(dt, 0), 0.25);
      const h = 1 / 120;
      while (rest > 1e-6) {
        const slice = Math.min(h, rest);
        integrate(slice);
        rest -= slice;
      }
      if (idle()) {
        pullX = 0;
        pullY = 0;
        vx = 0;
        vy = 0;
        press = 0;
        active = 0;
        wavePhase = 0;
      }
    }
    function idle() {
      return !held && Math.abs(pullX) < 0.05 && Math.abs(pullY) < 0.05 && Math.hypot(vx, vy) < 0.5 && press < 4e-3 && active < 4e-3 && waveAmp === 0;
    }
    function setElastic(on) {
      if (on === elastic) return;
      elastic = on;
      pressCeiling = on ? 1 : ACCESSIBILITY.stillPress;
      if (!on) {
        pullX = 0;
        pullY = 0;
        vx = 0;
        vy = 0;
        targetX = 0;
        targetY = 0;
        waveAmp = 0;
        wavePhase = 0;
      }
    }
    function sample() {
      return { touchX, touchY, pullX, pullY, press, active, waveAmp, wavePhase };
    }
    return { grab, drag, release, step, idle, sample, setElastic };
  }
  var NO_ACCESSIBILITY = {
    reduceTransparency: false,
    increaseContrast: false,
    reduceMotion: false
  };
  function applyAccessibility(optics, mods = NO_ACCESSIBILITY) {
    if (!mods.reduceTransparency && !mods.increaseContrast) return optics;
    const out = { ...optics };
    if (mods.reduceTransparency) {
      out.blur = Math.max(out.blur, ACCESSIBILITY.frostMinDp);
      out.bodyDensity = Math.max(out.bodyDensity, ACCESSIBILITY.obscureMin);
    }
    if (mods.increaseContrast) {
      out.bodyDensity = Math.max(out.bodyDensity, ACCESSIBILITY.contrastDensity);
      out.presence = Math.max(out.presence, ACCESSIBILITY.contrastPresence);
      out.legibility = 1;
    }
    return out;
  }
  function contrastRimLuma(tintLuma) {
    const light = tintLuma < 0.5;
    return light ? Math.min(tintLuma + ACCESSIBILITY.contrastRim, BODY3.tintLight) : Math.max(tintLuma - ACCESSIBILITY.contrastRim, BODY3.tintDark);
  }
  function elasticAllowed(mods = NO_ACCESSIBILITY) {
    return !mods.reduceMotion;
  }
  var GLASS_SCALE_DEFAULT = SCALE.default;
  var clamp013 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  function applyGlassScale(optics, scale) {
    const s = clamp013(scale);
    if (s === GLASS_SCALE_DEFAULT) return optics;
    if (s < GLASS_SCALE_DEFAULT) {
      const k2 = s / GLASS_SCALE_DEFAULT;
      return { ...optics, legibility: optics.legibility * k2, dimming: optics.dimming * k2 };
    }
    const k = (s - GLASS_SCALE_DEFAULT) / (1 - GLASS_SCALE_DEFAULT);
    return { ...optics, bodyDensity: Math.max(optics.bodyDensity, SCALE.tintedDensity * k) };
  }
  var SCROLL_EDGE_ENGAGE_DP = SCROLL_EDGE.engageDp;

  // node_modules/vireglass/dist/dom.js
  var SCALE_GAIN = 0.75;
  var MAX_STEP_PX = 0.09;
  var MAX_SCALE = 255 * MAX_STEP_PX;
  var BEVEL_SAMPLES = 8;
  function mapDensity(geometry, bevel, dpr) {
    if (bevel <= 0) return dpr;
    return Math.min(dpr, BEVEL_SAMPLES / bevel);
  }
  function encode(displacement, scale) {
    const channel = Math.round(255 * (displacement / scale + 0.5));
    return channel < 0 ? 0 : channel > 255 ? 255 : channel;
  }
  function bevelProfile(t) {
    const raw = Math.min(t / Math.sqrt(Math.max(1 - t * t * BEVEL.sphere, BEVEL.floor)), BEVEL.slopeMax);
    return raw / BEVEL.slopeMax;
  }
  function renderDisplacementPixels(optics, geometry, dpr, state = {}) {
    const bevel = bevelDp(geometry, optics);
    const density = mapDensity(geometry, bevel, dpr);
    const width = Math.max(1, Math.round(geometry.width * density));
    const height = Math.max(1, Math.round(geometry.height * density));
    const rawScale = optics.refraction * thicknessDp(geometry, optics) * SCALE_GAIN;
    const scale = Math.min(rawScale, MAX_SCALE);
    const smoothing = state.smoothing ?? 0;
    const shapes = [state.morph, state.morph2, ...state.morphs ?? []];
    const data = new Uint8ClampedArray(width * height * 4);
    const halfW = geometry.width / 2;
    const halfH = geometry.height / 2;
    for (let py = 0; py < height; py += 1) {
      const y = (py + 0.5) / density - halfH;
      for (let px = 0; px < width; px += 1) {
        const x = (px + 0.5) / density - halfW;
        const i = (py * width + px) * 4;
        const [wx, wy] = state.touch ? touchWarp(x, y, state.touch) : [x, y];
        const sd = sceneDistance(wx, wy, geometry.width, geometry.height, geometry.cornerRadius, smoothing, ...shapes);
        const t = Math.min(Math.max((sd + bevel) / bevel, 0), 1);
        if (t <= 0 || scale <= 0) {
          data[i] = 128;
          data[i + 1] = 128;
          data[i + 2] = 128;
          data[i + 3] = 255;
          continue;
        }
        const [gx, gy] = sceneGradient(wx, wy, geometry.width, geometry.height, geometry.cornerRadius, smoothing, ...shapes);
        const magnitude = bevelProfile(t) * (scale / 2);
        const dx = -gx * magnitude;
        const dy = -gy * magnitude;
        data[i] = encode(dx, scale);
        data[i + 1] = encode(dy, scale);
        data[i + 2] = 128;
        data[i + 3] = 255;
      }
    }
    return { data, width, height, scale };
  }
  function hasCanvasSupport() {
    return typeof document !== "undefined" && typeof document.createElement === "function";
  }
  function buildDisplacementMap(optics, geometry, dpr, state = {}) {
    if (!hasCanvasSupport()) {
      throw new Error("vireglass/dom: buildDisplacementMap requires a DOM (canvas)");
    }
    const { data, width, height, scale } = renderDisplacementPixels(optics, geometry, dpr, state);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("vireglass/dom: 2D canvas context unavailable");
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(data);
    ctx.putImageData(imageData, 0, 0);
    return { url: canvas.toDataURL("image/png"), width, height, scale };
  }
  var TAU = 6.28318530718;
  var LAMBDA = [LENS.lambdaR, LENS.lambdaG, LENS.lambdaB];
  var clamp012 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  function toHue(v) {
    const mean = Math.max((v[0] + v[1] + v[2]) / 3, 1e-3);
    return [v[0] / mean, v[1] / mean, v[2] / mean];
  }
  function rimSlopeCurve(x) {
    const k = 1 - clamp012(x);
    return k * k * k / Math.pow(Math.max(1 - k * k * k * k, 1e-5), 0.75);
  }
  function surfaceSlope(e, bevel, rim, thick) {
    if (e >= bevel || bevel <= 0) return 0;
    return Math.min((thick - rim) / bevel * rimSlopeCurve(e / bevel), LENS.slopeMax);
  }
  function surfaceCosine(slope) {
    return 1 / Math.sqrt(1 + slope * slope);
  }
  function interference(cosI, filmNm) {
    const sinT2 = (1 - cosI * cosI) / (LENS.filmIor * LENS.filmIor);
    const cosT = Math.sqrt(Math.max(1 - sinT2, 0));
    const opd = 2 * LENS.filmIor * filmNm * cosT;
    return toHue([
      0.5 + 0.5 * Math.cos(TAU * opd / LAMBDA[0] + Math.PI),
      0.5 + 0.5 * Math.cos(TAU * opd / LAMBDA[1] + Math.PI),
      0.5 + 0.5 * Math.cos(TAU * opd / LAMBDA[2] + Math.PI)
    ]);
  }
  function diffraction2(distFromEdge, bevel) {
    const phase = TAU * SPECTRAL.diffractionFringes * distFromEdge / Math.max(bevel, 1);
    const f = (lambda) => 0.5 + 0.5 * Math.cos(phase * SPECTRAL.referenceLambda / lambda);
    return toHue([f(LAMBDA[0]), f(LAMBDA[1]), f(LAMBDA[2])]);
  }
  function smoothstep(edge0, edge1, x) {
    const t = clamp012((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  }
  function spectralHue(e, bevel, rim, thick, optics) {
    let r = 1;
    let g = 1;
    let b = 1;
    const t = 1 - clamp012(bevel > 0 ? e / bevel : 1);
    if (optics.iridescence > 1e-3) {
      const w = optics.iridescence * smoothstep(SPECTRAL.iridescenceOnset, 1, t);
      if (w > 0) {
        const cosI = clamp012(surfaceCosine(surfaceSlope(e, bevel, rim, thick)));
        const i = interference(cosI, optics.film);
        r += (i[0] - 1) * w;
        g += (i[1] - 1) * w;
        b += (i[2] - 1) * w;
      }
    }
    if (optics.diffraction > 1e-3) {
      const w = optics.diffraction * smoothstep(SPECTRAL.diffractionOnset, 1, t);
      if (w > 0) {
        const d = diffraction2(e, bevel);
        r += (d[0] - 1) * w;
        g += (d[1] - 1) * w;
        b += (d[2] - 1) * w;
      }
    }
    return [r, g, b];
  }
  var HEADROOM = 2;
  var BEVEL_SAMPLES2 = 24;
  function mapDensity2(bevel, dpr) {
    if (bevel <= 0) return dpr;
    return Math.min(dpr, BEVEL_SAMPLES2 / bevel);
  }
  function renderSpectralPixels(optics, geometry, dpr) {
    const bevel = bevelDp(geometry, optics);
    const density = mapDensity2(bevel, dpr);
    const width = Math.max(1, Math.round(geometry.width * density));
    const height = Math.max(1, Math.round(geometry.height * density));
    const rim = rimDp(geometry, optics);
    const thick = thicknessDp(geometry, optics);
    const data = new Uint8ClampedArray(width * height * 4);
    const halfW = geometry.width / 2;
    const halfH = geometry.height / 2;
    const neutral = Math.round(1 / HEADROOM * 255);
    for (let py = 0; py < height; py += 1) {
      const y = (py + 0.5) / density - halfH;
      for (let px = 0; px < width; px += 1) {
        const x = (px + 0.5) / density - halfW;
        const i = (py * width + px) * 4;
        const sd = sdfRoundedRect(x, y, geometry.width, geometry.height, geometry.cornerRadius);
        const e = Math.max(-sd, 0);
        if (e >= bevel) {
          data[i] = neutral;
          data[i + 1] = neutral;
          data[i + 2] = neutral;
          data[i + 3] = 255;
          continue;
        }
        const [r, g, b] = spectralHue(e, bevel, rim, thick, optics);
        data[i] = Math.round(r / HEADROOM * 255);
        data[i + 1] = Math.round(g / HEADROOM * 255);
        data[i + 2] = Math.round(b / HEADROOM * 255);
        data[i + 3] = 255;
      }
    }
    return { data, width, height, headroom: HEADROOM };
  }
  function hasSpectralEdge(optics) {
    return optics.iridescence > 1e-3 || optics.diffraction > 1e-3;
  }
  function buildSpectralMap(optics, geometry, dpr) {
    if (typeof document === "undefined" || typeof document.createElement !== "function") {
      throw new Error("vireglass/dom: buildSpectralMap requires a DOM (canvas)");
    }
    const { data, width, height, headroom } = renderSpectralPixels(optics, geometry, dpr);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("vireglass/dom: 2D canvas context unavailable");
    const image = ctx.createImageData(width, height);
    image.data.set(data);
    ctx.putImageData(image, 0, 0);
    return { url: canvas.toDataURL("image/png"), width, height, headroom };
  }
  var LIMIT = 24;
  var store = /* @__PURE__ */ new Map();
  function cached(key, build5) {
    const hit = store.get(key);
    if (hit !== void 0) {
      store.delete(key);
      store.set(key, hit);
      return hit;
    }
    const value = build5();
    store.set(key, value);
    if (store.size > LIMIT) {
      const oldest = store.keys().next();
      if (!oldest.done) store.delete(oldest.value);
    }
    return value;
  }
  var GRID_COLS = 5;
  var GRID_ROWS = 5;
  function parseColor(value) {
    const match = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/i.exec(value);
    if (!match) return null;
    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    const a = match[4] === void 0 ? 1 : Number(match[4]);
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b) || !Number.isFinite(a)) return null;
    return { r, g, b, a };
  }
  function luma2(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function statsFromSamples(samples) {
    const n = samples.length;
    if (n === 0) return { luma: 0.5, busy: 0, lo: 0.5, hi: 0.5, r: 0.5, g: 0.5, b: 0.5 };
    const lumas = [];
    let sr = 0;
    let sg = 0;
    let sb = 0;
    for (const s of samples) {
      const r = s.r / 255;
      const g = s.g / 255;
      const b = s.b / 255;
      lumas.push(luma2(r, g, b));
      sr += r;
      sg += g;
      sb += b;
    }
    let mean = 0;
    for (const v of lumas) mean += v;
    mean /= n;
    let busy = 0;
    for (const v of lumas) busy += Math.abs(v - mean);
    busy = Math.min(busy / n * 2, 1);
    const sorted = [...lumas].sort((a, b) => a - b);
    const percentile = (p) => {
      const idx = p * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    return {
      luma: mean,
      busy,
      lo: percentile(0.1),
      hi: percentile(0.9),
      r: sr / n,
      g: sg / n,
      b: sb / n
    };
  }
  function compositeLayers(layers) {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    for (const layer of layers) {
      const share = layer.a * (1 - a);
      if (share <= 0) continue;
      r += layer.r * share;
      g += layer.g * share;
      b += layer.b * share;
      a += share;
      if (a >= 0.999) break;
    }
    if (a <= 1e-3) return null;
    return { r: r / a, g: g / a, b: b / a, a };
  }
  function sampleColorAt(el, x, y) {
    const stack = document.elementsFromPoint(x, y);
    const behind = stack.filter((node) => node !== el && !el.contains(node));
    const layers = [];
    for (const node of behind) {
      const bg = parseColor(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 1e-3) layers.push(bg);
    }
    const composited = compositeLayers(layers);
    if (composited) return composited;
    return canvasColor(el);
  }
  function canvasColor(el) {
    const doc = el.ownerDocument;
    for (const node of [doc.documentElement, doc.body]) {
      if (!node) continue;
      const bg = parseColor(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 1e-3) return bg.a >= 0.999 ? bg : compositeLayers([bg, WHITE]);
    }
    return WHITE;
  }
  var WHITE = { r: 255, g: 255, b: 255, a: 1 };
  function probeBackdrop(el, opts = {}) {
    const cols = opts.cols ?? GRID_COLS;
    const rows = opts.rows ?? GRID_ROWS;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return statsFromSamples([]);
    const samples = [];
    for (let j = 0; j < rows; j += 1) {
      const y = rect.top + (j + 0.5) / rows * rect.height;
      for (let i = 0; i < cols; i += 1) {
        const x = rect.left + (i + 0.5) / cols * rect.width;
        const color = sampleColorAt(el, x, y);
        if (color) samples.push(color);
      }
    }
    return statsFromSamples(samples);
  }
  var backdropFilterSupport = null;
  var svgBackdropFilterSupport = null;
  function probeProperty(property, value) {
    if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
    return CSS.supports(property, value);
  }
  function supportsBackdropFilter() {
    if (backdropFilterSupport === null) {
      backdropFilterSupport = probeProperty("backdrop-filter", "blur(1px)") || probeProperty("-webkit-backdrop-filter", "blur(1px)");
    }
    return backdropFilterSupport;
  }
  function supportsSvgBackdropFilter() {
    if (svgBackdropFilterSupport === null) {
      svgBackdropFilterSupport = probeProperty("backdrop-filter", "url(#vireglass-support-probe)");
    }
    return svgBackdropFilterSupport;
  }
  var FLAT_DENSITY = shadowOpacity(0);
  var BUSY_DENSITY = shadowOpacity(1);
  function shadowAlphaFrom(sample) {
    const t = (shadowOpacityFrom(sample) - FLAT_DENSITY) / (BUSY_DENSITY - FLAT_DENSITY);
    const alpha = SHADOW.alphaFlat + t * (SHADOW.alphaBusy - SHADOW.alphaFlat);
    return Math.min(Math.max(alpha, 0), 1);
  }
  var to255 = (v) => Math.round(Math.min(Math.max(v, 0), 1) * 255);
  function boxShadowCss(geometry, sample, appear = 1) {
    const reach = shadowReachDp(geometry);
    const present = appear < 0 ? 0 : appear > 1 ? 1 : appear;
    const alpha = shadowAlphaFrom(sample) * present;
    const ambient = "luma" in sample ? ambientFrom(sample) : null;
    if (!ambient) return `0 0 ${reach.toFixed(1)}px rgba(0, 0, 0, ${alpha.toFixed(3)})`;
    const [r, g, b] = shadowTint(ambient);
    const spill = SHADOW_GAP.tint;
    return `0 0 ${reach.toFixed(1)}px rgba(${to255(r * spill)}, ${to255(g * spill)}, ${to255(b * spill)}, ${alpha.toFixed(3)})`;
  }
  var {
    capLoose: BODY_CAP_LOOSE,
    capTight: BODY_CAP_TIGHT,
    tintDark: TINT_DARK,
    tintLight: TINT_LIGHT,
    groundSpan: GROUND_SPAN,
    busyEdge: BUSY_EDGE,
    darkSideFrom: DARK_SIDE_FROM,
    darkSideTo: DARK_SIDE_TO,
    maxDemand: MAX_DEMAND
  } = BODY3;
  var clamp3 = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  var mix = (a, b, t) => a + (b - a) * t;
  function smoothstep2(edge0, edge1, x) {
    const t = clamp3((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function resolveBody(optics, sample, ink) {
    const strict = clamp3(optics.legibility * 2, 0, 1);
    const capLight = mix(BODY_CAP_LOOSE, BODY_CAP_TIGHT, strict);
    const floorDark = 1 - capLight;
    const pol = clamp3(ink, 0, 1);
    const demand = clamp3(optics.legibility * 4, 0, 1);
    const mean = clamp3(sample.luma, 0, 1);
    const busy = Math.max(sample.busy, 0);
    const darkSide = smoothstep2(DARK_SIDE_FROM, DARK_SIDE_TO, mean);
    const away = mix(TINT_LIGHT, TINT_DARK, darkSide);
    const tintLuma = mix(away, mix(TINT_LIGHT, TINT_DARK, pol), demand);
    const edge = busy * BUSY_EDGE;
    const inkHi = Math.min(mean + edge, 1);
    const inkLo = Math.max(mean - edge, 0);
    const needForLight = inkHi > capLight ? clamp3((inkHi - capLight) / Math.max(inkHi - TINT_DARK, 1e-4), 0, MAX_DEMAND) : 0;
    const needForDark = inkLo < floorDark ? clamp3((floorDark - inkLo) / Math.max(TINT_LIGHT - inkLo, 1e-4), 0, MAX_DEMAND) : 0;
    const needForInk = mix(needForDark, needForLight, pol) * demand;
    const ground = busy * optics.legibility * GROUND_SPAN;
    return { density: Math.max(Math.max(optics.bodyDensity, ground), needForInk), tintLuma };
  }
  function withPresence(body, optics, sample) {
    if (optics.presence <= 0) return body;
    const mean = clamp3(sample.luma, 0, 1);
    const above = Math.abs(body.tintLuma - mean) > 1e-4 ? body.tintLuma > mean : mean < 0.5;
    const pole = above ? TINT_LIGHT : TINT_DARK;
    const separation = Math.min(optics.presence, Math.abs(pole - mean));
    const reached = Math.abs(body.tintLuma - mean) * body.density;
    if (reached >= separation) return body;
    const needed = separation / Math.max(Math.abs(pole - mean), 1e-4);
    return {
      density: Math.max(body.density, Math.min(needed, BODY3.presenceDemand)),
      // Left where the tint law put it, unless it landed exactly on the backdrop — which is the
      // case that used to be created here rather than avoided.
      tintLuma: Math.abs(body.tintLuma - mean) > 1e-4 ? body.tintLuma : pole
    };
  }
  var QUERIES = {
    reduceTransparency: "(prefers-reduced-transparency: reduce)",
    increaseContrast: "(prefers-contrast: more)",
    reduceMotion: "(prefers-reduced-motion: reduce)"
  };
  function matches(query) {
    if (typeof matchMedia !== "function") return false;
    try {
      return matchMedia(query).matches;
    } catch {
      return false;
    }
  }
  function systemAccessibility() {
    if (typeof matchMedia !== "function") return NO_ACCESSIBILITY;
    return {
      reduceTransparency: matches(QUERIES.reduceTransparency),
      increaseContrast: matches(QUERIES.increaseContrast),
      reduceMotion: matches(QUERIES.reduceMotion)
    };
  }
  function watchAccessibility(onChange) {
    if (typeof matchMedia !== "function") return () => {
    };
    const lists = [];
    const handler = () => onChange(systemAccessibility());
    for (const query of Object.values(QUERIES)) {
      try {
        const list = matchMedia(query);
        list.addEventListener("change", handler);
        lists.push(list);
      } catch {
      }
    }
    return () => {
      for (const list of lists) list.removeEventListener("change", handler);
    };
  }
  var { lobeExponent: LOBE_EXPONENT, opposingArc: OPPOSING_ARC, darkEdge: DARK_EDGE } = RIM;
  var STOPS = 48;
  function lightConicAngle(light) {
    const [lx, ly] = light;
    const deg = Math.atan2(lx, -ly) * 180 / Math.PI;
    return (deg + 360) % 360;
  }
  function rimLobe(deltaDeg, specular) {
    const facing = Math.cos(deltaDeg * Math.PI / 180);
    const front = facing > 0 ? Math.pow(facing, LOBE_EXPONENT) : 0;
    const back = facing < 0 ? Math.pow(-facing, LOBE_EXPONENT) : 0;
    return specular * (front + OPPOSING_ARC * back);
  }
  var clamp0122 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var to2552 = (v) => Math.round(clamp0122(v) * 255);
  function rimGradientCss(optics, ambient, light, appear = 1) {
    const present = clamp0122(appear);
    const start = lightConicAngle(light);
    const [ar, ag, ab] = ambient;
    const stops = [];
    for (let i = 0; i <= STOPS; i += 1) {
      const angle = i / STOPS * 360;
      const key = rimLobe(angle, optics.specular);
      const facing = Math.cos(angle * Math.PI / 180);
      const fringe = facing < 0 ? optics.iridescence * OPPOSING_ARC : 0;
      const lift = clamp0122(key * optics.fresnel);
      const r = ar + (1 - ar) * clamp0122(lift + fringe);
      const g = ag + (1 - ag) * lift;
      const b = ab + (1 - ab) * clamp0122(lift - fringe);
      const alpha = clamp0122(DARK_EDGE + lift * (1 - DARK_EDGE)) * present;
      const colour = lift > 1e-3 ? `rgba(${to2552(r)},${to2552(g)},${to2552(b)},${alpha.toFixed(3)})` : `rgba(0,0,0,${alpha.toFixed(3)})`;
      stops.push(`${colour} ${angle.toFixed(1)}deg`);
    }
    return `conic-gradient(from ${start.toFixed(1)}deg, ${stops.join(", ")})`;
  }
  var RIM_WIDTH_PX = RIM.widthPx;
  function contrastRimCss(bodyLuma, rimLuma) {
    const v = to2552(rimLuma);
    return `conic-gradient(rgb(${v},${v},${v}) 0deg, rgb(${v},${v},${v}) 360deg)`;
  }
  var TOUCH_RADIUS_FRACTION = TOUCH.radiusOfHalfSize;
  var WAVE_OF_TRAVEL = TOUCH.waveOfTravel;
  var RELEASE_WAVE = TOUCH.releaseWave;

  // src/glass.ts
  var MATERIAL = materialForInk(
    { ...VIREGLASS_CONTROL_MATERIAL, roughness: MATERIAL_RANGES.roughness[1] },
    true
  );
  var SVG_NS = "http://www.w3.org/2000/svg";
  var FILTER_ID = "vg-refract";
  var IDLE = { pullX: 0, pullY: 0, press: 0, active: 0 };
  var to2553 = (v) => Math.round(Math.min(Math.max(v, 0), 1) * 255);
  function createGlass({ root, layers, slack }) {
    if (!supportsBackdropFilter()) throw new Error("no backdrop-filter: the flat panel stands in");
    const { shell, refract, tint, glow, rim } = layers;
    const svgSupported = supportsSvgBackdropFilter();
    let a11y = systemAccessibility();
    const deform = createDeform({ elastic: elasticAllowed(a11y) });
    let inkLight = MATERIAL.ink > 0.5;
    let sample = statsFromSamples([]);
    let destroyed = false;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    const defs = document.createElementNS(SVG_NS, "defs");
    svg.append(defs);
    root.append(svg);
    function optics(material = MATERIAL) {
      return applyAccessibility(applyGlassScale(resolveOptics(material), GLASS_SCALE_DEFAULT), a11y);
    }
    function measure(width, height, radius) {
      const rect = shell.getBoundingClientRect();
      const r = radius ?? parseFloat(getComputedStyle(shell).borderTopLeftRadius);
      return roundedRectGeometry(width ?? rect.width, height ?? rect.height, r || 0);
    }
    const dpr = () => window.devicePixelRatio || 1;
    let feImage = null;
    let feBlur = null;
    let passes = [];
    let graphFor = "";
    let wornScale = -1;
    let wornBlur = -1;
    function buildGraph(o, geometry) {
      const filter = document.createElementNS(SVG_NS, "filter");
      filter.setAttribute("id", FILTER_ID);
      filter.setAttribute("filterUnits", "objectBoundingBox");
      filter.setAttribute("x", "0");
      filter.setAttribute("y", "0");
      filter.setAttribute("width", "1");
      filter.setAttribute("height", "1");
      filter.setAttribute("color-interpolation-filters", "sRGB");
      const flood = document.createElementNS(SVG_NS, "feFlood");
      flood.setAttribute("flood-color", "rgb(128,128,128)");
      flood.setAttribute("result", "flat");
      feImage = document.createElementNS(SVG_NS, "feImage");
      feImage.setAttribute("preserveAspectRatio", "none");
      feImage.setAttribute("result", "shape");
      const merge = document.createElementNS(SVG_NS, "feMerge");
      merge.setAttribute("result", "map");
      for (const src of ["flat", "shape"]) {
        const node = document.createElementNS(SVG_NS, "feMergeNode");
        node.setAttribute("in", src);
        merge.append(node);
      }
      feBlur = document.createElementNS(SVG_NS, "feGaussianBlur");
      feBlur.setAttribute("in", "SourceGraphic");
      feBlur.setAttribute("stdDeviation", String(Math.max(o.blur, 0)));
      feBlur.setAttribute("result", "blurred");
      filter.append(flood, feImage, merge, feBlur);
      passes = [];
      const base = refractionStrength(o.ior);
      const ratio = (shift) => base > 0 ? refractionStrength(o.ior + shift) / base : 1;
      const red = ratio(DISPERSION.redShift * o.iorSpread);
      const blue = ratio(DISPERSION.blueShift * o.iorSpread);
      const disperses = Math.abs(red - 1) > 1e-4 || Math.abs(blue - 1) > 1e-4;
      if (disperses) {
        const channels = [
          ["dR", red, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"],
          ["dG", 1, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"],
          ["dB", blue, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"]
        ];
        for (const [name, share, matrix] of channels) {
          const pass = document.createElementNS(SVG_NS, "feDisplacementMap");
          pass.setAttribute("in", "blurred");
          pass.setAttribute("in2", "map");
          pass.setAttribute("xChannelSelector", "R");
          pass.setAttribute("yChannelSelector", "G");
          pass.setAttribute("result", `${name}raw`);
          const only = document.createElementNS(SVG_NS, "feColorMatrix");
          only.setAttribute("in", `${name}raw`);
          only.setAttribute("type", "matrix");
          only.setAttribute("values", matrix);
          only.setAttribute("result", name);
          filter.append(pass, only);
          passes.push({ node: pass, ratio: share });
        }
        const rg = document.createElementNS(SVG_NS, "feComposite");
        const rgb = document.createElementNS(SVG_NS, "feComposite");
        for (const [node, a, b, out] of [
          [rg, "dR", "dG", "dRG"],
          [rgb, "dRG", "dB", "refracted"]
        ]) {
          node.setAttribute("in", a);
          node.setAttribute("in2", b);
          node.setAttribute("operator", "arithmetic");
          node.setAttribute("k1", "0");
          node.setAttribute("k2", "1");
          node.setAttribute("k3", "1");
          node.setAttribute("k4", "0");
          node.setAttribute("result", out);
        }
        filter.append(rg, rgb);
      } else {
        const pass = document.createElementNS(SVG_NS, "feDisplacementMap");
        pass.setAttribute("in", "blurred");
        pass.setAttribute("in2", "map");
        pass.setAttribute("xChannelSelector", "R");
        pass.setAttribute("yChannelSelector", "G");
        pass.setAttribute("result", "refracted");
        filter.append(pass);
        passes.push({ node: pass, ratio: 1 });
      }
      if (hasSpectralEdge(o)) {
        const key = `${geometry.width}x${geometry.height}r${geometry.cornerRadius}@${dpr()}`;
        const spectral = cached(`h|${key}`, () => buildSpectralMap(o, geometry, dpr()));
        const image = document.createElementNS(SVG_NS, "feImage");
        image.setAttribute("href", spectral.url);
        image.setAttribute("preserveAspectRatio", "none");
        image.setAttribute("result", "hue");
        const product = document.createElementNS(SVG_NS, "feComposite");
        product.setAttribute("in", "refracted");
        product.setAttribute("in2", "hue");
        product.setAttribute("operator", "arithmetic");
        product.setAttribute("k1", String(spectral.headroom));
        product.setAttribute("k2", "0");
        product.setAttribute("k3", "0");
        product.setAttribute("k4", "0");
        filter.append(image, product);
      }
      defs.replaceChildren(filter);
      wornScale = -1;
      wornBlur = -1;
    }
    function wear(scale, blur2) {
      if (Math.abs(scale - wornScale) > 0.05) {
        wornScale = scale;
        for (const pass of passes) pass.node.setAttribute("scale", (scale * pass.ratio).toFixed(2));
      }
      if (feBlur && Math.abs(blur2 - wornBlur) > 0.05) {
        wornBlur = blur2;
        feBlur.setAttribute("stdDeviation", blur2.toFixed(2));
      }
    }
    function fit(width, height) {
      if (!feImage) return;
      feImage.setAttribute("x", String(slack));
      feImage.setAttribute("y", String(slack));
      feImage.setAttribute("width", String(width));
      feImage.setAttribute("height", String(height));
    }
    function reshape(width, height, radius) {
      if (!svgSupported) return;
      const o = optics();
      const geometry = measure(width, height, radius);
      const key = `${geometry.width}x${geometry.height}r${geometry.cornerRadius}@${dpr()}:${o.blur}:${o.refraction}`;
      if (key !== graphFor || !feImage) {
        buildGraph(o, geometry);
        graphFor = key;
      }
      const map = cached(`d|${key}`, () => buildDisplacementMap(o, geometry, dpr()));
      feImage.setAttribute("href", map.url);
      fit(geometry.width, geometry.height);
      wear(map.scale, o.blur);
      refract.style.setProperty("backdrop-filter", `url(#${FILTER_ID})`);
      refract.style.setProperty("-webkit-backdrop-filter", `url(#${FILTER_ID})`);
    }
    function paintGlow(x, y, strength, geometry) {
      if (strength <= 1e-3) {
        glow.style.setProperty("--vireglass-glow-opacity", "0");
        return;
      }
      const [r, g, b] = ambientFrom(sample);
      const cx = (x + geometry.width / 2) / Math.max(geometry.width, 1) * 100;
      const cy = (y + geometry.height / 2) / Math.max(geometry.height, 1) * 100;
      const reach = halfMinDp(geometry) * TOUCH.radiusOfHalfSize;
      glow.style.setProperty(
        "--vireglass-glow",
        `radial-gradient(circle ${reach.toFixed(0)}px at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, rgba(${to2553(r)},${to2553(g)},${to2553(b)},1) 0%, rgba(${to2553(r)},${to2553(g)},${to2553(b)},0) 100%)`
      );
      glow.style.setProperty("--vireglass-glow-opacity", strength.toFixed(3));
    }
    function update() {
      if (destroyed) return;
      const o = optics();
      const geometry = measure();
      sample = probeBackdrop(shell);
      inkLight = shouldInkBeLight(sample, inkLight);
      const polarity = inkLight ? 1 : 0;
      const body = withPresence(resolveBody(o, sample, polarity), o, sample);
      const [ar, ag, ab] = ambientFrom(sample);
      const hue = (c) => body.tintLuma + (c - body.tintLuma) * o.colorPickup;
      tint.style.setProperty(
        "--vireglass-body-color",
        `rgba(${to2553(hue(ar))}, ${to2553(hue(ag))}, ${to2553(hue(ab))}, ${body.density.toFixed(3)})`
      );
      rim.style.setProperty(
        "--vireglass-rim",
        a11y.increaseContrast ? contrastRimCss(body.tintLuma, contrastRimLuma(body.tintLuma)) : rimGradientCss(o, [ar, ag, ab], REST_LIGHT)
      );
      rim.style.setProperty("--vireglass-rim-width", `${RIM_WIDTH_PX}px`);
      shell.style.boxShadow = boxShadowCss(geometry, sample);
      if (svgSupported) {
        reshape(geometry.width, geometry.height, geometry.cornerRadius);
        return;
      }
      const stand = `blur(${Math.max(o.blur, 1.5).toFixed(1)}px) saturate(${(1 + o.colorPickup).toFixed(2)})`;
      refract.style.setProperty("backdrop-filter", stand);
      refract.style.setProperty("-webkit-backdrop-filter", stand);
    }
    const stopWatching = watchAccessibility((next) => {
      a11y = next;
      deform.setElastic(elasticAllowed(next));
      graphFor = "";
      update();
    });
    let last = 0;
    const waveImpulse = (g) => halfMinDp(g) * MAX_STRETCH * TOUCH.waveOfTravel;
    function frame() {
      if (destroyed) return IDLE;
      const now = performance.now();
      deform.step(last ? Math.min((now - last) / 1e3, 0.25) : 0);
      last = now;
      const d = deform.sample();
      const geometry = measure();
      const settled = deform.idle();
      const live = settled ? optics() : optics(activeMaterial(MATERIAL, d.active));
      if (svgSupported && feImage && !settled) {
        const map = buildDisplacementMap(live, geometry, 1, {
          touch: {
            x: d.touchX,
            y: d.touchY,
            pullX: d.pullX,
            pullY: d.pullY,
            press: d.press,
            radius: halfMinDp(geometry) * TOUCH.radiusOfHalfSize,
            waveAmp: d.waveAmp,
            wavePhase: d.wavePhase
          }
        });
        feImage.setAttribute("href", map.url);
        wear(map.scale, live.blur);
        graphFor = "";
      }
      paintGlow(d.touchX, d.touchY, d.active * live.edgeLight, geometry);
      return { pullX: d.pullX, pullY: d.pullY, press: d.press, active: d.active };
    }
    return {
      update,
      ink: () => inkLight,
      frame,
      idle: () => deform.idle(),
      grab: (x, y) => deform.grab(x, y, waveImpulse(measure())),
      drag: (dx, dy) => deform.drag(dx, dy, halfMinDp(measure()) * MAX_STRETCH),
      release: () => deform.release(waveImpulse(measure()) * TOUCH.releaseWave),
      ripple(x, y) {
        deform.grab(x, y, waveImpulse(measure()));
        deform.release(0);
      },
      reshape,
      fit,
      destroy() {
        destroyed = true;
        stopWatching();
        svg.remove();
        refract.style.removeProperty("backdrop-filter");
        refract.style.removeProperty("-webkit-backdrop-filter");
      }
    };
  }

  // src/ui.ts
  var GLIDE_MS = 380;
  var CSS2 = `
:host {
  all: initial;
  /* The vire palette: a warm near-black; the accent is not colour but a lift of the surface. */
  --vg-body: oklch(0.115 0.006 75);
  --vg-deep: oklch(0.085 0.006 75);
  --vg-ink: oklch(0.93 0.008 83);
  --vg-dim: oklch(0.62 0.009 80);
  /* Lighter than the vire token for the same reason as legibility: on a dark
     body oklch(0.55 \u2026) does not read. Same hue. */
  --vg-alarm: oklch(0.74 0.16 27);
  --vg-warn: oklch(0.78 0.12 70);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --morph: 0.34s;
  --r-sheet: 26px;
  --pad: 6px;
  --r-item: 20px;
  /* Distance from the edge of the window. */
  --edge: 18px;
  /* Slack of the refraction layer past the sheet \u2014 see .refract. */
  --slack: 40px;
}
* { box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif; }

.root { position: fixed; z-index: 2147483000; }
/* The corner is set by classes: the panel grows out of the corner it is pinned to. */
.root.x-right { right: var(--edge); }
.root.x-left { left: var(--edge); }
.root.y-bottom { bottom: var(--edge); }
.root.y-top { top: var(--edge); }
/* A throw into another corner finishes the very motion the pane was dragged by. */
.root.gliding { transition: transform ${GLIDE_MS}ms var(--ease); }
.root.dragging { transition: none; }
.root.dragging, .root.dragging * { cursor: grabbing !important; user-select: none; }
/* Ink polarity follows the background: over a very light page the body of the
   glass cannot go dark enough, and light text on it is unreadable. */
.root.ink-dark {
  --vg-ink: oklch(0.24 0.012 75);
  --vg-dim: oklch(0.46 0.012 78);
  --vg-alarm: oklch(0.48 0.19 27);
  --vg-warn: oklch(0.52 0.12 62);
}
.fab, .head, .fmt button, .fmt .hint, .label, .link, .err, .note {
  transition: color .42s var(--ease);
}

.shell {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: var(--r-sheet);
  /* The pane is dragged by finger \u2014 the browser must not scroll the page
     instead, and a drag across it must not select its own labels. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.shell.ready {
  transition:
    width var(--morph) var(--ease),
    height var(--morph) var(--ease),
    border-radius var(--morph) var(--ease);
}

/* Refraction of the live DOM. The layer is WIDER than the sheet and sits inside
   the shell rather than on it, for two reasons at once:
     slack \u2014 the blur and the displacement need something to gather under the
             rim, otherwise the edge pulls in emptiness from past the filter region;
     clip  \u2014 with slack, backdrop-filter spills the filtered background past the
             bounds of its own element, and a rectangle shows around the rounded
             shape. Here the spill is cut off by overflow.
   The separate .clip is not decoration: while backdrop-filter sits directly in
   the shell, whose height is moving through a morph, and the sheet is pinned by
   its TOP, Chromium stops recomputing the position of the neighbouring layers \u2014
   the panel's content stays lifted by a couple of dozen pixels and escapes the
   clip. Its own wrapper with overflow unties that. */
.clip {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}
.refract { position: absolute; inset: calc(var(--slack) * -1); }
/* The body goes ABOVE the refraction. As a background of the shell it would be
   pulled into the refraction: a parent's background is part of its own child's
   backdrop. The colour is the material's own \u2014 how much medium stands between
   the page and the eye, and which way it tints \u2014 so CSS only paints it. It
   eases in over the same FADE_MS the ink recolours over: the density changes in
   steps, as the reader scrolls, and a step in the body reads as a flash. */
.tint {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: var(--vireglass-body-color, transparent);
  transition: background .42s var(--ease);
}
/* The light that blooms under a finger: a concentration of the surroundings,
   not the glass's own whiteness. The gradient arrives whole from the material \u2014
   position, reach and the colour it picked up off the page. */
.glow {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: var(--vireglass-glow, none);
  opacity: var(--vireglass-glow-opacity, 0);
}
/* The hairline: two opposing arcs of the key light and a dark edge, all out of
   the material. A ring rather than a fill \u2014 the same box painted twice, once
   clipped to the content box, and composited so only the padding band survives.
   The trick is the package's own; it lives here because the stylesheet that
   carries it in the package hangs on document.head and cannot reach a shadow
   tree. */
.rim {
  position: absolute;
  inset: 0;
  /* Above the content, like the ::after the package paints it with: the ring is
     one pixel at the very edge, and the panel's own padding keeps it clear. */
  z-index: 3;
  pointer-events: none;
  border-radius: inherit;
  padding: var(--vireglass-rim-width, 1px);
  background: var(--vireglass-rim, none);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
}

/* The fallback material when there is no backdrop-filter at all: the extension
   has to work without the glass too. */
.shell.flat {
  background: color-mix(in oklch, var(--vg-body) 90%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  backdrop-filter: blur(18px) saturate(160%);
  box-shadow:
    inset 0 1px 0 color-mix(in oklch, var(--vg-ink) 22%, transparent),
    0 0 0 1px color-mix(in oklch, var(--vg-ink) 10%, transparent),
    0 20px 44px -16px color-mix(in oklch, var(--vg-deep) 85%, transparent);
}

/* Arriving content waits for the shape. The sheet takes --morph to travel, and
   content that turns opaque inside the first third of it is read through a box
   still growing around it \u2014 clipped on the side the sheet has not reached yet,
   so the text appears to slide out of a hole rather than the panel to unfold.
   The delay is most of the morph: the shape forms, then the content resolves
   into it. */
.view {
  position: absolute;
  z-index: 2;
  opacity: 0;
  transition: opacity .2s var(--ease) .15s;
}
/* Leaving content does not wait for anything: it is being replaced, and
   lingering under the arriving one turns a cross-fade into a smear. */
.view.leaving { transition: opacity .12s var(--ease); }
/* The content is pinned to the same corner the sheet grows from: otherwise it
   drifts away from the edge during the morph. */
.root.x-right .view { right: 0; }
.root.x-left .view { left: 0; }
.root.y-bottom .view { bottom: 0; }
.root.y-top .view { top: 0; }
.view.in { opacity: 1; }

.fab {
  display: flex; align-items: center; gap: 9px;
  padding: 13px 17px 13px 15px;
  background: transparent; border: 0; cursor: pointer;
  color: var(--vg-ink); font-size: 14px; font-weight: 600; white-space: nowrap;
}
.fab svg { display: block; }

.panel { width: 268px; padding: var(--pad); }
.head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px 9px; font-size: 12px; letter-spacing: .02em; color: var(--vg-dim);
  cursor: grab;
}
.head .site { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.head .grip { flex: none; margin-left: auto; opacity: .55; }
.fmt {
  display: flex; flex-direction: column;
  margin-top: 4px; padding-top: 4px;
  border-top: 1px solid color-mix(in oklch, var(--vg-ink) 10%, transparent);
}
/* Concentric: sheet radius 20 = item radius 14 + padding 6. */
.fmt button {
  display: flex; align-items: baseline; gap: 8px; width: 100%;
  background: transparent; border: 0; cursor: pointer; text-align: left;
  padding: 10px; border-radius: var(--r-item);
  color: var(--vg-ink); font-size: 14px;
  transition: background .13s var(--ease);
}
.fmt button:hover, .fmt button:focus-visible {
  background: color-mix(in oklch, var(--vg-ink) 9%, transparent);
  outline: none;
}
.fmt .hint { color: var(--vg-dim); font-size: 11.5px; }

/* The translation row sits above the formats and is read as a setting, not as an
   action: the value is dim until a language is picked. */
.tr {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 2px 4px 2px 10px; color: var(--vg-ink); font-size: 14px;
}
.tr .pick { position: relative; display: flex; align-items: center; min-width: 0; }
.tr select {
  appearance: none; -webkit-appearance: none;
  background: transparent; border: 0; cursor: pointer; color: var(--vg-dim);
  font: inherit; font-size: 13.5px; text-align: right; text-align-last: right;
  padding: 7px 22px 7px 10px; border-radius: 14px; max-width: 150px;
  color-scheme: dark;
  /* Hugs the chosen language instead of the widest one in the list; older engines just stay wide. */
  field-sizing: content;
  transition: color .13s var(--ease), background .13s var(--ease);
}
.root.ink-dark .tr select { color-scheme: light; }
.tr.on select { color: var(--vg-ink); }
.tr select:hover, .tr select:focus-visible {
  color: var(--vg-ink);
  background: color-mix(in oklch, var(--vg-ink) 9%, transparent);
  outline: none;
}
.tr .chev { position: absolute; right: 8px; pointer-events: none; opacity: .7; color: var(--vg-dim); }
.tr-note { padding: 0 10px 6px; color: var(--vg-dim); font-size: 11.5px; line-height: 1.4; }
.tr-note[hidden] { display: none; }

.pad { width: 268px; padding: 13px 14px 14px; }
.label { font-size: 13px; color: var(--vg-ink); margin-bottom: 10px; min-height: 17px; }
.bar { height: 4px; border-radius: 99px; overflow: hidden; background: color-mix(in oklch, var(--vg-ink) 10%, transparent); }
.bar > i { display: block; height: 100%; width: 0%; border-radius: 99px; background: var(--vg-ink); transition: width .3s var(--ease); }
.row { display: flex; justify-content: space-between; align-items: center; margin-top: 11px; }
.link {
  background: none; border: 0; cursor: pointer; padding: 3px 0;
  color: var(--vg-dim); font-size: 12px;
  transition: color .13s var(--ease);
}
.link:hover, .link:focus-visible { color: var(--vg-ink); outline: none; }
.err { color: var(--vg-alarm); font-size: 12.5px; line-height: 1.45; }
.note { display: block; margin-top: 7px; color: var(--vg-warn); font-size: 12px; }
.ok { color: var(--vg-ink); }

@media (prefers-reduced-motion: reduce) {
  .shell.ready { transition: none; }
  .view { transition: none; }
  .root.gliding { transition: none; }
}
`;
  var ICON = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.8v8.4M4.6 7l3.4 3.4L11.4 7M2.2 13.4h11.6"/></svg>';
  var CHEVRON = '<svg class="chev" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.2 3.8 5 6.6l2.8-2.8"/></svg>';
  var GRIP = '<svg class="grip" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><circle cx="3" cy="2.5" r="1"/><circle cx="9" cy="2.5" r="1"/><circle cx="3" cy="6" r="1"/><circle cx="9" cy="6" r="1"/><circle cx="3" cy="9.5" r="1"/><circle cx="9" cy="9.5" r="1"/></svg>';
  var FORMATS = [
    { id: "epub", label: "EPUB", hint: "for Send to Kindle" },
    { id: "mobi", label: "MOBI", hint: "to Kindle over USB" },
    { id: "fb2", label: "FB2", hint: "phone, PocketBook" },
    { id: "txt", label: "TXT", hint: "plain text" }
  ];
  var CORNERS = ["br", "bl", "tr", "tl"];
  var DRAG_START = 7;
  var KEEP_IN = 8;
  function normalizeCorner(value) {
    return CORNERS.includes(value) ? value : "br";
  }
  function create({
    siteName,
    defaultFormat,
    corner,
    onCornerChange,
    translateTo: initialTranslateTo,
    onTranslateChange,
    onDownload
  }) {
    const host = document.createElement("div");
    host.id = "virebook-root";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CSS2;
    const rootEl = document.createElement("div");
    rootEl.className = "root";
    const shell = document.createElement("div");
    shell.className = "shell";
    const clipEl = document.createElement("div");
    clipEl.className = "clip";
    const refractEl = document.createElement("div");
    refractEl.className = "refract";
    clipEl.append(refractEl);
    const tintEl = document.createElement("div");
    tintEl.className = "tint";
    const glowEl = document.createElement("div");
    glowEl.className = "glow";
    const rimEl = document.createElement("div");
    rimEl.className = "rim";
    shell.append(clipEl, tintEl, glowEl, rimEl);
    rootEl.append(shell);
    shadow.append(style, rootEl);
    const SLACK = 40;
    let glass = null;
    try {
      glass = createGlass({
        root: shadow,
        layers: { shell, refract: refractEl, tint: tintEl, glow: glowEl, rim: rimEl },
        slack: SLACK
      });
    } catch {
      glass = null;
    }
    if (!glass) {
      clipEl.remove();
      tintEl.remove();
      glowEl.remove();
      rimEl.remove();
      shell.classList.add("flat");
    }
    let at = normalizeCorner(corner);
    let translateTo = normalizeTarget(initialTranslateTo);
    function applyCorner() {
      rootEl.classList.toggle("x-right", at[1] === "r");
      rootEl.classList.toggle("x-left", at[1] === "l");
      rootEl.classList.toggle("y-bottom", at[0] === "b");
      rootEl.classList.toggle("y-top", at[0] === "t");
    }
    applyCorner();
    let painting = 0;
    let paintUntil = 0;
    const SHEET_RADIUS = 26;
    function paintGlass(until) {
      if (!glass) return;
      paintUntil = Math.max(paintUntil, until || performance.now());
      if (painting) return;
      const frame = () => {
        painting = 0;
        const w = shell.offsetWidth;
        const h = shell.offsetHeight;
        if (w && h && glass) {
          const out = glass.frame();
          glass.fit(w, h);
          deformX = out.pullX;
          deformY = out.pullY;
          pressed = out.press;
          applyTransform();
        }
        if (performance.now() < paintUntil || !glass.idle()) {
          painting = requestAnimationFrame(frame);
        } else if (w && h) {
          refreshBackdrop();
        }
      };
      painting = requestAnimationFrame(frame);
    }
    function refreshBackdrop() {
      if (!glass) return;
      glass.update();
      rootEl.classList.toggle("ink-dark", !glass.ink());
    }
    let dragX = 0;
    let dragY = 0;
    let deformX = 0;
    let deformY = 0;
    let pressed = 0;
    const PRESS_SINK = 0.015;
    function applyTransform() {
      const x = dragX + deformX;
      const y = dragY + deformY;
      const scale = 1 - pressed * PRESS_SINK;
      const move = x || y ? `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)` : "";
      const sink = pressed > 1e-3 ? ` scale(${scale.toFixed(4)})` : "";
      rootEl.style.transform = move || sink ? `${move}${sink}`.trim() : "";
    }
    let controller = null;
    let settled = true;
    let view = null;
    let mode = "idle";
    function measure(el) {
      const probe = el.cloneNode(true);
      probe.style.position = "absolute";
      probe.style.left = "-9999px";
      probe.style.top = "0";
      probe.style.opacity = "0";
      probe.style.transition = "none";
      rootEl.append(probe);
      const size = { w: probe.offsetWidth, h: probe.offsetHeight };
      probe.remove();
      return size;
    }
    function nearestCorner(box) {
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      return (cy < innerHeight / 2 ? "t" : "b") + (cx < innerWidth / 2 ? "l" : "r");
    }
    function moveTo(next, animate) {
      const target = normalizeCorner(next);
      const before = shell.getBoundingClientRect();
      at = target;
      applyCorner();
      rootEl.classList.remove("gliding");
      dragX = 0;
      dragY = 0;
      applyTransform();
      const after = shell.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      const gliding = animate && !!(dx || dy);
      if (gliding) {
        dragX = dx;
        dragY = dy;
        applyTransform();
        requestAnimationFrame(() => {
          rootEl.classList.add("gliding");
          dragX = 0;
          dragY = 0;
          applyTransform();
        });
      }
      if (onCornerChange) onCornerChange(at);
      if (gliding) paintGlass(performance.now() + GLIDE_MS + 40);
      else refreshBackdrop();
    }
    function step(dir) {
      const y = at[0];
      const x = at[1];
      if (dir === "left") moveTo(y + "l", true);
      else if (dir === "right") moveTo(y + "r", true);
      else if (dir === "up") moveTo("t" + x, true);
      else moveTo("b" + x, true);
    }
    rootEl.addEventListener("transitionend", (e) => {
      if (e.target === rootEl && e.propertyName === "transform") rootEl.classList.remove("gliding");
    });
    let drag = null;
    let dragged = false;
    shell.addEventListener("pointerdown", (e) => {
      if (e.button !== void 0 && e.button !== 0) return;
      dragged = false;
      const box = shell.getBoundingClientRect();
      drag = { x: e.clientX, y: e.clientY, box, moving: false };
      if (glass) {
        glass.grab(e.clientX - (box.left + box.width / 2), e.clientY - (box.top + box.height / 2));
        paintGlass();
      }
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (e.buttons === 0) {
        letGo();
        return;
      }
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moving) {
        if (Math.hypot(dx, dy) < DRAG_START) {
          if (glass) glass.drag(dx, dy);
          return;
        }
        drag.moving = true;
        dragged = true;
        rootEl.classList.remove("gliding");
        rootEl.classList.add("dragging");
        if (glass) glass.release();
      }
      const b = drag.box;
      dragX = Math.min(Math.max(dx, KEEP_IN - b.left), innerWidth - KEEP_IN - b.right);
      dragY = Math.min(Math.max(dy, KEEP_IN - b.top), innerHeight - KEEP_IN - b.bottom);
      applyTransform();
      if (glass) paintGlass();
    });
    function letGo() {
      if (!drag) return;
      const moving = drag.moving;
      drag = null;
      if (glass) glass.release();
      if (moving) {
        rootEl.classList.remove("dragging");
        moveTo(nearestCorner(shell.getBoundingClientRect()), true);
      } else if (glass) {
        paintGlass();
      }
    }
    window.addEventListener("pointerup", letGo);
    window.addEventListener("pointercancel", letGo);
    rootEl.addEventListener(
      "click",
      (e) => {
        if (!dragged) return;
        dragged = false;
        e.stopPropagation();
        e.preventDefault();
      },
      true
    );
    rootEl.addEventListener("keydown", (e) => {
      if (!e.altKey) return;
      const dir = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }[e.key];
      if (!dir) return;
      e.preventDefault();
      step(dir);
    });
    if (glass) {
      let idleTimer = 0;
      const restage = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(refreshBackdrop, 180);
      };
      window.addEventListener("resize", restage, { passive: true });
      window.addEventListener("scroll", restage, { passive: true });
      try {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", restage);
      } catch {
      }
    }
    const closable = () => mode === "menu" || mode === "result";
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (!closable()) return;
        if (e.composedPath && e.composedPath().includes(host)) return;
        renderIdle();
      },
      true
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && closable()) renderIdle(true);
    });
    let mountTries = 0;
    function firstRender() {
      if (host.isConnected) {
        renderIdle();
        refreshBackdrop();
        return;
      }
      if (mountTries++ < 120) setTimeout(firstRender, 32);
    }
    function setView(next, pill) {
      const { w, h } = measure(next);
      next.classList.add("view");
      next.style.width = w + "px";
      const previous = view;
      if (previous) {
        previous.classList.add("leaving");
        previous.classList.remove("in");
        setTimeout(() => previous.remove(), 220);
      }
      shell.append(next);
      view = next;
      if (glass) {
        glass.reshape(w, h, pill ? h / 2 : SHEET_RADIUS);
        glass.ripple(
          at[1] === "l" ? -w / 2 : w / 2,
          at[0] === "t" ? -h / 2 : h / 2
        );
      }
      const apply = () => {
        shell.style.width = w + "px";
        shell.style.height = h + "px";
        shell.style.borderRadius = pill ? h / 2 + "px" : "";
        next.classList.add("in");
        paintGlass(performance.now() + 460);
      };
      if (!shell.classList.contains("ready")) {
        apply();
        requestAnimationFrame(() => shell.classList.add("ready"));
      } else {
        requestAnimationFrame(apply);
      }
      return next;
    }
    function renderIdle(focus) {
      settled = true;
      mode = "idle";
      const fab = document.createElement("button");
      fab.className = "fab";
      fab.type = "button";
      fab.title = "Download this book. Drag to any corner, or Alt+arrows from the keyboard";
      fab.setAttribute("aria-haspopup", "menu");
      fab.setAttribute("aria-expanded", "false");
      fab.innerHTML = ICON + "<span>Download book</span>";
      fab.addEventListener("click", () => renderMenu());
      setView(fab, true);
      if (focus) fab.focus();
    }
    function renderMenu(focusTranslate = false) {
      settled = false;
      mode = "menu";
      const panel = document.createElement("div");
      panel.className = "panel";
      const head = document.createElement("div");
      head.className = "head";
      head.title = "Drag to move the pane to another corner";
      const site = document.createElement("span");
      site.className = "site";
      site.textContent = siteName;
      head.append(site);
      head.insertAdjacentHTML("beforeend", GRIP);
      const list = document.createElement("div");
      list.className = "fmt";
      list.setAttribute("role", "menu");
      const ordered = FORMATS.slice().sort((a, b) => {
        if (a.id === defaultFormat) return -1;
        if (b.id === defaultFormat) return 1;
        return 0;
      });
      for (const f of ordered) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "menuitem");
        b.innerHTML = "<span>" + f.label + '</span><span class="hint">' + f.hint + "</span>";
        b.addEventListener("click", () => {
          void start(f.id);
        });
        list.append(b);
      }
      list.addEventListener("keydown", (e) => {
        if (e.altKey) return;
        const delta = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        if (!delta) return;
        e.preventDefault();
        const items = [...list.querySelectorAll("button")];
        const i = items.indexOf(shadow.activeElement);
        items[(i + delta + items.length) % items.length].focus();
      });
      const tr = document.createElement("label");
      tr.className = "tr" + (translateTo ? " on" : "");
      const trLabel = document.createElement("span");
      trLabel.textContent = "Translate";
      const pick2 = document.createElement("span");
      pick2.className = "pick";
      const select = document.createElement("select");
      select.setAttribute("aria-label", "Translate the book into");
      select.append(new Option("Off", ""), ...LANGUAGES.map((l) => new Option(l.label, l.code)));
      select.value = translateTo;
      pick2.append(select);
      pick2.insertAdjacentHTML("beforeend", CHEVRON);
      tr.append(trLabel, pick2);
      const note = document.createElement("div");
      note.className = "tr-note";
      note.textContent = "Chapter text is sent to Google Translate.";
      note.hidden = !translateTo;
      select.addEventListener("change", () => {
        translateTo = normalizeTarget(select.value);
        if (onTranslateChange) onTranslateChange(translateTo);
        renderMenu(true);
      });
      panel.append(head, tr, note, list);
      setView(panel, false);
      const first = focusTranslate ? select : list.querySelector("button");
      if (first) first.focus();
    }
    function renderProgress() {
      settled = false;
      mode = "progress";
      const wrap = document.createElement("div");
      wrap.className = "pad";
      const label = document.createElement("div");
      label.className = "label";
      label.setAttribute("role", "status");
      label.textContent = "Starting\u2026";
      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("i");
      bar.append(fill);
      const row = document.createElement("div");
      row.className = "row";
      const cancel = document.createElement("button");
      cancel.className = "link";
      cancel.type = "button";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", () => {
        if (controller) controller.abort();
        renderIdle(true);
      });
      row.append(cancel);
      wrap.append(label, bar, row);
      setView(wrap, false);
      return { label, fill };
    }
    function renderResult({ error, filename, note }) {
      settled = true;
      mode = "result";
      const wrap = document.createElement("div");
      wrap.className = "pad";
      const msg = document.createElement("div");
      msg.className = error ? "err" : "label ok";
      msg.setAttribute("role", "status");
      msg.textContent = error ? "Did not work: " + error : "Done: " + filename;
      if (!error && note) {
        const warn = document.createElement("span");
        warn.className = "note";
        warn.textContent = note;
        msg.append(warn);
      }
      const row = document.createElement("div");
      row.className = "row";
      const again = document.createElement("button");
      again.className = "link";
      again.type = "button";
      again.textContent = error ? "Try another format" : "Download another";
      again.addEventListener("click", () => renderMenu());
      row.append(again);
      wrap.append(msg, row);
      setView(wrap, false);
      if (!error && !note) {
        setTimeout(() => {
          if (settled) renderIdle();
        }, 6e3);
      }
    }
    async function start(format) {
      const ui = renderProgress();
      controller = new AbortController();
      const progress = (text, pct) => {
        ui.label.textContent = text;
        if (typeof pct === "number") {
          ui.fill.style.width = Math.min(99, Math.max(2, pct)) + "%";
        }
      };
      try {
        const result = await onDownload({ format, translateTo, progress, signal: controller.signal });
        ui.fill.style.width = "100%";
        renderResult({ filename: result.filename, note: result.note });
      } catch (err) {
        if (controller && controller.signal.aborted) return;
        const e = err;
        renderResult({ error: e && e.message ? e.message : String(err) });
      } finally {
        controller = null;
      }
    }
    firstRender();
    return {
      host,
      openMenu: renderMenu,
      start,
      moveTo: (next) => moveTo(next, true),
      corner: () => at
    };
  }

  // src/content.ts
  function main() {
    if (document.getElementById("virebook-root")) return;
    const url = location.href;
    const adapter = resolveAdapter(url);
    function looksLikeBook() {
      if (adapter.id !== "generic") return adapter.isWorkPage(url);
      const main2 = findMainContent(document);
      return !!main2 && (main2.textContent || "").length > 2500;
    }
    const forced = window.__VIREBOOK_FORCED__ === true;
    if (!forced && !looksLikeBook()) return;
    async function nativeDownload(format) {
      if (!adapter.native) return null;
      let links;
      try {
        links = adapter.native(document) || [];
      } catch {
        return null;
      }
      const match = links.find((l) => l.format === format);
      if (!match || !match.url) return null;
      const a = document.createElement("a");
      a.href = match.url;
      a.download = "";
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 15e3);
      return { filename: `${format.toUpperCase()} from the site` };
    }
    async function onDownload({ format, translateTo, progress, signal }) {
      if (!translateTo) {
        progress("Checking for a ready-made file on the site\u2026", 3);
        const native2 = await nativeDownload(format);
        if (native2) return native2;
      }
      const result = await buildBook({
        doc: document,
        url,
        format,
        progress,
        signal,
        translateTo: translateTo || void 0
      });
      progress("Saving the file\u2026", 99);
      saveBlob(result.blob, result.filename);
      return {
        filename: result.filename,
        note: [result.missing ? `Chapters not parsed: ${result.missing}` : "", result.untranslated ?? ""].filter(Boolean).join(" ")
      };
    }
    function mount(prefs) {
      const widget = create({
        siteName: siteLabel(url),
        defaultFormat: prefs?.defaultFormat || "epub",
        // The corner the reader threw the pane into last time: which spot does not
        // cover the text differs per site, and setting it again every time is the
        // same chore the whole extension exists to remove.
        corner: prefs?.widgetCorner,
        onCornerChange: (next) => {
          try {
            chrome.storage.sync.set({ widgetCorner: next });
          } catch {
          }
        },
        translateTo: prefs?.translateTo,
        onTranslateChange: (code) => {
          try {
            chrome.storage.sync.set({ translateTo: code });
          } catch {
          }
        },
        onDownload
      });
      document.documentElement.appendChild(widget.host);
      window.__VIREBOOK_WIDGET__ = widget;
    }
    try {
      chrome.storage.sync.get({ defaultFormat: "epub", widgetCorner: "br", translateTo: "" }, (s) => mount(s));
    } catch {
      mount(null);
    }
  }
  main();
})();
