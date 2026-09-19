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
    const { baseUrl = "", keepImages = true, dropSelectors = [] } = opts;
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
    if (!/<(p|div|h[1-6]|blockquote|ul|ol|pre)[\s>]/.test(xhtml) && xhtml) {
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
      const density2 = linkDensity(el);
      if (density2 > 0.35) continue;
      let score = text.length * (1 - density2) + paragraphs * 60;
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
  var SITE = "Archive of Our Own";
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
      siteName: SITE,
      summaryXhtml,
      summaryText,
      ...readMeta(fullDoc),
      expectedChapters: nodes.length,
      chapters
    });
  }
  var ao3 = {
    id: "ao3",
    name: SITE,
    match: (url) => /(^|\.)archiveofourown\.org$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/works\/\d+/.test(url),
    native,
    parse
  };

  // src/adapters/fanficsme.ts
  var SITE2 = "Fanfics.me";
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
      siteName: SITE2,
      expectedChapters: links.length > 1 ? links.length : 0,
      chapters
    });
  }
  var fanficsme = {
    id: "fanficsme",
    name: SITE2,
    match: (url) => /(^|\.)fanfics\.me$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/fic\d+|\/read/.test(url),
    parse: parse2
  };

  // src/adapters/ffnet.ts
  var SITE3 = "FanFiction.net";
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
      siteName: SITE3,
      expectedChapters: count,
      chapters
    });
  }
  var ffnet = {
    id: "ffnet",
    name: SITE3,
    match: (url) => /(^|\.)fanfiction\.net$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/s\/\d+/.test(url),
    parse: parse3
  };

  // src/adapters/ficbook.ts
  var PACING = { interval: 800, maxInterval: 2e4, concurrency: 2 };
  var SITE4 = "Ficbook";
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
  function readAuthor(doc) {
    const links = Array.from(
      doc.querySelectorAll('a[href^="/authors/"], a[href*="ficbook.net/authors/"]')
    );
    const names = links.map((a) => norm(a.textContent)).filter((t) => t && t.length > 1 && t.length < 60);
    return Array.from(new Set(names)).slice(0, 3).join(", ");
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
          siteName: SITE4,
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
          siteName: SITE4,
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
      siteName: SITE4,
      ...meta,
      ...summary,
      expectedChapters: links.length,
      chapters
    });
  }
  var ficbook = {
    id: "ficbook",
    name: SITE4,
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
      siteName: new URL(url).hostname.replace(/^www\./, ""),
      expectedChapters: expected,
      chapters
    });
  }
  var generic = {
    id: "generic",
    name: "Any site",
    match: () => true,
    isWorkPage: () => true,
    parse: parse5
  };

  // src/adapters/royalroad.ts
  var SITE5 = "Royal Road";
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
        siteName: SITE5,
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
      siteName: SITE5,
      expectedChapters: links.length,
      chapters
    });
  }
  var royalroad = {
    id: "royalroad",
    name: SITE5,
    match: (url) => /(^|\.)royalroad\.com$/i.test(new URL(url).hostname),
    isWorkPage: (url) => /\/fiction\/\d+/.test(url),
    parse: parse6
  };

  // src/adapters/wattpad.ts
  var SITE6 = "Wattpad";
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
      siteName: SITE6,
      expectedChapters: parts.length,
      chapters
    });
  }
  var wattpad = {
    id: "wattpad",
    name: SITE6,
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

  // src/core.ts
  var RETRY_STATUS = /* @__PURE__ */ new Set([408, 425, 429, 500, 502, 503, 504]);
  var MAX_ATTEMPTS = 5;
  var MAX_WAIT = 6e4;
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
  function makeContext({ progress, signal, pacing }) {
    const parser = new DOMParser();
    const report = progress || (() => {
    });
    const limiter = createRateLimiter({
      interval: pacing?.interval ?? 600,
      maxInterval: pacing?.maxInterval ?? 15e3
    });
    const aborted = () => Boolean(signal && signal.aborted);
    async function pause(attempt, floor, status) {
      const delay = backoffDelay(attempt, { floor, max: MAX_WAIT });
      if (SLOW_DOWN.has(status)) {
        report(`The site asked us to slow down \u2014 continuing in ${Math.ceil(delay / 1e3)} s\u2026`);
      }
      await sleep(delay, signal);
    }
    async function request(url) {
      let last = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        await limiter.acquire(signal);
        if (aborted()) throw abortError();
        let res;
        try {
          res = await fetch(url, { credentials: "same-origin", redirect: "follow", signal });
        } catch (err) {
          if (aborted()) throw err;
          last = netError("The network is not responding \u2014 check your connection.");
          limiter.penalize(0);
          if (attempt < MAX_ATTEMPTS - 1) await pause(attempt, 0, 0);
          continue;
        }
        if (res.ok) {
          limiter.reward();
          return res;
        }
        if (!RETRY_STATUS.has(res.status)) throw netError(httpMessage(res.status));
        const floor = Math.min(MAX_WAIT, parseRetryAfter(res.headers.get("Retry-After")));
        last = netError(httpMessage(res.status));
        limiter.penalize(floor);
        if (attempt < MAX_ATTEMPTS - 1) await pause(attempt, floor, res.status);
      }
      throw last || netError("The request failed");
    }
    async function fetchText(url) {
      return (await request(url)).text();
    }
    async function fetchDoc(url) {
      return parser.parseFromString(await fetchText(url), "text/html");
    }
    function parseFragment(html) {
      return parser.parseFromString(`<body>${html}</body>`, "text/html").body;
    }
    async function fetchBytes(url) {
      return new Uint8Array(await (await request(url)).arrayBuffer());
    }
    return { fetchText, fetchDoc, fetchBytes, parseFragment, progress: report, signal };
  }
  var BUILDERS = {
    epub: { build, ext: "epub" },
    mobi: { build: build3, ext: "mobi" },
    fb2: { build: build2, ext: "fb2" },
    txt: { build: build4, ext: "txt" }
  };
  async function buildBook({ doc, url, format, progress, signal }) {
    const adapter = resolveAdapter(url);
    const ctx = makeContext({ progress, signal, pacing: adapter.pacing });
    progress(`Reading the page (${adapter.name})\u2026`, 2);
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
    const builder = BUILDERS[format] || BUILDERS.epub;
    progress(`Assembling ${builder.ext.toUpperCase()} (${book.chapters.length} ch.)\u2026`, 90);
    const blob = await builder.build(book);
    const filename = safeFilename(
      book.author ? `${book.title} \u2014 ${book.author}` : book.title,
      builder.ext
    );
    return { blob, filename, book, adapter: adapter.id, missing };
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

  // src/glass/vireglass.bundle.js
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var require_react_development = __commonJS({
    "../vire/node_modules/.pnpm/react@19.2.4/node_modules/react/cjs/react.development.js"(exports, module) {
      "use strict";
      (function() {
        function defineDeprecationWarning(methodName, info) {
          Object.defineProperty(Component.prototype, methodName, {
            get: function() {
              console.warn(
                "%s(...) is deprecated in plain JavaScript React classes. %s",
                info[0],
                info[1]
              );
            }
          });
        }
        function getIteratorFn(maybeIterable) {
          if (null === maybeIterable || "object" !== typeof maybeIterable)
            return null;
          maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
          return "function" === typeof maybeIterable ? maybeIterable : null;
        }
        function warnNoop(publicInstance, callerName) {
          publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
          var warningKey = publicInstance + "." + callerName;
          didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
            "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
            callerName,
            publicInstance
          ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
        }
        function Component(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        function ComponentDummy() {
        }
        function PureComponent(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        function noop() {
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          try {
            testStringCoercion(value);
            var JSCompiler_inline_result = false;
          } catch (e) {
            JSCompiler_inline_result = true;
          }
          if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(
              JSCompiler_inline_result,
              "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
              JSCompiler_inline_result$jscomp$0
            );
            return testStringCoercion(value);
          }
        }
        function getComponentNameFromType(type) {
          if (null == type) return null;
          if ("function" === typeof type)
            return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
          if ("string" === typeof type) return type;
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
              return "Activity";
          }
          if ("object" === typeof type)
            switch ("number" === typeof type.tag && console.error(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ), type.$$typeof) {
              case REACT_PORTAL_TYPE:
                return "Portal";
              case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
              case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
              case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
              case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                  return getComponentNameFromType(type(innerType));
                } catch (x) {
                }
            }
          return null;
        }
        function getTaskName(type) {
          if (type === REACT_FRAGMENT_TYPE) return "<>";
          if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
            return "<...>";
          try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
          } catch (x) {
            return "<...>";
          }
        }
        function getOwner() {
          var dispatcher = ReactSharedInternals.A;
          return null === dispatcher ? null : dispatcher.getOwner();
        }
        function UnknownOwner() {
          return Error("react-stack-top-frame");
        }
        function hasValidKey(config) {
          if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return false;
          }
          return void 0 !== config.key;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
              "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
              displayName
            ));
          }
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function elementRefGetterWithDeprecationWarning() {
          var componentName = getComponentNameFromType(this.type);
          didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
            "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
          ));
          componentName = this.props.ref;
          return void 0 !== componentName ? componentName : null;
        }
        function ReactElement(type, key, props, owner, debugStack, debugTask) {
          var refProp = props.ref;
          type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type,
            key,
            props,
            _owner: owner
          };
          null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: false,
            get: elementRefGetterWithDeprecationWarning
          }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
          type._store = {};
          Object.defineProperty(type._store, "validated", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: 0
          });
          Object.defineProperty(type, "_debugInfo", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: null
          });
          Object.defineProperty(type, "_debugStack", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugStack
          });
          Object.defineProperty(type, "_debugTask", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugTask
          });
          Object.freeze && (Object.freeze(type.props), Object.freeze(type));
          return type;
        }
        function cloneAndReplaceKey(oldElement, newKey) {
          newKey = ReactElement(
            oldElement.type,
            newKey,
            oldElement.props,
            oldElement._owner,
            oldElement._debugStack,
            oldElement._debugTask
          );
          oldElement._store && (newKey._store.validated = oldElement._store.validated);
          return newKey;
        }
        function validateChildKeys(node) {
          isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
        }
        function isValidElement(object) {
          return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        function escape(key) {
          var escaperLookup = { "=": "=0", ":": "=2" };
          return "$" + key.replace(/[=:]/g, function(match) {
            return escaperLookup[match];
          });
        }
        function getElementKey(element, index) {
          return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
        }
        function resolveThenable(thenable) {
          switch (thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
            default:
              switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
                function(fulfilledValue) {
                  "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
                },
                function(error) {
                  "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
                }
              )), thenable.status) {
                case "fulfilled":
                  return thenable.value;
                case "rejected":
                  throw thenable.reason;
              }
          }
          throw thenable;
        }
        function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
          var type = typeof children;
          if ("undefined" === type || "boolean" === type) children = null;
          var invokeCallback = false;
          if (null === children) invokeCallback = true;
          else
            switch (type) {
              case "bigint":
              case "string":
              case "number":
                invokeCallback = true;
                break;
              case "object":
                switch (children.$$typeof) {
                  case REACT_ELEMENT_TYPE:
                  case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                    break;
                  case REACT_LAZY_TYPE:
                    return invokeCallback = children._init, mapIntoArray(
                      invokeCallback(children._payload),
                      array,
                      escapedPrefix,
                      nameSoFar,
                      callback
                    );
                }
            }
          if (invokeCallback) {
            invokeCallback = children;
            callback = callback(invokeCallback);
            var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
            isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
              return c;
            })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
              callback,
              escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
                userProvidedKeyEscapeRegex,
                "$&/"
              ) + "/") + childKey
            ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
            return 1;
          }
          invokeCallback = 0;
          childKey = "" === nameSoFar ? "." : nameSoFar + ":";
          if (isArrayImpl(children))
            for (var i = 0; i < children.length; i++)
              nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
                nameSoFar,
                array,
                escapedPrefix,
                type,
                callback
              );
          else if (i = getIteratorFn(children), "function" === typeof i)
            for (i === children.entries && (didWarnAboutMaps || console.warn(
              "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
            ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
              nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
                nameSoFar,
                array,
                escapedPrefix,
                type,
                callback
              );
          else if ("object" === type) {
            if ("function" === typeof children.then)
              return mapIntoArray(
                resolveThenable(children),
                array,
                escapedPrefix,
                nameSoFar,
                callback
              );
            array = String(children);
            throw Error(
              "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
            );
          }
          return invokeCallback;
        }
        function mapChildren(children, func, context) {
          if (null == children) return children;
          var result = [], count = 0;
          mapIntoArray(children, result, "", "", function(child) {
            return func.call(context, child, count++);
          });
          return result;
        }
        function lazyInitializer(payload) {
          if (-1 === payload._status) {
            var ioInfo = payload._ioInfo;
            null != ioInfo && (ioInfo.start = ioInfo.end = performance.now());
            ioInfo = payload._result;
            var thenable = ioInfo();
            thenable.then(
              function(moduleObject) {
                if (0 === payload._status || -1 === payload._status) {
                  payload._status = 1;
                  payload._result = moduleObject;
                  var _ioInfo = payload._ioInfo;
                  null != _ioInfo && (_ioInfo.end = performance.now());
                  void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
                }
              },
              function(error) {
                if (0 === payload._status || -1 === payload._status) {
                  payload._status = 2;
                  payload._result = error;
                  var _ioInfo2 = payload._ioInfo;
                  null != _ioInfo2 && (_ioInfo2.end = performance.now());
                  void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
                }
              }
            );
            ioInfo = payload._ioInfo;
            if (null != ioInfo) {
              ioInfo.value = thenable;
              var displayName = thenable.displayName;
              "string" === typeof displayName && (ioInfo.name = displayName);
            }
            -1 === payload._status && (payload._status = 0, payload._result = thenable);
          }
          if (1 === payload._status)
            return ioInfo = payload._result, void 0 === ioInfo && console.error(
              "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
              ioInfo
            ), "default" in ioInfo || console.error(
              "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
              ioInfo
            ), ioInfo.default;
          throw payload._result;
        }
        function resolveDispatcher() {
          var dispatcher = ReactSharedInternals.H;
          null === dispatcher && console.error(
            "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
          );
          return dispatcher;
        }
        function releaseAsyncTransition() {
          ReactSharedInternals.asyncTransitions--;
        }
        function enqueueTask(task) {
          if (null === enqueueTaskImpl)
            try {
              var requireString = ("require" + Math.random()).slice(0, 7);
              enqueueTaskImpl = (module && module[requireString]).call(
                module,
                "timers"
              ).setImmediate;
            } catch (_err) {
              enqueueTaskImpl = function(callback) {
                false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                  "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
                ));
                var channel2 = new MessageChannel();
                channel2.port1.onmessage = callback;
                channel2.port2.postMessage(void 0);
              };
            }
          return enqueueTaskImpl(task);
        }
        function aggregateErrors(errors) {
          return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
        }
        function popActScope(prevActQueue, prevActScopeDepth) {
          prevActScopeDepth !== actScopeDepth - 1 && console.error(
            "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
          );
          actScopeDepth = prevActScopeDepth;
        }
        function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
          var queue = ReactSharedInternals.actQueue;
          if (null !== queue)
            if (0 !== queue.length)
              try {
                flushActQueue(queue);
                enqueueTask(function() {
                  return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                });
                return;
              } catch (error) {
                ReactSharedInternals.thrownErrors.push(error);
              }
            else ReactSharedInternals.actQueue = null;
          0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
        }
        function flushActQueue(queue) {
          if (!isFlushing) {
            isFlushing = true;
            var i = 0;
            try {
              for (; i < queue.length; i++) {
                var callback = queue[i];
                do {
                  ReactSharedInternals.didUsePromise = false;
                  var continuation = callback(false);
                  if (null !== continuation) {
                    if (ReactSharedInternals.didUsePromise) {
                      queue[i] = callback;
                      queue.splice(0, i);
                      return;
                    }
                    callback = continuation;
                  } else break;
                } while (1);
              }
              queue.length = 0;
            } catch (error) {
              queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
            } finally {
              isFlushing = false;
            }
          }
        }
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
        var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
          isMounted: function() {
            return false;
          },
          enqueueForceUpdate: function(publicInstance) {
            warnNoop(publicInstance, "forceUpdate");
          },
          enqueueReplaceState: function(publicInstance) {
            warnNoop(publicInstance, "replaceState");
          },
          enqueueSetState: function(publicInstance) {
            warnNoop(publicInstance, "setState");
          }
        }, assign = Object.assign, emptyObject = {};
        Object.freeze(emptyObject);
        Component.prototype.isReactComponent = {};
        Component.prototype.setState = function(partialState, callback) {
          if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
            throw Error(
              "takes an object of state variables to update or a function which returns an object of state variables."
            );
          this.updater.enqueueSetState(this, partialState, callback, "setState");
        };
        Component.prototype.forceUpdate = function(callback) {
          this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
        };
        var deprecatedAPIs = {
          isMounted: [
            "isMounted",
            "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
          ],
          replaceState: [
            "replaceState",
            "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
          ]
        };
        for (fnName in deprecatedAPIs)
          deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
        ComponentDummy.prototype = Component.prototype;
        deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
        deprecatedAPIs.constructor = PureComponent;
        assign(deprecatedAPIs, Component.prototype);
        deprecatedAPIs.isPureReactComponent = true;
        var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
          H: null,
          A: null,
          T: null,
          S: null,
          actQueue: null,
          asyncTransitions: 0,
          isBatchingLegacy: false,
          didScheduleLegacyUpdate: false,
          didUsePromise: false,
          thrownErrors: [],
          getCurrentStack: null,
          recentlyCreatedOwnerStacks: 0
        }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
          return null;
        };
        deprecatedAPIs = {
          react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
          }
        };
        var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
        var didWarnAboutElementRef = {};
        var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
          deprecatedAPIs,
          UnknownOwner
        )();
        var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
        var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
          if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
            var event = new window.ErrorEvent("error", {
              bubbles: true,
              cancelable: true,
              message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
              error
            });
            if (!window.dispatchEvent(event)) return;
          } else if ("object" === typeof process && "function" === typeof process.emit) {
            process.emit("uncaughtException", error);
            return;
          }
          console.error(error);
        }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
          queueMicrotask(function() {
            return queueMicrotask(callback);
          });
        } : enqueueTask;
        deprecatedAPIs = Object.freeze({
          __proto__: null,
          c: function(size) {
            return resolveDispatcher().useMemoCache(size);
          }
        });
        var fnName = {
          map: mapChildren,
          forEach: function(children, forEachFunc, forEachContext) {
            mapChildren(
              children,
              function() {
                forEachFunc.apply(this, arguments);
              },
              forEachContext
            );
          },
          count: function(children) {
            var n = 0;
            mapChildren(children, function() {
              n++;
            });
            return n;
          },
          toArray: function(children) {
            return mapChildren(children, function(child) {
              return child;
            }) || [];
          },
          only: function(children) {
            if (!isValidElement(children))
              throw Error(
                "React.Children.only expected to receive a single React element child."
              );
            return children;
          }
        };
        exports.Activity = REACT_ACTIVITY_TYPE;
        exports.Children = fnName;
        exports.Component = Component;
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.Profiler = REACT_PROFILER_TYPE;
        exports.PureComponent = PureComponent;
        exports.StrictMode = REACT_STRICT_MODE_TYPE;
        exports.Suspense = REACT_SUSPENSE_TYPE;
        exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
        exports.__COMPILER_RUNTIME = deprecatedAPIs;
        exports.act = function(callback) {
          var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
          actScopeDepth++;
          var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
          try {
            var result = callback();
          } catch (error) {
            ReactSharedInternals.thrownErrors.push(error);
          }
          if (0 < ReactSharedInternals.thrownErrors.length)
            throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
          if (null !== result && "object" === typeof result && "function" === typeof result.then) {
            var thenable = result;
            queueSeveralMicrotasks(function() {
              didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
                "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
              ));
            });
            return {
              then: function(resolve, reject) {
                didAwaitActCall = true;
                thenable.then(
                  function(returnValue) {
                    popActScope(prevActQueue, prevActScopeDepth);
                    if (0 === prevActScopeDepth) {
                      try {
                        flushActQueue(queue), enqueueTask(function() {
                          return recursivelyFlushAsyncActWork(
                            returnValue,
                            resolve,
                            reject
                          );
                        });
                      } catch (error$0) {
                        ReactSharedInternals.thrownErrors.push(error$0);
                      }
                      if (0 < ReactSharedInternals.thrownErrors.length) {
                        var _thrownError = aggregateErrors(
                          ReactSharedInternals.thrownErrors
                        );
                        ReactSharedInternals.thrownErrors.length = 0;
                        reject(_thrownError);
                      }
                    } else resolve(returnValue);
                  },
                  function(error) {
                    popActScope(prevActQueue, prevActScopeDepth);
                    0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                      ReactSharedInternals.thrownErrors
                    ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                  }
                );
              }
            };
          }
          var returnValue$jscomp$0 = result;
          popActScope(prevActQueue, prevActScopeDepth);
          0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
            ));
          }), ReactSharedInternals.actQueue = null);
          if (0 < ReactSharedInternals.thrownErrors.length)
            throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
                return recursivelyFlushAsyncActWork(
                  returnValue$jscomp$0,
                  resolve,
                  reject
                );
              })) : resolve(returnValue$jscomp$0);
            }
          };
        };
        exports.cache = function(fn) {
          return function() {
            return fn.apply(null, arguments);
          };
        };
        exports.cacheSignal = function() {
          return null;
        };
        exports.captureOwnerStack = function() {
          var getCurrentStack = ReactSharedInternals.getCurrentStack;
          return null === getCurrentStack ? null : getCurrentStack();
        };
        exports.cloneElement = function(element, config, children) {
          if (null === element || void 0 === element)
            throw Error(
              "The argument must be a React element, but you passed " + element + "."
            );
          var props = assign({}, element.props), key = element.key, owner = element._owner;
          if (null != config) {
            var JSCompiler_inline_result;
            a: {
              if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
                config,
                "ref"
              ).get) && JSCompiler_inline_result.isReactWarning) {
                JSCompiler_inline_result = false;
                break a;
              }
              JSCompiler_inline_result = void 0 !== config.ref;
            }
            JSCompiler_inline_result && (owner = getOwner());
            hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
            for (propName in config)
              !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
          }
          var propName = arguments.length - 2;
          if (1 === propName) props.children = children;
          else if (1 < propName) {
            JSCompiler_inline_result = Array(propName);
            for (var i = 0; i < propName; i++)
              JSCompiler_inline_result[i] = arguments[i + 2];
            props.children = JSCompiler_inline_result;
          }
          props = ReactElement(
            element.type,
            key,
            props,
            owner,
            element._debugStack,
            element._debugTask
          );
          for (key = 2; key < arguments.length; key++)
            validateChildKeys(arguments[key]);
          return props;
        };
        exports.createContext = function(defaultValue) {
          defaultValue = {
            $$typeof: REACT_CONTEXT_TYPE,
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            _threadCount: 0,
            Provider: null,
            Consumer: null
          };
          defaultValue.Provider = defaultValue;
          defaultValue.Consumer = {
            $$typeof: REACT_CONSUMER_TYPE,
            _context: defaultValue
          };
          defaultValue._currentRenderer = null;
          defaultValue._currentRenderer2 = null;
          return defaultValue;
        };
        exports.createElement = function(type, config, children) {
          for (var i = 2; i < arguments.length; i++)
            validateChildKeys(arguments[i]);
          i = {};
          var key = null;
          if (null != config)
            for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
              "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
            )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
              hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
          var childrenLength = arguments.length - 2;
          if (1 === childrenLength) i.children = children;
          else if (1 < childrenLength) {
            for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
              childArray[_i] = arguments[_i + 2];
            Object.freeze && Object.freeze(childArray);
            i.children = childArray;
          }
          if (type && type.defaultProps)
            for (propName in childrenLength = type.defaultProps, childrenLength)
              void 0 === i[propName] && (i[propName] = childrenLength[propName]);
          key && defineKeyPropWarningGetter(
            i,
            "function" === typeof type ? type.displayName || type.name || "Unknown" : type
          );
          var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
          return ReactElement(
            type,
            key,
            i,
            getOwner(),
            propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
            propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
          );
        };
        exports.createRef = function() {
          var refObject = { current: null };
          Object.seal(refObject);
          return refObject;
        };
        exports.forwardRef = function(render) {
          null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
            "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
          ) : "function" !== typeof render ? console.error(
            "forwardRef requires a render function but was given %s.",
            null === render ? "null" : typeof render
          ) : 0 !== render.length && 2 !== render.length && console.error(
            "forwardRef render functions accept exactly two parameters: props and ref. %s",
            1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
          );
          null != render && null != render.defaultProps && console.error(
            "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
          );
          var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
          Object.defineProperty(elementType, "displayName", {
            enumerable: false,
            configurable: true,
            get: function() {
              return ownName;
            },
            set: function(name) {
              ownName = name;
              render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
            }
          });
          return elementType;
        };
        exports.isValidElement = isValidElement;
        exports.lazy = function(ctor) {
          ctor = { _status: -1, _result: ctor };
          var lazyType = {
            $$typeof: REACT_LAZY_TYPE,
            _payload: ctor,
            _init: lazyInitializer
          }, ioInfo = {
            name: "lazy",
            start: -1,
            end: -1,
            value: null,
            owner: null,
            debugStack: Error("react-stack-top-frame"),
            debugTask: console.createTask ? console.createTask("lazy()") : null
          };
          ctor._ioInfo = ioInfo;
          lazyType._debugInfo = [{ awaited: ioInfo }];
          return lazyType;
        };
        exports.memo = function(type, compare) {
          null == type && console.error(
            "memo: The first argument must be a component. Instead received: %s",
            null === type ? "null" : typeof type
          );
          compare = {
            $$typeof: REACT_MEMO_TYPE,
            type,
            compare: void 0 === compare ? null : compare
          };
          var ownName;
          Object.defineProperty(compare, "displayName", {
            enumerable: false,
            configurable: true,
            get: function() {
              return ownName;
            },
            set: function(name) {
              ownName = name;
              type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
            }
          });
          return compare;
        };
        exports.startTransition = function(scope) {
          var prevTransition = ReactSharedInternals.T, currentTransition = {};
          currentTransition._updatedFibers = /* @__PURE__ */ new Set();
          ReactSharedInternals.T = currentTransition;
          try {
            var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
            null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
            "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
          } catch (error) {
            reportGlobalError(error);
          } finally {
            null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
              "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
            )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
              "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
            ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
          }
        };
        exports.unstable_useCacheRefresh = function() {
          return resolveDispatcher().useCacheRefresh();
        };
        exports.use = function(usable) {
          return resolveDispatcher().use(usable);
        };
        exports.useActionState = function(action, initialState, permalink) {
          return resolveDispatcher().useActionState(
            action,
            initialState,
            permalink
          );
        };
        exports.useCallback = function(callback, deps) {
          return resolveDispatcher().useCallback(callback, deps);
        };
        exports.useContext = function(Context) {
          var dispatcher = resolveDispatcher();
          Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
            "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
          );
          return dispatcher.useContext(Context);
        };
        exports.useDebugValue = function(value, formatterFn) {
          return resolveDispatcher().useDebugValue(value, formatterFn);
        };
        exports.useDeferredValue = function(value, initialValue) {
          return resolveDispatcher().useDeferredValue(value, initialValue);
        };
        exports.useEffect = function(create2, deps) {
          null == create2 && console.warn(
            "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useEffect(create2, deps);
        };
        exports.useEffectEvent = function(callback) {
          return resolveDispatcher().useEffectEvent(callback);
        };
        exports.useId = function() {
          return resolveDispatcher().useId();
        };
        exports.useImperativeHandle = function(ref, create2, deps) {
          return resolveDispatcher().useImperativeHandle(ref, create2, deps);
        };
        exports.useInsertionEffect = function(create2, deps) {
          null == create2 && console.warn(
            "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useInsertionEffect(create2, deps);
        };
        exports.useLayoutEffect = function(create2, deps) {
          null == create2 && console.warn(
            "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useLayoutEffect(create2, deps);
        };
        exports.useMemo = function(create2, deps) {
          return resolveDispatcher().useMemo(create2, deps);
        };
        exports.useOptimistic = function(passthrough, reducer) {
          return resolveDispatcher().useOptimistic(passthrough, reducer);
        };
        exports.useReducer = function(reducer, initialArg, init) {
          return resolveDispatcher().useReducer(reducer, initialArg, init);
        };
        exports.useRef = function(initialValue) {
          return resolveDispatcher().useRef(initialValue);
        };
        exports.useState = function(initialState) {
          return resolveDispatcher().useState(initialState);
        };
        exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
          return resolveDispatcher().useSyncExternalStore(
            subscribe,
            getSnapshot,
            getServerSnapshot
          );
        };
        exports.useTransition = function() {
          return resolveDispatcher().useTransition();
        };
        exports.version = "19.2.4";
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
      })();
    }
  });
  var require_react = __commonJS({
    "../vire/node_modules/.pnpm/react@19.2.4/node_modules/react/index.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_development();
      }
    }
  });
  var clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  var clamp01 = (v) => clamp(v, 0, 1);
  var fresnelF0 = (ior) => ((ior - 1) / (ior + 1)) ** 2;
  var FRESNEL_GAIN = 17.5;
  var fresnelStrength = (ior) => clamp01(fresnelF0(ior) * FRESNEL_GAIN);
  var FRESNEL_EXPONENT = 5;
  var refractionStrength = (ior) => clamp01((ior - 1) / 0.6);
  var MAGNIFY_PER_DP = 6e-3;
  var refractionScale = (ior, thicknessDp) => 1 + MAGNIFY_PER_DP * thicknessDp * (1 - 1 / Math.max(ior, 1));
  var DISPERSION_PER_IOR = 1.1;
  var dispersion = (ior) => clamp01((ior - 1) * DISPERSION_PER_IOR);
  var ABSORB_PER_DP = 0.017;
  var absorption = (pathDp) => 1 - Math.exp(-ABSORB_PER_DP * Math.max(pathDp, 0));
  var edgeDensity = (thicknessDp, bevelDp2) => {
    const body = absorption(thicknessDp);
    if (body <= 0) return 1;
    return clamp(absorption(thicknessDp + bevelDp2) / body, 1, 4);
  };
  var BLUR_MAX = 12;
  var blur = (roughness) => clamp01(roughness) * BLUR_MAX;
  var specularPower = (roughness) => 160 - clamp01(roughness) * 152;
  var specularStrength = (ior, roughness) => clamp01(fresnelStrength(ior) * (1 - clamp01(roughness) * 0.6));
  var EDGE_PUSH_PER_BEVEL = 2.6;
  var edgePush = (ior, bevelDp2) => refractionStrength(ior) * EDGE_PUSH_PER_BEVEL * Math.max(bevelDp2, 0);
  var COOL = { r: 0.86, g: 1, b: 1.08 };
  var NEUTRAL = { r: 1, g: 1.02, b: 0.99 };
  var WARM = { r: 1.08, g: 1, b: 0.88 };
  var mixHue = (a, b, t) => ({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t
  });
  function mediumTint(ior) {
    const t = clamp01((ior - 1.2) / 0.55);
    const hue = t < 0.5 ? mixHue(COOL, NEUTRAL, t * 2) : mixHue(NEUTRAL, WARM, (t - 0.5) * 2);
    const lift = 0.34 + fresnelF0(ior) * 2.4;
    return { r: clamp01(hue.r * lift), g: clamp01(hue.g * lift), b: clamp01(hue.b * lift) };
  }
  var GATHER_PER_BEVEL = 4;
  var GATHER_MAX = 28;
  var gatherRadius = (bevelDp2) => clamp(Math.max(bevelDp2, 1) * GATHER_PER_BEVEL, 4, GATHER_MAX);
  var BODY_DENSITY = 0.19;
  var bodyDensity = (thicknessDp) => BODY_DENSITY * absorption(thicknessDp);
  var EDGE_LIGHT_GAIN = 6;
  var edgeLight = (ior) => clamp01(fresnelF0(ior) * EDGE_LIGHT_GAIN);
  var iridescence = (ior, filmNm) => filmNm <= 0 ? 0 : clamp01(fresnelStrength(ior) * 1.6);
  var diffraction = (ior) => clamp01(dispersion(ior) * 0.5);
  var colorPickup = (ior) => clamp(fresnelStrength(ior) * 0.9, 0, 0.42);
  var MATERIAL_RANGES = {
    ior: [1, 2],
    thickness: [0, 60],
    bevel: [0, 40],
    roughness: [0, 1],
    environment: [0, 1],
    legibility: [0, 1],
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
    ink: 1,
    presence: 0.05,
    film: 340
  };
  var VIREGLASS_MATERIAL_V5 = {
    ior: 1.5,
    thickness: 16,
    bevel: 8,
    roughness: 0.06,
    environment: 0.27,
    legibility: 0.26,
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
    thickness: 24,
    bevel: 16,
    roughness: 0.035,
    presence: 0.176
  };
  var VIREGLASS_MATERIAL = VIREGLASS_MATERIAL_V5;
  function materialForInk(material, carriesInk) {
    return { ...material, legibility: carriesInk ? VIREGLASS_LYRICS_MATERIAL.legibility : 0 };
  }
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
      edgePushDp: edgePush(m.ior, m.bevel),
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
      ink: m.ink,
      presence: m.presence,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: bodyDensity(m.thickness),
      edgeLight: edgeLight(m.ior),
      film: m.film,
      iridescence: iridescence(m.ior, m.film),
      diffraction: diffraction(m.ior),
      colorPickup: colorPickup(m.ior)
    };
  }
  var LEGACY_OPTICS = {
    "v3 \u0432\u0440\u0443\u0447\u043D\u0443\u044E": {
      blur: 4.32,
      refraction: 0.49,
      refractionScale: 1.05,
      bevelDp: 12.6,
      edgePushDp: 32.7,
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
      ink: 1,
      presence: 0,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: 0.14,
      edgeLight: 0.35,
      film: 0,
      iridescence: 0,
      diffraction: 0,
      colorPickup: 0
    },
    "v2": {
      blur: 5,
      refraction: 0.95,
      refractionScale: 1.34,
      bevelDp: 14,
      edgePushDp: 30,
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
      ink: 1,
      presence: 0,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: 0.14,
      edgeLight: 0.35,
      film: 0,
      iridescence: 0,
      diffraction: 0,
      colorPickup: 0
    },
    "v1": {
      blur: 12,
      refraction: 0.55,
      refractionScale: 1.14,
      bevelDp: 10,
      edgePushDp: 22,
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
      ink: 1,
      presence: 0,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: 0.14,
      edgeLight: 0.35,
      film: 0,
      iridescence: 0,
      diffraction: 0,
      colorPickup: 0
    }
  };
  var LEGACY_NAMES = Object.keys(LEGACY_OPTICS);
  var MATERIAL_PRESETS = {
    \u0412\u043E\u0434\u0430: VIREGLASS_MATERIAL_V4,
    \u0421\u0442\u0435\u043A\u043B\u043E: { ...VIREGLASS_MATERIAL_V4, ior: 1.45, thickness: 25, bevel: 12.6, roughness: 0.17 },
    \u041A\u0440\u0438\u0441\u0442\u0430\u043B\u043B: { ...VIREGLASS_MATERIAL_V4, ior: 1.7, thickness: 30, bevel: 16, roughness: 0.02 },
    \u041C\u0430\u0442\u043E\u0432\u043E\u0435: { ...VIREGLASS_MATERIAL_V4, roughness: 0.55 },
    \u0422\u043E\u043B\u0441\u0442\u043E\u0435: { ...VIREGLASS_MATERIAL_V4, thickness: 48, bevel: 22 },
    \u041F\u043B\u0451\u043D\u043A\u0430: { ...VIREGLASS_MATERIAL_V4, thickness: 4, bevel: 3 },
    \u0411\u0435\u043D\u0437\u0438\u043D: { ...VIREGLASS_MATERIAL_V4, ior: 1.5, thickness: 8, bevel: 6, film: 620 }
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
  function applyToggles(optics, toggles = {}) {
    const on = { ...ALL_EFFECTS_ON, ...toggles };
    const o = { ...optics, tint: { ...optics.tint } };
    if (!on.blur) o.blur = 0;
    if (!on.refraction) {
      o.refraction = 0;
      o.refractionScale = 1;
      o.edgePushDp = 0;
    }
    if (!on.fresnel) o.fresnel = 0;
    if (!on.bevel) o.bevelDp = 1;
    if (!on.specular) o.specular = 0;
    if (!on.dispersion) o.dispersion = 0;
    if (!on.tint) o.tintStrength = 0;
    if (!on.environment) o.environment = 0;
    if (!on.legibility) o.legibility = 0;
    if (!on.interference) o.iridescence = 0;
    if (!on.diffraction) o.diffraction = 0;
    return o;
  }
  var DEBUG_MODES = [
    "normal",
    "sdf",
    "mask",
    "edge",
    "fresnel",
    "refraction",
    "backdrop",
    "specular",
    "dispersion",
    "normals",
    "spectral",
    "adapt"
  ];
  function debugIndex(mode) {
    return DEBUG_MODES.indexOf(mode);
  }
  var roundedRectGeometry = (width, height, cornerRadius) => ({ width, height, cornerRadius });
  var halfMinDp = (g) => Math.max(Math.min(g.width, g.height) / 2, 1);
  var MAX_STRETCH = 0.34;
  var MAX_BEVEL_FRACTION = 0.5;
  var MAX_PUSH_FRACTION = 0.85;
  var bevelFraction = (g, o) => Math.min(MAX_BEVEL_FRACTION, o.bevelDp / halfMinDp(g));
  var bevelDp = (g, o) => Math.max(bevelFraction(g, o) * halfMinDp(g), 1);
  var edgePushDp = (g, o) => Math.min(o.edgePushDp, MAX_PUSH_FRACTION * halfMinDp(g));
  var SPHERICAL_PER_BEVEL = 0.26;
  var CHROMA_PER_BEVEL = 0.3;
  var sphericalDp = (g, o) => o.refraction * SPHERICAL_PER_BEVEL * bevelDp(g, o);
  var chromaDp = (g, o) => o.dispersion * CHROMA_PER_BEVEL * bevelDp(g, o);
  var shadowReachDp = (g) => Math.min(halfMinDp(g) * 0.16, 7);
  function morphReachDp(g, morph) {
    if (!morph || morph.smoothing <= 0) return 0;
    return Math.max(
      0,
      Math.abs(morph.offsetX) + morph.width / 2 - g.width / 2,
      Math.abs(morph.offsetY) + morph.height / 2 - g.height / 2
    );
  }
  var PAD_STEP = 8;
  var quantise = (v) => Math.ceil(v / PAD_STEP) * PAD_STEP;
  function lensPadDp(g, o, morph, dragLimit = 0) {
    const sampling = Math.max(
      edgePushDp(g, o) + sphericalDp(g, o) + chromaDp(g, o) + o.blur,
      o.gatherRadiusDp
    );
    const stretch = halfMinDp(g) * MAX_STRETCH;
    return quantise(sampling + dragLimit + stretch + morphReachDp(g, morph) + 2);
  }
  function surfacePadDp(g, dragLimit = 0, morph) {
    return quantise(shadowReachDp(g) * 1.2 + dragLimit + morphReachDp(g, morph) + 2);
  }
  var VG_SDF = `
float vgRoundRect(float2 p, float2 halfSize, float corner) {
  float2 q = abs(p) - halfSize + corner;
  return min(max(q.x, q.y), 0.0) + length(max(q, float2(0.0))) - corner;
}

float vgSmin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// \u0421\u0446\u0435\u043D\u0430 = \u043E\u0434\u043D\u0430 \u0444\u043E\u0440\u043C\u0430, \u0430 \u043F\u0440\u0438 k > 0 \u2014 \u0433\u043B\u0430\u0434\u043A\u043E\u0435 \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0434\u0432\u0443\u0445 (\u043C\u043E\u0440\u0444\u0438\u043D\u0433-\u044D\u043A\u0441\u043F\u0435\u0440\u0438\u043C\u0435\u043D\u0442).
float vgScene(float2 p, float2 halfSize, float corner,
              float2 offsetB, float2 halfB, float cornerB, float k) {
  float a = vgRoundRect(p, halfSize, corner);
  if (k <= 0.0) { return a; }
  return vgSmin(a, vgRoundRect(p - offsetB, halfB, cornerB), k);
}

// \u041E\u0442\u043A\u043B\u0438\u043A \u043D\u0430 \u043F\u0430\u043B\u0435\u0446. \u0414\u0435\u0444\u043E\u0440\u043C\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u041F\u041E\u041B\u0415 \u0432\u043E\u043A\u0440\u0443\u0433 \u0442\u043E\u0447\u043A\u0438 \u043A\u0430\u0441\u0430\u043D\u0438\u044F, \u0430 \u043D\u0435 \u0433\u0430\u0431\u0430\u0440\u0438\u0442 \u0444\u043E\u0440\u043C\u044B: \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u0443\u044F
// \u0448\u0438\u0440\u0438\u043D\u0443, \u0442\u044F\u0433\u0443 \u0437\u0430 \u043F\u0440\u0430\u0432\u044B\u0439 \u043A\u0440\u0430\u0439 \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0448\u044C \u0438 \u043D\u0430 \u043B\u0435\u0432\u043E\u043C \u2014 \u0443 \u0436\u0438\u0434\u043A\u043E\u0441\u0442\u0438 \u0442\u0430\u043A \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442. \u0417\u0434\u0435\u0441\u044C \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435
// \u0437\u0430\u0442\u0443\u0445\u0430\u0435\u0442 \u0441 \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435\u043C \u043E\u0442 \u043F\u0430\u043B\u044C\u0446\u0430, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0434\u0430\u043B\u044C\u043D\u0438\u0439 \u043A\u0440\u0430\u0439 \u0441\u0442\u043E\u0438\u0442 \u043D\u0430 \u043C\u0435\u0441\u0442\u0435.
//
// \u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0441\u043B\u0430\u0433\u0430\u0435\u043C\u044B\u0445 \u0437\u043D\u0430\u0447\u0438\u043C: \u0442\u044F\u0433\u0430 \u0441\u0434\u0432\u0438\u0433\u0430\u0435\u0442 \u043F\u043E\u043B\u0435, \u043D\u0430\u0436\u0430\u0442\u0438\u0435 \u0441\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442 \u0435\u0433\u043E \u043A \u043F\u0430\u043B\u044C\u0446\u0443, \u0432\u043E\u043B\u043D\u0430 \u0438\u0434\u0451\u0442
// \u043F\u043E\u0432\u0435\u0440\u0445 \u0443\u0436\u0435 \u0441\u043C\u0435\u0449\u0451\u043D\u043D\u043E\u0433\u043E \u2014 \u0438\u043D\u0430\u0447\u0435 \u0440\u044F\u0431\u044C \u043E\u0442\u0432\u044F\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0442 \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u0438 \u0436\u0438\u0432\u0451\u0442 \u0441\u0430\u043C\u0430 \u043F\u043E \u0441\u0435\u0431\u0435.
float2 vgTouchWarp(float2 p, float2 touch, float2 pull, float press, float radius,
                   float waveAmp, float wavePhase) {
  if (radius <= 0.0) { return p; }
  float2 d = p - touch;
  float r = length(d);

  // \u041F\u0430\u043B\u0435\u0446 \u2014 \u041F\u042F\u0422\u041D\u041E, \u0430 \u043D\u0435 \u0442\u043E\u0447\u043A\u0430, \u043D\u043E \u0438 \u043D\u0435 \u0436\u0451\u0441\u0442\u043A\u0438\u0439 \u0448\u0442\u0430\u043C\u043F: \u0432\u0435\u0440\u0448\u0438\u043D\u0430 \u0448\u0438\u0440\u043E\u043A\u0430\u044F, \u043A\u0440\u0430\u044F \u043C\u044F\u0433\u043A\u0438\u0435. \u041F\u043B\u043E\u0441\u043A\u0430\u044F
  // \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0430 \u0441 \u043E\u0431\u0440\u044B\u0432\u043E\u043C \u043D\u0430 \u043A\u0440\u0430\u044E \u0441\u0434\u0432\u0438\u0433\u0430\u0435\u0442 \u0443\u0447\u0430\u0441\u0442\u043E\u043A \u0446\u0435\u043B\u0438\u043A\u043E\u043C, \u0438 \u043F\u0440\u044F\u043C\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u043B\u043E\u043C\u0430\u0435\u0442\u0441\u044F
  // \u0441\u0442\u0443\u043F\u0435\u043D\u044C\u044E \u2014 \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u043E\u0439, \u0445\u043E\u0442\u044F \u043F\u0430\u043B\u0435\u0446 \u043A\u0440\u0443\u0433\u043B\u044B\u0439. \u0414\u0432\u043E\u0439\u043D\u043E\u0439 smoothstep
  // \u0434\u0430\u0451\u0442 \u0442\u0443 \u0436\u0435 \u0448\u0438\u0440\u0438\u043D\u0443 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0430 \u0431\u0435\u0437 \u044D\u0442\u043E\u0439 \u0441\u0442\u0443\u043F\u0435\u043D\u0438.
  //
  // \u0412\u043B\u0438\u044F\u043D\u0438\u0435 \u043E\u0431\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u0440\u0430\u0434\u0438\u0443\u0441\u0435, \u0430 \u043D\u0435 \u0440\u0430\u0441\u0442\u0432\u043E\u0440\u044F\u0435\u0442\u0441\u044F \u0431\u0435\u0441\u043A\u043E\u043D\u0435\u0447\u043D\u044B\u043C \u0445\u0432\u043E\u0441\u0442\u043E\u043C, \u043A\u0430\u043A \u0443 \u0433\u0430\u0443\u0441\u0441\u0438\u0430\u043D\u044B:
  // \u0441 \u0445\u0432\u043E\u0441\u0442\u043E\u043C \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0440\u0430\u0441\u043F\u043B\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0443\u0437\u044B\u0440\u0451\u043C \u2014 \xAB\u0440\u0435\u0437\u0438\u043D\u043E\u0432\u044B\u0439 \u043C\u0430\u0442\u0440\u0430\u0446\xBB.
  float k = clamp((radius - r) / radius, 0.0, 1.0);
  float s = k * k * (3.0 - 2.0 * k);
  float core = s * s * (3.0 - 2.0 * s);
  // \u041A\u043E\u043B\u044C\u0446\u043E \u0432\u043E\u043A\u0440\u0443\u0433 \u043F\u044F\u0442\u043D\u0430: \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B, \u0443\u0448\u0435\u0434\u0448\u0438\u0439 \u0438\u0437-\u043F\u043E\u0434 \u043F\u0430\u043B\u044C\u0446\u0430, \u043E\u0431\u044F\u0437\u0430\u043D \u0433\u0434\u0435-\u0442\u043E \u043E\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F. \u0411\u0435\u0437 \u044D\u0442\u043E\u0433\u043E
  // \u0432\u0430\u043B\u0438\u043A\u0430 \u0444\u043E\u0440\u043C\u0430 \u043F\u0440\u043E\u0441\u0442\u043E \u0440\u0430\u0437\u0434\u0443\u0432\u0430\u0435\u0442\u0441\u044F, \u0430 \u043F\u043B\u043E\u0442\u043D\u0430\u044F \u0441\u0440\u0435\u0434\u0430 \u0442\u0430\u043A \u0441\u0435\u0431\u044F \u043D\u0435 \u0432\u0435\u0434\u0451\u0442.
  float rim = k * k * (1.0 - k) * 4.0;

  float2 q = p - pull * (core - 0.42 * rim);
  q -= d * (press * 0.16 * core);

  // \u0423 \u0432\u043E\u043B\u043D\u044B \u0441\u0432\u043E\u0439 \u043C\u0430\u0441\u0448\u0442\u0430\u0431, \u0432\u0434\u0432\u043E\u0435 \u0448\u0438\u0440\u0435 \u0440\u0430\u0434\u0438\u0443\u0441\u0430 \u0442\u044F\u0433\u0438: \u0440\u044F\u0431\u044C \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0434\u043E\u0431\u0435\u0436\u0430\u0442\u044C \u0434\u043E \u0434\u0430\u043B\u044C\u043D\u0435\u0433\u043E \u043A\u0440\u0430\u044F,
  // \u0438\u043D\u0430\u0447\u0435 \u043E\u043D\u0430 \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043A\u0430\u043A \u0434\u0440\u043E\u0436\u0430\u043D\u0438\u0435 \u043F\u043E\u0434 \u043F\u0430\u043B\u044C\u0446\u0435\u043C, \u0430 \u043D\u0435 \u043A\u0430\u043A \u0432\u043E\u043B\u043D\u0430 \u043F\u043E \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438. \u0414\u043B\u0438\u043D\u0430 \u0432\u043E\u043B\u043D\u044B
  // \u043A\u043E\u0440\u043E\u0442\u043A\u0430\u044F: \u0432 \u043F\u043B\u043E\u0442\u043D\u043E\u0439 \u0441\u0440\u0435\u0434\u0435 \u0440\u044F\u0431\u044C \u0447\u0430\u0441\u0442\u0430\u044F \u0438 \u043C\u0435\u043B\u043A\u0430\u044F, \u0434\u043B\u0438\u043D\u043D\u044B\u0435 \u043F\u043E\u043B\u043E\u0433\u0438\u0435 \u0432\u0430\u043B\u044B \u2014 \u044D\u0442\u043E \u0432\u043E\u0434\u0430.
  if (waveAmp > 0.0 && r > 0.0001) {
    float span = radius * 2.0;
    float ring = sin(r / (span * 0.17) - wavePhase * 6.2831853) * exp(-r / (span * 0.7));
    q -= (d / r) * ring * waveAmp;
  }
  return q;
}

// \u0410\u043D\u0430\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043D\u043E\u0440\u043C\u0430\u043B\u044C \u043E\u0434\u0438\u043D\u043E\u0447\u043D\u043E\u0439 \u0444\u043E\u0440\u043C\u044B: \u0440\u0430\u0434\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u043D\u0430 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0438, \u043E\u0441\u0435\u0432\u0430\u044F \u043D\u0430 \u043F\u0440\u044F\u043C\u044B\u0445 \u0443\u0447\u0430\u0441\u0442\u043A\u0430\u0445.
float2 vgRoundRectNormal(float2 p, float2 halfSize, float corner) {
  float2 q = abs(p) - halfSize + corner;
  float2 g = (q.x > 0.0 && q.y > 0.0)
    ? normalize(max(q, float2(0.0001)))
    : (q.x > q.y ? float2(1.0, 0.0) : float2(0.0, 1.0));
  return g * sign(p);
}

// \u041D\u043E\u0440\u043C\u0430\u043B\u044C \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u2014 \u0410\u041D\u0410\u041B\u0418\u0422\u0418\u0427\u0415\u0421\u041A\u0410\u042F, \u043A\u043E\u043D\u0435\u0447\u043D\u044B\u0445 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u0435\u0439 \u0437\u0434\u0435\u0441\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435\u0442.
//
// \u0412\u044B\u0432\u043E\u0434: \u0443 smin \u0434\u0432\u0430 \u0441\u043B\u0430\u0433\u0430\u0435\u043C\u044B\u0445, mix(b,a,h) \u0438 \u2212k\xB7h\xB7(1\u2212h). \u0418\u0445 \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u043D\u044B\u0435 \u043F\u043E h \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442
// \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C (1\u22122h) \u0441 \u043F\u0440\u043E\u0442\u0438\u0432\u043E\u043F\u043E\u043B\u043E\u0436\u043D\u044B\u043C\u0438 \u0437\u043D\u0430\u043A\u0430\u043C\u0438 \u0438 \u0441\u043E\u043A\u0440\u0430\u0449\u0430\u044E\u0442\u0441\u044F \u0440\u043E\u0432\u043D\u043E, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E h \u043B\u0438\u043D\u0435\u0439\u043D\u0430
// \u043F\u043E (b\u2212a)/k. \u041E\u0441\u0442\u0430\u0451\u0442\u0441\u044F mix(\u2207b, \u2207a, h) \u2014 \u0442\u043E \u0435\u0441\u0442\u044C \u043D\u043E\u0440\u043C\u0430\u043B\u0438 \u0434\u0432\u0443\u0445 \u0444\u043E\u0440\u043C, \u0441\u043C\u0435\u0448\u0430\u043D\u043D\u044B\u0435 \u0442\u0435\u043C \u0436\u0435 \u0432\u0435\u0441\u043E\u043C,
// \u043A\u0430\u043A\u0438\u043C \u0441\u043C\u0435\u0448\u0430\u043D\u044B \u0441\u0430\u043C\u0438 \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u044F.
//
// \u041F\u0440\u0435\u0436\u043D\u0438\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0431\u0440\u0430\u043B \u0447\u0435\u0442\u044B\u0440\u0435 \u0414\u041E\u041F\u041E\u041B\u041D\u0418\u0422\u0415\u041B\u042C\u041D\u042B\u0425 \u0432\u044B\u0447\u0438\u0441\u043B\u0435\u043D\u0438\u044F \u0441\u0446\u0435\u043D\u044B \u043D\u0430 \u043F\u0438\u043A\u0441\u0435\u043B\u044C (\u043A\u0430\u0436\u0434\u043E\u0435 \u2014 \u0434\u0432\u0435
// \u0444\u043E\u0440\u043C\u044B \u043F\u043B\u044E\u0441 smin) \u0438 \u043F\u0440\u0438 \u044D\u0442\u043E\u043C \u0431\u044B\u043B \u043F\u0440\u0438\u0431\u043B\u0438\u0436\u0435\u043D\u0438\u0435\u043C. \u0417\u0434\u0435\u0441\u044C \u0434\u0432\u0435 \u0444\u043E\u0440\u043C\u044B, \u0442\u043E\u0447\u043D\u043E.
float2 vgSceneNormal(float2 p, float2 halfSize, float corner,
                     float2 offsetB, float2 halfB, float cornerB, float k) {
  float2 na = vgRoundRectNormal(p, halfSize, corner);
  if (k <= 0.0) { return na; }
  float2 q = p - offsetB;
  float a = vgRoundRect(p, halfSize, corner);
  float b = vgRoundRect(q, halfB, cornerB);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return normalize(mix(vgRoundRectNormal(q, halfB, cornerB), na, h) + float2(1e-5, 1e-5));
}

// \u041F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0432 \u0444\u0430\u0441\u043A\u0435: 0 \u2014 \u043F\u043B\u043E\u0441\u043A\u0430\u044F \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0430, 1 \u2014 \u0441\u0430\u043C\u0430\u044F \u043A\u0440\u043E\u043C\u043A\u0430. \u041E\u0434\u043D\u0430 \u044D\u0442\u0430 \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u0430 \u043F\u0438\u0442\u0430\u0435\u0442
// \u043C\u0430\u0441\u043A\u0443, \u0442\u043E\u043B\u0449\u0438\u043D\u0443, \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u0435, \u0430\u0431\u0435\u0440\u0440\u0430\u0446\u0438\u0438 \u0438 \u0448\u0438\u0440\u0438\u043D\u0443 \u0441\u0432\u0435\u0442\u043E\u0432\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438.
float vgBevelT(float sd, float bevel) {
  return clamp((sd + bevel) / bevel, 0.0, 1.0);
}

// \u041D\u0430\u043A\u043B\u043E\u043D \u043F\u0440\u043E\u0444\u0438\u043B\u044F \u0444\u0430\u0441\u043A\u0438 \u2014 \u0441\u0444\u0435\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0439: t / sqrt(1 - t\xB2), \u043A\u0430\u043A \u0443 \u0448\u0430\u0440\u043E\u0432\u043E\u0433\u043E \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0430. \u041F\u0440\u0435\u0436\u043D\u0438\u0439
// t\xB2 \u0434\u0435\u0440\u0436\u0430\u043B \u043D\u0430\u043A\u043B\u043E\u043D \u043E\u043A\u043E\u043B\u043E \u043D\u0443\u043B\u044F \u043F\u043E\u0447\u0442\u0438 \u0432\u0441\u044E \u0444\u0430\u0441\u043A\u0443 \u0438 \u0432\u0437\u043B\u0435\u0442\u0430\u043B \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438, \u043E\u0442\u0447\u0435\u0433\u043E \u0432\u0441\u044F \u043E\u043F\u0442\u0438\u043A\u0430
// \u0441\u043E\u0431\u0438\u0440\u0430\u043B\u0430\u0441\u044C \u0432 \u0443\u0437\u043A\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u0447\u0438\u0442\u0430\u043B\u0430\u0441\u044C \u0428\u0410\u0419\u0411\u041E\u0419 \u2014 \u043F\u043B\u043E\u0441\u043A\u0438\u0439 \u0432\u0435\u0440\u0445 \u0438 \u0441\u0442\u0435\u043D\u043A\u0430 \u043F\u043E \u0431\u043E\u0440\u0442\u0443.
// \u0417\u0434\u0435\u0441\u044C \u043A\u0440\u0438\u0432\u0438\u0437\u043D\u0430 \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430 \u043F\u043E \u0444\u0430\u0441\u043A\u0435, \u0438 \u043A\u0440\u043E\u043C\u043A\u0430 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u0431\u044B\u0442\u044C \u043B\u0438\u043D\u0438\u0435\u0439.
//
// \u041F\u043E\u043B\u0435\u043C \u0437\u0440\u0435\u043D\u0438\u044F \u044D\u0442\u043E \u043F\u043E-\u043F\u0440\u0435\u0436\u043D\u0435\u043C\u0443 \u043D\u0435 \u043F\u0440\u0430\u0432\u0438\u0442: \u0433\u043D\u0451\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0444\u0430\u0441\u043A\u0430, \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0430 \u043F\u043B\u043E\u0441\u043A\u0430\u044F, \u0438\u043D\u0430\u0447\u0435
// \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043C\u044B\u043B\u044C\u043D\u044B\u043C \u043F\u0443\u0437\u044B\u0440\u0451\u043C.
float vgBevelSlope(float t) {
  return min(t * inversesqrt(max(1.0 - t * t * 0.94, 0.02)), 3.2);
}

// \u0421\u042B\u0413\u0420\u0410\u041D\u041D\u0410\u042F \u0414\u041E\u041B\u042F. \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u2014 \u044D\u0442\u043E \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435, \u0441\u0442\u0430\u0432\u0448\u0435\u0435 \u041F\u041E\u041B\u0415\u041C: \u0441\u043B\u0435\u0432\u0430 \u043E\u0442 \u0433\u0440\u0430\u043D\u0438\u0446\u044B \u0434\u0435\u0442\u0430\u043B\u044C
// \u0430\u043A\u0442\u0438\u0432\u043D\u0430, \u0441\u043F\u0440\u0430\u0432\u0430 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043E\u0431\u044B\u0447\u043D\u044B\u043C \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u0438 \u0433\u0440\u0430\u043D\u0438\u0446\u0430 \u0435\u0434\u0435\u0442. \u041E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0435\u0442
// \u043F\u043E\u043B\u0435 \u0446\u0435\u043B\u0438\u043A\u043E\u043C \u2014 \u043D\u043E\u043B\u044C \u0437\u0430\u043D\u044F\u0442 \u043D\u0430\u0447\u0430\u043B\u043E\u043C \u0442\u0440\u0435\u043A\u0430 \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u043C \u0431\u044B\u0442\u044C \u043D\u0435 \u043C\u043E\u0436\u0435\u0442.
//
// \u0413\u0440\u0430\u043D\u0438\u0446\u0430 \u041C\u042F\u0413\u041A\u0410\u042F. \u0420\u0435\u0437\u043A\u0438\u0439 \u0441\u0442\u044B\u043A \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0441\u043A\u043B\u0435\u0439\u043A\u043E\u0439 \u0434\u0432\u0443\u0445 \u0440\u0430\u0437\u043D\u044B\u0445 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432, \u0430 \u043D\u0435 \u0434\u0432\u0443\u043C\u044F
// \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F\u043C\u0438 \u043E\u0434\u043D\u043E\u0433\u043E; \u0448\u0438\u0440\u0438\u043D\u0430 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0430 \u0431\u0435\u0440\u0451\u0442\u0441\u044F \u0434\u043E\u043B\u0435\u0439 \u043F\u043E\u043B\u0443\u0448\u0438\u0440\u0438\u043D\u044B, \u0447\u0442\u043E\u0431\u044B \u043D\u0430 \u043A\u0440\u0443\u043F\u043D\u043E\u0439 \u0434\u0435\u0442\u0430\u043B\u0438
// \u043E\u043D \u043D\u0435 \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u043B \u043D\u0438\u0442\u043A\u043E\u0439, \u0430 \u043D\u0430 \u043C\u0435\u043B\u043A\u043E\u0439 \u043D\u0435 \u0441\u044A\u0435\u0434\u0430\u043B \u0435\u0451 \u0446\u0435\u043B\u0438\u043A\u043E\u043C.
float vgProgress(float2 p, float2 halfSize, float progress) {
  if (progress < 0.0) { return 0.0; }
  float edge = mix(-halfSize.x, halfSize.x, clamp(progress, 0.0, 1.0));
  float soft = max(halfSize.x * 0.05, 1.0);
  return 1.0 - smoothstep(edge - soft, edge + soft, p.x);
}
`;
  var VG_FALLOFF = 2.6;
  var HOLD_STIFFNESS = 260;
  var HOLD_DAMPING = 46;
  var RELEASE_STIFFNESS = 420;
  var RELEASE_DAMPING = 34;
  var PRESS_ATTACK = 0.07;
  var PRESS_RELEASE = 0.16;
  var WAVE_DECAY = 0.22;
  var WAVE_TURNS_PER_SECOND = 3;
  function createDeform() {
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
      waveAmp = Math.min(waveAmp + waveStart, waveStart * 1.6);
    }
    function drag(dx, dy, limit) {
      if (!held) return;
      const len = Math.hypot(dx, dy);
      const scale = len > 1e-3 ? limit * Math.tanh(len / limit) / len : 0;
      targetX = dx * scale;
      targetY = dy * scale;
    }
    function release(waveStart) {
      held = false;
      targetX = 0;
      targetY = 0;
      waveAmp = Math.min(waveAmp + waveStart, waveStart * 2);
    }
    function integrate(dt) {
      const k = held ? HOLD_STIFFNESS : RELEASE_STIFFNESS;
      const c = held ? HOLD_DAMPING : RELEASE_DAMPING;
      vx += (k * (targetX - pullX) - c * vx) * dt;
      vy += (k * (targetY - pullY) - c * vy) * dt;
      pullX += vx * dt;
      pullY += vy * dt;
      const pressTarget = held ? 1 : 0;
      const tau = held ? PRESS_ATTACK : PRESS_RELEASE;
      press += (pressTarget - press) * (1 - Math.exp(-dt / tau));
      active += (pressTarget - active) * (1 - Math.exp(-dt / 0.09));
      const follow = 1 - Math.exp(-dt / 0.045);
      touchX += (targetTouchX - touchX) * follow;
      touchY += (targetTouchY - touchY) * follow;
      wavePhase += dt * WAVE_TURNS_PER_SECOND;
      waveAmp *= Math.exp(-dt / WAVE_DECAY);
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
    function sample() {
      return { touchX, touchY, pullX, pullY, press, active, waveAmp, wavePhase };
    }
    return { grab, drag, release, step, idle, sample };
  }
  var LENS_SHADER = `
uniform shader content;

// \u0417\u043D\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u0430\u043C\u0430 \u0432\u044C\u044E\u0445\u0430: \u0441\u0432\u043E\u0439 \u0440\u0430\u0437\u043C\u0435\u0440 \u0438 \u0441\u0432\u043E\u0451 \u043C\u0435\u0441\u0442\u043E \u043D\u0430 \u044D\u043A\u0440\u0430\u043D\u0435.
uniform float2 u_center;
uniform float  u_reach;
uniform float2 u_contentMin;
uniform float2 u_contentMax;
// \u041E\u0446\u0435\u043D\u043A\u0430 \u0444\u043E\u043D\u0430 \u041F\u041E\u0414 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0438\u0437 \u043D\u0430\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0437\u043E\u043D\u0434\u0430: \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430, \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0430 \u0438 \u0441\u0440\u0435\u0434\u043D\u0438\u0439 \u0446\u0432\u0435\u0442, \u0443\u0436\u0435
// \u0441\u0433\u043B\u0430\u0436\u0435\u043D\u043D\u044B\u0435 \u043F\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438. \u041E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u2014 \u0437\u043E\u043D\u0434\u0430 \u0435\u0449\u0451 \u043D\u0435\u0442, \u0434\u0435\u0440\u0436\u0438\u043C\u0441\u044F \u043D\u0430 \u0441\u0432\u043E\u0438\u0445 \u043E\u0442\u0441\u0447\u0451\u0442\u0430\u0445.
uniform float  u_probeLuma;
uniform float  u_probeBusy;
// \u041A\u0440\u0430\u044F \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C. \u0421\u0443\u0434\u0438\u0442\u044C \u043F\u043E \u0441\u0440\u0435\u0434\u043D\u0435\u043C\u0443 \u043D\u0435\u043B\u044C\u0437\u044F: \u043D\u0430\u0434 \u0433\u0440\u0430\u043D\u0438\u0446\u0435\u0439 \u0447\u0451\u0440\u043D\u043E\u0433\u043E \u0438
// \u0431\u0435\u043B\u043E\u0433\u043E \u0441\u0440\u0435\u0434\u043D\u0435\u0435 \u2014 \u0441\u0435\u0440\u044B\u0439, \u043F\u0440\u0438 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \xAB\u0432\u0441\u0451 \u0432 \u043F\u043E\u0440\u044F\u0434\u043A\u0435\xBB, \u0430 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0442\u043E\u043D\u0435\u0442 \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u043E\u0439.
uniform float2 u_probeRange;
// \u041D\u0430\u043A\u043B\u043E\u043D \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B \u043F\u043E \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u0434\u043E\u043B\u0438 \u043D\u0430 \u043F\u043E\u043B\u0443\u0440\u0430\u0437\u043C\u0435\u0440. \u0422\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0413\u0420\u0410\u0414\u0418\u0415\u041D\u0422\u041D\u041E\u0415: \u0442\u0430\u043C, \u0433\u0434\u0435 \u043F\u043E\u0434
// \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u043E\u0434\u043D\u0430 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0430 \u0441\u0432\u0435\u0442\u043B\u0435\u0435 \u0434\u0440\u0443\u0433\u043E\u0439, \u043E\u0434\u043D\u0430 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u043D\u0430 \u0432\u0441\u044E \u0434\u0435\u0442\u0430\u043B\u044C \u043D\u0435 \u0440\u0430\u0437\u0432\u043E\u0434\u0438\u0442 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u043D\u0438
// \u0441 \u043E\u0434\u043D\u043E\u0439 \u0438\u0437 \u043D\u0438\u0445. \u041F\u043B\u043E\u0441\u043A\u043E\u0441\u0442\u044C \u2014 \u0441\u0430\u043C\u0430\u044F \u0433\u0440\u0443\u0431\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u044D\u0442\u043E \u043E\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442, \u0438 \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u0430\u044F
// \u0433\u043B\u0430\u0434\u043A\u0430\u044F \u043F\u043E \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044E: \u0442\u043E\u0447\u0435\u0447\u043D\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430 \u043D\u0430 \u0438\u0437\u043B\u043E\u043C\u0435 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u0438 \u0434\u0430\u0432\u0430\u043B\u0430 \u043F\u0440\u0438\u0437\u0440\u0430\u0447\u043D\u044B\u0435 \u043A\u043E\u043F\u0438\u0438 \u0442\u0435\u043A\u0441\u0442\u0430.
uniform float2 u_probeSlope;
uniform float3 u_probe;

// \u041C\u0430\u0442\u0435\u0440\u0438\u0430\u043B \u2014 \u043E\u0431\u0449\u0438\u043C \u043A\u0430\u043D\u0430\u043B\u043E\u043C \u0438\u0437 JS, \u0443\u0436\u0435 \u0432 \u043F\u0438\u043A\u0441\u0435\u043B\u044F\u0445 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430.
uniform float2 u_halfSize;
uniform float  u_corner;
uniform float  u_bevel;
uniform float  u_magnify;
uniform float  u_edgePush;
uniform float  u_chroma;
uniform float  u_spherical;
uniform float  u_frost;
uniform float  u_ink;
uniform float  u_legibility;
uniform float  u_presence;
uniform float  u_progress;
uniform float  u_adaptRadius;
uniform float3 u_bodyTint;
uniform float  u_bodyDensity;
uniform float  u_edgeLight;
uniform float  u_fresnel;
uniform float  u_fresnelPower;
uniform float  u_reflectReach;
uniform float  u_film;
uniform float  u_iridescence;
uniform float  u_diffraction;
uniform float  u_colorPickup;
uniform float2 u_morphOffset;
uniform float2 u_morphHalf;
uniform float  u_morphCorner;
uniform float  u_morphK;
uniform float  u_debug;
uniform float2 u_touch;
uniform float2 u_pull;
uniform float  u_touchPress;
uniform float  u_touchRadius;
uniform float2 u_wave;

${VG_SDF}

const float VG_FALLOFF = ${VG_FALLOFF};
// \u041E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0432 \u0434\u0438\u0441\u043A\u043E\u0432\u043E\u043C \u0441\u0431\u043E\u0440\u0435. \u0414\u0432\u0435\u043D\u0430\u0434\u0446\u0430\u0442\u0438 \u0445\u0432\u0430\u0442\u0430\u043B\u043E, \u043F\u043E\u043A\u0430 \u0440\u0430\u0434\u0438\u0443\u0441 \u0431\u044B\u043B \u043C\u0430\u043B; \u0441 \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435\u043C \u043F\u043E
// \u0440\u0430\u0437\u043C\u0430\u0445\u0443 \u0444\u043E\u043D\u0430 \u043E\u043D \u0434\u043E\u0445\u043E\u0434\u0438\u0442 \u0434\u043E \u0434\u0432\u0443\u0445 \u0434\u0435\u0441\u044F\u0442\u043A\u043E\u0432 \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439, \u0438 \u043D\u0430 \u0440\u0435\u0437\u043A\u043E\u0439 \u0433\u0440\u0430\u043D\u0438\u0446\u0435 \u0434\u0432\u0435\u043D\u0430\u0434\u0446\u0430\u0442\u044C
// \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u0441\u0442\u0443\u043F\u0435\u043D\u044C\u043A\u0430\u043C\u0438 \u2014 \u043D\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435, \u0430 \u043B\u0435\u0441\u0435\u043D\u043A\u0430 \u0438\u0437 \u043A\u043E\u043F\u0438\u0439.
const int   VG_FROST_TAPS = 20;
// \u0427\u0438\u0441\u043B\u043E \u043F\u0440\u043E\u0431 \u0440\u0430\u0441\u0442\u0451\u0442 \u0441 \u041F\u041B\u041E\u0429\u0410\u0414\u042C\u042E \u043A\u0440\u0443\u0433\u0430, \u0430 \u043D\u0435 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u044B\u043C. \u0428\u0443\u043C \u043E\u0446\u0435\u043D\u043A\u0438 \u2014 \u044D\u0442\u043E \u0440\u0430\u0437\u0431\u0440\u043E\u0441
// \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u0434\u0435\u043B\u0451\u043D\u043D\u044B\u0439 \u043D\u0430 \u043A\u043E\u0440\u0435\u043D\u044C \u0438\u0437 \u0447\u0438\u0441\u043B\u0430 \u043F\u0440\u043E\u0431: \u043D\u0430 \u0440\u0435\u0437\u043A\u043E\u043C \u0442\u0435\u043A\u0441\u0442\u0435 \u0434\u0432\u0430\u0434\u0446\u0430\u0442\u0438 \u043F\u0440\u043E\u0431
// \u043D\u0430 \u0440\u0430\u0434\u0438\u0443\u0441\u0435 \u0432 \u0441\u0435\u043C\u044C \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u043D\u0430 \xB118 \u0438\u0437 255, \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u043F\u043E\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043A\u0440\u0443\u043F\u043E\u0439. \u041F\u043E\u0442\u043E\u043B\u043E\u043A
// \u0441\u0442\u043E\u0438\u0442 \u043F\u043E\u0442\u043E\u043C\u0443, \u0447\u0442\u043E \u0432\u044B\u0431\u043E\u0440\u043A\u0430 \u0442\u0435\u043A\u0441\u0442\u0443\u0440\u044B \u2014 \u0441\u0430\u043C\u043E\u0435 \u0434\u043E\u0440\u043E\u0433\u043E\u0435 \u0437\u0434\u0435\u0441\u044C, \u0430 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435\u0433\u043E \u0440\u0430\u0434\u0438\u0443\u0441 \u0443\u0445\u043E\u0434\u0438\u0442
// \u0442\u043E\u043B\u044C\u043A\u043E \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438.
const int   VG_FROST_TAPS_MAX = 64;
/* \u041F\u043E\u043F\u0440\u0430\u0432\u043A\u0430 \u043D\u0430 \u0441\u0436\u0430\u0442\u0438\u0435 \u0443 \u0444\u0430\u0441\u043A\u0438 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0430. \u041E\u043D\u0430 \u0447\u0435\u0441\u0442\u043D\u043E \u0440\u0430\u0441\u0442\u0451\u0442 \u0434\u043E \u0431\u0435\u0441\u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0441\u0442\u0438 \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438,
   \u0430 \u0441 \u043D\u0435\u0439 \u0440\u0430\u0441\u0442\u0451\u0442 \u0438 \u0440\u0430\u0434\u0438\u0443\u0441 \u0441\u0431\u043E\u0440\u0430 \u2014 \u0442\u043E \u0435\u0441\u0442\u044C \u0448\u0443\u043C \u043E\u0446\u0435\u043D\u043A\u0438 \u0438 \u0446\u0435\u043D\u0430. \u0414\u0430\u043B\u044C\u0448\u0435 \u044D\u0442\u043E\u0433\u043E \u043F\u0440\u0435\u0434\u0435\u043B\u0430 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443
   \u0443 \u043A\u0440\u043E\u043C\u043A\u0438 \u0441\u043D\u0438\u043C\u0430\u0435\u0442 \u043D\u0435 \u0440\u0430\u0434\u0438\u0443\u0441, \u0430 \u043F\u043E\u0434\u043B\u043E\u0436\u043A\u0430 \u043F\u043E\u0434 \u043A\u0440\u0430\u0441\u043A\u043E\u0439. */
const float VG_FOOTPRINT_MAX = 1.8;
const float VG_TAU = 6.28318530718;
// \u0420\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043F\u043E \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0435, \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E \u043E\u0431\u044F\u0437\u0430\u043D\u043E \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0438\u0442\u044C \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u043F\u043E\u0432\u0435\u0440\u0445 \u0441\u0435\u0431\u044F \u043F\u0440\u0438
// \u043F\u043E\u043B\u043D\u043E\u0439 \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u0438. \u0412\u0435\u043B\u0438\u0447\u0438\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u0438, \u0430 \u043D\u0435 \u0440\u0443\u0447\u043A\u0430: \u043D\u0438\u0436\u0435 \u043D\u0435\u0451 \u0442\u0435\u043A\u0441\u0442 \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442 \u0442\u043E\u043D\u0443\u0442\u044C.
// \u041F\u0440\u0435\u0434\u0435\u043B, \u0437\u0430 \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0442\u0435\u043B\u0443 \u043D\u0435\u043B\u044C\u0437\u044F \u0432\u044B\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u043F\u043E\u0432\u0435\u0440\u0445 \u043E\u0441\u0442\u0430\u043B\u0430\u0441\u044C \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0439.
// \u042D\u0442\u043E \u041F\u041E\u0422\u041E\u041B\u041E\u041A, \u0430 \u043D\u0435 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u044C: \u043F\u0440\u0435\u0436\u043D\u044F\u044F \u043C\u043E\u0434\u0435\u043B\u044C \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043B\u0430 \u0431\u044B\u0442\u044C \xAB\u043D\u0430 sep \u0442\u0435\u043C\u043D\u0435\u0435\xBB \u043D\u0430\u0434\u043F\u0438\u0441\u0438, \u0438 \u043D\u0430
// \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0435 0.86 \u0441\u0447\u0438\u0442\u0430\u043B\u0430 \u0431\u0435\u043B\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0447\u0438\u0442\u0430\u0435\u043C\u044B\u043C \u2014 \u0430 \u043E\u043D \u0442\u0430\u043C \u043D\u0435 \u0432\u0438\u0434\u0435\u043D \u0432\u043E\u0432\u0441\u0435. \u041E\u0442\u0441\u044E\u0434\u0430 \u0438 \u0431\u0440\u0430\u043B\u0438\u0441\u044C
// \u0431\u0435\u043B\u044B\u0435 \u0438\u043A\u043E\u043D\u043A\u0438, \u0442\u043E\u043D\u0443\u0449\u0438\u0435 \u043D\u0430 \u0436\u0451\u043B\u0442\u043E\u043C \u0438 \u0437\u0435\u043B\u0451\u043D\u043E\u043C.
const float VG_BODY_CAP_LOOSE = 0.62;
const float VG_BODY_CAP_TIGHT = 0.38;
// \u0421\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u0442\u0438\u043D\u0442\u0430 \u0432 \u0434\u0432\u0443\u0445 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F\u0445. \u041D\u0435 \u0447\u0438\u0441\u0442\u044B\u0435 0 \u0438 1: \u0443 \u0441\u0442\u0435\u043A\u043B\u0430 \u0442\u0435\u043B\u043E \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442 \u043D\u0438 \u0443\u0433\u043E\u043B\u044C\u043D\u044B\u043C,
// \u043D\u0438 \u0431\u0443\u043C\u0430\u0436\u043D\u044B\u043C, \u0438 \u0443\u043F\u043E\u0440 \u0432 \u043A\u0440\u0430\u044F \u0434\u0430\u0451\u0442 \u043F\u043B\u043E\u0441\u043A\u0443\u044E \u0437\u0430\u043B\u0438\u0432\u043A\u0443 \u0432\u043C\u0435\u0441\u0442\u043E \u0441\u0440\u0435\u0434\u044B.
const float VG_TINT_DARK = 0.07;
const float VG_TINT_LIGHT = 0.94;
/* \u041D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u044B\u0433\u0440\u0430\u043D\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u0435\u0435 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0439 \u0434\u0435\u0442\u0430\u043B\u0438. \u0414\u0435\u0440\u0436\u0438\u0442\u0441\u044F \u0432 \u0442\u0435\u0445 \u0436\u0435 \u0435\u0434\u0438\u043D\u0438\u0446\u0430\u0445, \u0447\u0442\u043E \u0438
   \u0441\u0430\u043C\u043E \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u0438\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u044F, \u0438 \u041D\u0415\u0412\u042B\u0421\u041E\u041A\u0418\u041C: \u043D\u0430\u0434 \u0440\u043E\u0432\u043D\u044B\u043C \u0442\u0451\u043C\u043D\u044B\u043C \u0444\u043E\u043D\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0430\u044F \u043F\u0440\u0438\u0431\u0430\u0432\u043A\u0430
   \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0443 \u0434\u0435\u0442\u0430\u043B\u0438 \u0432 \u043C\u0430\u0442\u043E\u0432\u044B\u0439 \u0434\u0438\u0441\u043A \u2014 \u0440\u043E\u0432\u043D\u043E \u0442\u043E, \u0447\u0435\u0433\u043E \u043C\u043E\u0434\u0435\u043B\u044C \u0432\u0435\u043B\u0438\u0442 \u0438\u0437\u0431\u0435\u0433\u0430\u0442\u044C. */
const float VG_PROGRESS_PRESENCE = 0.10;
// \u041E\u043F\u043E\u0440\u043D\u044B\u0435 \u0434\u043B\u0438\u043D\u044B \u0432\u043E\u043B\u043D \u043A\u0430\u043D\u0430\u043B\u043E\u0432, \u043D\u043C. \u041E\u0442\u0441\u044E\u0434\u0430 \u0436\u0438\u0432\u0443\u0442 \u0412\u0421\u0415 \u0442\u0440\u0438 \u0441\u043F\u0435\u043A\u0442\u0440\u0430\u043B\u044C\u043D\u044B\u0445 \u044F\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0440\u0430\u0437\u0443:
// \u0434\u0438\u0441\u043F\u0435\u0440\u0441\u0438\u044F (\u043F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u03BB), \u0434\u0438\u0444\u0440\u0430\u043A\u0446\u0438\u044F \u0438 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u044F (\u0444\u0430\u0437\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u0442
// \u043E\u0442 \u03BB). \u041E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0445 \xAB\u0441\u0438\u043B \u0440\u0430\u0434\u0443\u0433\u0438\xBB \u0432 \u043C\u043E\u0434\u0435\u043B\u0438 \u043D\u0435\u0442.
const float3 VG_LAMBDA = float3(610.0, 550.0, 460.0);
// \u041E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u0435 \u043A\u0430\u043D\u0430\u043B\u0430 \u043F\u0440\u0438 \u0434\u0438\u0441\u043F\u0435\u0440\u0441\u0438\u0438, \u043D\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u043F\u043E \u0437\u0435\u043B\u0451\u043D\u043E\u043C\u0443 (\u041A\u043E\u0448\u0438, n ~ A+B/\u03BB\xB2).
// \u0417\u043D\u0430\u043A \u0432\u0430\u0436\u0435\u043D: \u0441\u0438\u043D\u0438\u0439 \u0433\u043D\u0451\u0442\u0441\u044F \u0421\u0418\u041B\u042C\u041D\u0415\u0415 \u043A\u0440\u0430\u0441\u043D\u043E\u0433\u043E, \u0438 \u043E\u0431\u0430 \u0432 \u043E\u0434\u043D\u0443 \u0441\u0442\u043E\u0440\u043E\u043D\u0443. \u0421\u0438\u043C\u043C\u0435\u0442\u0440\u0438\u0447\u043D\u0430\u044F \u043A\u0430\u0439\u043C\u0430,
// \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0431\u044B\u043B\u0430 \u0437\u0434\u0435\u0441\u044C \u0440\u0430\u043D\u044C\u0448\u0435, \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0446\u0432\u0435\u0442\u043D\u043E\u0439 \u043E\u0431\u0432\u043E\u0434\u043A\u043E\u0439, \u0430 \u043D\u0435 \u0440\u0430\u0441\u0449\u0435\u043F\u043B\u0435\u043D\u0438\u0435\u043C \u043B\u0443\u0447\u0430.
const float3 VG_CAUCHY = float3(-0.21, 0.0, 0.49);
// \u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043F\u043B\u0451\u043D\u043A\u0438. \u041D\u0435 \u0440\u0443\u0447\u043A\u0430: \u0443 \u0432\u0441\u0435\u0445 \u0442\u043E\u043D\u043A\u0438\u0445 \u043F\u043B\u0451\u043D\u043E\u043A \u043D\u0430 \u0441\u0442\u0435\u043A\u043B\u0435 \u043E\u043D \u043E\u043A\u043E\u043B\u043E \u044D\u0442\u043E\u0433\u043E.
const float VG_FILM_IOR = 1.35;

float vgLuma(float3 c) { return dot(c, float3(0.2126, 0.7152, 0.0722)); }

// \u0412\u043E\u0441\u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0435\u043C\u0430\u044F \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u0438 \u043E\u0431\u0440\u0430\u0442\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u0445\u043E\u0434 (CIE L*, \u043D\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0432 0\u20261). \u041D\u0443\u0436\u043D\u044B \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044E
// \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u043E\u0441\u0442\u0438: \u0433\u043B\u0430\u0437 \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u0448\u0430\u0433\u0438 \u0440\u0430\u0432\u043D\u044B\u043C\u0438 \u0432 L*, \u0430 \u043D\u0435 \u0432 \u044F\u0440\u043A\u043E\u0441\u0442\u0438, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0432 \u043B\u0438\u043D\u0435\u0439\u043D\u044B\u0445 \u0435\u0434\u0438\u043D\u0438\u0446\u0430\u0445
// \u043E\u0434\u0438\u043D \u0438 \u0442\u043E\u0442 \u0436\u0435 \u0448\u0430\u0433 \u0432 \u0442\u0435\u043D\u044F\u0445 \u0442\u0435\u0440\u044F\u0435\u0442\u0441\u044F, \u0430 \u0432 \u0441\u0432\u0435\u0442\u0430\u0445 \u043A\u0440\u0438\u0447\u0438\u0442.
float vgLstar(float y) {
  return y > 0.008856 ? 1.16 * pow(y, 1.0 / 3.0) - 0.16 : 9.033 * y;
}

float vgUnLstar(float l) {
  return l > 0.08 ? pow((l + 0.16) / 1.16, 3.0) : l / 9.033;
}

// \u0420\u0430\u0437\u0432\u043E\u0440\u043E\u0442 premultiplied \u0432 \u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u0446\u0432\u0435\u0442. \u0414\u0435\u043B\u0435\u043D\u0438\u0435 \u043E\u0434\u043D\u043E \u0438 \u0432 float: \u0443 half \u043E\u043A\u043E\u043B\u043E \u043D\u0443\u043B\u044F \u0448\u0430\u0433
// \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0433\u0440\u0443\u0431\u044B\u0439, \u0438 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0434\u0435\u043B\u0435\u043D\u0438\u0439 \u043F\u043E\u0434\u0440\u044F\u0434 \u043F\u043E\u0434\u043D\u0438\u043C\u0430\u044E\u0442 \u0448\u0443\u043C.
float3 vgUnpack(half4 c) {
  float a = float(c.a);
  return a > 0.004 ? float3(c.rgb) / a : float3(0.0);
}

// \u0417\u0430\u0445\u0432\u0430\u0442 \u043A\u043E\u043D\u0447\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043A\u0440\u0430\u044E \u044D\u043A\u0440\u0430\u043D\u0430. \u0412\u044B\u0431\u043E\u0440\u043A\u0430, \u0443\u0448\u0435\u0434\u0448\u0430\u044F \u0437\u0430 \u043D\u0435\u0433\u043E, \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043F\u0443\u0441\u0442\u043E\u0442\u0443, \u0438 \u0443
// \u0441\u0442\u0435\u043A\u043B\u0430 \u0432\u043E \u0432\u0441\u044E \u0448\u0438\u0440\u0438\u043D\u0443 \u0432\u0434\u043E\u043B\u044C \u043B\u0435\u0432\u043E\u0439 \u0438 \u043F\u0440\u0430\u0432\u043E\u0439 \u043A\u0440\u043E\u043C\u043E\u043A \u043F\u043E\u044F\u0432\u043B\u044F\u043B\u0430\u0441\u044C \u043F\u043E\u043B\u043E\u0441\u0430 \u0432\u043E\u043E\u0431\u0449\u0435 \u0431\u0435\u0437
// \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u044F. \u041F\u0440\u0438\u0436\u0438\u043C\u0430\u0435\u043C \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0443 \u043A \u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A\u0443, \u0433\u0434\u0435 \u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u0435\u0441\u0442\u044C: \u043A\u0440\u043E\u043C\u043A\u0430 \u0442\u043E\u0433\u0434\u0430
// \u0441\u0436\u0438\u043C\u0430\u0435\u0442 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0439 \u043A\u0443\u0441\u043E\u043A \u0444\u043E\u043D\u0430, \u0430 \u043D\u0435 \u043F\u0440\u043E\u0432\u0430\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u0434\u044B\u0440\u0443.
float2 vgInContent(float2 q) { return clamp(q, u_contentMin, u_contentMax); }

// \u041E\u0442\u0442\u0435\u043D\u043E\u043A \u0431\u0435\u0437 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B. \u041D\u0443\u0436\u0435\u043D \u0442\u0430\u043C, \u0433\u0434\u0435 \u0446\u0432\u0435\u0442 \u0431\u0435\u0440\u0443\u0442 \u0443 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430, \u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u044E\u0442 \u0441\u0432\u043E\u044E:
// \u0434\u0435\u043B\u0438\u0442\u044C \u043D\u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E \u043D\u0435\u043B\u044C\u0437\u044F \u2014 \u0443 \u043D\u0430\u0441\u044B\u0449\u0435\u043D\u043D\u043E\u0433\u043E \u0441\u0438\u043D\u0435\u0433\u043E \u043E\u043D\u0430 0.07, \u0438 \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C \u0443\u043B\u0435\u0442\u0430\u0435\u0442.
float3 vgHue(float3 c) {
  float l = vgLuma(c);
  // \u041D\u0438\u0436\u0435 \u043F\u043E\u0440\u043E\u0433\u0430 \u0443 \u0446\u0432\u0435\u0442\u0430 \u043E\u0442\u0442\u0435\u043D\u043A\u0430 \u043D\u0435\u0442: \u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u043A\u043E\u043D\u0441\u0442\u0430\u043D\u0442\u0443 \u043D\u0435 \u043D\u043E\u0440\u043C\u0438\u0440\u0443\u0435\u0442, \u0430 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043F\u043E\u0447\u0442\u0438
  // \u0447\u0451\u0440\u043D\u043E\u0435 \u2014 \u0438 \u0432\u0441\u0451, \u0447\u0442\u043E \u043A\u0440\u0430\u0441\u0438\u0442\u0441\u044F \u0442\u0430\u043A\u0438\u043C \xAB\u043E\u0442\u0442\u0435\u043D\u043A\u043E\u043C\xBB, \u0442\u0435\u0440\u044F\u0435\u0442 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u043D\u0438\u043C. \u041D\u0430\u0434 \u0442\u0451\u043C\u043D\u044B\u043C
  // \u0444\u043E\u043D\u043E\u043C \u0442\u0435\u043B\u043E \u043E\u0442 \u044D\u0442\u043E\u0433\u043E \u043D\u0435\u0434\u043E\u0431\u0438\u0440\u0430\u043B\u043E \u0432\u0442\u0440\u043E\u0435, \u0430 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u043E\u0441\u0442\u0438 \u043D\u0435 \u043C\u043E\u0433\u043B\u043E \u0435\u0433\u043E \u0432\u044B\u0442\u044F\u043D\u0443\u0442\u044C.
  if (l < 0.02) { return float3(1.0); }
  return clamp(c / l, float3(0.0), float3(2.0));
}

// \u0418\u041D\u0422\u0415\u0420\u0424\u0415\u0420\u0415\u041D\u0426\u0418\u042F \u0432 \u0442\u043E\u043D\u043A\u043E\u0439 \u043F\u043B\u0451\u043D\u043A\u0435. \u041B\u0443\u0447, \u043E\u0442\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0439 \u043E\u0442 \u0432\u0435\u0440\u0445\u043D\u0435\u0439 \u0433\u0440\u0430\u043D\u0438\u0446\u044B, \u0438 \u043B\u0443\u0447, \u043E\u0442\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0439 \u043E\u0442
// \u043D\u0438\u0436\u043D\u0435\u0439, \u043F\u0440\u0438\u0445\u043E\u0434\u044F\u0442 \u0441 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u044C\u044E \u0445\u043E\u0434\u0430 2\xB7n\xB7d\xB7cos\u03B8t. \u0413\u0434\u0435 \u043E\u043D\u0430 \u043A\u0440\u0430\u0442\u043D\u0430 \u0434\u043B\u0438\u043D\u0435 \u0432\u043E\u043B\u043D\u044B \u2014 \u043A\u0430\u043D\u0430\u043B
// \u0443\u0441\u0438\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F, \u0433\u0434\u0435 \u043F\u043E\u043B\u0443\u0446\u0435\u043B\u043E\u0439 \u2014 \u0433\u0430\u0441\u0438\u0442\u0441\u044F; \u0443 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u043A\u0430\u043D\u0430\u043B\u0430 \u0441\u0432\u043E\u044F \u03BB, \u043E\u0442\u0441\u044E\u0434\u0430 \u043F\u0435\u0440\u0435\u043B\u0438\u0432\u044B. \u03C0 \u0432 \u0444\u0430\u0437\u0435
// \u2014 \u0441\u043A\u0430\u0447\u043E\u043A \u043F\u0440\u0438 \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0438 \u043E\u0442 \u0431\u043E\u043B\u0435\u0435 \u043F\u043B\u043E\u0442\u043D\u043E\u0439 \u0441\u0440\u0435\u0434\u044B.
//
// \u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u041E\u0422\u0422\u0415\u041D\u041E\u041A: \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043D\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D \u043D\u0430 \u0441\u0432\u043E\u0451 \u0441\u0440\u0435\u0434\u043D\u0435\u0435, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u044F \u043A\u0440\u0430\u0441\u0438\u0442
// \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435, \u043D\u043E \u043D\u0435 \u0434\u0435\u043B\u0430\u0435\u0442 \u0435\u0433\u043E \u044F\u0440\u0447\u0435 \u0438\u043B\u0438 \u0442\u0435\u043C\u043D\u0435\u0435. \u0418\u043D\u0430\u0447\u0435 \u043D\u0430 \u0431\u0435\u043B\u043E\u043C \u0444\u043E\u043D\u0435 \u043E\u043D\u0430 \u0432\u044B\u0431\u0438\u0432\u0430\u043B\u0430 \u0431\u044B \u043A\u0430\u043D\u0430\u043B.
float3 vgInterference(float cosI) {
  float sinT2 = (1.0 - cosI * cosI) / (VG_FILM_IOR * VG_FILM_IOR);
  float cosT = sqrt(max(1.0 - sinT2, 0.0));
  float opd = 2.0 * VG_FILM_IOR * u_film * cosT;
  float3 i = 0.5 + 0.5 * cos(VG_TAU * opd / VG_LAMBDA + 3.14159265);
  return i / max((i.r + i.g + i.b) / 3.0, 0.001);
}

// \u0414\u0418\u0424\u0420\u0410\u041A\u0426\u0418\u042F \u043D\u0430 \u043A\u0440\u043E\u043C\u043A\u0435. \u0412\u043E\u043B\u043D\u0430, \u043E\u0431\u043E\u0433\u043D\u0443\u0432\u0448\u0430\u044F \u043A\u0440\u0430\u0439, \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \u0432 \u0442\u043E\u0447\u043A\u0443 \u0434\u0432\u0443\u043C\u044F \u043F\u0443\u0442\u044F\u043C\u0438, \u0438 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u044C
// \u0445\u043E\u0434\u0430 \u0440\u0430\u0441\u0442\u0451\u0442 \u043F\u043E \u043C\u0435\u0440\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u043E\u0442 \u043A\u0440\u0430\u044F. \u041F\u043E\u043B\u043E\u0441\u044B \u0442\u0435\u043C \u0447\u0430\u0449\u0435, \u0447\u0435\u043C \u043E\u0441\u0442\u0440\u0435\u0435 \u0444\u0430\u0441\u043A\u0430, \u2014 \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0435\u0451
// \u0448\u0438\u0440\u0438\u043D\u0430 \u0441\u0442\u043E\u0438\u0442 \u0432 \u0437\u043D\u0430\u043C\u0435\u043D\u0430\u0442\u0435\u043B\u0435. \u0422\u043E\u0436\u0435 \u043D\u043E\u0440\u043C\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u043D\u0430 \u0441\u0440\u0435\u0434\u043D\u0435\u0435: \u044D\u0442\u043E \u0446\u0432\u0435\u0442, \u043D\u0435 \u044F\u0440\u043A\u043E\u0441\u0442\u044C.
float3 vgDiffraction(float distFromEdge, float bevel) {
  float phase = VG_TAU * 4.0 * distFromEdge / max(bevel, 1.0);
  float3 d = 0.5 + 0.5 * cos(phase * (550.0 / VG_LAMBDA));
  return d / max((d.r + d.g + d.b) / 3.0, 0.001);
}

// \u041C\u044F\u0433\u043A\u043E\u0435 \u0441\u0436\u0430\u0442\u0438\u0435 \u0432\u043C\u0435\u0441\u0442\u043E \u0436\u0451\u0441\u0442\u043A\u043E\u0433\u043E \u043A\u043B\u0430\u043C\u043F\u0430. \u041D\u0430 \u0431\u0435\u043B\u043E\u043C \u0444\u043E\u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u043A\u0430 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F \u0432\u044B\u0431\u0438\u0432\u0430\u043B\u0430 \u043A\u0430\u043D\u0430\u043B \u0432
// \u0435\u0434\u0438\u043D\u0438\u0446\u0443, \u0438 \u0441\u0442\u0435\u043A\u043B\u043E \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u043B\u043E\u0441\u044C \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0435 \u043F\u044F\u0442\u043D\u043E \u0431\u0435\u0437 \u0435\u0434\u0438\u043D\u043E\u0439 \u0434\u0435\u0442\u0430\u043B\u0438 \u2014 \u043F\u0440\u0438 \u0442\u043E\u043C \u0447\u0442\u043E \u0434\u0435\u0442\u0430\u043B\u044C
// \u043F\u043E\u0434 \u043D\u0438\u043C \u0435\u0441\u0442\u044C. \u0417\u0434\u0435\u0441\u044C \u0432\u0441\u0451 \u0432\u044B\u0448\u0435 \u043F\u043E\u0440\u043E\u0433\u0430 \u0441\u0436\u0438\u043C\u0430\u0435\u0442\u0441\u044F \u0432 \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430 \u0438 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0442\u0435\u0440\u044F\u0435\u0442\u0441\u044F.
float vgHash(float2 p) {
  return fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453);
}

float3 vgSoftClip(float3 c) {
  float3 over = max(c - 0.86, float3(0.0));
  return min(c, float3(0.86)) + over * 0.14 / (0.14 + over);
}


// \u0421\u041E\u0411\u0421\u0422\u0412\u0415\u041D\u041D\u041E\u0415 \u0420\u0410\u0417\u041C\u042B\u0422\u0418\u0415. \u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435\u043D\u043D\u044B\u0439 \u0431\u043B\u044E\u0440 (dimezisBlurView) \u0443\u043C\u0435\u043D\u044C\u0448\u0430\u0435\u0442 \u0432\u044C\u044E\u0445\u0443, \u0440\u0430\u0437\u043C\u044B\u0432\u0430\u0435\u0442 \u0438
// \u0440\u0430\u0441\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442 \u043E\u0431\u0440\u0430\u0442\u043D\u043E, \u0430 \u043F\u043E\u043B\u043E\u0441\u044B \u043E\u0442 8-\u0431\u0438\u0442\u043D\u043E\u0433\u043E \u043E\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F \u0440\u0430\u0437\u0431\u0438\u0432\u0430\u0435\u0442 \u0434\u0438\u0437\u0435\u0440\u0438\u043D\u0433\u043E\u043C \u2014 \u044D\u0442\u043E \u0438 \u0435\u0441\u0442\u044C
// \u0437\u0435\u0440\u043D\u043E, \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0432\u0438\u0434\u043D\u043E \u043D\u0430 \u0442\u0451\u043C\u043D\u044B\u0445 \u0443\u0447\u0430\u0441\u0442\u043A\u0430\u0445. \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u0437\u0430\u0445\u0432\u0430\u0442 \u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D \u0447\u0438\u0441\u0442\u044B\u043C (RenderNode \u0431\u0435\u0437
// \u044D\u0444\u0444\u0435\u043A\u0442\u043E\u0432), \u0430 \u0440\u0430\u0437\u043C\u044B\u0432\u0430\u0435\u0442 \u0448\u0435\u0439\u0434\u0435\u0440: \u0443\u0441\u0440\u0435\u0434\u043D\u0435\u043D\u0438\u0435 \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0432 float \u0441\u0430\u043C\u043E \u0441\u0433\u043B\u0430\u0436\u0438\u0432\u0430\u0435\u0442 \u043F\u043E\u043B\u043E\u0441\u044B \u0438
// \u0441\u0432\u043E\u0435\u0433\u043E \u0448\u0443\u043C\u0430 \u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442.
//
// \u041E\u0442\u0441\u0447\u0451\u0442\u044B \u0438\u0434\u0443\u0442 \u043F\u043E \u0441\u043F\u0438\u0440\u0430\u043B\u0438 \u0441 \u0437\u043E\u043B\u043E\u0442\u044B\u043C \u0443\u0433\u043B\u043E\u043C \u2014 \u0440\u0430\u0432\u043D\u043E\u043C\u0435\u0440\u043D\u043E\u0435 \u043F\u043E\u043A\u0440\u044B\u0442\u0438\u0435 \u0434\u0438\u0441\u043A\u0430 \u0431\u0435\u0437 \u0440\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u043E\u0439 \u0441\u0435\u0442\u043A\u0438,
// \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0431\u044B\u043B \u0431\u044B \u0432\u0438\u0434\u0435\u043D \u043C\u0443\u0430\u0440. \u0421\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u043C PREMULTIPLIED \u2014 \u0442\u0430\u043A \u0443\u0441\u0440\u0435\u0434\u043D\u044F\u044E\u0442\u0441\u044F \u043F\u043E\u043B\u0443\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0435
// \u043F\u0438\u043A\u0441\u0435\u043B\u0438, \u0440\u0430\u0437\u0432\u043E\u0440\u043E\u0442 \u043E\u0434\u0438\u043D \u0438 \u043E\u0431\u0449\u0438\u0439.
float4 vgGather(float2 q, float radius, float2 seed) {
  float4 acc = float4(content.eval(vgInContent(q)));
  if (radius <= 0.25) { return acc; }
  if (radius < 4.0) {
    // \u041C\u0435\u043B\u043A\u0438\u0439 \u0440\u0430\u0437\u0431\u0440\u043E\u0441: \u0441\u043F\u0438\u0440\u0430\u043B\u044C \u0438\u0437 \u0434\u0432\u0443\u0445 \u0434\u0435\u0441\u044F\u0442\u043A\u043E\u0432 \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u043B\u043E\u0436\u0438\u0442\u0441\u044F \u0432 \u0442\u0435 \u0436\u0435 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439,
    // \u0430 \u0441\u0442\u043E\u0438\u0442 \u0432\u043F\u044F\u0442\u0435\u0440\u043E \u0434\u043E\u0440\u043E\u0436\u0435. \u041A\u0440\u0435\u0441\u0442 \u043F\u043E \u0447\u0435\u0442\u044B\u0440\u0451\u043C \u0442\u043E\u0447\u043A\u0430\u043C \u0434\u0430\u0451\u0442 \u0442\u043E\u0442 \u0436\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442.
    float r = radius * 0.7;
    acc += float4(content.eval(vgInContent(q + float2(r, 0.0))))
      + float4(content.eval(vgInContent(q - float2(r, 0.0))))
      + float4(content.eval(vgInContent(q + float2(0.0, r))))
      + float4(content.eval(vgInContent(q - float2(0.0, r))));
    return acc * 0.2;
  }
  float ca = cos(2.39996323);
  float sa = sin(2.39996323);
  // \u0421\u043F\u0438\u0440\u0430\u043B\u044C \u0440\u0430\u0437\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u0421\u0412\u041E\u0419 \u0443\u0433\u043E\u043B \u0432 \u043A\u0430\u0436\u0434\u043E\u043C \u043F\u0438\u043A\u0441\u0435\u043B\u0435. \u0421 \u043E\u0431\u0449\u0438\u043C \u0434\u043B\u044F \u0432\u0441\u0435\u0445 \u0443\u0433\u043B\u043E\u043C \u0434\u0432\u0430
  // \u0434\u0435\u0441\u044F\u0442\u043A\u0430 \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u043B\u043E\u0436\u0430\u0442\u0441\u044F \u0432 \u0441\u043E\u0441\u0435\u0434\u043D\u0438\u0445 \u043F\u0438\u043A\u0441\u0435\u043B\u044F\u0445 \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u043E, \u0438 \u043D\u0430 \u043C\u0435\u043B\u043A\u043E\u0439 \u0444\u0430\u043A\u0442\u0443\u0440\u0435 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C
  // \u044D\u0442\u043E \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043D\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435\u043C, \u0430 \u043A\u043E\u043C\u043A\u0430\u043C\u0438. \u041F\u0438\u043A\u0441\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0432\u043E\u0440\u043E\u0442 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0438\u0445 \u0432 \u043C\u0435\u043B\u043A\u043E\u0435 \u0437\u0435\u0440\u043D\u043E \u2014
  // \u0440\u043E\u0432\u043D\u043E \u0442\u043E, \u0447\u0435\u043C \u0438 \u0432\u044B\u0433\u043B\u044F\u0434\u0438\u0442 \u043C\u0430\u0442\u043E\u0432\u0430\u044F \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C.
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

/* \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u044F, dp. \u041F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u043A \u041C\u0410\u0421\u0428\u0422\u0410\u0411\u0423 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u043E\u0431\u044F\u0437\u0430\u043D\u043E \u0441\u043A\u0440\u044B\u0432\u0430\u0442\u044C: \u0441\u043F\u043E\u0440\u0438\u0442 \u0441
   \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u043D\u0430 \u0441\u0442\u0435\u043A\u043B\u0435 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u0434 \u043D\u0438\u043C, \u0430 \u043E\u043D \u0432\u044B\u0441\u043E\u0442\u043E\u0439 11\u201314 dp, \u0438 \u0447\u0442\u043E\u0431\u044B \u0440\u0430\u0437\u0440\u0443\u0448\u0438\u0442\u044C
   \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u0442\u0430\u043A\u043E\u0433\u043E \u0440\u0430\u0437\u043C\u0435\u0440\u0430, \u0440\u0430\u0434\u0438\u0443\u0441\u0430 \u043D\u0443\u0436\u043D\u043E \u043E\u043A\u043E\u043B\u043E \u0435\u0451 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u044B. \u041F\u0440\u0435\u0436\u043D\u0438\u0435 3.5 dp \u0431\u044B\u043B\u0438 \u043C\u0435\u043B\u044C\u0447\u0435
   \u0441\u0442\u0440\u043E\u043A\u0438: \u0442\u043E\u043D\u043A\u0438\u0439 \u0442\u0435\u043A\u0441\u0442 \u043E\u043D\u0438 \u0441\u043C\u0430\u0437\u044B\u0432\u0430\u043B\u0438, \u0430 \u043F\u043E\u043B\u0443\u0436\u0438\u0440\u043D\u044B\u0439 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u043B \u0441\u043A\u0432\u043E\u0437\u044C \u0441\u0442\u0435\u043A\u043B\u043E \u0446\u0435\u043B\u044B\u043C. */
const float VG_ADAPT_BLUR_MAX = 4.0;
/* \u041D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0431\u044B\u0441\u0442\u0440\u043E \u043E\u0442\u043A\u043B\u0438\u043A \u043D\u0430 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0432\u044B\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043F\u043E\u043B\u043A\u0443. \u041F\u043E\u0434\u043E\u0431\u0440\u0430\u043D\u043E \u043F\u043E \u0440\u0435\u0434\u043A\u043E\u0439
   \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0435: \u0441\u0442\u0440\u043E\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u043D\u043E\u0433\u043E \u0442\u0435\u043A\u0441\u0442\u0430 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0434\u0430\u0451\u0442 busy \u043E\u043A\u043E\u043B\u043E 0.12 \u2014 \u0437\u0430\u043C\u0435\u0440 \u0437\u043E\u043D\u0434\u0430 \u043F\u043E\u0434
   \u043F\u043B\u0430\u0448\u043A\u043E\u0439 \u0441 \u043F\u0440\u043E\u0435\u0437\u0436\u0430\u044E\u0449\u0438\u043C \u0441\u043F\u0438\u0441\u043A\u043E\u043C, \u2014 \u0438 \u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0432\u044B\u0431\u0438\u0440\u0430\u0442\u044C \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u043F\u043E\u0447\u0442\u0438 \u0446\u0435\u043B\u0438\u043A\u043E\u043C. */
const float VG_STRUCTURE_GAIN = 20.0;
/* \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0435\u043B\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u043D\u043E\u043C \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0438 \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u0438. \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u043D\u0438\u0437\u043A\u0438\u0439 \u043D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u043E: \u0432\u044B\u0448\u0435 \u0434\u0435\u0442\u0430\u043B\u044C
   \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0442\u043E, \u0447\u0442\u043E \u043F\u043E\u0434 \u043D\u0435\u0439, \u0438 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u0432 \u043A\u0440\u0430\u0448\u0435\u043D\u0443\u044E \u043F\u043B\u0430\u0448\u043A\u0443 \u2014 \u0430 \u0447\u0443\u0436\u043E\u0439 \u0442\u0435\u043A\u0441\u0442
   \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u0434\u0430\u0432\u0438\u0442 \u043D\u0435 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C\u044E, \u0430 \u0442\u0435\u043C, \u0447\u0442\u043E \u043E\u043D \u0440\u0435\u0437\u043A\u0438\u0439. */
/* \u041F\u043E\u043B \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u044F: \u0441\u0442\u043E\u043B\u044C\u043A\u043E \u0441\u0440\u0435\u0434\u044B \u0434\u0435\u0442\u0430\u043B\u044C \u0441 \u043A\u0440\u0430\u0441\u043A\u043E\u0439 \u0434\u0435\u0440\u0436\u0438\u0442 \u0412\u0421\u0415\u0413\u0414\u0410, \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E \u043E\u0442 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u043F\u043E\u0434
   \u043D\u0435\u0439. \u041D\u0438\u0437\u043A\u0438\u0439 \u043D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u043E \u2014 \u0432\u044B\u0448\u0435 \u0434\u0435\u0442\u0430\u043B\u044C \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u0431\u044B\u0442\u044C \u043E\u043A\u043D\u043E\u043C \u043D\u0430\u0434 \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u043C \u043F\u043E\u043B\u043E\u0442\u043D\u043E\u043C, \u0438 \u044D\u0442\u043E
   \u043B\u043E\u0432\u0438\u0442 check:optics. */
const float VG_GROUND_MIN = 0.50;
/* \u041F\u043E\u0442\u043E\u043B\u043E\u043A: \u0434\u043E \u0441\u0442\u043E\u043B\u044C\u043A\u0438 \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u0434\u043E\u0445\u043E\u0434\u0438\u0442 \u043D\u0430\u0434 \u041F\u0401\u0421\u0422\u0420\u042B\u041C \u043F\u043E\u043B\u043E\u0442\u043D\u043E\u043C, \u0433\u0434\u0435 \u0447\u0443\u0436\u0430\u044F \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0441\u043F\u043E\u0440\u0438\u0442 \u0441
   \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E. \u0420\u0430\u0437\u0432\u043E\u0434\u0438\u0442\u044C \u043F\u043E\u043B \u0438 \u043F\u043E\u0442\u043E\u043B\u043E\u043A \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E: \u043E\u0434\u043D\u0438\u043C \u0447\u0438\u0441\u043B\u043E\u043C \u043B\u0438\u0431\u043E \u0442\u0435\u0440\u044F\u0435\u0442\u0441\u044F \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0441\u0442\u044C \u043D\u0430\u0434
   \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u043C \u0444\u043E\u043D\u043E\u043C, \u043B\u0438\u0431\u043E \u0447\u0443\u0436\u043E\u0439 \u0442\u0435\u043A\u0441\u0442 \u0432\u0441\u0442\u0430\u0451\u0442 \u0432\u0440\u043E\u0432\u0435\u043D\u044C \u0441 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u0434\u0435\u0442\u0430\u043B\u0438. */
const float VG_GROUND_MAX = 0.80;
/* \u0412\u043E \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0437 \u043A\u0440\u043E\u043C\u043A\u0430 \u044F\u0440\u0447\u0435 \u0442\u043E\u0433\u043E \u043E\u0442\u0445\u043E\u0434\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043D\u0435 \u0434\u0430\u043B\u043E \u0442\u0435\u043B\u043E. \u0411\u043E\u043B\u044C\u0448\u0435 \u0435\u0434\u0438\u043D\u0438\u0446\u044B, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E
   \u043A\u0440\u043E\u043C\u043A\u0430 \u0443\u0437\u043A\u0430\u044F: \u0442\u043E\u0442 \u0436\u0435 \u0448\u0430\u0433 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B \u043D\u0430 \u043F\u043E\u043B\u043E\u0441\u043A\u0435 \u0432 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439 \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0441\u043B\u0430\u0431\u0435\u0435, \u0447\u0435\u043C \u043D\u0430
   \u0432\u0441\u0435\u0439 \u043F\u043B\u043E\u0449\u0430\u0434\u0438 \u0434\u0435\u0442\u0430\u043B\u0438. */
const float VG_RIM_GAIN = 3.2;

half4 main(float2 xy) {
  float2 p = vgTouchWarp(xy - u_center, u_touch, u_pull, u_touchPress, u_touchRadius, u_wave.x, u_wave.y);
  float sd = vgScene(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);
  if (sd > 1.0) { return half4(0.0); }

  float bevel = max(u_bevel, 1.0);
  float t = vgBevelT(sd, bevel);
  float2 n = vgSceneNormal(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);

  // \u0420\u0435\u0436\u0438\u043C \xAB\u0431\u044D\u043A\u0434\u0440\u043E\u043F\xBB \u043E\u0442\u0434\u0430\u0451\u0442 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 \u043A\u0430\u043A \u0435\u0441\u0442\u044C \u2014 \u044D\u0442\u043E \u043E\u043F\u043E\u0440\u043D\u0430\u044F \u0442\u043E\u0447\u043A\u0430 \u0434\u043B\u044F \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u043E\u043F\u0442\u0438\u043A\u0438.
  float on = u_debug > 5.5 && u_debug < 6.5 ? 0.0 : 1.0;
  float magnify = mix(1.0, u_magnify, on);
  float2 s = u_center + p / magnify + n * (u_edgePush * on * pow(t, VG_FALLOFF));

  // \u041F\u041B\u041E\u0429\u0410\u0414\u041D\u041E\u0415 \u0418\u041D\u0422\u0415\u0413\u0420\u0418\u0420\u041E\u0412\u0410\u041D\u0418\u0415. \u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0430\u044F \u043B\u0438\u043D\u0437\u0430 \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u0441\u0432\u0435\u0442 \u0441 \u043F\u043B\u043E\u0449\u0430\u0434\u0438, \u0430 \u043C\u044B \u0431\u0435\u0440\u0451\u043C \u0442\u043E\u0447\u0435\u0447\u043D\u044B\u0435
  // \u043E\u0442\u0441\u0447\u0451\u0442\u044B \u2014 \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0442\u0430\u043C, \u0433\u0434\u0435 \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u0431\u044B\u0441\u0442\u0440\u043E, \u043F\u043E \u0440\u0435\u0437\u043A\u043E\u043C\u0443 \u0444\u043E\u043D\u0443 \u0438\u0434\u0451\u0442 \u0437\u0435\u0440\u043D\u043E.
  // \u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0438 \u0440\u0430\u0432\u043D\u0430 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u044F \u043D\u0430 \u043F\u0438\u043A\u0441\u0435\u043B\u044C: \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u0442\u0451\u0442 \u043A\u0430\u043A
  // edgePush \xB7 t^FALLOFF \u043F\u043E \u0432\u0441\u0435\u0439 \u0444\u0430\u0441\u043A\u0435, \u0437\u043D\u0430\u0447\u0438\u0442 \u0435\u0433\u043E \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u043D\u0430\u044F \u043F\u043E \u044D\u043A\u0440\u0430\u043D\u0443 \u0435\u0441\u0442\u044C
  // edgePush \xB7 FALLOFF \xB7 t^(FALLOFF\u22121) / bevel.
  float footprint = u_edgePush * VG_FALLOFF * pow(t, VG_FALLOFF - 1.0) / bevel;
  // \u0428\u0435\u0440\u043E\u0445\u043E\u0432\u0430\u0442\u043E\u0441\u0442\u0438 \u0437\u0434\u0435\u0441\u044C \u0411\u041E\u041B\u042C\u0428\u0415 \u041D\u0415\u0422: \u043E\u043D\u0430 \u043C\u0443\u0442\u0438\u0442 \u0432 \u0434\u0438\u0441\u043A\u043E\u0432\u043E\u043C \u0441\u0431\u043E\u0440\u0435 \u043D\u0438\u0436\u0435. \u041F\u043E\u043A\u0430 \u043E\u043D\u0430 \u0441\u0442\u043E\u044F\u043B\u0430 \u0438
  // \u0442\u0443\u0442, \u0443 \u043B\u044E\u0431\u043E\u0433\u043E \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u0430 \u0441 \u043D\u0435\u043D\u0443\u043B\u0435\u0432\u043E\u0439 \u0448\u0435\u0440\u043E\u0445\u043E\u0432\u0430\u0442\u043E\u0441\u0442\u044C\u044E \u0440\u0430\u0437\u0431\u0440\u043E\u0441 \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0439 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0432\u0430\u043B
  // \u0432\u044B\u0440\u043E\u0436\u0434\u0430\u0442\u044C\u0441\u044F \u2014 \u0438 \u0442\u0435\u043B\u043E, \u0442\u043E \u0435\u0441\u0442\u044C \u043F\u043E\u0447\u0442\u0438 \u0432\u0441\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u0434\u0435\u0442\u0430\u043B\u0438, \u0443\u0445\u043E\u0434\u0438\u043B\u043E \u0441 \u043E\u0434\u043D\u043E\u0439 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u043D\u0430 \u0448\u0435\u0441\u0442\u044C.
  float spread = max(u_spherical * t * t, footprint) * on;
  float chroma = u_chroma * on * t * t;

  float3 rgb;
  float srcA;

  if (chroma + spread < 0.25) {
    // \u0412 \u043F\u043B\u043E\u0441\u043A\u043E\u043C \u0442\u0435\u043B\u0435 \u0440\u0430\u0437\u0431\u0440\u043E\u0441 \u0438 \u0445\u0440\u043E\u043C\u0430\u0442\u0438\u043A\u0430 \u0432\u044B\u0440\u043E\u0436\u0434\u0430\u044E\u0442\u0441\u044F: \u0432\u0441\u0435 \u043E\u0442\u0441\u0447\u0451\u0442\u044B \u043B\u0435\u0433\u043B\u0438 \u0431\u044B \u0432 \u041E\u0414\u041D\u0423 \u0442\u043E\u0447\u043A\u0443.
    // \u0422\u0435\u043B\u043E \u2014 \u044D\u0442\u043E \u043F\u043E\u0447\u0442\u0438 \u0432\u0441\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u0441\u0442\u0435\u043A\u043B\u0430, \u0430 \u0432\u044B\u0431\u043E\u0440\u043A\u0430 \u0442\u0435\u043A\u0441\u0442\u0443\u0440\u044B \u0437\u0434\u0435\u0441\u044C \u0441\u0430\u043C\u043E\u0435 \u0434\u043E\u0440\u043E\u0433\u043E\u0435, \u0447\u0442\u043E \u0435\u0441\u0442\u044C.
    half4 c = content.eval(vgInContent(s));
    srcA = float(c.a);
    rgb = srcA > 0.004 ? float3(c.rgb) / srcA : float3(0.0);
  } else {
    // \u0414\u0418\u0421\u041F\u0415\u0420\u0421\u0418\u042F. \u041A\u0430\u0436\u0434\u044B\u0439 \u043A\u0430\u043D\u0430\u043B \u0438\u0434\u0451\u0442 \u043F\u043E \u0421\u0412\u041E\u0415\u0419 \u0442\u0440\u0430\u0435\u043A\u0442\u043E\u0440\u0438\u0438: \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u043A\u0430\u043D\u0430\u043B\u0430 \u043F\u0440\u043E\u043F\u043E\u0440\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E
    // \u0435\u0433\u043E \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u044E \u043F\u043E \u041A\u043E\u0448\u0438, \u0438 \u0432\u0441\u0435 \u0442\u0440\u0438 \u2014 \u0432\u0434\u043E\u043B\u044C \u043E\u0434\u043D\u043E\u0439 \u043D\u043E\u0440\u043C\u0430\u043B\u0438. \u041F\u0430\u0440\u0430 \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u043D\u0430 \u043A\u0430\u043D\u0430\u043B
    // \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0443 (footprint), \u043E\u0434\u043D\u0430 \u2014 \u0446\u0432\u0435\u0442.
    //
    // content.eval \u043E\u0442\u0434\u0430\u0451\u0442 PREMULTIPLIED \u0446\u0432\u0435\u0442. \u0411\u0440\u0430\u0442\u044C .r/.g/.b \u0438\u0437 \u0420\u0410\u0417\u041D\u042B\u0425 \u0442\u043E\u0447\u0435\u043A \u0438 \u0441\u043A\u043B\u0435\u0438\u0432\u0430\u0442\u044C
    // \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E \u043D\u0435\u043B\u044C\u0437\u044F: \u0433\u0434\u0435 \u0430\u043B\u044C\u0444\u0430 \u043C\u0435\u0436\u0434\u0443 \u0432\u044B\u0431\u043E\u0440\u043A\u0430\u043C\u0438 \u043E\u0442\u043B\u0438\u0447\u0430\u0435\u0442\u0441\u044F, \u043A\u0430\u043D\u0430\u043B\u044B \u0434\u0435\u043B\u044F\u0442\u0441\u044F \u043D\u0430 \u0440\u0430\u0437\u043D\u044B\u0439
    // \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C \u0438 \u043D\u0430 \u0433\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u0432\u044B\u043B\u0435\u0437\u0430\u0435\u0442 \u0446\u0432\u0435\u0442\u043D\u0430\u044F \u043A\u0430\u0439\u043C\u0430, \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0432 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0435 \u043D\u0435\u0442.
    // \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u0441\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u043C premultiplied \u0438 \u0434\u0435\u043B\u0438\u043C \u041E\u0414\u0418\u041D \u0440\u0430\u0437 \u043D\u0430 \u043F\u0430\u0440\u0443, \u0432 float: half \u0443 \u043D\u0443\u043B\u044F
    // \u043A\u0432\u0430\u043D\u0442\u0443\u0435\u0442\u0441\u044F \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0433\u0440\u0443\u0431\u043E.
    float2 dR = n * (chroma * VG_CAUCHY.r);
    float2 dG = n * (chroma * VG_CAUCHY.g);
    float2 dB = n * (chroma * VG_CAUCHY.b);
    float2 e = n * spread;
    half4 c0 = content.eval(vgInContent(s + dR - e));
    half4 c1 = content.eval(vgInContent(s + dR + e));
    half4 c2 = content.eval(vgInContent(s + dG - e));
    half4 c3 = content.eval(vgInContent(s + dG + e));
    half4 c4 = content.eval(vgInContent(s + dB - e));
    half4 c5 = content.eval(vgInContent(s + dB + e));

    float aR = float(c0.a + c1.a) * 0.5;
    float aG = float(c2.a + c3.a) * 0.5;
    float aB = float(c4.a + c5.a) * 0.5;
    rgb = float3(
      aR > 0.004 ? float(c0.r + c1.r) * 0.5 / aR : 0.0,
      aG > 0.004 ? float(c2.g + c3.g) * 0.5 / aG : 0.0,
      aB > 0.004 ? float(c4.b + c5.b) * 0.5 / aB : 0.0);
    srcA = (aR + aG + aB) / 3.0;
  }

  // \u041E\u0422\u0420\u0410\u0416\u0415\u041D\u0418\u0415. \u0421\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C, \u0430 \u043D\u0435 \u0432 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u2014 \u044D\u0442\u043E \u0444\u0443\u043D\u043A\u0446\u0438\u044F
  // \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F, \u0430 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u0435 \u0432\u0438\u0434\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0442\u0441\u044E\u0434\u0430: \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0440\u0438\u0441\u0443\u0435\u0442\u0441\u044F \u043F\u043E\u0432\u0435\u0440\u0445 \u043B\u0438\u043D\u0437\u044B \u0438
  // \u0431\u044D\u043A\u0434\u0440\u043E\u043F\u0430 \u043D\u0435 \u0438\u043C\u0435\u0435\u0442 \u0432\u043E\u0432\u0441\u0435.
  //
  // \u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u0435\u0433\u043E \u0421\u041D\u0410\u0420\u0423\u0416\u0418 \u0444\u043E\u0440\u043C\u044B, \u0430 \u043D\u0435 \u0438\u0437-\u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u0430: \u043D\u0430 \u0441\u043A\u043E\u043B\u044C\u0437\u044F\u0449\u0435\u043C \u0443\u0433\u043B\u0435 \u0432 \u0433\u043B\u0430\u0437 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442
  // \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u0435 \u0434\u0435\u0442\u0430\u043B\u0438, \u0430 \u043D\u0435 \u0442\u043E, \u0447\u0442\u043E \u0437\u0430 \u043D\u0435\u0439. \u041E\u0442\u0441\u044E\u0434\u0430 \u0438 \u043F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u2014 \u044F\u0440\u043A\u0430\u044F \u043E\u0431\u043B\u043E\u0436\u043A\u0430 \u0440\u044F\u0434\u043E\u043C \u0437\u0430\u0436\u0438\u0433\u0430\u0435\u0442
  // \u0431\u043B\u0438\u0436\u043D\u044E\u044E \u043A \u043D\u0435\u0439 \u043A\u0440\u043E\u043C\u043A\u0443, \u0430 \u043F\u043E\u0441\u0440\u0435\u0434\u0438 \u043F\u0443\u0441\u0442\u043E\u0439 \u0447\u0435\u0440\u043D\u043E\u0442\u044B \u0441\u0442\u0435\u043A\u043B\u043E \u0447\u0435\u0441\u0442\u043D\u043E \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0442\u0451\u043C\u043D\u044B\u043C.
  //
  // \u0411\u0435\u0440\u0451\u0442\u0441\u044F \u041F\u041B\u041E\u0429\u0410\u0414\u041A\u041E\u0419, \u0430 \u043D\u0435 \u0442\u043E\u0447\u043A\u043E\u0439: \u043A\u0440\u0438\u0432\u0430\u044F \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u0446\u0435\u043B\u044B\u0439 \u0442\u0435\u043B\u0435\u0441\u043D\u044B\u0439 \u0443\u0433\u043E\u043B, \u0438 \u043E\u0434\u0438\u043D
  // \u0441\u0434\u0432\u0438\u043D\u0443\u0442\u044B\u0439 \u043E\u0442\u0441\u0447\u0451\u0442 \u2014 \u044D\u0442\u043E \u0447\u0438\u0441\u0442\u044B\u0439 \u043F\u0435\u0440\u0435\u043D\u043E\u0441 \u0431\u0435\u0437 \u0441\u0436\u0430\u0442\u0438\u044F, \u0442\u043E \u0435\u0441\u0442\u044C \u043D\u0435\u0438\u0441\u043A\u0430\u0436\u0451\u043D\u043D\u0430\u044F \u041A\u041E\u041F\u0418\u042F \u0441\u043E\u0441\u0435\u0434\u043D\u0435\u0433\u043E
  // \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u0432\u043D\u0443\u0442\u0440\u0438 \u0441\u0442\u0435\u043A\u043B\u0430 (material-lab.md E-33).
  float slope = vgBevelSlope(t);
  float3 N = normalize(float3(n * slope, 1.0));
  float fres = u_fresnel * pow(1.0 - clamp(N.z, 0.0, 1.0), u_fresnelPower);

  // \u041E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0436\u0438\u0432\u0451\u0442 \u043D\u0430 \u0424\u0410\u0421\u041A\u0415: \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0439 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435 \u0424\u0440\u0435\u043D\u0435\u043B\u044C \u0440\u0430\u0432\u0435\u043D \u043D\u0443\u043B\u044E \u043F\u043E \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044E, \u0438 \u0432\u043E\u0441\u0435\u043C\u044C
  // \u0432\u044B\u0431\u043E\u0440\u043E\u043A \u0442\u0430\u043C \u0443\u0445\u043E\u0434\u0438\u043B\u0438 \u0431\u044B \u0432\u043F\u0443\u0441\u0442\u0443\u044E \u043F\u043E \u0432\u0441\u0435\u0439 \u043F\u043B\u043E\u0449\u0430\u0434\u0438 \u0434\u0435\u0442\u0430\u043B\u0438. \u0422\u0435\u043B\u0443 \u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0441\u0440\u0435\u0434\u043D\u0435\u0439 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B
  // \u043E\u043A\u0440\u0435\u0441\u0442\u043D\u043E\u0441\u0442\u0438 \u2014 \u0435\u0451 \u0438 \u0442\u0430\u043A \u043F\u043E\u0441\u0447\u0438\u0442\u0430\u043B \u0437\u043E\u043D\u0434, \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E.
  float3 refl;
  if (t > 0.02) {
    float2 around = u_center + p + n * (u_reflectReach * mix(0.35, 1.0, clamp(slope / 3.2, 0.0, 1.0)));
    // \u0414\u0432\u0430 \u043A\u043E\u043B\u044C\u0446\u0430, \u0430 \u043D\u0435 \u043E\u0434\u043D\u043E: \u0447\u0435\u0442\u044B\u0440\u0435 \u043E\u0442\u0441\u0447\u0451\u0442\u0430 \u043D\u0430 \u0440\u0430\u0434\u0438\u0443\u0441\u0435 \u0441\u0431\u043E\u0440\u0430 \u0443\u0441\u0440\u0435\u0434\u043D\u044F\u044E\u0442 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0433\u0440\u0443\u0431\u043E, \u0438
    // \u0442\u0435\u043A\u0441\u0442, \u043B\u0435\u0436\u0430\u0449\u0438\u0439 \u0420\u042F\u0414\u041E\u041C \u0441\u043E \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u043E\u0441\u0442\u0430\u0432\u0430\u043B\u0441\u044F \u0447\u0438\u0442\u0430\u0435\u043C\u044B\u043C \u0432\u043D\u0443\u0442\u0440\u0438 \u043D\u0435\u0433\u043E (E-33 \u2014 \u0442\u0430\u043C \u0436\u0435 \u043F\u0440\u043E \u0442\u043E,
    // \u043F\u043E\u0447\u0435\u043C\u0443 \u043E\u0434\u0438\u043D \u043E\u0442\u0441\u0447\u0451\u0442 \u0432\u043E\u043E\u0431\u0449\u0435 \u043D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C). \u0412\u043E\u0441\u0435\u043C\u044C \u043F\u043E \u0434\u0432\u0443\u043C \u0440\u0430\u0434\u0438\u0443\u0441\u0430\u043C \u0440\u0430\u0437\u043C\u044B\u0432\u0430\u044E\u0442 \u0444\u043E\u0440\u043C\u0443, \u043D\u043E
    // \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442 \u0446\u0432\u0435\u0442 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F, \u0440\u0430\u0434\u0438 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0432\u0441\u0451 \u0438 \u0431\u0435\u0440\u0451\u0442\u0441\u044F.
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
    // \u0412 \u0442\u0435\u043B\u0435 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u043D\u0435 \u0431\u0435\u0440\u0451\u043C \u0432\u043E\u0432\u0441\u0435, \u0430 \u0447\u0442\u043E\u0431\u044B \u043D\u0430 \u0433\u0440\u0430\u043D\u0438\u0446\u0435 \u0432\u0435\u0442\u0432\u0435\u0439 \u043D\u0435 \u043F\u043E\u044F\u0432\u0438\u043B\u0441\u044F \u0432\u0438\u0434\u0438\u043C\u044B\u0439 \u0441\u0435\u0440\u043F,
    // \u0437\u0434\u0435\u0441\u044C \u0441\u0442\u043E\u0438\u0442 \u0440\u043E\u0432\u043D\u043E \u0442\u043E, \u0432\u043E \u0447\u0442\u043E \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0438\u0442 \u0441\u043C\u0435\u0441\u044C \u043D\u0438\u0436\u0435.
    refl = u_probeLuma >= 0.0 ? u_probe : rgb;
  }

  // \u0421\u0432\u0435\u0442, \u0434\u043E\u0445\u043E\u0434\u044F\u0449\u0438\u0439 \u0434\u043E \u0442\u0435\u043B\u0430, \u043E\u0431\u044F\u0437\u0430\u043D \u0431\u044B\u0442\u044C \u0413\u041B\u0410\u0414\u041A\u0418\u041C \u043F\u043E \u0432\u0441\u0435\u0439 \u0434\u0435\u0442\u0430\u043B\u0438: \u043E\u043D \u0432\u0438\u0434\u0435\u043D \u043D\u0430 \u0432\u0441\u0435\u0439 \u043F\u043B\u043E\u0449\u0430\u0434\u0438,
  // \u0430 \u0432\u044B\u0431\u043E\u0440\u043A\u0430 \u043E\u043A\u0440\u0435\u0441\u0442\u043D\u043E\u0441\u0442\u0438 \u0436\u0438\u0432\u0451\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u0444\u0430\u0441\u043A\u0435. \u0421\u043C\u0435\u0441\u044C \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u0430 \u043F\u043E \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044E \u2014 \u043F\u0440\u0438
  // t \u2264 0.02 refl \u0438 \u0435\u0441\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0430 \u0437\u043E\u043D\u0434\u0430.
  float3 ambient = mix(u_probeLuma >= 0.0 ? u_probe : rgb, refl, smoothstep(0.0, 0.2, t));

  // \u0421\u041F\u0415\u041A\u0422\u0420\u0410\u041B\u042C\u041D\u0410\u042F \u041A\u0420\u041E\u041C\u041A\u0410. \u0418\u043D\u0442\u0435\u0440\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u044F \u0438 \u0434\u0438\u0444\u0440\u0430\u043A\u0446\u0438\u044F \u2014 \u043E\u0431\u0430 \u0432\u043E\u043B\u043D\u043E\u0432\u044B\u0435, \u043E\u0431\u0430 \u0436\u0438\u0432\u0443\u0442 \u0432 \u043E\u0442\u0440\u0430\u0436\u0451\u043D\u043D\u043E\u043C
  // \u043B\u0443\u0447\u0435 \u0438 \u043E\u0431\u0430 \u0437\u0430\u043C\u0435\u0442\u043D\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u0441\u043A\u043E\u043B\u044C\u0437\u044F\u0449\u0435\u043C \u0443\u0433\u043B\u0435. \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u044D\u0442\u043E \u043E\u0434\u0438\u043D \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C \u041E\u0422\u0422\u0415\u041D\u041A\u0410 \u043A
  // \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u044E: ALU \u0431\u0435\u0437 \u0435\u0434\u0438\u043D\u043E\u0439 \u043B\u0438\u0448\u043D\u0435\u0439 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u0442\u0435\u043A\u0441\u0442\u0443\u0440\u044B.
  float3 spectral = float3(1.0);
  if (u_iridescence > 0.001) {
    spectral *= mix(float3(1.0), vgInterference(clamp(N.z, 0.0, 1.0)), u_iridescence);
  }
  if (u_diffraction > 0.001) {
    // \u041F\u043E\u043B\u043E\u0441\u044B \u0436\u0438\u0432\u0443\u0442 \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438: \u0434\u0430\u043B\u044C\u0448\u0435 \u0432 \u0442\u043E\u043B\u0449\u0435 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u044C \u0445\u043E\u0434\u0430 \u0442\u0435\u0440\u044F\u0435\u0442 \u043A\u043E\u0433\u0435\u0440\u0435\u043D\u0442\u043D\u043E\u0441\u0442\u044C.
    float w = u_diffraction * smoothstep(0.45, 1.0, t);
    spectral *= mix(float3(1.0), vgDiffraction((1.0 - t) * bevel, bevel), w);
  }
  // \u0421\u043F\u0435\u043A\u0442\u0440 \u0434\u043E\u043C\u0435\u0448\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0422\u041E\u041B\u042C\u041A\u041E \u0432 \u0437\u0435\u0440\u043A\u0430\u043B\u044C\u043D\u0443\u044E \u0447\u0430\u0441\u0442\u044C. \u0420\u0430\u043D\u044C\u0448\u0435 \u043E\u043D \u043C\u043D\u043E\u0436\u0438\u043B refl \u0446\u0435\u043B\u0438\u043A\u043E\u043C, \u0430 \u0442\u043E\u0442 \u0436\u0435
  // refl \u0443\u0445\u043E\u0434\u0438\u0442 \u043F\u043E\u0442\u043E\u043C \u0432 \u043F\u043E\u0434\u0441\u0432\u0435\u0442\u043A\u0443 \u0442\u0435\u043B\u0430 \u2014 \u0438 \u043F\u0435\u0440\u0435\u043B\u0438\u0432\u044B \u043F\u043B\u0451\u043D\u043A\u0438 \u043A\u0440\u0430\u0441\u0438\u043B\u0438 \u0432\u0441\u044E \u0434\u0435\u0442\u0430\u043B\u044C \u0432 \u0446\u0432\u0435\u0442
  // \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u0438, \u0445\u043E\u0442\u044F \u0436\u0438\u0432\u0443\u0442 \u043E\u043D\u0438 \u0432 \u043E\u0442\u0440\u0430\u0436\u0451\u043D\u043D\u043E\u043C \u043B\u0443\u0447\u0435 \u043D\u0430 \u0441\u043A\u043E\u043B\u044C\u0437\u044F\u0449\u0435\u043C \u0443\u0433\u043B\u0435.
  rgb = mix(rgb, refl * spectral, fres);

  // \u041E\u0426\u0415\u041D\u041A\u0410 \u0424\u041E\u041D\u0410. \u041F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \u0438\u0437 \u043D\u0430\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0437\u043E\u043D\u0434\u0430 \u043E\u0434\u043D\u043E\u0439 \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u043E\u0439 \u043D\u0430 \u0432\u0441\u044E \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C: \u043E\u043D
  // \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u0442 \u0437\u0430\u0445\u0432\u0430\u0442 \u0432 \u0441\u0435\u0442\u043A\u0443 16\xD732 \u0438 \u0443\u0441\u0440\u0435\u0434\u043D\u044F\u0435\u0442 \u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A \u044D\u0442\u043E\u0433\u043E \u0441\u0442\u0435\u043A\u043B\u0430.
  //
  // \u0421\u0447\u0438\u0442\u0430\u0442\u044C \u0435\u0451 \u0437\u0434\u0435\u0441\u044C \u043F\u043E \u043E\u0442\u0441\u0447\u0451\u0442\u0430\u043C \u041D\u0415\u041B\u042C\u0417\u042F, \u0438 \u044D\u0442\u043E \u043D\u0435 \u043F\u0440\u043E \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u044E. \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0435\u043B\u0430 \u2014 \u043D\u0435\u043B\u0438\u043D\u0435\u0439\u043D\u0430\u044F
  // \u0444\u0443\u043D\u043A\u0446\u0438\u044F \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B \u0441 \u0438\u0437\u043B\u043E\u043C\u043E\u043C: \u0442\u0430\u043C, \u0433\u0434\u0435 \u043E\u0442\u0441\u0447\u0451\u0442 \u0437\u0430\u0435\u0437\u0436\u0430\u043B \u043D\u0430 \u0431\u0443\u043A\u0432\u0443 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u043E\u0446\u0435\u043D\u043A\u0430 \u043F\u0440\u044B\u0433\u0430\u043B\u0430,
  // \u0430 \u0441 \u043D\u0435\u0439 \u043F\u0440\u044B\u0433\u0430\u043B\u0430 \u0438 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C. \u041D\u0430 \u044D\u043A\u0440\u0430\u043D\u0435 \u044D\u0442\u043E \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u043B\u043E \u043F\u0440\u0438\u0437\u0440\u0430\u0447\u043D\u044B\u043C\u0438 \u043A\u043E\u043F\u0438\u044F\u043C\u0438 \u0442\u0435\u043A\u0441\u0442\u0430 \u043D\u0430
  // \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0438 \u0440\u0430\u0434\u0438\u0443\u0441\u0430 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u2014 \u0440\u043E\u0432\u043D\u043E \u0442\u0430 \u0433\u0440\u0435\u0431\u0451\u043D\u043A\u0430, \u0447\u0442\u043E \u0438 \u0432 E-31, \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u0438,
  // \u0430 \u043D\u0435 \u043F\u043E \u0446\u0432\u0435\u0442\u0443. \u041D\u0438\u043A\u0430\u043A\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0435\u0451 \u043D\u0435 \u0443\u0431\u0438\u0440\u0430\u0435\u0442: \u043E\u043D\u0430 \u0432 \u0441\u0430\u043C\u043E\u0439 \u0434\u0438\u0441\u043A\u0440\u0435\u0442\u043D\u043E\u0441\u0442\u0438 \u043E\u0446\u0435\u043D\u043A\u0438.
  //
  // \u0417\u0430\u043E\u0434\u043D\u043E \u044D\u0442\u043E \u0434\u0435\u0448\u0435\u0432\u043B\u0435 \u043D\u0430 \u0447\u0435\u0442\u044B\u0440\u0435 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u0442\u0435\u043A\u0441\u0442\u0443\u0440\u044B \u0441 \u043F\u0438\u043A\u0441\u0435\u043B\u044F \u0438 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435 \u043F\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u2014
  // \u0430\u0434\u0430\u043F\u0442\u0430\u0446\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0431\u044B\u0442\u044C \u043D\u0435\u0437\u0430\u043C\u0435\u0442\u043D\u043E\u0439, \u0430 \u043D\u0435 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u043E\u0439.
  float3 wide;
  float busy;
  if (u_probeLuma >= 0.0) {
    wide = u_probe;
    busy = u_probeBusy;
  } else {
    // \u0417\u043E\u043D\u0434 \u0435\u0449\u0451 \u043D\u0435 \u043E\u0442\u0447\u0438\u0442\u0430\u043B\u0441\u044F (\u043F\u0435\u0440\u0432\u044B\u0435 \u043A\u0430\u0434\u0440\u044B) \u2014 \u0434\u0435\u0440\u0436\u0438\u043C\u0441\u044F \u043D\u0430 \u0441\u0432\u043E\u0438\u0445 \u043E\u0442\u0441\u0447\u0451\u0442\u0430\u0445, \u0447\u0442\u043E\u0431\u044B \u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0435
    // \u043C\u0438\u0433\u043D\u0443\u043B\u043E \u043D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u043C \u043D\u0430 \u0441\u0442\u0430\u0440\u0442\u0435.
    float2 wx = float2(u_adaptRadius, 0.0);
    float2 wy = float2(0.0, u_adaptRadius);
    float3 w0 = vgUnpack(content.eval(vgInContent(s + wx)));
    float3 w1 = vgUnpack(content.eval(vgInContent(s - wx)));
    float3 w2 = vgUnpack(content.eval(vgInContent(s + wy)));
    float3 w3 = vgUnpack(content.eval(vgInContent(s - wy)));
    wide = (w0 + w1 + w2 + w3) * 0.25;
    float lw = vgLuma(wide);
    busy = max(max(abs(vgLuma(w0) - lw), abs(vgLuma(w1) - lw)),
               max(abs(vgLuma(w2) - lw), abs(vgLuma(w3) - lw)));
  }
  // \u0421\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u0432 \u042D\u0422\u041E\u041C \u043C\u0435\u0441\u0442\u0435 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u0430 \u043D\u0435 \u0441\u0440\u0435\u0434\u043D\u044F\u044F \u043F\u043E \u043D\u0435\u0439: \u043F\u043B\u043E\u0441\u043A\u043E\u0441\u0442\u044C \u0437\u043E\u043D\u0434\u0430, \u0437\u0430\u0436\u0430\u0442\u0430\u044F \u0432
  // \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u043D\u044B\u0439 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u043A\u043B\u043E\u043D \u043D\u0435 \u0443\u0432\u043E\u0434\u0438\u043B \u043E\u0446\u0435\u043D\u043A\u0443 \u0437\u0430 \u043F\u0440\u0435\u0434\u0435\u043B\u044B \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0435\u0441\u0442\u044C.
  float2 nrm = p / max(u_halfSize, float2(1.0));
  float lumWide = u_probeLuma >= 0.0
    ? clamp(u_probeLuma + dot(u_probeSlope, nrm), u_probeRange.x, u_probeRange.y)
    : vgLuma(wide);

  // \u0410\u0414\u0410\u041F\u0422\u0418\u0412\u041D\u041E\u0415 \u0420\u0410\u0421\u0421\u0415\u042F\u041D\u0418\u0415. \u041C\u0443\u0442\u0438\u0442\u044C \u0444\u043E\u043D \u043D\u0443\u0436\u043D\u043E \u0440\u043E\u0432\u043D\u043E \u0442\u0430\u043C, \u0433\u0434\u0435 \u043E\u043D \u043F\u0451\u0441\u0442\u0440\u044B\u0439: \u043D\u0430 \u0440\u043E\u0432\u043D\u043E\u0439 \u0437\u0430\u043B\u0438\u0432\u043A\u0435
  // \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0434\u0430\u0451\u0442, \u0430 \u043D\u0430 \u0442\u0435\u043A\u0441\u0442\u0435 \u0438 \u043E\u0431\u043B\u043E\u0436\u043A\u0435 \u043E\u043D\u043E \u0438 \u0435\u0441\u0442\u044C \u0442\u043E, \u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u043F\u043E\u0432\u0435\u0440\u0445
  // \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0439. \u0421\u043C\u0435\u0448\u0438\u0432\u0430\u0442\u044C \u0441 \u0447\u0435\u0442\u044B\u0440\u044C\u043C\u044F \u0448\u0438\u0440\u043E\u043A\u0438\u043C\u0438 \u043E\u0442\u0441\u0447\u0451\u0442\u0430\u043C\u0438 \u041D\u0415\u041B\u042C\u0417\u042F \u2014 \u044D\u0442\u043E \u0433\u0440\u0435\u0431\u0451\u043D\u043A\u0430, \u0430 \u043D\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435:
  // \u043D\u0430 \u0432\u044B\u0445\u043E\u0434\u0435 \u0447\u0435\u0442\u044B\u0440\u0435 \u0441\u043C\u0435\u0449\u0451\u043D\u043D\u044B\u0435 \u043A\u043E\u043F\u0438\u0438 (material-lab.md E-31). \u0428\u0438\u0440\u043E\u043A\u0438\u0435 \u043E\u0442\u0441\u0447\u0451\u0442\u044B \u0433\u043E\u0434\u044F\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E
  // \u043D\u0430 \u041E\u0426\u0415\u041D\u041A\u0423; \u0432\u0438\u0434\u0438\u043C\u043E\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0434\u0435\u043B\u0430\u0435\u0442 \u0447\u0435\u0441\u0442\u043D\u044B\u0439 \u0434\u0438\u0441\u043A\u043E\u0432\u044B\u0439 \u0441\u0431\u043E\u0440 \u043F\u043E \u0441\u043F\u0438\u0440\u0430\u043B\u0438.
  //
  // \u0420\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u0436\u0438\u0432\u0451\u0442 \u0432 \u0422\u041E\u041B\u0429\u0415, \u0430 \u043D\u0435 \u0432 \u043A\u0440\u043E\u043C\u043A\u0435: \u0443 \u0444\u0430\u0441\u043A\u0438 \u0440\u0430\u0431\u043E\u0442\u0430 \u0434\u0440\u0443\u0433\u0430\u044F \u2014 \u0433\u043D\u0443\u0442\u044C \u043B\u0443\u0447 \u0438 \u0440\u0430\u0441\u0449\u0435\u043F\u043B\u044F\u0442\u044C
  // \u0435\u0433\u043E. \u0420\u0430\u0437\u043C\u044B\u0432\u0430\u044F \u0434\u0435\u0442\u0430\u043B\u044C \u0446\u0435\u043B\u0438\u043A\u043E\u043C, \u0430\u0434\u0430\u043F\u0442\u0430\u0446\u0438\u044F \u0441\u044A\u0435\u0434\u0430\u043B\u0430 \u0438 \u0434\u0438\u0441\u043F\u0435\u0440\u0441\u0438\u044E, \u0438 \u043F\u043E\u0434\u0445\u0432\u0430\u0442 \u0446\u0432\u0435\u0442\u0430.
  // \u0420\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u0438\u0434\u0451\u0442 \u043E\u0442 \u0434\u0432\u0443\u0445 \u043F\u0440\u0438\u0447\u0438\u043D: \u043E\u0442 \u0440\u0430\u0437\u043C\u0430\u0445\u0430 \u0444\u043E\u043D\u0430 (\u043C\u0443\u0442\u0438\u0442\u044C \u0435\u0441\u0442\u044C \u0441\u043C\u044B\u0441\u043B \u0442\u0430\u043C, \u0433\u0434\u0435 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C
  // \u0420\u0410\u0417\u041D\u041E\u0415) \u0438 \u043E\u0442 \u0448\u0435\u0440\u043E\u0445\u043E\u0432\u0430\u0442\u043E\u0441\u0442\u0438 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438. \u041E\u0431\u0435 \u0436\u0438\u0432\u0443\u0442 \u0432 \u043E\u0434\u043D\u043E\u043C \u0434\u0438\u0441\u043A\u043E\u0432\u043E\u043C \u0441\u0431\u043E\u0440\u0435.
  //
  // \u041E\u043D\u043E \u041E\u0414\u041D\u041E \u0418 \u0422\u041E \u0416\u0415 \u043F\u043E \u0432\u0441\u0435\u0439 \u043B\u0438\u043D\u0437\u0435. \u0420\u0430\u043D\u044C\u0448\u0435 \u0437\u0434\u0435\u0441\u044C \u0441\u0442\u043E\u044F\u043B \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C, \u0433\u0430\u0441\u0438\u0432\u0448\u0438\u0439 \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u043A
  // \u0444\u0430\u0441\u043A\u0435, \u2014 \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u0447\u0438\u0442\u0430\u043B\u0430\u0441\u044C \u043A\u0430\u043A \u0448\u0430\u0440 \u0441 \u043C\u0443\u0442\u043D\u043E\u0439 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u043E\u0439 \u0438 \u0440\u0435\u0437\u043A\u0438\u043C \u043E\u0431\u043E\u0434\u043A\u043E\u043C: \u0434\u0432\u0430 \u0440\u0430\u0437\u043D\u044B\u0445
  // \u0441\u0442\u0435\u043A\u043B\u0430 \u0432 \u043E\u0434\u043D\u043E\u0439 \u0444\u043E\u0440\u043C\u0435. \u041B\u0438\u043D\u0437\u0430 \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0431\u044B\u0442\u044C \u043E\u0434\u043D\u043E\u0440\u043E\u0434\u043D\u043E\u0439 \u0441\u0440\u0435\u0434\u043E\u0439; \u0437\u0430 \u0440\u0435\u0437\u043A\u043E\u0441\u0442\u044C \u043A\u0440\u043E\u043C\u043A\u0438 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442
  // \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u044F, \u0430 \u043D\u0435 \u0440\u0430\u0437\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043C\u0443\u0442\u0438 \u0432 \u0440\u0430\u0437\u043D\u044B\u0445 \u0435\u0451 \u043C\u0435\u0441\u0442\u0430\u0445.
  //
  // \u0412\u0435\u043B\u0438\u0447\u0438\u043D\u0430 \u043D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u043E \u0421\u041B\u0410\u0411\u0410\u042F. \u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0437\u0434\u0435\u0441\u044C \u0432\u0441\u043F\u043E\u043C\u043E\u0433\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435: \u043E\u043D\u043E \u0441\u043C\u044F\u0433\u0447\u0430\u0435\u0442 \u0444\u0430\u043A\u0442\u0443\u0440\u0443 \u043F\u043E\u0434
  // \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E, \u043D\u043E \u0440\u0430\u0437\u0432\u043E\u0434\u0438\u0442 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043D\u0435 \u043E\u043D\u043E, \u0430 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0435\u043B\u0430. \u0414\u0430\u0439 \u0435\u043C\u0443 \u0432\u043E\u043B\u044E \u2014 \u0438 \u0431\u0443\u043A\u0432\u044B \u043F\u043E\u0434
  // \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u044E\u0442\u0441\u044F \u0432 \u043A\u0430\u0448\u0443 \u0438\u0437 \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439, \u0447\u0435\u0433\u043E \u043D\u0438\u043A\u0430\u043A\u0430\u044F \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u043D\u0435 \u0441\u0442\u043E\u0438\u0442.
  // \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u0436\u0451\u0441\u0442\u043A\u0438\u0439 \u0438 \u043D\u0438\u0437\u043A\u0438\u0439. \u0424\u043E\u0440\u043C\u0443\u043B\u0430 \u0440\u0430\u0441\u0442\u0451\u0442 \u043A\u0430\u043A legibility \xD7 adaptRadius, \u0438 \u043D\u0430 \u043F\u0430\u043D\u0435\u043B\u0438 \u0441
  // legibility 0.95 \u0434\u0430\u0432\u0430\u043B\u0430 10.5 dp \u2014 \u0440\u043E\u0432\u043D\u043E \u0442\u0430 \u043A\u0430\u0448\u0430, \u043E \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0430\u0435\u0442 \u0430\u0431\u0437\u0430\u0446 \u0432\u044B\u0448\u0435:
  // \u043E\u0431\u043B\u043E\u0436\u043A\u0430 \u043F\u043E\u0434 \u0442\u0435\u043A\u0441\u0442\u043E\u043C \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u043B\u0430\u0441\u044C \u0432 \u043C\u0443\u0442\u043D\u043E\u0435 \u043F\u044F\u0442\u043D\u043E, \u0438 \u044D\u0442\u043E \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u043B\u0438 \u0437\u0430 \u043F\u043B\u043E\u0445\u043E\u0435 \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u0435.
  // \u0427\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u043D\u0430\u0431\u0438\u0440\u0430\u0442\u044C\u0441\u044F \u041F\u041B\u041E\u0422\u041D\u041E\u0421\u0422\u042C\u042E \u0442\u0435\u043B\u0430 (busyFloor \u043D\u0438\u0436\u0435), \u0430 \u043D\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435\u043C.
  //
  // \u041E\u0422\u041A\u041B\u0418\u041A \u041D\u0410 \u0421\u0422\u0420\u0423\u041A\u0422\u0423\u0420\u0423 \u041D\u0410\u0421\u042B\u0429\u0410\u0415\u0422\u0421\u042F, \u0430 \u043D\u0435 \u0440\u0430\u0441\u0442\u0451\u0442 \u043B\u0438\u043D\u0435\u0439\u043D\u043E \u043F\u043E \u0441\u0440\u0435\u0434\u043D\u0435\u043C\u0443 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u044E. \u0421\u043F\u043E\u0440\u0438\u0442
  // \u0441 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u043D\u0435
  // \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B, \u0430 \u0441\u0430\u043C \u0444\u0430\u043A\u0442 \u0435\u0451 \u043D\u0430\u043B\u0438\u0447\u0438\u044F: \u0441\u0442\u0440\u043E\u043A\u0430 \u0442\u0435\u043A\u0441\u0442\u0430 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u043F\u0440\u043E\u0446\u0435\u043D\u0442\u044B
  // \u043F\u043B\u043E\u0449\u0430\u0434\u0438, \u0438 \u0432 \u0441\u0440\u0435\u0434\u043D\u0435\u043C \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u0438 \u043E\u043D\u0430 \u0432\u0441\u0435\u0433\u0434\u0430 \u043C\u0430\u043B\u0430 \u2014 \u043B\u0438\u043D\u0435\u0439\u043D\u044B\u0439 \u043E\u0442\u043A\u043B\u0438\u043A \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043B \u0440\u043E\u0432\u043D\u043E \u0442\u043E\u0442
  // \u0441\u043B\u0443\u0447\u0430\u0439, \u0440\u0430\u0434\u0438 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u0438 \u0437\u0430\u0432\u0435\u0434\u0435\u043D\u0430, \u0445\u0443\u0436\u0435 \u0432\u0441\u0435\u0433\u043E. \u0417\u0430\u043C\u0435\u0440: \u043F\u043E\u0434 \u043F\u043B\u0430\u0448\u043A\u043E\u0439 \u0441 \u043F\u0440\u043E\u0435\u0437\u0436\u0430\u044E\u0449\u0438\u043C
  // \u0441\u043F\u0438\u0441\u043A\u043E\u043C busy = 0.12 \u0434\u0430\u0432\u0430\u043B 1.3 dp \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u044F, \u0438 \u0442\u0435\u043A\u0441\u0442 \u0447\u0438\u0442\u0430\u043B\u0441\u044F \u0441\u043A\u0432\u043E\u0437\u044C \u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0430\u0440\u0430\u0432\u043D\u0435 \u0441 \u0435\u0451
  // \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E. \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u043F\u0440\u0438 \u044D\u0442\u043E\u043C \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0438 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043D\u0438\u0437\u043A\u0438\u043C \u2014 \u043E\u043D \u0438 \u0437\u0430\u0449\u0438\u0449\u0430\u0435\u0442
  // \u043E\u0431\u043B\u043E\u0436\u043A\u0443 \u043E\u0442 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u044F \u0432 \u043A\u0430\u0448\u0443.
  float structure = 1.0 - exp(-busy * VG_STRUCTURE_GAIN);
  // \u0420\u0410\u0414\u0418\u0423\u0421 \u041C\u0415\u0420\u042F\u0415\u0422\u0421\u042F \u0412 \u0424\u041E\u041D\u0415, \u0410 \u041D\u0415 \u041D\u0410 \u042D\u041A\u0420\u0410\u041D\u0415. \u0423 \u0444\u0430\u0441\u043A\u0438 \u043B\u0438\u043D\u0437\u0430 \u0441\u0436\u0438\u043C\u0430\u0435\u0442 \u0444\u043E\u043D: \u0448\u0438\u0440\u043E\u043A\u0430\u044F \u043F\u043E\u043B\u043E\u0441\u0430
  // \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u0443\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u0443\u0437\u043A\u0443\u044E \u043F\u043E\u043B\u043E\u0441\u043A\u0443 \u044D\u043A\u0440\u0430\u043D\u0430, \u0438 footprint \u2014 \u044D\u0442\u043E \u0440\u043E\u0432\u043D\u043E \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C
  // \u0441\u0436\u0430\u0442\u0438\u044F, \u043E\u043D\u0430 \u0443\u0436\u0435 \u043F\u043E\u0441\u0447\u0438\u0442\u0430\u043D\u0430 \u0432\u044B\u0448\u0435 \u0434\u043B\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u043D\u043E\u0433\u043E \u0438\u043D\u0442\u0435\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F. \u0420\u0430\u0434\u0438\u0443\u0441, \u0437\u0430\u0434\u0430\u043D\u043D\u044B\u0439 \u0432
  // \u044D\u043A\u0440\u0430\u043D\u043D\u044B\u0445 \u043F\u0438\u043A\u0441\u0435\u043B\u044F\u0445, \u0443 \u0444\u0430\u0441\u043A\u0438 \u043F\u043E\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0432 (1 + footprint) \u0440\u0430\u0437 \u043C\u0435\u043D\u044C\u0448\u0435 \u0444\u043E\u043D\u0430, \u0447\u0435\u043C \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0439
  // \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435, \u2014 \u0438 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u0432 \u0442\u0435\u043B\u0435 \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u0443\u0431\u0438\u0440\u0430\u043B\u043E, \u0443 \u043A\u0440\u043E\u043C\u043A\u0438 \u0432\u044B\u0436\u0438\u0432\u0430\u043B\u0430 \u0438 \u0432\u0434\u043E\u0431\u0430\u0432\u043E\u043A
  // \u0443\u0441\u0438\u043B\u0438\u0432\u0430\u043B\u0430\u0441\u044C \u0441\u0436\u0430\u0442\u0438\u0435\u043C. \u0417\u0430\u043C\u0435\u0440: \u0441\u0442\u0440\u043E\u043A\u0430 \u0441\u043F\u0438\u0441\u043A\u0430 \u043F\u043E\u0434 \u043F\u043B\u0430\u0448\u043A\u043E\u0439 \u0434\u0430\u0432\u0430\u043B\u0430 199 \u043F\u0440\u043E\u0442\u0438\u0432 158 \u0443 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439
  // \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u0434\u0435\u0442\u0430\u043B\u0438, \u0438 \u0432\u0441\u044F \u043F\u043E\u043B\u043E\u0441\u0430 \u0441\u0438\u0434\u0435\u043B\u0430 \u0432 \u0444\u0430\u0441\u043A\u0435, \u0430 \u0432 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435 \u0435\u0451 \u043D\u0435 \u0431\u044B\u043B\u043E.
  // \u0420\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u0432\u0435\u0440\u043D\u0443\u043B\u043E\u0441\u044C \u043A \u0421\u0412\u041E\u0415\u0419, \u043C\u044F\u0433\u043A\u043E\u0439 \u0440\u043E\u043B\u0438 \u0438 \u0441\u043D\u043E\u0432\u0430 \u0440\u0430\u0441\u0442\u0451\u0442 \u043B\u0438\u043D\u0435\u0439\u043D\u043E \u043F\u043E \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0435. \u0427\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C
  // \u043D\u0430\u0431\u0438\u0440\u0430\u0435\u0442 \u043F\u043E\u0434\u043B\u043E\u0436\u043A\u0430 \u043F\u043E\u0434 \u043A\u0440\u0430\u0441\u043A\u043E\u0439 (vgVeil \u0432 surface-shader.ts), \u0430 \u043E\u043D\u0430 \u0434\u0430\u0451\u0442 \u0442\u0443 \u0436\u0435 \u0440\u0430\u0431\u043E\u0442\u0443 \u0411\u0415\u0417
  // \u0448\u0443\u043C\u0430: \u0434\u0438\u0441\u043A\u043E\u0432\u044B\u0439 \u0441\u0431\u043E\u0440 \u043E\u0446\u0435\u043D\u0438\u0432\u0430\u0435\u0442 \u0444\u043E\u043D \u0442\u043E\u0447\u0435\u0447\u043D\u044B\u043C\u0438 \u043F\u0440\u043E\u0431\u0430\u043C\u0438, \u0438 \u043D\u0430 \u0440\u0435\u0437\u043A\u043E\u043C \u0442\u0435\u043A\u0441\u0442\u0435 \u0434\u0430\u0436\u0435 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0441\u043E\u0442\u043D\u0435
  // \u043F\u0440\u043E\u0431 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \xB110 \u0438\u0437 255 \u2014 \u0434\u0435\u0442\u0430\u043B\u044C \u043F\u043E\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043A\u0440\u0443\u043F\u043E\u0439. \u0420\u0430\u0434\u0438\u0443\u0441, \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u043A\u0440\u0443\u043F\u044B \u043D\u0435 \u0432\u0438\u0434\u043D\u043E,
  // \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u043D\u0435 \u0440\u0430\u0437\u0440\u0443\u0448\u0430\u0435\u0442, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0433\u043D\u0430\u0442\u044C\u0441\u044F \u0437\u0430 \u043D\u0438\u043C \u043D\u0435\u0447\u0435\u043C.
  float adaptBlur = max(
    min(busy * u_legibility * u_adaptRadius * 0.5, VG_ADAPT_BLUR_MAX)
      * min(1.0 + footprint, VG_FOOTPRINT_MAX),
    u_frost);
  if (adaptBlur > 0.5) {
    float reach = max(u_reach - length(p), 1.0);
    float4 g = vgGather(s, min(adaptBlur, reach), xy);
    float ga = g.a;
    float3 blurred = ga > 0.004 ? g.rgb / ga : float3(0.0);
    rgb = mix(rgb, blurred, smoothstep(0.5, 2.0, adaptBlur));
  }
  // \u0421\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u043C\u0435\u0441\u0442\u0430 \u2014 \u044D\u0442\u043E \u043E\u0446\u0435\u043D\u043A\u0430 \u0437\u043E\u043D\u0434\u0430, \u0430 \u043D\u0435 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u042D\u0422\u041E\u0413\u041E \u043F\u0438\u043A\u0441\u0435\u043B\u044F. \u041F\u043E\u0434\u043C\u0435\u0448\u0438\u0432\u0430\u0442\u044C \u0441\u044E\u0434\u0430
  // \u043F\u0438\u043A\u0441\u0435\u043B\u044C \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u043E \u0442\u043E\u0439 \u0436\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0435, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043E\u0446\u0435\u043D\u043A\u0430 \u0443\u0435\u0445\u0430\u043B\u0430 \u0432 \u0437\u043E\u043D\u0434: \u0438\u0437\u043B\u043E\u043C \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u0438
  // \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043B\u044E\u0431\u0443\u044E \u0432\u044B\u0441\u043E\u043A\u0443\u044E \u0447\u0430\u0441\u0442\u043E\u0442\u0443 \u0432 \u0432\u0438\u0434\u0438\u043C\u0443\u044E \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443.
  float local = lumWide;

  // \u0422\u0415\u041B\u041E \u0421\u0422\u0415\u041A\u041B\u0410. \u0421\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0417\u0414\u0415\u0421\u042C, \u0430 \u043D\u0435 \u0432 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u043F\u043E \u0442\u043E\u0439 \u0436\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0435, \u0447\u0442\u043E \u0438 \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435:
  // \u0444\u043E\u043D \u0432\u0438\u0434\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0442\u0441\u044E\u0434\u0430. \u041F\u043E\u043A\u0430 \u0442\u0438\u043D\u0442 \u0440\u0438\u0441\u043E\u0432\u0430\u043B\u0441\u044F \u043F\u043E\u0432\u0435\u0440\u0445, \u043E\u043D \u0431\u044B\u043B \u043E\u0431\u044F\u0437\u0430\u043D \u0431\u044B\u0442\u044C \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u044B\u043C \u043D\u0430
  // \u0432\u0441\u0435\u0439 \u0434\u0435\u0442\u0430\u043B\u0438 \u2014 \u0442\u043E\u0447\u0435\u0447\u043D\u043E\u0439 \u0430\u0434\u0430\u043F\u0442\u0430\u0446\u0438\u0438 \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043E\u0432\u0430\u043B\u043E \u0432 \u043F\u0440\u0438\u043D\u0446\u0438\u043F\u0435.
  //
  // \u0426\u0435\u043B\u044C \u2014 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043F\u043E \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0435 \u0441 \u0442\u0435\u043C, \u0447\u0442\u043E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0440\u0438\u0441\u0443\u0435\u0442 \u041F\u041E\u0412\u0415\u0420\u0425 \u0441\u0442\u0435\u043A\u043B\u0430.
  // \u0423\u043D\u0438\u0444\u043E\u0440\u043C\u0430 u_ink \u0437\u0434\u0435\u0441\u044C \u041F\u041E\u041B\u042F\u0420\u041D\u041E\u0421\u0422\u042C \u043D\u0430\u0434\u043F\u0438\u0441\u0438 (1 \u0441\u0432\u0435\u0442\u043B\u0430\u044F, 0 \u0442\u0451\u043C\u043D\u0430\u044F), \u0430 \u043D\u0435 \u0435\u0451 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430: \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F
  // \u0441\u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u043D\u0430 \u043A\u043E\u043D\u0446\u0430\u0445 \u0438 \u0441\u043C\u0435\u0448\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u043F\u043E \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438. \u0415\u0441\u043B\u0438 \u043F\u043E\u0434\u0441\u0442\u0430\u0432\u043B\u044F\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443, \u0442\u043E
  // \u043D\u0430 \u043F\u0435\u0440\u0435\u043A\u0440\u0430\u0441\u043A\u0435 \u043D\u0430\u0434\u043F\u0438\u0441\u0438 ink \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442 \u0447\u0435\u0440\u0435\u0437 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0443 \u2014 \u0430 \u0441\u0435\u0440\u0430\u044F \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u043E\u0442 \u0442\u0435\u043B\u0430
  // \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C\u0430, \u0438 \u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0430 \u043F\u043E\u043B\u043F\u0443\u0442\u0438 \u043D\u044B\u0440\u044F\u0435\u0442 \u0442\u0435\u043C\u043D\u0435\u0435, \u0447\u0435\u043C \u0432 \u043E\u0431\u043E\u0438\u0445 \u043A\u043E\u043D\u0435\u0447\u043D\u044B\u0445 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F\u0445.
  float strict = clamp(u_legibility * 2.0, 0.0, 1.0);
  float capLight = mix(VG_BODY_CAP_LOOSE, VG_BODY_CAP_TIGHT, strict);
  float floorDark = 1.0 - capLight;
  float pol = clamp(u_ink, 0.0, 1.0);

  // \u0420\u0410\u0417\u041D\u041E\u0420\u041E\u0414\u041D\u042B\u0419 \u0424\u041E\u041D. \u041A\u043E\u0433\u0434\u0430 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0438 \u0447\u0451\u0440\u043D\u043E\u0435, \u0438 \u0431\u0435\u043B\u043E\u0435 \u0441\u0440\u0430\u0437\u0443, \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u043F\u043E \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0435 \u043D\u0435
  // \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u043D\u0438 \u043F\u0440\u0438 \u043A\u0430\u043A\u043E\u0439 \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438: \u043D\u0430\u0434 \u043E\u0434\u043D\u043E\u0439 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0442\u043E\u043D\u0435\u0442 \u0432 \u043B\u044E\u0431\u043E\u043C \u0441\u043B\u0443\u0447\u0430\u0435. \u0422\u043E\u0433\u0434\u0430
  // \u0441\u0442\u0435\u043A\u043B\u043E \u0434\u043E\u0433\u043E\u043D\u044F\u0435\u0442 \u041F\u041B\u041E\u0422\u041D\u041E\u0421\u0422\u042C\u042E \u2014 \u0440\u043E\u0432\u043D\u043E \u0442\u043E, \u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0435 \u0441\u0442\u0435\u043A\u043B\u043E \u0448\u0435\u0440\u043E\u0445\u043E\u0432\u0430\u0442\u043E\u0441\u0442\u044C\u044E:
  // \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u0431\u044B\u0442\u044C \u043E\u043A\u043D\u043E\u043C. \u0412\u0435\u043B\u0438\u0447\u0438\u043D\u0443 \u0437\u0430\u0434\u0430\u0451\u0442 legibility, \u043F\u043E\u0432\u043E\u0434 \u2014 \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0430; \u043E\u0442\u043A\u043B\u0438\u043A \u043D\u0430\u0441\u044B\u0449\u0430\u0435\u0442\u0441\u044F
  // \u0440\u0430\u043D\u043E, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E \u0441\u043F\u043E\u0440\u0438\u0442 \u0441 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u043D\u0435 \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B, \u0430 \u0441\u0430\u043C \u0444\u0430\u043A\u0442 \u0435\u0451 \u043D\u0430\u043B\u0438\u0447\u0438\u044F.
  // \u041F\u043E\u043B \u0437\u0430\u0434\u0430\u0451\u0442 \u0421\u0410\u041C\u0410 legibility, \u0430 \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0430 \u043C\u043E\u0436\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0432\u0435\u0440\u0445\u0443. \u0421\u0442\u0430\u0432\u0438\u0442\u044C \u0435\u0433\u043E \u0432
  // \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u044C \u043E\u0442 \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u044B \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u043E \u0434\u0432\u0443\u043C \u043F\u0440\u0438\u0447\u0438\u043D\u0430\u043C \u0441\u0440\u0430\u0437\u0443: \u0437\u043E\u043D\u0434 \u0443\u0441\u0440\u0435\u0434\u043D\u044F\u0435\u0442, \u0438 \u0441\u0442\u0440\u043E\u043A\u0443 \u0442\u0435\u043A\u0441\u0442\u0430 \u043F\u043E\u0434
  // \u0448\u0438\u0440\u043E\u043A\u043E\u0439 \u0434\u0435\u0442\u0430\u043B\u044C\u044E \u043E\u043D \u0432 \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0435 \u043F\u043E\u0447\u0442\u0438 \u043D\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 (\u0437\u0430\u043C\u0435\u0440: busy 0.12 \u0442\u0430\u043C, \u0433\u0434\u0435 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C
  // \u0435\u0434\u0443\u0442 \u0434\u0432\u0435 \u0441\u0442\u0440\u043E\u043A\u0438) \u2014 \u0430 \u043D\u0430 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0438 \u043F\u043E\u043B \u0445\u043E\u0434\u0438\u043B \u0431\u044B \u0432\u0432\u0435\u0440\u0445-\u0432\u043D\u0438\u0437 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u043E\u0446\u0435\u043D\u043A\u043E\u0439, \u0438 \u0442\u0435\u043B\u043E \u0433\u0443\u043B\u044F\u043B\u043E
  // \u0431\u044B \u043F\u043E \u044F\u0440\u043A\u043E\u0441\u0442\u0438. \u0420\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u043E\u0441\u0442\u044C \u0434\u0435\u0442\u0430\u043B\u0438 \u043F\u0440\u0438 \u044D\u0442\u043E\u043C \u043D\u0435 \u0441\u0442\u0440\u0430\u0434\u0430\u0435\u0442: \u0435\u0451 \u043D\u0435\u0441\u0451\u0442 \u043A\u0440\u043E\u043C\u043A\u0430 \u043D\u0438\u0436\u0435, \u0430 \u043D\u0435 \u0442\u0435\u043B\u043E.
  float busyFloor = max(u_legibility * VG_GROUND_MIN,
                        structure * mix(0.06, VG_GROUND_MAX, u_legibility));

  // \u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u0413\u0410\u0421\u041D\u0415\u0422 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 legibility: \u0434\u0435\u0442\u0430\u043B\u044C, \u043F\u043E\u0432\u0435\u0440\u0445 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0440\u0438\u0441\u0443\u044E\u0442, \u0440\u0430\u0437\u0432\u043E\u0434\u0438\u0442\u044C
  // \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043D\u0435 \u0441 \u0447\u0435\u043C, \u0438 \u043C\u043E\u0434\u0435\u043B\u044C \u043E\u0431\u0435\u0449\u0430\u0435\u0442 \u0435\u0439 \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E (material.ts).
  float demand = clamp(u_legibility * 4.0, 0.0, 1.0);

  // \u0422\u0418\u041D\u0422 \u0421\u0420\u0415\u0414\u042B \u0417\u0410\u0414\u0410\u0401\u0422 \u041F\u041E\u041B\u042F\u0420\u041D\u041E\u0421\u0422\u042C \u041D\u0410\u0414\u041F\u0418\u0421\u0418: \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043D\u0443\u0436\u043D\u0430 \u0442\u0451\u043C\u043D\u0430\u044F \u0441\u0440\u0435\u0434\u0430, \u0442\u0451\u043C\u043D\u043E\u0439 \u2014 \u0441\u0432\u0435\u0442\u043B\u0430\u044F. \u042D\u0442\u043E
  // \u043D\u0435 \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435, \u0430 \u0443\u0441\u043B\u043E\u0432\u0438\u0435 \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u0438: \u043A \u0442\u0438\u043D\u0442\u0443 \u043F\u0440\u0438\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0412\u0421\u0401, \u0447\u0442\u043E \u0432\u0438\u0434\u043D\u043E \u0441\u043A\u0432\u043E\u0437\u044C \u0441\u0442\u0435\u043A\u043B\u043E,
  // \u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0444\u043E\u043D\u043E\u043C \u043F\u0440\u0438\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0447\u0443\u0436\u043E\u0439 \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u0434 \u043D\u0438\u043C. \u0421\u0442\u043E\u0438\u043B\u043E \u0443\u0432\u0435\u0441\u0442\u0438 \u0442\u0438\u043D\u0442 \u043E\u0442 \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438 \u2014
  // \u0438 \u0447\u0443\u0436\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0430\u0441\u044C \u044F\u0440\u0447\u0435 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u0434\u0435\u0442\u0430\u043B\u0438.
  //
  // \u041D\u043E \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C \u0440\u0435\u0448\u0430\u0435\u0442 \u0440\u043E\u0432\u043D\u043E \u0432 \u0442\u043E\u0439 \u043C\u0435\u0440\u0435, \u0432 \u043A\u0430\u043A\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0432\u043E\u043E\u0431\u0449\u0435 \u0435\u0441\u0442\u044C. \u0422\u0430\u043C, \u0433\u0434\u0435 \u043F\u043E\u0432\u0435\u0440\u0445 \u0441\u0442\u0435\u043A\u043B\u0430
  // \u043D\u0435 \u0440\u0438\u0441\u0443\u044E\u0442 \u043D\u0438\u0447\u0435\u0433\u043E, \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u0442\u044C \u0435\u0439 \u043D\u0435\u0447\u0435\u0433\u043E, \u0438 \u0441\u0440\u0435\u0434\u0430 \u043A\u0440\u0430\u0441\u0438\u0442\u0441\u044F \u0442\u0430\u043A, \u0447\u0442\u043E\u0431\u044B \u0434\u0435\u0442\u0430\u043B\u044C \u041E\u0422\u041E\u0428\u041B\u0410 \u041E\u0422
  // \u0424\u041E\u041D\u0410 \u2014 \u044D\u0442\u043E \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435, \u0447\u0442\u043E \u043E\u0442 \u043D\u0435\u0451 \u0442\u0430\u043C \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F. \u041F\u043E\u043A\u0430 \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C \u0440\u0435\u0448\u0430\u043B\u0430 \u0438 \u0432 \u044D\u0442\u043E\u043C \u0441\u043B\u0443\u0447\u0430\u0435,
  // \u043F\u0443\u0441\u0442\u044B\u0435 \u043A\u043D\u043E\u043F\u043A\u0438 \u0442\u0435\u0440\u044F\u043B\u0438 \u0442\u0435\u043B\u043E: \u0442\u0438\u043D\u0442 \u043F\u043E \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438 \u0441\u043C\u043E\u0442\u0440\u0435\u043B \u0442\u0443\u0434\u0430 \u0436\u0435, \u043A\u0443\u0434\u0430 \u0438 \u0444\u043E\u043D.
  float dirEarly = local < 0.5 ? 1.0 : -1.0;
  float away = local < 0.5 ? VG_TINT_LIGHT : VG_TINT_DARK;
  float tintLuma = mix(away, mix(VG_TINT_LIGHT, VG_TINT_DARK, pol), demand);

  // \u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0440\u0435\u0434\u044B \u043D\u0443\u0436\u043D\u043E, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0435\u0441\u0442\u0438 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043F\u043E\u0434 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u0437\u0430 \u043F\u043E\u0440\u043E\u0433. \u0421\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043F\u043E \u041C\u0415\u0421\u0422\u0423:
  // \u0442\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0433\u0440\u0430\u0434\u0438\u0435\u043D\u0442\u043D\u043E\u0435, \u0438 \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u043E\u0439 \u043E\u043D\u043E \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u043B\u043E\u0442\u043D\u0435\u0435, \u0447\u0435\u043C \u043D\u0430\u0434 \u0442\u0451\u043C\u043D\u043E\u0439.
  float needForLight = local > capLight
    ? clamp((local - capLight) / max(local - VG_TINT_DARK, 1e-4), 0.0, 0.92)
    : 0.0;
  float needForDark = local < floorDark
    ? clamp((floorDark - local) / max(VG_TINT_LIGHT - local, 1e-4), 0.0, 0.92)
    : 0.0;
  float needForInk = mix(needForDark, needForLight, pol) * demand;

  // \u0420\u0410\u0417\u041B\u0418\u0427\u0418\u041C\u041E\u0421\u0422\u042C \u0421\u0410\u041C\u041E\u0419 \u0414\u0415\u0422\u0410\u041B\u0418. \u041D\u0430\u0434 \u043E\u0434\u043D\u043E\u0440\u043E\u0434\u043D\u044B\u043C \u0444\u043E\u043D\u043E\u043C \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u044F\u0442\u044C \u043D\u0435\u0447\u0435\u0433\u043E, \u0438 \u0441\u0442\u0435\u043A\u043B\u043E \u0447\u0435\u0441\u0442\u043D\u043E
  // \u0438\u0441\u0447\u0435\u0437\u0430\u0435\u0442 \u2014 \u0434\u043B\u044F \u043A\u0443\u0441\u043A\u0430 \u0444\u043E\u043D\u0430 \u044D\u0442\u043E \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E, \u0434\u043B\u044F \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u043E. \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441
  // \u0438\u0434\u0451\u0442 \u044D\u0442\u0438\u043C \u0436\u0435 \u043A\u0430\u043D\u0430\u043B\u043E\u043C: \u0441\u044B\u0433\u0440\u0430\u043D\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C \u2014 \u0443\u0447\u0430\u0441\u0442\u043E\u043A, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0442\u0440\u0435\u0431\u0443\u044E\u0442 \u0411\u041E\u041B\u042C\u0428\u0415\u0413\u041E \u043E\u0442\u0445\u043E\u0434\u0430.
  float sep = u_presence + VG_PROGRESS_PRESENCE * vgProgress(p, u_halfSize, u_progress);

  // \u041E\u0442\u043E\u0439\u0442\u0438 \u043E\u0442 \u0444\u043E\u043D\u0430 \u0422\u0415\u041B\u041E\u041C \u043C\u043E\u0436\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0435\u0441\u043B\u0438 \u0442\u0438\u043D\u0442 \u0441\u043C\u043E\u0442\u0440\u0438\u0442 \u0412 \u0421\u0422\u041E\u0420\u041E\u041D\u0423 \u041E\u0422 \u0444\u043E\u043D\u0430. \u041D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u0444\u043E\u043D\u043E\u043C \u0443
  // \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u0442\u0430\u043A \u0438 \u0435\u0441\u0442\u044C \u2014 \u0442\u0451\u043C\u043D\u0430\u044F \u0441\u0440\u0435\u0434\u0430 \u0443\u0432\u043E\u0434\u0438\u0442 \u0442\u0435\u043B\u043E \u0432\u043D\u0438\u0437, \u0438 \u044D\u0442\u043E \u0436\u0435 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0438 \u0440\u0430\u0437\u0434\u0435\u043B\u044F\u0435\u0442.
  // \u041D\u0430\u0434 \u0422\u0401\u041C\u041D\u042B\u041C \u0444\u043E\u043D\u043E\u043C \u0442\u0438\u043D\u0442 \u0442\u043E\u0436\u0435 \u0442\u0451\u043C\u043D\u044B\u0439, \u0438\u0434\u0442\u0438 \u0442\u0435\u043B\u0443 \u043D\u0435\u043A\u0443\u0434\u0430: \u0442\u0435\u043C\u043D\u0435\u0435 \u043F\u043E\u0447\u0442\u0438 \u0447\u0451\u0440\u043D\u043E\u0433\u043E \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442.
  float toward = (tintLuma - local) * dirEarly;

  // \u041F\u041B\u041E\u0422\u041D\u041E\u0421\u0422\u042C \u0421\u0427\u0418\u0422\u0410\u0415\u0422\u0421\u042F \u041F\u041E \u041A\u0420\u0410\u0419\u041D\u0415\u0419 \u0421\u0412\u0415\u0422\u041B\u041E\u0422\u0415, \u0410 \u041D\u0415 \u041F\u041E \u0422\u0418\u041D\u0422\u0423. \u0414\u0435\u043B\u0438\u0442\u044C \u0442\u0440\u0435\u0431\u0443\u0435\u043C\u044B\u0439 \u043E\u0442\u0445\u043E\u0434 \u043D\u0430
  // \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043E\u0442 \u0442\u0438\u043D\u0442\u0430 \u0434\u043E \u0444\u043E\u043D\u0430 \u043D\u0435\u043B\u044C\u0437\u044F: \u043E\u043D\u0438 \u043C\u043E\u0433\u0443\u0442 \u0441\u043E\u0432\u043F\u0430\u0441\u0442\u044C. \u0421\u0432\u0435\u0442\u043B\u0430\u044F \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0434\u0430\u0451\u0442 \u0442\u0438\u043D\u0442 0.11,
  // \u0442\u0451\u043C\u043D\u044B\u0439 \u0444\u043E\u043D \u2014 \u0442\u043E\u0436\u0435 0.11, \u0438 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u0432 0.05 \u043F\u0440\u043E\u0441\u0438\u0442 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C 14 \u2014 \u0442\u043E \u0435\u0441\u0442\u044C \u0443\u043F\u0438\u0440\u0430\u0435\u0442\u0441\u044F \u0432
  // \u043A\u043B\u0430\u043C\u043F\u0443, \u0438 \u0441\u0442\u0435\u043A\u043B\u043E \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u043D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0439 \u043F\u043B\u0430\u0448\u043A\u043E\u0439. \u0420\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0434\u043E \u041A\u0420\u0410\u042F \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430 \u043C\u0430\u043B\u043E \u043D\u0435
  // \u0431\u044B\u0432\u0430\u0435\u0442, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u0430 \u0437\u0434\u0435\u0441\u044C \u0432\u0441\u0435\u0433\u0434\u0430 \u043E\u0441\u043C\u044B\u0441\u043B\u0435\u043D\u043D\u0430\u044F, \u0430 \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0442\u0435\u043B\u043E \u0432 \u0438\u0442\u043E\u0433\u0435 \u043D\u0435 \u0434\u043E\u0431\u0440\u0430\u043B\u043E \u2014
  // \u0441\u0447\u0438\u0442\u0430\u0435\u0442 unmet \u043D\u0438\u0436\u0435 \u0438 \u043E\u0442\u0434\u0430\u0451\u0442 \u043A\u0440\u043E\u043C\u043A\u0435.
  float densityForSep = clamp(sep / max(abs(away - local), 1e-4), 0.0, 0.92);
  float density = max(max(u_bodyDensity, busyFloor), max(needForInk, densityForSep));

  // \u0426\u0412\u0415\u0422 \u0422\u0415\u041B\u0410. \u041E\u0442\u0442\u0435\u043D\u043E\u043A \u0441\u0440\u0435\u0434\u044B \u0437\u0430\u0434\u0430\u043D \u0435\u0451 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C\u044E, \u043D\u043E \u0442\u0435\u043B\u043E \u0435\u0449\u0451 \u0438 \u041A\u0420\u0410\u0421\u0418\u0422\u0421\u042F \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u044B\u043C: \u0441\u0432\u0435\u0442
  // \u0433\u0443\u043B\u044F\u0435\u0442 \u0432\u043D\u0443\u0442\u0440\u0438 \u0441\u0442\u0435\u043A\u043B\u0430 \u043C\u043D\u043E\u0433\u043E\u043A\u0440\u0430\u0442\u043D\u043E \u0438 \u0443\u043D\u043E\u0441\u0438\u0442 \u0441 \u0441\u043E\u0431\u043E\u0439 \u0446\u0432\u0435\u0442 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u043F\u043E\u0434 \u043D\u0438\u043C \u0438 \u0432\u043E\u043A\u0440\u0443\u0433 \u043D\u0435\u0433\u043E.
  // \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u0440\u044F\u0434\u043E\u043C \u0441 \u0436\u0451\u043B\u0442\u043E\u0439 \u043E\u0431\u043B\u043E\u0436\u043A\u043E\u0439 \u0442\u0435\u043F\u043B\u0435\u0435\u0442 \u0432\u0441\u0451 \u0442\u0435\u043B\u043E, \u0430 \u043D\u0435 \u043E\u0434\u043D\u0430 \u043A\u0440\u043E\u043C\u043A\u0430. \u0421\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u043F\u0440\u0438 \u044D\u0442\u043E\u043C
  // \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0441\u0432\u043E\u044F \u2014 \u043E\u043D\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0443 \u043F\u043E \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u044E \u0441 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E.
  float3 tintHue = mix(vgHue(u_bodyTint), vgHue(wide * 0.5 + ambient * 0.5), u_colorPickup);

  float3 tint = tintHue * tintLuma;
  rgb = mix(rgb, tint, density);

  // \u0421\u0412\u0415\u0422 \u041E\u041A\u0420\u0423\u0416\u0415\u041D\u0418\u042F. \u0421\u0442\u0435\u043A\u043B\u043E \u043D\u0430 \u0447\u0451\u0440\u043D\u043E\u043C \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442 \u0434\u044B\u0440\u043E\u0439: \u0434\u043E \u043D\u0435\u0433\u043E \u0434\u043E\u0445\u043E\u0434\u0438\u0442 \u0441\u0432\u0435\u0442 \u043E\u0442 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E
  // \u043B\u0435\u0436\u0438\u0442 \u0440\u044F\u0434\u043E\u043C. \u0411\u0435\u0440\u0451\u043C \u0446\u0432\u0435\u0442 \u043E\u043A\u0440\u0435\u0441\u0442\u043D\u043E\u0441\u0442\u0438 (\u0442\u043E\u0442 \u0436\u0435 \u043E\u0442\u0441\u0447\u0451\u0442, \u0447\u0442\u043E \u0438 \u0443 \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u044F), \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u043A\u0440\u043E\u043C\u043A\u0430
  // \u0438 \u0442\u0435\u043B\u043E \u043E\u043A\u0440\u0430\u0448\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0412 \u0426\u0412\u0415\u0422 \u041A\u041E\u041D\u0422\u0415\u041D\u0422\u0410. \u041D\u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u043C \u0444\u043E\u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u043A\u0430 \u0441\u0430\u043C\u0430 \u0441\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043D\u0435\u0442.
  // \u0414\u043E\u0431\u0430\u0432\u043A\u0430 \u041E\u0414\u041D\u0410 \u0418 \u0422\u0410 \u0416\u0415 \u043F\u043E \u0432\u0441\u0435\u0439 \u0434\u0435\u0442\u0430\u043B\u0438. \u0420\u0430\u043D\u044C\u0448\u0435 \u043E\u043D\u0430 \u0448\u043B\u0430 \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u0435\u043C mix(0.35, 1.0, t) \u2014
  // \u0432\u0442\u0440\u043E\u0435 \u0441\u043B\u0430\u0431\u0435\u0435 \u0432 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435, \u0447\u0435\u043C \u0443 \u0444\u0430\u0441\u043A\u0438, \u2014 \u0438 \u043D\u0430 \u0442\u0435\u043B\u0435 \u044D\u0442\u043E \u0447\u0438\u0442\u0430\u043B\u043E\u0441\u044C \u043F\u044F\u0442\u043D\u043E\u043C \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u0442\u043E\u043D\u0430 \u043F\u043E
  // \u0446\u0435\u043D\u0442\u0440\u0443: \u0442\u0430 \u0436\u0435 \u0431\u043E\u043B\u0435\u0437\u043D\u044C \xAB\u0434\u0432\u0443\u0445 \u0441\u0442\u0451\u043A\u043E\u043B \u0432 \u043E\u0434\u043D\u043E\u0439 \u0444\u043E\u0440\u043C\u0435\xBB, \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u043E\u043D\u043E\u043C, \u0430 \u043D\u0435 \u043C\u0443\u0442\u044C\u044E. \u041A\u0440\u043E\u043C\u043A\u0443
  // \u0432\u044B\u0434\u0435\u043B\u044F\u0435\u0442 \u0424\u0440\u0435\u043D\u0435\u043B\u044C, \u0443 \u043D\u0435\u0433\u043E \u043D\u0430 \u044D\u0442\u043E \u0441\u0432\u043E\u0451 \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0435.
  rgb += ambient * u_edgeLight * (0.12 + 0.55 * (1.0 - local));

  // \u041D\u0415\u0414\u041E\u0411\u0420\u0410\u041D\u041D\u0410\u042F \u0420\u0410\u0417\u041B\u0418\u0427\u0418\u041C\u041E\u0421\u0422\u042C \u0423\u0425\u041E\u0414\u0418\u0422 \u0412 \u041A\u0420\u041E\u041C\u041A\u0423. \u041D\u0430\u0434 \u0442\u0451\u043C\u043D\u044B\u043C \u0444\u043E\u043D\u043E\u043C \u0442\u0435\u043B\u043E \u043E\u0442\u043E\u0439\u0442\u0438 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442: \u0441\u0432\u0435\u0442\u043B\u043E\u0439
  // \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u043D\u0443\u0436\u043D\u0430 \u0442\u0451\u043C\u043D\u0430\u044F \u0441\u0440\u0435\u0434\u0430, \u0430 \u0442\u0435\u043C\u043D\u0435\u0435 \u043F\u043E\u0447\u0442\u0438 \u0447\u0451\u0440\u043D\u043E\u0433\u043E \u0444\u043E\u043D\u0430 \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442. \u0422\u044F\u043D\u0443\u0442\u044C \u0442\u0435\u043B\u043E \u0432 \u0441\u0432\u0435\u0442\u043B\u043E\u0435
  // \u0440\u0430\u0434\u0438 \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u043E\u0441\u0442\u0438 \u043D\u0435\u043B\u044C\u0437\u044F \u2014 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0442\u0435\u043B\u043E\u043C \u0441\u0432\u0435\u0442\u043B\u0435\u0435\u0442 \u0438 \u0447\u0443\u0436\u043E\u0439 \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u043E\u043D
  // \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u044F\u0440\u0447\u0435 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u0434\u0435\u0442\u0430\u043B\u0438, \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u0431\u044B\u0442\u044C \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0439.
  //
  // \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F \u0431\u0435\u0440\u0451\u0442 \u043D\u0430 \u0441\u0435\u0431\u044F \u0424\u0410\u0421\u041A\u0410: \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0441\u0432\u0435\u0442 \u043F\u043E \u043A\u0440\u043E\u043C\u043A\u0435, \u043D\u0435 \u0437\u0430\u043D\u044F\u0442\u044B\u0439 \u0443
  // \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F. \u042D\u0442\u043E \u0438 \u0435\u0441\u0442\u044C \xAB\u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0430 \u0442\u0451\u043C\u043D\u043E\u043C \u0444\u043E\u043D\u0435 \u0447\u0435\u0441\u0442\u043D\u0435\u0435 \u0447\u0438\u0442\u0430\u0442\u044C \u043A\u0440\u043E\u043C\u043A\u043E\u0439, \u0447\u0435\u043C \u0437\u0430\u043B\u0438\u0432\u043A\u043E\u0439\xBB \u2014 \u0437\u0434\u0435\u0441\u044C
  // \u043E\u043D\u043E \u041F\u041E\u0421\u0427\u0418\u0422\u0410\u041D\u041E, \u0430 \u043D\u0435 \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u043E: \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0442\u0435\u043B\u043E \u043D\u0435 \u0434\u043E\u0431\u0440\u0430\u043B\u043E, \u0441\u0442\u043E\u043B\u044C\u043A\u043E \u043A\u0440\u043E\u043C\u043A\u0430 \u0438 \u043F\u043E\u043B\u0443\u0447\u0438\u0442, \u0438 \u043D\u0430\u0434
  // \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u0444\u043E\u043D\u043E\u043C, \u0433\u0434\u0435 \u0442\u0435\u043B\u043E \u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0441\u0430\u043C\u043E, \u043A\u0440\u043E\u043C\u043A\u0438 \u043D\u0435\u0442 \u0432\u043E\u0432\u0441\u0435.
  // \u0417\u043D\u0430\u043A \u0443 \u043A\u0440\u043E\u043C\u043A\u0438 \u0422\u041E\u0422 \u0416\u0415, \u0427\u0422\u041E \u0423 \u0412\u0421\u0415\u0413\u041E \u041E\u0421\u0422\u0410\u041B\u042C\u041D\u041E\u0413\u041E \u2014 \u043E\u0442 \u0444\u043E\u043D\u0430: \u043D\u0430\u0434 \u0442\u0451\u043C\u043D\u044B\u043C \u043F\u043E\u043B\u043E\u0442\u043D\u043E\u043C \u043E\u043D\u0430 \u0441\u0432\u0435\u0442\u043B\u0435\u0435\u0442,
  // \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u0442\u0435\u043C\u043D\u0435\u0435\u0442. \u041F\u043E\u043A\u0430 \u043E\u043D\u0430 \u0432\u0441\u0435\u0433\u0434\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u043B\u0430 \u0441\u0432\u0435\u0442\u0430, \u043D\u0430\u0434 \u043F\u043E\u0447\u0442\u0438 \u0431\u0435\u043B\u044B\u043C \u043F\u043E\u043B\u043E\u0442\u043D\u043E\u043C \u0435\u0451 \u043F\u0440\u043E\u0441\u0442\u043E
  // \u043D\u0435 \u0431\u044B\u043B\u043E \u0432\u0438\u0434\u043D\u043E \u2014 \u0441\u0432\u0435\u0442 \u043F\u043E \u0441\u0432\u0435\u0442\u0443, \u2014 \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u0442\u0430\u043C \u043F\u0440\u043E\u043F\u0430\u0434\u0430\u043B\u0430 \u0446\u0435\u043B\u0438\u043A\u043E\u043C.
  float unmet = max(sep - max(density * toward, 0.0), 0.0);
  rgb += float3(dirEarly * unmet * VG_RIM_GAIN * pow(t, 3.0));

  if (u_debug > 9.5 && u_debug < 10.5) { rgb = spectral * 0.5; }
  if (u_debug > 10.5) { rgb = float3(density, sep, max(sep - max(density * toward, 0.0), 0.0)); }

  // \u0421\u0436\u0430\u0442\u0438\u0435 \u2014 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u043C, \u043F\u043E \u0438\u0442\u043E\u0433\u043E\u0432\u043E\u043C\u0443 \u0446\u0432\u0435\u0442\u0443.
  //
  // \u0414\u0438\u0437\u0435\u0440\u0430 \u0437\u0434\u0435\u0441\u044C \u041D\u0415\u0422. \u041E\u043D \u0441\u0442\u043E\u044F\u043B, \u043F\u043E\u043A\u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u0444\u043E\u043D\u0430 \u043E\u0446\u0435\u043D\u0438\u0432\u0430\u043B\u0430\u0441\u044C \u043F\u043E \u043F\u0438\u043A\u0441\u0435\u043B\u044E: \u0442\u0435\u043B\u043E \u0431\u044B\u043B\u043E \u0433\u043B\u0430\u0434\u043A\u043E\u0439
  // \u0444\u0443\u043D\u043A\u0446\u0438\u0435\u0439 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B, \u0438 \u0432\u043E\u0441\u044C\u043C\u0438\u0431\u0438\u0442\u043D\u044B\u0439 \u0432\u044B\u0432\u043E\u0434 \u0448\u0451\u043B \u043F\u043E\u043B\u043E\u0441\u0430\u043C\u0438. \u0422\u0435\u043F\u0435\u0440\u044C \u043E\u0446\u0435\u043D\u043A\u0430 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \u0438\u0437 \u0437\u043E\u043D\u0434\u0430
  // \u043E\u0434\u043D\u0438\u043C \u0447\u0438\u0441\u043B\u043E\u043C \u043D\u0430 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C, \u0442\u0438\u043D\u0442 \u0434\u0430\u0451\u0442 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u043E\u0435 \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435, \u0430 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u0430\u044F \u043D\u0435 \u0431\u0430\u043D\u0434\u0438\u0442 \u2014
  // \u0440\u0430\u0437\u0431\u0438\u0432\u0430\u0442\u044C \u043D\u0435\u0447\u0435\u0433\u043E. \u041E\u0441\u0442\u0430\u043B\u0430\u0441\u044C \u0431\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u043A\u0440\u0443\u043F\u0430 \u043D\u0430 \u0440\u043E\u0432\u043D\u043E\u0439 \u0437\u0430\u043B\u0438\u0432\u043A\u0435, \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0442\u0430\u043C \u0432\u0437\u044F\u0442\u044C\u0441\u044F \u043D\u0435\u043E\u0442\u043A\u0443\u0434\u0430.
  rgb = vgSoftClip(rgb);

  // \u0410\u043B\u044C\u0444\u0430 \u0432\u044B\u0431\u043E\u0440\u043E\u043A \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0434\u043E\u0436\u0438\u0442\u044C \u0434\u043E \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430: \u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0446\u0432\u0435\u0442 \u043F\u043E \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u0439 \u0430\u043B\u044C\u0444\u0435, \u0430 \u0432\u0435\u0440\u043D\u0443\u0442\u044C
  // \u0441 \u0447\u0443\u0436\u043E\u0439 (\u043C\u0430\u0441\u043A\u043E\u0439 \u0444\u043E\u0440\u043C\u044B) \u2014 \u0437\u043D\u0430\u0447\u0438\u0442 \u0441\u0434\u0435\u043B\u0430\u0442\u044C \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0439 \u0431\u044D\u043A\u0434\u0440\u043E\u043F \u043D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u043C \u0438 \u0437\u0430\u0441\u0432\u0435\u0442\u0438\u0442\u044C \u0435\u0433\u043E.
  float alpha = srcA * (1.0 - smoothstep(-1.0, 1.0, sd));
  return half4(half3(clamp(rgb, float3(0.0), float3(1.0)) * alpha), half(alpha));
}
`;
  var SURFACE_SHADER = `
uniform shader u_icon;
/** \u0426\u0432\u0435\u0442\u043D\u043E\u0439 \u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u041D\u0410 \u0441\u0442\u0435\u043A\u043B\u0435 \u2014 \u043E\u0431\u043B\u043E\u0436\u043A\u0430, \u043C\u0438\u043D\u0438\u0430\u0442\u044E\u0440\u0430. \u041E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u0441\u043B\u043E\u0439 \u043E\u0442 \u043C\u0430\u0441\u043A\u0438 \u043A\u0440\u0430\u0441\u043A\u0438:
 *  \u0442\u0430 \u043E\u0434\u043D\u043E\u043A\u0430\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u0438 \u043A\u0440\u0430\u0441\u0438\u0442\u0441\u044F \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C\u044E, \u0430 \u044D\u0442\u043E\u0442 \u043D\u0435\u0441\u0451\u0442 \u0441\u0432\u043E\u0439 \u0446\u0432\u0435\u0442 \u043A\u0430\u043A \u0435\u0441\u0442\u044C. */
uniform shader u_overlay;

uniform float2 u_center;
uniform float2 u_halfSize;
uniform float  u_corner;
uniform float  u_bevel;
uniform float  u_thickness;
uniform float2 u_morphOffset;
uniform float2 u_morphHalf;
uniform float  u_morphCorner;
uniform float  u_morphK;

uniform float  u_press;
uniform float  u_active;
uniform float2 u_light;

uniform float  u_specular;
uniform float  u_specularPower;
uniform float  u_edgeDensity;
uniform float  u_dispersion;
uniform float  u_refraction;
uniform float4 u_tint;
uniform float  u_shadow;
uniform float  u_shadowReach;
uniform float  u_presence;
uniform float  u_progress;
uniform float  u_debug;

uniform float  u_iconOn;
uniform float  u_overlayOn;
uniform float  u_iconScale;
uniform float4 u_inkIdle;
uniform float4 u_inkActive;
uniform float2 u_touch;
uniform float2 u_pull;
uniform float  u_touchPress;
uniform float  u_touchRadius;
uniform float2 u_wave;

${VG_SDF}

const float VG_FALLOFF = ${VG_FALLOFF};

/* \u0422\u043E\u043B\u0449\u0438\u043D\u0430, \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043E\u0442\u043A\u0430\u043B\u0438\u0431\u0440\u043E\u0432\u0430\u043D\u043E \u043F\u043E\u0433\u043B\u043E\u0449\u0435\u043D\u0438\u0435: \u043F\u0440\u0438 \u043D\u0435\u0439 \u043F\u043E\u043B\u043E\u0441\u0430 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0435\u0442 \u0441 \u043F\u0440\u0435\u0436\u043D\u0438\u043C \u0441\u0442\u0435\u043A\u043B\u043E\u043C. */
const float VG_REF_THICKNESS = 0.18;
// \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0438\u043D\u0442\u0430 \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0439 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435; \u0443 \u0444\u0430\u0441\u043A\u0438 \u043E\u043D\u0430 \u043C\u043D\u043E\u0436\u0438\u0442\u0441\u044F \u043D\u0430 u_edgeDensity.
const float VG_BODY_DENSITY = 0.19;
/* \u0413\u043B\u0443\u0431\u0438\u043D\u0430 \u043A\u0440\u0430\u0441\u043A\u0438 \u043F\u043E\u0434 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C\u044E, dp. \u041D\u0430 \u0441\u0442\u043E\u043B\u044C\u043A\u043E \u0435\u0451 \u0443\u0432\u043E\u0434\u0438\u0442 \u043D\u043E\u0440\u043C\u0430\u043B\u044C \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438. */
const float VG_INK_DEPTH = 4.0;

half4 vgPack(half3 c, float a) { return half4(c * half(a), half(a)); }

half3 vgHeat(float v) {
  float x = clamp(v, 0.0, 1.0);
  return half3(half(clamp(x * 2.2 - 0.2, 0.0, 1.0)),
               half(clamp(1.0 - abs(x - 0.5) * 2.2, 0.0, 1.0)),
               half(clamp(1.2 - x * 2.4, 0.0, 1.0)));
}

half4 main(float2 xy) {
  float2 p = vgTouchWarp(xy - u_center, u_touch, u_pull, u_touchPress, u_touchRadius, u_wave.x, u_wave.y);

  // \u041E\u0431\u0440\u0430\u0442\u043D\u0430\u044F \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F: \u0432\u0434\u043E\u043B\u044C \u0432\u0435\u043A\u0442\u043E\u0440\u0430 \u0442\u044F\u0433\u0438 \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 A, \u043F\u043E\u043F\u0435\u0440\u0451\u043A \u0441\u0436\u0430\u0442\u0438\u0435 1/sqrt(A). \u0420\u043E\u0432\u043D\u043E
  // \u044D\u0442\u043E\u0442 \u0437\u0430\u043A\u043E\u043D \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442 \u0442\u0440\u0430\u043D\u0441\u0444\u043E\u0440\u043C \u0436\u0438\u0432\u043E\u0439 \u043F\u043E\u0434\u043B\u043E\u0436\u043A\u0438 \u043F\u043E\u0434 \u043A\u0430\u043D\u0432\u0430\u0441\u043E\u043C, \u0438\u043D\u0430\u0447\u0435 \u043E\u043D\u0438 \u0440\u0430\u0437\u044A\u0435\u0437\u0436\u0430\u044E\u0442\u0441\u044F.
  // \u0413\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u0438 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F \u0437\u0434\u0435\u0441\u044C \u041D\u0415\u0422 \u2014 \u043D\u0438 \u0442\u044F\u0433\u0438, \u043D\u0438 \u0432\u0437\u0434\u0443\u0442\u0438\u044F \u043E\u0442 \u043D\u0430\u0436\u0430\u0442\u0438\u044F. \u0412\u0441\u0451 \u044D\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u043E\u0434\u0438\u043D
  // \u0442\u0440\u0430\u043D\u0441\u0444\u043E\u0440\u043C \u043E\u0431\u0451\u0440\u0442\u043A\u0438, \u043E\u043D \u0436\u0435 \u043D\u0435\u0441\u0451\u0442 \u043D\u0430\u0442\u0438\u0432\u043D\u0443\u044E \u043B\u0438\u043D\u0437\u0443: \u0448\u0435\u0439\u0434\u0435\u0440 \u0435\u0451 \u043D\u0435 \u0434\u043E\u0441\u0442\u0430\u0451\u0442, \u0430 \u0434\u0432\u0430 \u043A\u043E\u043D\u0432\u0435\u0439\u0435\u0440\u0430
  // \u043D\u0430 \u043E\u0434\u043D\u043E \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u043D\u0430 \u043A\u0430\u0434\u0440, \u0438 \u0441\u043B\u043E\u0438 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0432\u0438\u0434\u043D\u043E \u043F\u043E \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438.

  float halfMin = max(min(u_halfSize.x, u_halfSize.y), 1.0);
  float bevel = max(u_bevel, 1.0);

  float sd = vgScene(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);
  float t = vgBevelT(sd, bevel);
  float2 n = vgSceneNormal(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);
  float3 N = normalize(float3(n * vgBevelSlope(t), 1.0));
  float3 V = float3(0.0, 0.0, 1.0);

  float bloom = 1.0 + u_press * 0.45;

  // \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u2014 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435, \u0441\u0442\u0430\u0432\u0448\u0435\u0435 \u043F\u043E\u043B\u0435\u043C: \u0441\u044B\u0433\u0440\u0430\u043D\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C \u0431\u043B\u0435\u0441\u0442\u0438\u0442 \u0438 \u0441\u0432\u0435\u0442\u0438\u0442\u0441\u044F \u0440\u043E\u0432\u043D\u043E
  // \u043D\u0430\u0441\u0442\u043E\u043B\u044C\u043A\u043E, \u043D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0431\u043B\u0435\u0441\u0442\u0438\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0434\u0435\u0442\u0430\u043B\u044C \u0446\u0435\u043B\u0438\u043A\u043E\u043C. \u041A\u0440\u0430\u0441\u043A\u0443 \u044D\u0442\u043E \u041D\u0415 \u0442\u0440\u043E\u0433\u0430\u0435\u0442: \u043F\u0435\u0440\u0435\u043A\u0440\u0430\u0448\u0438\u0432\u0430\u0442\u044C
  // \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u043F\u043E \u0445\u043E\u0434\u0443 \u0442\u0440\u0435\u043A\u0430 \u0437\u043D\u0430\u0447\u0438\u0442 \u043C\u0435\u043D\u044F\u0442\u044C \u0435\u0451 \u043F\u043E\u0441\u0440\u0435\u0434\u0438 \u0441\u043B\u043E\u0432\u0430.
  float lit = max(u_active, vgProgress(p, u_halfSize, u_progress));

  float3 L1 = normalize(float3(u_light * 0.86, 0.42));
  float3 L2 = normalize(float3(-u_light * 0.78, 0.50));
  float bevelMask = smoothstep(0.10, 0.55, t);
  float s1 = pow(max(dot(reflect(-L1, N), V), 0.0), u_specularPower) * 0.85;
  float s2 = pow(max(dot(reflect(-L2, N), V), 0.0), u_specularPower * 1.45) * 0.14;
  float spec = (s1 + s2) * bevelMask * u_specular * bloom * (1.0 + lit * 0.30);

  // \u0421\u0432\u0435\u0442\u044F\u0449\u0435\u0439\u0441\u044F \u043A\u0440\u043E\u043C\u043A\u0438 \u0437\u0434\u0435\u0441\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u041D\u0415\u0422. \u041E\u043D\u0430 \u0431\u044B\u043B\u0430 \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435\u043C, \u043D\u0430\u0440\u0438\u0441\u043E\u0432\u0430\u043D\u043D\u044B\u043C \u0431\u0435\u043B\u044B\u043C \u043F\u043E\u0432\u0435\u0440\u0445, \u0438
  // \u043F\u043E\u0442\u043E\u043C\u0443 \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u043B\u0430 \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u043E \u043D\u0430\u0434 \u0447\u0451\u0440\u043D\u044B\u043C \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u0438 \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043E\u0431\u043B\u043E\u0436\u043A\u043E\u0439. \u041E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435
  // \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u043B\u0438\u043D\u0437\u0430 (lens-shader.ts) \u2014 \u0442\u0430\u043C \u0432\u0438\u0434\u0435\u043D \u0431\u044D\u043A\u0434\u0440\u043E\u043F, \u0438 \u043A\u0440\u043E\u043C\u043A\u0430 \u0431\u0435\u0440\u0451\u0442 \u0446\u0432\u0435\u0442 \u043E\u0442 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E
  // \u0440\u0435\u0430\u043B\u044C\u043D\u043E \u043F\u043E\u0434 \u043D\u0435\u0439. \u0417\u0434\u0435\u0441\u044C \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u043E, \u0447\u0442\u043E \u043E\u0442 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F \u043D\u0435 \u0437\u0430\u0432\u0438\u0441\u0438\u0442: \u0431\u043B\u0438\u043A \u043E\u0442 \u041D\u0410\u0428\u0415\u0413\u041E
  // \u043A\u043B\u044E\u0447\u0435\u0432\u043E\u0433\u043E \u0441\u0432\u0435\u0442\u0430, \u043F\u043E\u0433\u043B\u043E\u0449\u0435\u043D\u0438\u0435 \u0441\u0440\u0435\u0434\u044B \u0438 \u0442\u0435\u043D\u044C.
  float facing = dot(n, u_light);

  // \u0422\u043E\u043B\u0449\u0438\u043D\u0430 \u043A\u0430\u043A \u043F\u043E\u0433\u043B\u043E\u0449\u0435\u043D\u0438\u0435: \u043F\u043E\u043B\u043E\u0441\u0430 \u0442\u0430\u043C, \u0433\u0434\u0435 \u043A\u0440\u043E\u043C\u043A\u0443 \u043D\u0435 \u043E\u0441\u0432\u0435\u0449\u0430\u0435\u0442 \u043D\u0438 \u043E\u0434\u0438\u043D \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A. \u0420\u0430\u0441\u0442\u0451\u0442
  // \u0441 \u0444\u0430\u0441\u043A\u043E\u0439, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0442\u043E\u043D\u043A\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E \u0441\u0430\u043C\u043E \u043F\u043E \u0441\u0435\u0431\u0435 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \xAB\u043D\u0430\u043B\u0438\u0432\u0430\u0442\u044C\u0441\u044F\xBB \u0443 \u043A\u0440\u0430\u044F.
  float absorb = smoothstep(0.0, 0.70, t) * (1.0 - smoothstep(0.80, 1.0, t))
    * (1.0 - abs(facing)) * 0.10 * (u_thickness / VG_REF_THICKNESS);

  if (u_debug > 0.5) {
    float inMask = 1.0 - smoothstep(-1.0, 1.0, sd);
    if (u_debug < 1.5) {
      float band = abs(fract(sd / (halfMin * 0.22)) - 0.5) * 2.0;
      half3 c = sd < 0.0 ? half3(0.20, 0.62, 1.0) : half3(1.0, 0.42, 0.22);
      return vgPack(c * half(0.25 + band * 0.75), 1.0);
    }
    if (u_debug < 2.5) { return vgPack(half3(1.0), inMask); }
    if (u_debug < 3.5) { return vgPack(vgHeat(t), inMask); }
    // \u0424\u0440\u0435\u043D\u0435\u043B\u044C \u0442\u0435\u043F\u0435\u0440\u044C \u0443 \u043B\u0438\u043D\u0437\u044B; \u0437\u0434\u0435\u0441\u044C \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u043C \u0435\u0433\u043E \u0424\u041E\u0420\u041C\u0423 \u2014 \u043D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0432\u0437\u0433\u043B\u044F\u0434 \u0441\u043A\u043E\u043B\u044C\u0437\u044F\u0449\u0438\u0439.
    if (u_debug < 4.5) { return vgPack(vgHeat(1.0 - clamp(N.z, 0.0, 1.0)), inMask); }
    if (u_debug < 5.5) {
      float push = pow(t, VG_FALLOFF) * u_refraction;
      return vgPack(vgHeat(push), inMask);
    }
    if (u_debug < 6.5) { return half4(0.0); }
    if (u_debug < 7.5) { return vgPack(half3(1.0), spec * inMask); }
    // \u0420\u0430\u0441\u0449\u0435\u043F\u043B\u0435\u043D\u0438\u0435 \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u043B\u0438\u043D\u0437\u0430; \u0437\u0434\u0435\u0441\u044C \u2014 \u043F\u043E\u043B\u0435, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u043E\u043D\u043E \u043D\u0430\u0440\u0430\u0441\u0442\u0430\u0435\u0442.
    if (u_debug < 8.5) { return vgPack(vgHeat(u_dispersion * t * t), inMask); }
    if (u_debug < 9.5) { return vgPack(half3(N * 0.5 + 0.5), inMask); }
    // spectral \u0438 adapt \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u041B\u0418\u041D\u0417\u0410 \u2014 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0443\u0439\u0442\u0438 \u0441 \u0434\u043E\u0440\u043E\u0433\u0438.
    return half4(0.0);
  }

  // \u0422\u0435\u043D\u044C \u0438 \u043E\u0440\u0435\u043E\u043B \u0436\u0438\u0432\u0443\u0442 \u0421\u041D\u0410\u0420\u0423\u0416\u0418 \u0444\u043E\u0440\u043C\u044B: \u0432\u043D\u0443\u0442\u0440\u0438 \u0438\u0445 \u043C\u0435\u0441\u0442\u043E \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u0441\u0430\u043C\u043E \u0441\u0442\u0435\u043A\u043B\u043E. \u041E\u0442\u0440\u044B\u0432 \u043E\u0442
  // \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430 \u0434\u0435\u0440\u0436\u0438\u0442\u0441\u044F \u0438\u043C\u0435\u043D\u043D\u043E \u043D\u0430 \u0442\u0435\u043D\u0438 \u2014 \u0431\u0435\u0437 \u043D\u0435\u0451 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u043B\u0435\u0436\u0438\u0442 \u041D\u0410 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0435, \u0430 \u043D\u0435 \u043D\u0430\u0434 \u043D\u0435\u0439.
  // \u0422\u0435\u043D\u044C \u0436\u0438\u0432\u0451\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0443 \u043A\u0440\u043E\u043C\u043A\u0438 \u0438 \u0441\u043D\u0430\u0440\u0443\u0436\u0438: \u043F\u0440\u0438 sd < \u22121 \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C outside \u0438 \u0442\u0430\u043A \u043D\u043E\u043B\u044C.
  // \u0421\u0447\u0438\u0442\u0430\u0442\u044C \u0435\u0451 \u0433\u043B\u0443\u0431\u043E\u043A\u043E \u0432\u043D\u0443\u0442\u0440\u0438 \u0444\u043E\u0440\u043C\u044B \u2014 \u044D\u0442\u043E \u043B\u0438\u0448\u043D\u044F\u044F \u041F\u041E\u041B\u041D\u0410\u042F \u043E\u0446\u0435\u043D\u043A\u0430 SDF \u043D\u0430 \u043A\u0430\u0436\u0434\u044B\u0439 \u0442\u0430\u043A\u043E\u0439 \u043F\u0438\u043A\u0441\u0435\u043B\u044C,
  // \u0430 \u0442\u0435\u043B\u043E \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u043F\u043E\u0447\u0442\u0438 \u0432\u0441\u044E \u043F\u043B\u043E\u0449\u0430\u0434\u044C. \u0412\u0435\u0442\u0432\u043B\u0435\u043D\u0438\u0435 \u0437\u0434\u0435\u0441\u044C \u043F\u043E \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0435, \u043D\u043E \u0440\u0430\u0441\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E
  // \u043D\u0438\u0442\u0438 \u043D\u0430 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0435.
  float shade = 0.0;
  float halo = 0.0;
  if (sd > -1.0) {
    float outside = smoothstep(-1.0, 1.0, sd);
    float sdDrop = vgScene(p - float2(0.0, u_shadowReach * 0.16), u_halfSize, u_corner,
                           u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);
    float amb = 1.0 - smoothstep(0.0, u_shadowReach, max(sdDrop, 0.0));
    float con = 1.0 - smoothstep(0.0, u_shadowReach * 0.22, max(sd, 0.0));
    shade = (amb * amb * 0.22 + con * con * 0.18) * outside * u_shadow;
    halo = 1.0 - smoothstep(0.0, u_shadowReach * 0.30, max(sd, 0.0));
    halo = halo * halo * lit * 0.10 * outside;
  }

  if (sd > 1.0) {
    return half4(half3(half(halo)), half(halo + shade * (1.0 - halo)));
  }

  float density = u_tint.w;
  float inner = clamp(-sd / halfMin, 0.0, 1.0);
  half3 col = half3(u_tint.rgb);

  // \u0422\u0438\u043D\u0442 \u0421\u0412\u0415\u0422\u041B\u042B\u0419 \u0438 \u0441\u043B\u0430\u0431\u044B\u0439, \u0430 \u043D\u0435 \u0442\u0451\u043C\u043D\u044B\u0439: \u0442\u0451\u043C\u043D\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0430 \u0442\u0451\u043C\u043D\u043E\u043C \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0435 \u0438\u0441\u0447\u0435\u0437\u0430\u0435\u0442, \u0438 \u0435\u0433\u043E
  // \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0436\u0438\u0440\u043D\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u043E\u0439 \u2014 \u043E\u0442 \u044D\u0442\u043E\u0433\u043E \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0445\u0440\u043E\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0439 \u0431\u0443\u0441\u0438\u043D\u043E\u0439.
  // \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0438\u043D\u0442\u0430 \u0443 \u0444\u0430\u0441\u043A\u0438 \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u0430\u044F \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u0430: \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438 \u0444\u0430\u0441\u043A\u0430 \u0433\u043D\u0451\u0442 \u0441\u0432\u0435\u0442 \u0441\u0438\u043B\u044C\u043D\u0435\u0435, \u043D\u043E
  // \u043C\u0443\u0442\u043D\u0435\u0435 \u041D\u0415 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F. \u0421\u0446\u0435\u043F\u043B\u0435\u043D\u043D\u044B\u0435, \u043E\u043D\u0438 \u0434\u0430\u0432\u0430\u043B\u0438 \u043C\u043E\u043B\u043E\u0447\u043D\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E \u043F\u043E \u0432\u0441\u0435\u043C\u0443 \u043E\u0431\u0432\u043E\u0434\u0443.
  float body = mix(VG_BODY_DENSITY, VG_BODY_DENSITY * u_edgeDensity, smoothstep(0.10, 0.62, t)) * density;
  float vignette = smoothstep(0.15, 1.0, inner) * 0.19 * density;
  // \u041F\u0440\u0438\u0431\u0430\u0432\u043A\u0438 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u0438 \u043D\u0430 \u043D\u0430\u0436\u0430\u0442\u0438\u0435 \u0437\u0434\u0435\u0441\u044C \u041D\u0415\u0422. \u041E\u043D\u0430 \u0437\u0430\u0434\u0443\u043C\u044B\u0432\u0430\u043B\u0430\u0441\u044C \u043A\u0430\u043A \xAB\u0434\u0435\u0442\u0430\u043B\u044C \u0437\u0430\u043C\u0435\u0442\u043D\u0435\u0435 \u043F\u043E\u0434
  // \u043F\u0430\u043B\u044C\u0446\u0435\u043C\xBB, \u043D\u043E \u0442\u044F\u043D\u0435\u0442 \u0442\u0435\u043B\u043E \u043A \u0442\u0438\u043D\u0442\u0443, \u0430 \u0442\u0438\u043D\u0442 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438: \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u0444\u043E\u043D\u043E\u043C
  // (\u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C \u0442\u0451\u043C\u043D\u0430\u044F) \u043D\u0430\u0436\u0430\u0442\u0438\u0435 \u0422\u0415\u041C\u041D\u0418\u041B\u041E \u0434\u0435\u0442\u0430\u043B\u044C. \u041F\u0440\u0438\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E\u0442 \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043F\u043E\u043B\u044F
  // vgTouchWarp \u0438 \u0440\u0430\u0441\u0446\u0432\u0435\u0442\u0430\u044E\u0449\u0438\u0439 \u0431\u043B\u0438\u043A \u043D\u0438\u0436\u0435 \u2014 \u0438\u043C \u0437\u043D\u0430\u043A \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438 \u0431\u0435\u0437\u0440\u0430\u0437\u043B\u0438\u0447\u0435\u043D.
  float a = max(body, vignette);

  // \u0426\u0432\u0435\u0442 \u0442\u0435\u043B\u0430 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u041D\u0415 \u0442\u0440\u043E\u0433\u0430\u0435\u0442. \u041F\u043E\u0434\u043C\u0435\u0448\u0438\u0432\u0430\u043D\u0438\u0435 \u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0433\u043E \u0441\u0435\u0440\u043E\u0433\u043E \u0441\u044E\u0434\u0430 \u043C\u0435\u043D\u044F\u043B\u043E \u0437\u043D\u0430\u043A
  // \u044D\u0444\u0444\u0435\u043A\u0442\u0430 \u043E\u0442 \u0444\u043E\u043D\u0430: \u043D\u0430\u0434 \u0442\u0451\u043C\u043D\u044B\u043C \u0434\u0435\u0442\u0430\u043B\u044C \u0441\u0432\u0435\u0442\u043B\u0435\u043B\u0430, \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u2014 \u0442\u0435\u043C\u043D\u0435\u043B\u0430, \u0445\u043E\u0442\u044F \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043E\u0434\u043D\u043E
  // \u0438 \u0442\u043E \u0436\u0435. \u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E\u0442 \u0431\u043B\u0438\u043A \u0438 \u043F\u043E\u0434\u0441\u0432\u0435\u0442\u043A\u0430 \u043A\u0440\u043E\u043C\u043A\u0438 \u0432\u044B\u0448\u0435: \u0438\u043C \u0444\u043E\u043D \u0431\u0435\u0437\u0440\u0430\u0437\u043B\u0438\u0447\u0435\u043D.
  a = a + absorb;
  col *= 1.0 - half(absorb * 1.2);

  // \u0417\u041D\u0410\u0427\u041E\u041A \u041B\u0415\u0416\u0418\u0422 \u041F\u041E\u0414 \u041F\u041E\u0412\u0415\u0420\u0425\u041D\u041E\u0421\u0422\u042C\u042E, \u0430 \u043D\u0435 \u043D\u0430\u043A\u043B\u0435\u0435\u043D \u043D\u0430 \u043D\u0435\u0451: \u0440\u0430\u043D\u044C\u0448\u0435 \u043E\u043D \u043F\u043E\u0434\u043C\u0435\u0448\u0438\u0432\u0430\u043B\u0441\u044F \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u043C,
  // \u043F\u043E\u0432\u0435\u0440\u0445 \u0431\u043B\u0438\u043A\u0430, \u0438 \u0447\u0438\u0442\u0430\u043B\u0441\u044F \u043F\u043B\u043E\u0441\u043A\u0438\u043C \u0441\u0442\u0438\u043A\u0435\u0440\u043E\u043C \u043D\u0430 \u043E\u0431\u044A\u0451\u043C\u043D\u043E\u043C \u0441\u0442\u0435\u043A\u043B\u0435. \u0423 \u043A\u0440\u043E\u043C\u043A\u0438 \u0435\u0433\u043E \u0443\u0432\u043E\u0434\u0438\u0442 \u043D\u043E\u0440\u043C\u0430\u043B\u044C,
  // \u043A\u0430\u043A \u0432\u0441\u0451, \u0447\u0442\u043E \u0432\u0438\u0434\u043D\u043E \u0441\u043A\u0432\u043E\u0437\u044C \u0441\u0442\u0435\u043A\u043B\u043E, \u0430 \u0431\u043B\u0438\u043A \u043B\u043E\u0436\u0438\u0442\u0441\u044F \u0421\u0412\u0415\u0420\u0425\u0423 \u2014 \u043E\u043D \u0436\u0438\u0432\u0451\u0442 \u043D\u0430 \u0441\u0430\u043C\u043E\u0439 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438.
  //
  // \u041D\u0438\u043A\u0430\u043A\u043E\u0439 \u0442\u0435\u043D\u0438 \u043F\u043E\u0434 \u0437\u043D\u0430\u0447\u043A\u043E\u043C \u0437\u0434\u0435\u0441\u044C \u041D\u0415\u0422. \u041E\u043D\u0430 \u0434\u0435\u043B\u0430\u043B\u0430\u0441\u044C \u0440\u0430\u0437\u043D\u0438\u0446\u0435\u0439 \u0434\u0432\u0443\u0445 \u0441\u043C\u0435\u0449\u0451\u043D\u043D\u044B\u0445 \u0432\u044B\u0431\u043E\u0440\u043E\u043A \u043C\u0430\u0441\u043A\u0438 \u0438
  // \u0434\u0430\u0432\u0430\u043B\u0430 \u043F\u043E \u043A\u0440\u0430\u044E \u0432\u0442\u043E\u0440\u043E\u0439 \u043A\u043E\u043D\u0442\u0443\u0440 \u2014 \u0433\u0440\u0430\u043D\u0438\u0446\u044B \u0437\u043D\u0430\u0447\u043A\u0430 \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u043B\u0438 \u0440\u0432\u0430\u043D\u044B\u043C\u0438.
  // \u0421\u0414\u0412\u0418\u0413 \u041A\u0420\u0410\u0421\u041A\u0418 \u0417\u0410\u0414\u0410\u041D \u0415\u0401 \u0413\u041B\u0423\u0411\u0418\u041D\u041E\u0419, \u0410 \u041D\u0415 \u0428\u0418\u0420\u0418\u041D\u041E\u0419 \u0424\u0410\u0421\u041A\u0418. \u041A\u0440\u0430\u0441\u043A\u0430 \u043B\u0435\u0436\u0438\u0442 \u0443 \u0441\u0430\u043C\u043E\u0439 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u0438
  // \u0443\u0432\u043E\u0434\u0438\u0442 \u0435\u0451 \u0440\u043E\u0432\u043D\u043E \u0442\u0430 \u0442\u043E\u043D\u043A\u0430\u044F \u0442\u043E\u043B\u0449\u0430, \u0447\u0442\u043E \u043D\u0430\u0434 \u043D\u0435\u0439, \u2014 \u0430 \u043D\u0435 \u0442\u043E, \u043D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0448\u0438\u0440\u043E\u043A\u0443\u044E \u0444\u0430\u0441\u043A\u0443 \u0441\u043D\u044F\u043B\u0438 \u0443
  // \u044D\u0442\u043E\u0433\u043E \u043A\u0443\u0441\u043A\u0430 \u0441\u0442\u0435\u043A\u043B\u0430. \u0414\u043E\u043B\u0435\u0439 \u0444\u0430\u0441\u043A\u0438 \u044D\u0442\u043E \u0438 \u0431\u044B\u043B\u043E: \u043D\u0430 \u0442\u043E\u043D\u043A\u043E\u043C \u0441\u0442\u0435\u043A\u043B\u0435 \u0441\u0434\u0432\u0438\u0433 \u0432\u044B\u0445\u043E\u0434\u0438\u043B 4 dp \u0438 \u0432\u0441\u0451
  // \u0441\u0445\u043E\u0434\u0438\u043B\u043E\u0441\u044C, \u0430 \u043D\u0430 \u0442\u043E\u043B\u0441\u0442\u043E\u043C \u2014 8, \u0438 \u043E\u0431\u043B\u043E\u0436\u043A\u0430, \u043E\u0442\u0431\u0438\u0442\u0430\u044F \u043E\u0442 \u043A\u0440\u0430\u044F \u043D\u0430 6, \u0440\u0430\u0441\u0442\u044F\u0433\u0438\u0432\u0430\u043B\u0430\u0441\u044C \u043A \u043A\u0440\u043E\u043C\u043A\u0435 \u0438
  // \u0432\u044B\u043B\u0435\u0437\u0430\u043B\u0430 \u0437\u0430 \u0433\u0430\u0431\u0430\u0440\u0438\u0442. \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u0430\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u044B\u0439: \u0443 \u043A\u0440\u0430\u0441\u043A\u0438 \u043E\u0434\u043D\u0430 \u0433\u043B\u0443\u0431\u0438\u043D\u0430 \u043F\u0440\u0438 \u043B\u044E\u0431\u043E\u043C \u0441\u0442\u0435\u043A\u043B\u0435.
  float2 inkShift = n * (min(u_bevel * 0.5, VG_INK_DEPTH) * t);
  float2 inkUv = u_center + p - inkShift;

  half4 ink = u_icon.eval(inkUv * u_iconScale) * half(u_iconOn);

  // \u041F\u041E\u0414\u041B\u041E\u0416\u041A\u0410 \u041F\u041E\u0414 \u041A\u0420\u0410\u0421\u041A\u041E\u0419. \u0427\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u2014 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u041C\u0415\u0421\u0422\u041D\u041E\u0415, \u0430 \u043D\u0435 \u043E\u0431\u0449\u0435\u0435 \u043F\u043E \u0434\u0435\u0442\u0430\u043B\u0438. \u0413\u0430\u0441\u0438\u0442\u044C \u0444\u043E\u043D \u043F\u043E
  // \u0432\u0441\u0435\u0439 \u043F\u043B\u043E\u0449\u0430\u0434\u0438 \u0437\u043D\u0430\u0447\u0438\u0442 \u043F\u043B\u0430\u0442\u0438\u0442\u044C \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0441\u0442\u044C\u044E \u0442\u0430\u043C, \u0433\u0434\u0435 \u0433\u0430\u0441\u0438\u0442\u044C \u043D\u0435\u0447\u0435\u0433\u043E: \u043F\u043E\u0434 \u043F\u0443\u0441\u0442\u044B\u043C \u043C\u0435\u0441\u0442\u043E\u043C \u0441\u0442\u0435\u043A\u043B\u043E
  // \u043E\u0431\u044F\u0437\u0430\u043D\u043E \u043E\u0441\u0442\u0430\u0432\u0430\u0442\u044C\u0441\u044F \u0441\u0442\u0435\u043A\u043B\u043E\u043C. \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u043F\u043E\u0434\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0434 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u0430\u0441\u043A\u043E\u0439 \u0438 \u0432 \u043A\u0430\u0439\u043C\u0435
  // \u0432\u043E\u043A\u0440\u0443\u0433 \u043D\u0435\u0451 \u2014 \u0442\u0430\u043A \u043D\u0430 \u0441\u0442\u0435\u043A\u043B\u0435 \u043C\u0430\u0442\u0438\u0440\u0443\u044E\u0442 \u0437\u043E\u043D\u0443 \u043F\u043E\u0434 \u0433\u0440\u0430\u0432\u0438\u0440\u043E\u0432\u043A\u043E\u0439, \u0430 \u043D\u0435 \u0432\u0435\u0441\u044C \u043B\u0438\u0441\u0442.
  //
  // \u041F\u043E\u043B\u0435 \u043A\u0430\u0439\u043C\u044B \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \u0413\u041E\u0422\u041E\u0412\u042B\u041C, \u043A\u0440\u0430\u0441\u043D\u044B\u043C \u043A\u0430\u043D\u0430\u043B\u043E\u043C \u043C\u0430\u0441\u043A\u0438 (\u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442 \u043E\u043F\u0438\u0441\u0430\u043D \u0443 iconMask \u0432 \u0440\u0435\u043D\u0434\u0435\u0440\u0435\u0440\u0435):
  // \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0440\u0430\u0437\u043C\u044B\u0432\u0430\u0435\u0442 \u043A\u0440\u0430\u0441\u043A\u0443 \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043D\u0430 \u043A\u0430\u0434\u0440 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u043C \u0433\u0430\u0443\u0441\u0441\u0438\u0430\u043D\u043E\u043C. \u0421\u0447\u0438\u0442\u0430\u0442\u044C \u044D\u0442\u043E \u043F\u043E\u043B\u0435 \u0437\u0434\u0435\u0441\u044C
  // \u043D\u0435\u0447\u0435\u043C: \u043A\u043E\u043B\u044C\u0446\u043E \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0432\u043E\u043A\u0440\u0443\u0433 \u043F\u0438\u043A\u0441\u0435\u043B\u044F \u2014 \u0442\u043E \u0436\u0435 \u043D\u0435\u0434\u043E\u0441\u044D\u043C\u043F\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u0447\u0442\u043E \u0438 \u0432 \u0434\u0438\u0441\u043A\u043E\u0432\u043E\u043C \u0441\u0431\u043E\u0440\u0435,
  // \u0438 \u043F\u043E\u0434\u043B\u043E\u0436\u043A\u0430 \u0432\u044B\u0445\u043E\u0434\u0438\u043B\u0430 \u0440\u0432\u0430\u043D\u043E\u0439, \u0441 \u0432\u0438\u0434\u0438\u043C\u043E\u0439 \u0433\u0440\u0430\u043D\u0438\u0446\u0435\u0439 \u0432\u043E\u043A\u0440\u0443\u0433 \u043A\u0430\u0436\u0434\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B \u0431\u0443\u043A\u0432.

  half inkA = ink.g * half(mix(0.82, 1.0, u_active));
  half3 inkCol = mix(half3(u_inkIdle.rgb), half3(u_inkActive.rgb), half(u_active));
  col = col * (1.0 - inkA) + inkCol * inkA;

  // \u0426\u0412\u0415\u0422\u041D\u041E\u0419 \u041A\u041E\u041D\u0422\u0415\u041D\u0422 \u041B\u0415\u0416\u0418\u0422 \u0422\u0410\u041C \u0416\u0415, \u0413\u0414\u0415 \u041A\u0420\u0410\u0421\u041A\u0410 \u2014 \u0432\u043D\u0443\u0442\u0440\u0438 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u0430 \u0438 \u043D\u0430 \u0442\u043E\u0439 \u0436\u0435 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0435. \u0418\u043D\u0430\u0447\u0435
  // \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0432\u0435\u0434\u0451\u0442 \u0438\u0445 \u043F\u043E\u0440\u043E\u0437\u043D\u044C: \u043F\u0440\u0438 \u043D\u0430\u0436\u0430\u0442\u0438\u0438 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438 \u0430\u0440\u0442\u0438\u0441\u0442 \u0442\u0440\u044F\u0441\u0443\u0442\u0441\u044F \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C\u044E,
  // \u0430 \u043E\u0431\u043B\u043E\u0436\u043A\u0430 \u0441\u0442\u043E\u0438\u0442 \u043D\u0430 \u043C\u0435\u0441\u0442\u0435, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E \u043E\u043D\u0430 \u0431\u044B\u043B\u0430 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u043C \u0441\u043B\u043E\u0435\u043C \u043F\u043E\u0432\u0435\u0440\u0445 \u0441\u0442\u0435\u043A\u043B\u0430. \u041F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C \u0435\u0433\u043E
  // \u043D\u0435 \u0442\u0440\u043E\u0433\u0430\u0435\u0442 \u2014 \u0443 \u043D\u0435\u0433\u043E \u0441\u0432\u043E\u0439 \u0446\u0432\u0435\u0442, \u0438 \u043F\u043E\u0434\u043C\u0435\u043D\u044F\u0442\u044C \u0435\u0433\u043E \u043D\u0435\u0447\u0435\u043C.
  half4 over = u_overlay.eval(inkUv * u_iconScale) * half(u_overlayOn);
  col = col * (1.0 - over.a) + over.rgb * over.a;

  col += half3(spec) * half3(0.98, 0.99, 1.0);

  // \u0410\u043B\u044C\u0444\u0430 \u0431\u043B\u0438\u043A\u0430 \u0438\u0434\u0451\u0442 \u0432\u0440\u043E\u0432\u0435\u043D\u044C \u0441 \u0435\u0433\u043E \u044F\u0440\u043A\u043E\u0441\u0442\u044C\u044E: \u043F\u0440\u0438 \u0437\u0430\u043D\u0438\u0436\u0435\u043D\u043D\u043E\u0439 \u0430\u043B\u044C\u0444\u0435 premultiplied \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442
  // \u0433\u0430\u0441\u043D\u0435\u0442 \u0438 \u0431\u043B\u0438\u043A \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u043D\u0435\u0432\u0438\u0434\u0438\u043C\u044B\u043C \u043D\u0430 \u0442\u0451\u043C\u043D\u043E\u043C \u0444\u043E\u043D\u0435.
  a = clamp(a + spec, 0.0, 1.0);
  a = max(a, max(float(inkA), float(over.a)));
  a *= 1.0 - smoothstep(-1.0, 1.0, sd);

  col = clamp(col, half3(0.0), half3(1.0));
  return half4(col * half(a), half(a + shade * (1.0 - a)));
}
`;
  var import_react = __toESM(require_react(), 1);
  var TINT_DARK = 0.07;
  var TINT_LIGHT = 0.94;
  var BODY_CAP_LOOSE = 0.62;
  var BODY_CAP_TIGHT = 0.38;
  var MAX_DENSITY = 0.92;
  var clamp3 = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  function bodyCap(legibility) {
    return BODY_CAP_LOOSE + (BODY_CAP_TIGHT - BODY_CAP_LOOSE) * clamp3(legibility * 2, 0, 1);
  }
  function bodyDensityFor(local, legibility, bodyDensity2, polarity, spread = 0) {
    const cap = bodyCap(legibility);
    const need = polarity > 0.5 ? local > cap ? clamp3((local - cap) / Math.max(local - TINT_DARK, 1e-4), 0, MAX_DENSITY) : 0 : local < 1 - cap ? clamp3((1 - cap - local) / Math.max(TINT_LIGHT - local, 1e-4), 0, MAX_DENSITY) : 0;
    const s = clamp3(spread, 0, 1);
    const busyFloor = s * (0.15 + (0.85 - 0.15) * clamp3(legibility, 0, 1));
    const demand = clamp3(legibility * 4, 0, 1);
    return Math.max(bodyDensity2, need * demand, busyFloor);
  }
  function bodyLuma(local, legibility, bodyDensity2, polarity, spread = 0, edgeLight2 = 0) {
    const tint = polarity > 0.5 ? TINT_DARK : TINT_LIGHT;
    const density2 = bodyDensityFor(local, legibility, bodyDensity2, polarity, spread);
    const lift = local * edgeLight2 * (0.12 + 0.55 * (1 - local));
    return clamp3(local + (tint - local) * density2 + lift, 0, 1);
  }
  function shouldInkBeLight(sample, legibility, wasLight) {
    const hi = sample.hi ?? sample.luma;
    const decisive = sample.luma * 0.75 + hi * 0.25;
    const cost = bodyDensityFor(decisive, legibility, 0, 1);
    const wantsFlip = wasLight ? cost > FLIP_DENSITY : cost < RETURN_DENSITY;
    return wantsFlip ? !wasLight : wasLight;
  }
  var FLIP_DENSITY = 0.48;
  var RETURN_DENSITY = 0.4;
  var CONFIRMATIONS = 3;
  var NO_TOUCH = {
    x: 0,
    y: 0,
    pullX: 0,
    pullY: 0,
    press: 0,
    radius: 0,
    waveAmp: 0,
    wavePhase: 0
  };
  var NO_MORPH = { offsetX: 0, offsetY: 0, width: 0, height: 0, cornerRadius: 0, smoothing: 0 };
  var NO_PROGRESS = -1;
  var lensMagnify = (o) => 1 + (o.refractionScale - 1) * o.refraction;
  var shapes = /* @__PURE__ */ new Map();
  function channel(entries) {
    const uniformValues = [];
    let shape = shapes.get(entries.length);
    let same = shape !== void 0;
    for (let i = 0; i < entries.length; i += 1) {
      const [name, value] = entries[i];
      const v = typeof value === "number" ? [value] : value;
      if (same && (shape.names[i] !== name || shape.sizes[i] !== v.length)) same = false;
      for (const x of v) uniformValues.push(x);
    }
    if (!same) {
      shape = {
        names: entries.map((e) => e[0]),
        sizes: entries.map((e) => typeof e[1] === "number" ? 1 : e[1].length)
      };
      shapes.set(entries.length, shape);
    }
    return { uniformNames: shape.names, uniformSizes: shape.sizes, uniformValues };
  }
  function toLensProps(optics, geometry, density2, options = {}) {
    const morph = options.morph ?? NO_MORPH;
    const touch = options.touch ?? NO_TOUCH;
    const g = options.groupProbe;
    const group = g && g.length >= 9 ? [
      ["u_probeLuma", g[0]],
      ["u_probeBusy", g[1]],
      ["u_probeRange", [g[2], g[3]]],
      ["u_probeSlope", [g[4], g[5]]],
      ["u_probe", [g[6], g[7], g[8]]]
    ] : [];
    const d = density2;
    const halfW = geometry.width * d / 2;
    const halfH = geometry.height * d / 2;
    const halfMin = Math.min(halfW, halfH);
    return {
      shaderSource: LENS_SHADER,
      glassWidth: geometry.width,
      glassHeight: geometry.height,
      ...channel([
        ["u_halfSize", [halfW, halfH]],
        ["u_corner", Math.min(geometry.cornerRadius * d, halfMin)],
        ["u_bevel", Math.max(bevelDp(geometry, optics) * d, 1)],
        ["u_magnify", lensMagnify(optics)],
        ["u_edgePush", edgePushDp(geometry, optics) * d],
        ["u_chroma", chromaDp(geometry, optics) * d],
        ["u_spherical", sphericalDp(geometry, optics) * d],
        // Мутность от шероховатости поверхности. Живёт в том же дисковом сборе, что и
        // адаптивное рассеяние, и гасится к фаске: там работа другая — гнуть луч и расщеплять.
        ["u_frost", optics.blur * d],
        ["u_ink", optics.ink],
        ["u_legibility", optics.legibility],
        ["u_presence", optics.presence],
        ["u_adaptRadius", optics.adaptRadius * d],
        ["u_bodyTint", [optics.tint.r, optics.tint.g, optics.tint.b]],
        ["u_bodyDensity", optics.bodyDensity],
        ["u_edgeLight", optics.edgeLight],
        ["u_fresnel", optics.fresnel],
        ["u_fresnelPower", optics.fresnelPower],
        // Кромка собирает свет в окрестности детали — это радиус вокруг формы, а не её фаска.
        ["u_reflectReach", optics.gatherRadiusDp * d],
        ["u_film", optics.film],
        ["u_iridescence", optics.iridescence],
        ["u_diffraction", optics.diffraction],
        ["u_colorPickup", optics.colorPickup],
        ["u_morphOffset", [morph.offsetX * d, morph.offsetY * d]],
        ["u_morphHalf", [morph.width * d / 2, morph.height * d / 2]],
        ["u_morphCorner", morph.cornerRadius * d],
        ["u_morphK", morph.smoothing * d],
        ["u_touch", [touch.x * d, touch.y * d]],
        ["u_pull", [touch.pullX * d, touch.pullY * d]],
        ["u_touchPress", touch.press],
        ["u_touchRadius", touch.radius * d],
        ["u_wave", [touch.waveAmp * d, touch.wavePhase]],
        ["u_progress", options.progress ?? NO_PROGRESS],
        ["u_debug", debugIndex(options.debug ?? "normal")],
        ...group
      ])
    };
  }
  function toSurfaceUniforms(optics, geometry, options = {}) {
    const morph = options.morph ?? NO_MORPH;
    const touch = options.touch ?? NO_TOUCH;
    const pad2 = surfacePadDp(geometry, options.dragLimit ?? 0, morph);
    return {
      u_center: [geometry.width / 2 + pad2, geometry.height / 2 + pad2],
      u_halfSize: [geometry.width / 2, geometry.height / 2],
      u_corner: Math.min(geometry.cornerRadius, halfMinDp(geometry)),
      u_bevel: bevelDp(geometry, optics),
      u_thickness: bevelFraction(geometry, optics),
      u_morphOffset: [morph.offsetX, morph.offsetY],
      u_morphHalf: [morph.width / 2, morph.height / 2],
      u_morphCorner: morph.cornerRadius,
      u_morphK: morph.smoothing,
      u_specular: optics.specular,
      u_specularPower: optics.specularPower,
      u_edgeDensity: optics.edgeDensity,
      u_dispersion: optics.dispersion,
      u_refraction: optics.refraction,
      // Плотность тинта гасится, когда тело считает линза: рисовать его дважды значит
      // получить двойную заливку, а адаптация у поверхности всё равно невозможна — фона она
      // не видит. Сам цвет остаётся: по нему идёт поглощение у кромки.
      u_tint: [
        optics.tint.r,
        optics.tint.g,
        optics.tint.b,
        options.bodyInLens ? 0 : optics.tintStrength
      ],
      u_shadow: options.shadow ?? 1,
      u_shadowReach: shadowReachDp(geometry),
      u_touch: [touch.x, touch.y],
      u_pull: [touch.pullX, touch.pullY],
      u_touchPress: touch.press,
      u_touchRadius: touch.radius,
      u_wave: [touch.waveAmp, touch.wavePhase],
      u_presence: optics.presence,
      u_progress: options.progress ?? NO_PROGRESS,
      u_debug: debugIndex(options.debug ?? "normal")
    };
  }
  var REST_LIGHT = [-0.577, -0.817];
  var DYNAMIC_UNIFORMS = ["u_press", "u_active", "u_light"];
  var ICON_UNIFORMS = ["u_iconOn", "u_iconScale", "u_inkIdle", "u_inkActive"];
  var OVERLAY_UNIFORMS = ["u_overlayOn"];
  function sizeUniformName(sampler) {
    return sampler.startsWith("u_") ? `${sampler}Size` : `u_${sampler}Size`;
  }
  function convertVecTypes(src) {
    return src.replace(/\bfloat([234])\b/g, "vec$1");
  }
  function convertHalfTypes(src) {
    return src.replace(/\bhalf([234])\b/g, "vec$1").replace(/\bhalf\b/g, "float");
  }
  function convertShaderUniforms(src) {
    return src.replace(/uniform\s+shader\s+(\w+)\s*;/g, (_match, name) => {
      return `uniform sampler2D ${name};
uniform vec2 ${sizeUniformName(name)};`;
    });
  }
  function convertEvalCalls(src) {
    const samplers = /* @__PURE__ */ new Set();
    const declRe = /uniform\s+sampler2D\s+(\w+)\s*;/g;
    for (let m = declRe.exec(src); m; m = declRe.exec(src)) samplers.add(m[1]);
    if (samplers.size === 0) return src;
    const callRe = /(\w+)\.eval\(/g;
    let out = "";
    let cursor = 0;
    for (let m = callRe.exec(src); m; m = callRe.exec(src)) {
      const name = m[1];
      if (!samplers.has(name)) continue;
      const argStart = m.index + m[0].length;
      let depth = 1;
      let i = argStart;
      while (i < src.length && depth > 0) {
        if (src[i] === "(") depth += 1;
        else if (src[i] === ")") depth -= 1;
        i += 1;
      }
      const args = src.slice(argStart, i - 1);
      out += src.slice(cursor, m.index);
      out += `texture(${name}, (${args}) / ${sizeUniformName(name)})`;
      cursor = i;
      callRe.lastIndex = i;
    }
    out += src.slice(cursor);
    return out;
  }
  function convertReturns(mainBody) {
    return mainBody.replace(/\breturn\s+([^;]+);/g, "fragColor = $1; return;");
  }
  var ENTRY_RE = /half4\s+main\s*\(\s*float2\s+(\w+)\s*\)\s*\{/;
  function convertEntryPoint(src) {
    const match = ENTRY_RE.exec(src);
    if (!match) {
      throw new Error('vireglass/targets/glsl: entry point "half4 main(float2 xy)" not found');
    }
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let i = bodyStart;
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth += 1;
      else if (src[i] === "}") depth -= 1;
      i += 1;
    }
    const bodyEnd = i - 1;
    const param = match[1];
    const body = convertReturns(src.slice(bodyStart, bodyEnd));
    const head = src.slice(0, match.index);
    const tail = src.slice(i);
    return `${head}void main() {
  vec2 ${param} = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
${body}}${tail}`;
  }
  function addPrologue(src) {
    return "#version 300 es\nprecision highp float;\n\nout vec4 fragColor;\nuniform vec2 u_resolution;\n\n" + src;
  }
  function toGLSL(shaderSource) {
    let out = shaderSource;
    out = convertEntryPoint(out);
    out = convertShaderUniforms(out);
    out = convertEvalCalls(out);
    out = convertVecTypes(out);
    out = convertHalfTypes(out);
    out = addPrologue(out);
    return out;
  }
  var FULLSCREEN_TRIANGLE_VERTEX_SOURCE = `#version 300 es
const vec2 VG_POS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(VG_POS[gl_VertexID], 0.0, 1.0);
}
`;
  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("vireglass/web: gl.createShader \u0432\u0435\u0440\u043D\u0443\u043B null");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? "(\u043D\u0435\u0442 \u043B\u043E\u0433\u0430)";
      gl.deleteShader(shader);
      throw new Error(`vireglass/web: \u0448\u0435\u0439\u0434\u0435\u0440 \u043D\u0435 \u0441\u043A\u043E\u043C\u043F\u0438\u043B\u0438\u0440\u043E\u0432\u0430\u043B\u0441\u044F:
${log}`);
    }
    return shader;
  }
  function createProgram(gl, vertexSource, fragmentSource) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) throw new Error("vireglass/web: gl.createProgram \u0432\u0435\u0440\u043D\u0443\u043B null");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? "(\u043D\u0435\u0442 \u043B\u043E\u0433\u0430)";
      gl.deleteProgram(program);
      throw new Error(`vireglass/web: \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u043D\u0435 \u0441\u043B\u0438\u043D\u043A\u043E\u0432\u0430\u043B\u0430\u0441\u044C:
${log}`);
    }
    return program;
  }
  function drawFullscreenTriangle(gl) {
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function createTexture(gl, options) {
    const texture = gl.createTexture();
    if (!texture) throw new Error("vireglass/web: gl.createTexture \u0432\u0435\u0440\u043D\u0443\u043B null");
    const internalFormat = options.internalFormat ?? gl.RGBA8;
    const format = options.format ?? gl.RGBA;
    const type = options.type ?? gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      options.width,
      options.height,
      0,
      format,
      type,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }
  function createFramebuffer(gl, texture) {
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("vireglass/web: gl.createFramebuffer \u0432\u0435\u0440\u043D\u0443\u043B null");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`vireglass/web: FBO \u043D\u0435\u043F\u043E\u043B\u043E\u043D, \u0441\u0442\u0430\u0442\u0443\u0441 ${status}`);
    }
    return fbo;
  }
  function bindTextureAt(gl, unit, texture, program, uniformName) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const loc = gl.getUniformLocation(program, uniformName);
    gl.uniform1i(loc, unit);
  }
  var PROBE_GRID_WIDTH = 48;
  var PROBE_GRID_HEIGHT = 96;
  var DOWNSAMPLE_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D u_content;
uniform vec2 u_contentSize;
uniform vec2 u_gridSize;

// \u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u044F\u0447\u0435\u0439\u043A\u0430 \u2192 UV \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E. \u041D\u0415 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0432\u0438\u0434\u0438\u043C\u043E\u043C\u0443 \u0432\u0435\u0440\u0445\u0443/\u043D\u0438\u0437\u0443 \u043A\u0430\u043D\u0432\u0430\u0441\u0430 \u2014 \u044D\u0442\u043E
// \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0439 \u043F\u0440\u043E\u0445\u043E\u0434, \u0435\u0433\u043E \u0431\u0443\u0444\u0435\u0440 \u043D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F, \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043E\u0431\u0440\u0430\u0442\u043D\u043E \u043D\u0430 CPU \u0442\u043E\u0439
// \u0436\u0435 \u0444\u043E\u0440\u043C\u0443\u043B\u043E\u0439 (\u0441\u043C. rectStats \u043D\u0438\u0436\u0435). \u0421\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0441 \u0431\u043B\u0438\u0442-\u043F\u0440\u043E\u0445\u043E\u0434\u043E\u043C \u043D\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F.
void main() {
  vec2 uv = gl_FragCoord.xy / u_gridSize;
  vec3 sum = vec3(0.0);
  const int N = 5;
  vec2 block = u_contentSize / u_gridSize;
  vec2 origin = uv * u_contentSize;
  for (int y = 0; y < N; y++) {
    for (int x = 0; x < N; x++) {
      vec2 p = origin + (vec2(float(x), float(y)) + 0.5) * (block / float(N));
      sum += texture(u_content, p / u_contentSize).rgb;
    }
  }
  fragColor = vec4(sum / float(N * N), 1.0);
}
`;
  function pickDownsampleFormat(gl) {
    const hasFloat = gl.getExtension("EXT_color_buffer_float") !== null;
    return hasFloat ? { internalFormat: gl.RGBA32F, type: gl.FLOAT, floatPrecision: true } : { internalFormat: gl.RGBA8, type: gl.UNSIGNED_BYTE, floatPrecision: false };
  }
  function luma(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function rectStats(buffer, floatPrecision, gridW, gridH, contentWidth, contentHeight, rect) {
    const x0 = rect.centerX - rect.halfWidth;
    const x1 = rect.centerX + rect.halfWidth;
    const y0 = rect.centerY - rect.halfHeight;
    const y1 = rect.centerY + rect.halfHeight;
    const lumas = [];
    const nx = [];
    const ny = [];
    let sr = 0;
    let sg = 0;
    let sb = 0;
    const norm2 = floatPrecision ? 1 : 255;
    for (let row = 0; row < gridH; row++) {
      const cy = (row + 0.5) / gridH * contentHeight;
      if (cy < y0 || cy > y1) continue;
      for (let col = 0; col < gridW; col++) {
        const cx = (col + 0.5) / gridW * contentWidth;
        if (cx < x0 || cx > x1) continue;
        const i = (row * gridW + col) * 4;
        const r = buffer[i] / norm2;
        const g = buffer[i + 1] / norm2;
        const b = buffer[i + 2] / norm2;
        lumas.push(luma(r, g, b));
        nx.push((cx - rect.centerX) / Math.max(rect.halfWidth, 1));
        ny.push((cy - rect.centerY) / Math.max(rect.halfHeight, 1));
        sr += r;
        sg += g;
        sb += b;
      }
    }
    const n = lumas.length;
    if (n === 0) return null;
    let mean = 0;
    for (const v of lumas) mean += v;
    mean /= n;
    let busy = 0;
    for (const v of lumas) busy += Math.abs(v - mean);
    busy = busy / n * 2;
    const sorted = [...lumas].sort((a, b) => a - b);
    const percentile = (p) => {
      const idx = p * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    const slope = (xs) => {
      let mx = 0;
      for (const v of xs) mx += v;
      mx /= n;
      let sxx = 0;
      let sxl = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - mx;
        sxx += dx * dx;
        sxl += dx * (lumas[i] - mean);
      }
      return sxx > 1e-6 ? sxl / sxx : 0;
    };
    return {
      luma: mean,
      busy: Math.min(busy, 1),
      lo: percentile(0.1),
      hi: percentile(0.9),
      slopeX: slope(nx),
      slopeY: slope(ny),
      r: sr / n,
      g: sg / n,
      b: sb / n
    };
  }
  function createProbe(gl, vertexSource) {
    const program = createProgram(gl, vertexSource, DOWNSAMPLE_FRAGMENT_SOURCE);
    const format = pickDownsampleFormat(gl);
    const texture = gl.createTexture();
    if (!texture) throw new Error("vireglass/web/probe: gl.createTexture \u0432\u0435\u0440\u043D\u0443\u043B null");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      format.internalFormat,
      PROBE_GRID_WIDTH,
      PROBE_GRID_HEIGHT,
      0,
      gl.RGBA,
      format.type,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    const fbo = createFramebuffer(gl, texture);
    const byteSize = PROBE_GRID_WIDTH * PROBE_GRID_HEIGHT * 4 * (format.floatPrecision ? 4 : 1);
    const slots = [0, 1].map(() => {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error("vireglass/web/probe: gl.createBuffer \u0432\u0435\u0440\u043D\u0443\u043B null");
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
      gl.bufferData(gl.PIXEL_PACK_BUFFER, byteSize, gl.STREAM_READ);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      return { buffer, sync: null, pending: false };
    });
    let cursor = 0;
    let latestRaw = null;
    const contentLoc = gl.getUniformLocation(program, "u_content");
    const contentSizeLoc = gl.getUniformLocation(program, "u_contentSize");
    const gridSizeLoc = gl.getUniformLocation(program, "u_gridSize");
    function pollReady(slot) {
      if (!slot.pending || !slot.sync) return;
      const status = gl.clientWaitSync(slot.sync, 0, 0);
      if (status === gl.TIMEOUT_EXPIRED) return;
      gl.deleteSync(slot.sync);
      slot.sync = null;
      slot.pending = false;
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, slot.buffer);
      const out = format.floatPrecision ? new Float32Array(PROBE_GRID_WIDTH * PROBE_GRID_HEIGHT * 4) : new Uint8Array(PROBE_GRID_WIDTH * PROBE_GRID_HEIGHT * 4);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, out);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      latestRaw = out;
    }
    function sample(contentTexture, contentWidth, contentHeight, rect) {
      for (const slot2 of slots) pollReady(slot2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, PROBE_GRID_WIDTH, PROBE_GRID_HEIGHT);
      gl.useProgram(program);
      bindTextureAt(gl, 0, contentTexture, program, "u_content");
      gl.uniform1i(contentLoc, 0);
      gl.uniform2f(contentSizeLoc, contentWidth, contentHeight);
      gl.uniform2f(gridSizeLoc, PROBE_GRID_WIDTH, PROBE_GRID_HEIGHT);
      gl.disable(gl.BLEND);
      drawFullscreenTriangle(gl);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const slot = slots[cursor];
      cursor = (cursor + 1) % slots.length;
      if (!slot.pending) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, slot.buffer);
        gl.readPixels(0, 0, PROBE_GRID_WIDTH, PROBE_GRID_HEIGHT, gl.RGBA, format.type, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        slot.sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        slot.pending = true;
      }
      return statsFor(contentWidth, contentHeight, rect);
    }
    function statsFor(contentWidth, contentHeight, rect) {
      if (!latestRaw) return null;
      return rectStats(
        latestRaw,
        format.floatPrecision,
        PROBE_GRID_WIDTH,
        PROBE_GRID_HEIGHT,
        contentWidth,
        contentHeight,
        rect
      );
    }
    function destroy() {
      for (const slot of slots) {
        if (slot.sync) gl.deleteSync(slot.sync);
        gl.deleteBuffer(slot.buffer);
      }
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    }
    return { sample, statsFor, destroy };
  }
  var BLIT_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D u_content;
uniform vec2 u_resolution;
void main() {
  // \u0422\u043E\u0442 \u0436\u0435 \u0444\u043B\u0438\u043F Y, \u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u0442\u0440\u0430\u043D\u0441\u043F\u0430\u0439\u043B\u0435\u0440 \u0434\u043B\u044F \u043B\u0438\u043D\u0437\u044B/\u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 (targets/glsl.ts):
  // content \u0437\u0430\u043B\u0438\u0442 \u0438\u0437 2D-\u043A\u0430\u043D\u0432\u0430\u0441\u0430 \u0411\u0415\u0417 \u043F\u0435\u0440\u0435\u0432\u043E\u0440\u043E\u0442\u0430, \u0435\u0433\u043E V=0 \u2014 \u0432\u0435\u0440\u0445\u043D\u044F\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u0441\u0446\u0435\u043D\u044B. \u0417\u0434\u0435\u0441\u044C \u0442\u043E\u0442
  // \u0436\u0435 \u043F\u043E\u0440\u044F\u0434\u043E\u043A, \u0438\u043D\u0430\u0447\u0435 \u0444\u043E\u043D \u0438 \u0442\u043E, \u0447\u0442\u043E \u0447\u0435\u0440\u0435\u0437 \u043D\u0435\u0433\u043E \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u044F\u0435\u0442 \u043B\u0438\u043D\u0437\u0430, \u0440\u0430\u0437\u044A\u0435\u0437\u0436\u0430\u044E\u0442\u0441\u044F \u043F\u043E \u0432\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u0438.
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;
  fragColor = texture(u_content, uv);
}
`;
  function locationCache(gl, program) {
    const cache = /* @__PURE__ */ new Map();
    return (name) => {
      let loc = cache.get(name);
      if (loc === void 0) {
        loc = gl.getUniformLocation(program, name);
        cache.set(name, loc);
      }
      return loc;
    };
  }
  function setUniform(gl, loc, value) {
    if (!loc) return;
    if (typeof value === "number") {
      gl.uniform1f(loc, value);
      return;
    }
    switch (value.length) {
      case 1:
        gl.uniform1f(loc, value[0]);
        break;
      case 2:
        gl.uniform2f(loc, value[0], value[1]);
        break;
      case 3:
        gl.uniform3f(loc, value[0], value[1], value[2]);
        break;
      case 4:
        gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
        break;
      default:
        throw new Error(`vireglass/web: \u043D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u043D\u043D\u044B\u0439 \u0440\u0430\u0437\u043C\u0435\u0440 \u0443\u043D\u0438\u0444\u043E\u0440\u043C\u044B (${value.length})`);
    }
  }
  function applyChannel(gl, get, names, sizes, values) {
    let cursor = 0;
    for (let i = 0; i < names.length; i += 1) {
      const size = sizes[i];
      setUniform(gl, get(names[i]), values.slice(cursor, cursor + size));
      cursor += size;
    }
  }
  function applyObject(gl, get, values) {
    for (const name of Object.keys(values)) setUniform(gl, get(name), values[name]);
  }
  function createVireGlassRenderer(canvas, options = {}) {
    const context = canvas.getContext("webgl2", {
      preserveDrawingBuffer: true,
      alpha: options.alpha ?? false,
      antialias: false
    });
    if (!context) throw new Error("vireglass/web: WebGL2 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D");
    const gl = context;
    const blitProgram = createProgram(gl, FULLSCREEN_TRIANGLE_VERTEX_SOURCE, BLIT_FRAGMENT_SOURCE);
    const lensProgram = createProgram(gl, FULLSCREEN_TRIANGLE_VERTEX_SOURCE, toGLSL(LENS_SHADER));
    const surfaceProgram = createProgram(
      gl,
      FULLSCREEN_TRIANGLE_VERTEX_SOURCE,
      toGLSL(SURFACE_SHADER)
    );
    const probe = createProbe(gl, FULLSCREEN_TRIANGLE_VERTEX_SOURCE);
    const blitLoc = locationCache(gl, blitProgram);
    const lensLoc = locationCache(gl, lensProgram);
    const surfaceLoc = locationCache(gl, surfaceProgram);
    let width = canvas.width;
    let height = canvas.height;
    let sceneCanvas = document.createElement("canvas");
    let sceneCtx = sceneCanvas.getContext("2d");
    if (!sceneCtx) throw new Error("vireglass/web: 2D-\u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0441\u0446\u0435\u043D\u044B \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D");
    const settled = /* @__PURE__ */ new Map();
    const SETTLE2 = 0.12;
    function settleStats(index, fresh) {
      const prev = settled.get(index);
      if (!prev) {
        settled.set(index, fresh);
        return fresh;
      }
      const mix = (a, b) => a + (b - a) * SETTLE2;
      const next = {
        luma: mix(prev.luma, fresh.luma),
        busy: mix(prev.busy, fresh.busy),
        lo: mix(prev.lo, fresh.lo),
        hi: mix(prev.hi, fresh.hi),
        slopeX: mix(prev.slopeX, fresh.slopeX),
        slopeY: mix(prev.slopeY, fresh.slopeY),
        r: mix(prev.r, fresh.r),
        g: mix(prev.g, fresh.g),
        b: mix(prev.b, fresh.b)
      };
      settled.set(index, next);
      return next;
    }
    let contentTexture = createTexture(gl, {
      width: Math.max(width, 1),
      height: Math.max(height, 1)
    });
    const iconTexture = createTexture(gl, { width: 1, height: 1 });
    const colorTexture = createTexture(gl, { width: 1, height: 1 });
    gl.bindTexture(gl.TEXTURE_2D, iconTexture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    function resize(widthPx, heightPx) {
      width = Math.max(1, Math.round(widthPx));
      height = Math.max(1, Math.round(heightPx));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      sceneCanvas = document.createElement("canvas");
      sceneCanvas.width = width;
      sceneCanvas.height = height;
      sceneCtx = sceneCanvas.getContext("2d");
      if (!sceneCtx) throw new Error("vireglass/web: 2D-\u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0441\u0446\u0435\u043D\u044B \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D");
      gl.deleteTexture(contentTexture);
      contentTexture = createTexture(gl, { width, height });
    }
    function render(options2) {
      if (!sceneCtx) throw new Error("vireglass/web: \u0440\u0435\u043D\u0434\u0435\u0440\u0435\u0440 \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D (resize \u043D\u0435 \u0432\u044B\u0437\u0432\u0430\u043D)");
      sceneCtx.clearRect(0, 0, width, height);
      options2.scene(sceneCtx, width, height, options2.offsetX ?? 0, options2.offsetY ?? 0);
      gl.bindTexture(gl.TEXTURE_2D, contentTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sceneCanvas);
      gl.bindTexture(gl.TEXTURE_2D, null);
      if (options2.colorLayer) {
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, options2.colorLayer);
      }
      if (options2.iconMask) {
        gl.bindTexture(gl.TEXTURE_2D, iconTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, options2.iconMask);
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.disable(gl.BLEND);
      gl.disable(gl.SCISSOR_TEST);
      if (options2.backdrop ?? true) {
        gl.useProgram(blitProgram);
        bindTextureAt(gl, 0, contentTexture, blitProgram, "u_content");
        setUniform(gl, blitLoc("u_resolution"), [width, height]);
        drawFullscreenTriangle(gl);
      } else {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      const probes = [];
      for (let index = 0; index < options2.pieces.length; index += 1) {
        const piece = options2.pieces[index];
        const halfWidth = piece.geometry.width * options2.density / 2;
        const halfHeight = piece.geometry.height * options2.density / 2;
        const rect = {
          centerX: piece.centerX,
          centerY: piece.centerY,
          halfWidth,
          halfHeight
        };
        const fresh = index === 0 ? probe.sample(contentTexture, width, height, rect) : probe.statsFor(width, height, rect);
        const stats = fresh ? settleStats(index, fresh) : null;
        probes.push(stats);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const morphReach = piece.morph ? Math.hypot(piece.morph.offsetX, piece.morph.offsetY) + Math.max(piece.morph.width, piece.morph.height) / 2 + piece.morph.smoothing : 0;
        const touchReach = piece.touch ? Math.hypot(piece.touch.pullX, piece.touch.pullY) + piece.touch.waveAmp * 2 : 0;
        const padPx = (lensPadDp(piece.geometry, piece.optics) + surfacePadDp(piece.geometry, 0) + morphReach + touchReach) * options2.density;
        const left = Math.max(0, Math.floor(piece.centerX - halfWidth - padPx));
        const right = Math.min(width, Math.ceil(piece.centerX + halfWidth + padPx));
        const top = Math.max(0, Math.floor(height - (piece.centerY + halfHeight + padPx)));
        const bottom = Math.min(height, Math.ceil(height - (piece.centerY - halfHeight - padPx)));
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
        const withLens = piece.lens ?? true;
        if (withLens) {
          gl.useProgram(lensProgram);
          bindTextureAt(gl, 0, contentTexture, lensProgram, "content");
          setUniform(gl, lensLoc("u_contentSize"), [width, height]);
          setUniform(gl, lensLoc("u_resolution"), [width, height]);
          setUniform(gl, lensLoc("u_center"), [piece.centerX, piece.centerY]);
          setUniform(gl, lensLoc("u_reach"), Math.max(width, height));
          setUniform(gl, lensLoc("u_contentMin"), [1, 1]);
          setUniform(gl, lensLoc("u_contentMax"), [width - 1, height - 1]);
          if (stats) {
            setUniform(gl, lensLoc("u_probeLuma"), stats.luma);
            setUniform(gl, lensLoc("u_probeBusy"), stats.busy);
            setUniform(gl, lensLoc("u_probeRange"), [stats.lo, stats.hi]);
            setUniform(gl, lensLoc("u_probeSlope"), [stats.slopeX, stats.slopeY]);
            setUniform(gl, lensLoc("u_probe"), [stats.r, stats.g, stats.b]);
          } else {
            setUniform(gl, lensLoc("u_probeLuma"), -1);
          }
          const lens = toLensProps(piece.optics, piece.geometry, options2.density, {
            debug: options2.debug,
            morph: piece.morph,
            touch: piece.touch,
            progress: piece.progress
          });
          applyChannel(gl, lensLoc, lens.uniformNames, lens.uniformSizes, lens.uniformValues);
          drawFullscreenTriangle(gl);
        }
        gl.useProgram(surfaceProgram);
        const rawSurface = toSurfaceUniforms(piece.optics, piece.geometry, {
          debug: options2.debug,
          morph: piece.morph,
          bodyInLens: withLens,
          touch: piece.touch,
          progress: piece.progress
        });
        const d = options2.density;
        applyObject(gl, surfaceLoc, {
          ...rawSurface,
          u_center: [piece.centerX, piece.centerY],
          u_halfSize: [rawSurface.u_halfSize[0] * d, rawSurface.u_halfSize[1] * d],
          u_corner: rawSurface.u_corner * d,
          u_bevel: rawSurface.u_bevel * d,
          u_morphOffset: [rawSurface.u_morphOffset[0] * d, rawSurface.u_morphOffset[1] * d],
          u_morphHalf: [rawSurface.u_morphHalf[0] * d, rawSurface.u_morphHalf[1] * d],
          u_morphCorner: rawSurface.u_morphCorner * d,
          u_morphK: rawSurface.u_morphK * d,
          u_shadowReach: rawSurface.u_shadowReach * d,
          u_touch: [rawSurface.u_touch[0] * d, rawSurface.u_touch[1] * d],
          u_pull: [rawSurface.u_pull[0] * d, rawSurface.u_pull[1] * d],
          u_touchRadius: rawSurface.u_touchRadius * d,
          u_wave: [rawSurface.u_wave[0] * d, rawSurface.u_wave[1]]
        });
        setUniform(gl, surfaceLoc(DYNAMIC_UNIFORMS[0]), piece.press ?? 0);
        setUniform(gl, surfaceLoc(DYNAMIC_UNIFORMS[1]), piece.active ?? 0);
        setUniform(gl, surfaceLoc(DYNAMIC_UNIFORMS[2]), REST_LIGHT);
        const hasIcon = Boolean(piece.icon && options2.iconMask);
        setUniform(gl, surfaceLoc(ICON_UNIFORMS[0]), hasIcon ? 1 : 0);
        setUniform(gl, surfaceLoc(ICON_UNIFORMS[1]), 1);
        setUniform(gl, surfaceLoc(ICON_UNIFORMS[2]), piece.inkIdle ?? [1, 1, 1, 1]);
        setUniform(gl, surfaceLoc(ICON_UNIFORMS[3]), piece.inkActive ?? [1, 1, 1, 1]);
        bindTextureAt(gl, 1, iconTexture, surfaceProgram, "u_icon");
        setUniform(gl, surfaceLoc("u_iconSize"), hasIcon ? [width, height] : [1, 1]);
        const hasColor = Boolean(piece.overlay && options2.colorLayer);
        setUniform(gl, surfaceLoc(OVERLAY_UNIFORMS[0]), hasColor ? 1 : 0);
        bindTextureAt(gl, 2, colorTexture, surfaceProgram, "u_overlay");
        setUniform(gl, surfaceLoc("u_overlaySize"), hasColor ? [width, height] : [1, 1]);
        setUniform(gl, surfaceLoc("u_resolution"), [width, height]);
        drawFullscreenTriangle(gl);
      }
      gl.disable(gl.SCISSOR_TEST);
      return { probes };
    }
    function destroy() {
      probe.destroy();
      gl.deleteProgram(blitProgram);
      gl.deleteProgram(lensProgram);
      gl.deleteProgram(surfaceProgram);
      gl.deleteTexture(contentTexture);
      gl.deleteTexture(iconTexture);
      gl.deleteTexture(colorTexture);
    }
    return { resize, render, destroy };
  }
  var MATERIAL = materialForInk(
    // Roughness at the ceiling of the model: the sheet material sits at 0.85 and
    // bright patches of page text still push through. The pane lies over live
    // text, so here haze works for legibility, not for looks.
    { ...VIREGLASS_CONTROL_MATERIAL, roughness: MATERIAL_RANGES.roughness[1] },
    true
  );
  var SETTLE = 0.12;
  var density = () => window.devicePixelRatio || 1;
  function displacementMap(width, height, radius, bevel, push) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    const img = ctx.createImageData(w, h);
    const hx = w / 2;
    const hy = h / 2;
    const r = Math.min(radius, Math.min(hx, hy));
    const band = Math.max(1, bevel);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const px = x + 0.5 - hx;
        const py = y + 0.5 - hy;
        const qx = Math.abs(px) - (hx - r);
        const qy = Math.abs(py) - (hy - r);
        const mx = Math.max(qx, 0);
        const my = Math.max(qy, 0);
        const d = Math.hypot(mx, my) + Math.min(Math.max(qx, qy), 0) - r;
        let nx = 0;
        let ny = 0;
        if (d < 0) {
          const t = Math.min(1, Math.max(0, 1 + d / band));
          if (t > 0) {
            if (mx > 0 && my > 0) {
              const len = Math.hypot(mx, my) || 1;
              nx = mx / len * Math.sign(px);
              ny = my / len * Math.sign(py);
            } else if (qx > qy) {
              nx = Math.sign(px);
            } else {
              ny = Math.sign(py);
            }
            const k = -(t * t);
            nx *= k;
            ny *= k;
          }
        }
        const i = (y * w + x) * 4;
        img.data[i] = Math.round(128 + nx * 127);
        img.data[i + 1] = Math.round(128 + ny * 127);
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  function createGlassSurface(canvas, maxWidth, maxHeight) {
    const renderer = createVireGlassRenderer(canvas, { alpha: true });
    const deform = createDeform();
    const widest = roundedRectGeometry(maxWidth, maxHeight, 28);
    const pad2 = Math.ceil(lensPadDp(widest, resolveOptics(MATERIAL)) + surfacePadDp(widest));
    const boxW = maxWidth + pad2 * 2;
    const boxH = maxHeight + pad2 * 2;
    canvas.style.width = boxW + "px";
    canvas.style.height = boxH + "px";
    let scale = 0;
    function fit(next) {
      if (next === scale) return;
      scale = next;
      renderer.resize(Math.ceil(boxW * scale), Math.ceil(boxH * scale));
    }
    fit(density());
    let backdrop = "#ffffff";
    let spreadTarget = 0;
    let spread = 0;
    let settledAlpha = -1;
    let settledLevel = -1;
    let aimAlpha = -1;
    let aimLevel = -1;
    let inkLight = true;
    let confirmations = 0;
    let last = null;
    let prev = 0;
    let shape = widest;
    const scene = (ctx, w, h) => {
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, w, h);
    };
    return {
      /** How far the canvas reaches past the pane: shadow, bevel and light gathering
       *  all fall outside the shape. */
      pad: pad2,
      setBackdropColor(color) {
        backdrop = color;
      },
      /** Busyness of the background under the pane, 0…1 — the model's `spread`.
       *  The probe reads it off the drawn scene, and our scene is flat: the
       *  variegation of a live page cannot be fed in there. Without it the model
       *  considers the background uniform and asks for no density — and then the
       *  panel's labels land straight on the page's text. */
      setSpread(value) {
        spreadTarget = Math.min(1, Math.max(0, value));
      },
      /** Whether the material has arrived — this decides whether to keep drawing.
       *  Asking about busyness alone is not enough: body density and colour ease in
       *  on their own SETTLE, and ink polarity waits CONFIRMATIONS frames. Stop
       *  earlier and on a slow machine the panel freezes half-arrived: the body at
       *  half strength, the ink still the old polarity. */
      settled: () => Math.abs(spread - spreadTarget) < 5e-3 && confirmations === 0 && (aimAlpha < 0 || Math.abs(settledAlpha - aimAlpha) < 2e-3) && (aimLevel < 0 || Math.abs(settledLevel - aimLevel) < 0.5),
      /** Response to the cursor — the core's springs and its own proportions:
       *  pull travel and finger radius come off the pane's half-size, not guesswork. */
      grab: (x, y) => deform.grab(x, y, 3.2),
      drag(dx, dy) {
        deform.drag(dx, dy, 0.14 * halfMinDp(shape));
      },
      release: () => deform.release(1.8),
      idle: () => deform.idle(),
      /**
       * Refraction of the live DOM: the map for feDisplacementMap plus the shift
       * magnitude and the haze, all out of the core's optics. Recomputed only when
       * the shape changes: it is a raster, and re-rasterising it every morph frame
       * would be pointless.
       */
      refraction(width, height, cornerRadius) {
        const geometry = roundedRectGeometry(width, height, cornerRadius);
        const optics = resolveOptics(MATERIAL);
        const bevel = bevelDp(geometry, optics);
        const push = bevel * optics.refraction;
        return {
          map: displacementMap(width, height, cornerRadius, bevel, push),
          scale: push * 2,
          blur: optics.blur
        };
      },
      /** Returns whether the lettering over the glass should be light. */
      draw(width, height, cornerRadius, anchor = "br") {
        fit(density());
        const now = performance.now();
        deform.step(prev ? Math.min((now - prev) / 1e3, 0.25) : 0);
        prev = now;
        const geometry = roundedRectGeometry(width, height, cornerRadius);
        shape = geometry;
        const d = deform.sample();
        const material = { ...activeMaterial(MATERIAL, d.active), ink: inkLight ? 1 : 0 };
        const optics = applyToggles(resolveOptics(material), { tint: false });
        const left = anchor === "bl" || anchor === "tl" ? pad2 : boxW - pad2 - width;
        const top = anchor === "tl" || anchor === "tr" ? pad2 : boxH - pad2 - height;
        const centerX = (left + width / 2) * scale;
        const centerY = (top + height / 2) * scale;
        const { probes } = renderer.render({
          density: scale,
          debug: "normal",
          scene,
          backdrop: false,
          pieces: [
            {
              optics,
              geometry,
              centerX,
              centerY,
              lens: false,
              press: d.press,
              active: d.active,
              // A settled pane is exactly the neutral material. The touch point
              // outlives the deformation itself, and on a shape that has changed
              // size it stays pressed in at a stale spot — visible as a blob on
              // empty ground.
              touch: deform.idle() ? void 0 : {
                x: d.touchX,
                y: d.touchY,
                pullX: d.pullX,
                pullY: d.pullY,
                press: d.press,
                radius: 0.72 * halfMinDp(geometry),
                waveAmp: d.waveAmp,
                wavePhase: d.wavePhase
              }
            }
          ]
        });
        const stats = probes[0];
        last = stats;
        if (stats) {
          const wants = shouldInkBeLight(stats, material.legibility, inkLight);
          if (wants === inkLight) {
            confirmations = 0;
          } else if (++confirmations >= CONFIRMATIONS) {
            inkLight = wants;
            confirmations = 0;
          }
        }
        spread += (spreadTarget - spread) * SETTLE;
        const local = stats ? stats.luma : 1;
        const alpha = bodyDensityFor(local, material.legibility, optics.bodyDensity, material.ink, spread);
        const aim = bodyLuma(local, material.legibility, optics.bodyDensity, material.ink, spread);
        const tint = alpha > 1e-3 ? (aim - local * (1 - alpha)) / alpha : material.ink > 0.5 ? 0 : 1;
        const level = Math.round(Math.min(1, Math.max(0, tint)) * 255);
        aimAlpha = alpha;
        aimLevel = level;
        settledAlpha = settledAlpha < 0 ? alpha : settledAlpha + (alpha - settledAlpha) * SETTLE;
        settledLevel = settledLevel < 0 ? level : settledLevel + (level - settledLevel) * SETTLE;
        return {
          inkLight,
          body: `rgba(${Math.round(settledLevel)}, ${Math.round(settledLevel)}, ${Math.round(settledLevel)}, ${settledAlpha.toFixed(3)})`
        };
      },
      /** The last background measurement and ink decision — for debugging the material. */
      probe: () => ({ stats: last, inkLight, backdrop }),
      destroy: () => renderer.destroy()
    };
  }

  // src/ui.ts
  var CSS = `
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
.root.gliding { transition: transform 0.38s var(--ease); }
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

/* The VireGlass core draws the material into this canvas: body, bevel, Fresnel,
   highlight and shadow as consequences of the material's causes, not a pile of
   CSS shadows. The canvas is wider than the pane: shadow and light gathering
   reach outside the shape. */
.glass { position: absolute; pointer-events: none; z-index: 0; }

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
   backdrop. */
.tint { position: absolute; inset: 0; z-index: 1; pointer-events: none; }

/* The fallback material when WebGL2 is unavailable: the extension has to work
   without the glass too. */
.shell.flat {
  background: color-mix(in oklch, var(--vg-body) 90%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  backdrop-filter: blur(18px) saturate(160%);
  box-shadow:
    inset 0 1px 0 color-mix(in oklch, var(--vg-ink) 22%, transparent),
    0 0 0 1px color-mix(in oklch, var(--vg-ink) 10%, transparent),
    0 20px 44px -16px color-mix(in oklch, var(--vg-deep) 85%, transparent);
}

.view {
  position: absolute;
  z-index: 2;
  opacity: 0;
  transition: opacity .19s var(--ease);
}
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
.fmt { display: flex; flex-direction: column; }
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
    onDownload
  }) {
    const host = document.createElement("div");
    host.id = "virebook-root";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CSS;
    const rootEl = document.createElement("div");
    rootEl.className = "root";
    const canvas = document.createElement("canvas");
    canvas.className = "glass";
    const shell = document.createElement("div");
    shell.className = "shell";
    const clipEl = document.createElement("div");
    clipEl.className = "clip";
    const refractEl = document.createElement("div");
    refractEl.className = "refract";
    clipEl.append(refractEl);
    const tintEl = document.createElement("div");
    tintEl.className = "tint";
    shell.append(clipEl, tintEl);
    rootEl.append(canvas, shell);
    const SVGNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    const filterEl = document.createElementNS(SVGNS, "filter");
    filterEl.setAttribute("id", "vg-refract");
    filterEl.setAttribute("color-interpolation-filters", "sRGB");
    filterEl.setAttribute("filterUnits", "objectBoundingBox");
    filterEl.setAttribute("x", "0");
    filterEl.setAttribute("y", "0");
    filterEl.setAttribute("width", "1");
    filterEl.setAttribute("height", "1");
    const flood = document.createElementNS(SVGNS, "feFlood");
    flood.setAttribute("flood-color", "rgb(128,128,128)");
    flood.setAttribute("result", "flat");
    const feImage = document.createElementNS(SVGNS, "feImage");
    feImage.setAttribute("result", "shape");
    feImage.setAttribute("preserveAspectRatio", "none");
    const merge = document.createElementNS(SVGNS, "feMerge");
    merge.setAttribute("result", "map");
    for (const src of ["flat", "shape"]) {
      const node = document.createElementNS(SVGNS, "feMergeNode");
      node.setAttribute("in", src);
      merge.append(node);
    }
    const blurEl = document.createElementNS(SVGNS, "feGaussianBlur");
    blurEl.setAttribute("in", "SourceGraphic");
    blurEl.setAttribute("stdDeviation", "0");
    blurEl.setAttribute("result", "scattered");
    const feDisp = document.createElementNS(SVGNS, "feDisplacementMap");
    feDisp.setAttribute("in", "scattered");
    feDisp.setAttribute("in2", "map");
    feDisp.setAttribute("xChannelSelector", "R");
    feDisp.setAttribute("yChannelSelector", "G");
    filterEl.append(flood, feImage, merge, blurEl, feDisp);
    svg.append(filterEl);
    shadow.append(style, svg, rootEl);
    const SLACK = 40;
    const MAX_W = 290;
    const MAX_H = 240;
    let glass = null;
    try {
      glass = createGlassSurface(canvas, MAX_W, MAX_H);
    } catch {
      glass = null;
    }
    if (!glass) {
      canvas.remove();
      clipEl.remove();
      tintEl.remove();
      shell.classList.add("flat");
    }
    let at = normalizeCorner(corner);
    function placeCanvas() {
      if (!glass) return;
      const off = -glass.pad + "px";
      canvas.style.left = at[1] === "l" ? off : "";
      canvas.style.right = at[1] === "r" ? off : "";
      canvas.style.top = at[0] === "t" ? off : "";
      canvas.style.bottom = at[0] === "b" ? off : "";
    }
    function applyCorner() {
      rootEl.classList.toggle("x-right", at[1] === "r");
      rootEl.classList.toggle("x-left", at[1] === "l");
      rootEl.classList.toggle("y-bottom", at[0] === "b");
      rootEl.classList.toggle("y-top", at[0] === "t");
      placeCanvas();
      if (glass && shell.offsetWidth) {
        glass.draw(
          shell.offsetWidth,
          shell.offsetHeight,
          parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0,
          at
        );
      }
    }
    applyCorner();
    function pageBackdrop() {
      for (const el of [document.body, document.documentElement]) {
        if (!el) continue;
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== "transparent" && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(bg)) return bg;
      }
      return "#ffffff";
    }
    let painting = 0;
    let paintUntil = 0;
    let lastSpread = -1;
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
          const r = parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0;
          const out = glass.draw(w, h, r, at);
          rootEl.classList.toggle("ink-dark", !out.inkLight);
          tintEl.style.background = out.body;
          fitMap(w, h);
        }
        if (performance.now() < paintUntil || !glass.idle() || !glass.settled()) {
          painting = requestAnimationFrame(frame);
        } else if (w && h) {
          refract(w, h, parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0);
          const next = pageSpread();
          if (Math.abs(next - lastSpread) > 0.05) {
            lastSpread = next;
            glass.setSpread(next);
            paintGlass(performance.now() + 500);
          }
        }
      };
      painting = requestAnimationFrame(frame);
    }
    function pageSpread(rect) {
      const box = rect || shell.getBoundingClientRect();
      if (!box.width || !box.height) return 0;
      const cols = 5;
      const rows = 4;
      let hits = 0;
      let total = 0;
      for (let i = 0; i < cols; i += 1) {
        for (let j = 0; j < rows; j += 1) {
          const x = box.left + box.width * (i + 0.5) / cols;
          const y = box.top + box.height * (j + 0.5) / rows;
          if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
          total += 1;
          for (const el of document.elementsFromPoint(x, y)) {
            if (el === host || el === document.documentElement || el === document.body) continue;
            const tag = el.tagName;
            if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SVG") {
              hits += 1;
              break;
            }
            if ((el.textContent || "").trim()) {
              hits += 1;
              break;
            }
          }
        }
      }
      return total ? hits / total : 0;
    }
    function refreshBackdrop() {
      if (!glass) return;
      glass.setBackdropColor(pageBackdrop());
      lastSpread = pageSpread();
      glass.setSpread(lastSpread);
      paintGlass(performance.now() + 900);
    }
    let mapFor = "";
    const mapCache = /* @__PURE__ */ new Map();
    function fitMap(w, h) {
      feImage.setAttribute("x", String(SLACK));
      feImage.setAttribute("y", String(SLACK));
      feImage.setAttribute("width", String(w));
      feImage.setAttribute("height", String(h));
    }
    function refract(w, h, r) {
      if (!glass) return;
      const key = w + "x" + h + "r" + Math.round(r);
      if (key === mapFor) return;
      mapFor = key;
      let out = mapCache.get(key);
      if (!out) {
        out = glass.refraction(w, h, r);
        if (mapCache.size > 24) mapCache.clear();
        mapCache.set(key, out);
      }
      if (!out.map) return;
      feImage.setAttribute("href", out.map);
      fitMap(w, h);
      feDisp.setAttribute("scale", out.scale.toFixed(2));
      blurEl.setAttribute("stdDeviation", (out.blur / 2).toFixed(2));
      refractEl.style.backdropFilter = "url(#vg-refract)";
      refractEl.style.setProperty("-webkit-backdrop-filter", "url(#vg-refract)");
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
      rootEl.style.transform = "";
      const after = shell.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (animate && (dx || dy)) {
        rootEl.style.transform = "translate(" + dx + "px," + dy + "px)";
        requestAnimationFrame(() => {
          rootEl.classList.add("gliding");
          rootEl.style.transform = "";
        });
      }
      if (onCornerChange) onCornerChange(at);
      refreshBackdrop();
    }
    function step(dir) {
      const y = at[0];
      const x = at[1];
      if (dir === "left") moveTo(y + "l", true);
      else if (dir === "right") moveTo(y + "r", true);
      else if (dir === "up") moveTo("t" + x, true);
      else moveTo("b" + x, true);
    }
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
      const mx = Math.min(Math.max(dx, KEEP_IN - b.left), innerWidth - KEEP_IN - b.right);
      const my = Math.min(Math.max(dy, KEEP_IN - b.top), innerHeight - KEEP_IN - b.bottom);
      rootEl.style.transform = "translate(" + mx + "px," + my + "px)";
      if (glass) paintGlass();
    });
    const letGo = () => {
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
    };
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
        previous.classList.remove("in");
        setTimeout(() => previous.remove(), 220);
      }
      shell.append(next);
      view = next;
      if (glass) {
        const now = shell.getBoundingClientRect();
        const left = at[1] === "l" ? now.left : (now.right || innerWidth - 18) - w;
        const top = at[0] === "t" ? now.top : (now.bottom || innerHeight - 18) - h;
        lastSpread = pageSpread({ left, top, width: w, height: h });
        glass.setSpread(lastSpread);
        refract(w, h, pill ? h / 2 : SHEET_RADIUS);
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
    function renderMenu() {
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
      panel.append(head, list);
      setView(panel, false);
      const first = list.querySelector("button");
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
        const result = await onDownload({ format, progress, signal: controller.signal });
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
    async function onDownload({ format, progress, signal }) {
      progress("Checking for a ready-made file on the site\u2026", 3);
      const native2 = await nativeDownload(format);
      if (native2) return native2;
      const result = await buildBook({ doc: document, url, format, progress, signal });
      progress("Saving the file\u2026", 99);
      saveBlob(result.blob, result.filename);
      return {
        filename: result.filename,
        note: result.missing ? `Chapters not parsed: ${result.missing}` : ""
      };
    }
    function mount(prefs) {
      const widget = create({
        siteName: adapter.name,
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
        onDownload
      });
      document.documentElement.appendChild(widget.host);
      window.__VIREBOOK_WIDGET__ = widget;
    }
    try {
      chrome.storage.sync.get({ defaultFormat: "epub", widgetCorner: "br" }, (s) => mount(s));
    } catch {
      mount(null);
    }
  }
  main();
})();
