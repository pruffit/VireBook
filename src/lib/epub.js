// EPUB 3 с NCX для обратной совместимости: Send to Kindle конвертирует именно его.
(function (root, factory) {
  const VireBook = (root.VireBook = root.VireBook || {});
  factory(VireBook);
  if (typeof module !== 'undefined' && module.exports) module.exports = VireBook;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (VireBook) {
  const esc = (s) => VireBook.html.escapeText(String(s == null ? '' : s));
  const escA = (s) => VireBook.html.escapeAttr(String(s == null ? '' : s));
  const pad = (n, w = 3) => String(n).padStart(w, '0');

  const STYLE = `@charset "utf-8";
body { margin: 0 5%; font-family: serif; line-height: 1.5; text-align: justify; }
h1, h2, h3 { font-family: serif; font-weight: bold; text-align: left; line-height: 1.25; }
h1 { font-size: 1.6em; margin: 1.2em 0 0.6em; }
h2 { font-size: 1.25em; margin: 1em 0 0.8em; page-break-before: always; }
p { margin: 0; text-indent: 1.2em; orphans: 2; widows: 2; }
p:first-of-type, h1 + p, h2 + p, h3 + p, blockquote p:first-child { text-indent: 0; }
blockquote { margin: 1em 1.5em; font-style: italic; }
hr { border: 0; border-top: 1px solid currentColor; width: 35%; margin: 1.5em auto; opacity: 0.4; }
img { max-width: 100%; height: auto; }
.fk-meta { font-size: 0.85em; line-height: 1.6; text-indent: 0; margin: 0.35em 0; }
.fk-meta-key { font-weight: bold; }
.fk-title { text-align: center; margin-top: 18%; }
.fk-title h1 { text-align: center; font-size: 1.8em; }
.fk-author { text-align: center; font-size: 1.1em; margin: 0.4em 0 2em; text-indent: 0; }
.fk-summary { margin: 1.5em 0; font-style: italic; }
.fk-source { font-size: 0.8em; opacity: 0.75; text-indent: 0; margin-top: 2em; }
.fk-notes { font-size: 0.9em; border-top: 1px solid currentColor; margin-top: 1.5em; padding-top: 0.8em; }
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
    if (!value) return '';
    return `<p class="fk-meta"><span class="fk-meta-key">${esc(key)}:</span> ${esc(value)}</p>`;
  }

  function titlePage(book) {
    const meta = [
      metaRow('Фэндом', book.fandom),
      metaRow('Пейринг', book.pairing),
      metaRow('Рейтинг', book.rating),
      metaRow('Статус', book.status),
      metaRow('Размер', book.size),
      metaRow('Метки', (book.tags || []).join(', ')),
    ].join('\n');

    const summary = book.summaryXhtml
      ? `<div class="fk-summary">${book.summaryXhtml}</div>`
      : '';

    return page(
      book.title,
      `<div class="fk-title">
<h1>${esc(book.title)}</h1>
<p class="fk-author">${esc(book.author || 'Автор неизвестен')}</p>
</div>
${summary}
${meta}
<p class="fk-source">Источник: ${esc(book.siteName || '')} — ${esc(book.sourceUrl || '')}<br/>
Скачано ${esc(new Date().toLocaleDateString('ru-RU'))}</p>`,
      book.language
    );
  }

  function navPage(book, chapters) {
    const items = chapters
      .map((c, i) => `<li><a href="ch${pad(i + 1)}.xhtml">${esc(c.title)}</a></li>`)
      .join('\n');
    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escA(book.language)}" lang="${escA(book.language)}">
<head><meta charset="utf-8"/><title>Оглавление</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<nav epub:type="toc" id="toc">
<h1>Оглавление</h1>
<ol>
<li><a href="title.xhtml">${esc(book.title)}</a></li>
${items}
</ol>
</nav>
<nav epub:type="landmarks" hidden="hidden">
<ol>
<li><a epub:type="toc" href="nav.xhtml">Оглавление</a></li>
<li><a epub:type="bodymatter" href="ch001.xhtml">Начало</a></li>
</ol>
</nav>
</body>
</html>`;
  }

  function ncx(book, chapters, uid) {
    const points = [{ title: book.title, href: 'title.xhtml' }]
      .concat(chapters.map((c, i) => ({ title: c.title, href: `ch${pad(i + 1)}.xhtml` })))
      .map(
        (p, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}">
<navLabel><text>${esc(p.title)}</text></navLabel>
<content src="${escA(p.href)}"/>
</navPoint>`
      )
      .join('\n');

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
      '<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>',
    ];
    const spine = ['<itemref idref="title"/>', '<itemref idref="nav"/>'];

    if (cover) {
      manifest.push(`<item id="cover-image" href="${escA(cover.name)}" media-type="${escA(cover.mime)}" properties="cover-image"/>`);
      manifest.push('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>');
      spine.unshift('<itemref idref="cover"/>');
    }

    chapters.forEach((c, i) => {
      const id = `ch${pad(i + 1)}`;
      manifest.push(`<item id="${id}" href="${id}.xhtml" media-type="application/xhtml+xml"/>`);
      spine.push(`<itemref idref="${id}"/>`);
    });

    const subjects = (book.tags || [])
      .concat(book.fandom ? [book.fandom] : [])
      .slice(0, 24)
      .map((t) => `<dc:subject>${esc(t)}</dc:subject>`)
      .join('\n');

    return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${escA(book.language)}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">${esc(uid)}</dc:identifier>
<dc:title>${esc(book.title)}</dc:title>
<dc:language>${esc(book.language)}</dc:language>
<dc:creator id="author">${esc(book.author || 'Неизвестный автор')}</dc:creator>
<meta refines="#author" property="role" scheme="marc:relators">aut</meta>
${book.summaryText ? `<dc:description>${esc(book.summaryText.slice(0, 1800))}</dc:description>` : ''}
${book.siteName ? `<dc:publisher>${esc(book.siteName)}</dc:publisher>` : ''}
${book.sourceUrl ? `<dc:source>${esc(book.sourceUrl)}</dc:source>` : ''}
${subjects}
<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
${cover ? '<meta name="cover" content="cover-image"/>' : ''}
</metadata>
<manifest>
${manifest.join('\n')}
</manifest>
<spine toc="ncx">
${spine.join('\n')}
</spine>
</package>`;
  }

  async function buildEpub(book) {
    const chapters = book.chapters || [];
    const uid = `urn:uuid:${book.uuid || VireBook.util.uuid()}`;
    const lang = book.language || 'ru';
    const withLang = Object.assign({}, book, { language: lang });

    const files = [
      { name: 'mimetype', data: 'application/epub+zip', store: true },
      {
        name: 'META-INF/container.xml',
        data: `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
      },
      { name: 'OEBPS/style.css', data: STYLE },
      { name: 'OEBPS/title.xhtml', data: titlePage(withLang) },
      { name: 'OEBPS/nav.xhtml', data: navPage(withLang, chapters) },
      { name: 'OEBPS/toc.ncx', data: ncx(withLang, chapters, uid) },
    ];

    let cover = null;
    if (book.cover && book.cover.bytes && book.cover.bytes.length) {
      cover = { name: `cover.${book.cover.ext || 'jpg'}`, mime: book.cover.mime || 'image/jpeg' };
      files.push({ name: `OEBPS/${cover.name}`, data: book.cover.bytes });
      files.push({
        name: 'OEBPS/cover.xhtml',
        data: page(
          'Обложка',
          `<div style="text-align:center;margin:0;padding:0;"><img src="${escA(cover.name)}" alt="${escA(book.title)}"/></div>`,
          lang
        ),
      });
    }

    chapters.forEach((c, i) => {
      const notes = c.notesXhtml ? `<div class="fk-notes">${c.notesXhtml}</div>` : '';
      files.push({
        name: `OEBPS/ch${pad(i + 1)}.xhtml`,
        data: page(c.title, `<h2>${esc(c.title)}</h2>\n${c.xhtml}\n${notes}`, lang),
      });
    });

    files.push({ name: 'OEBPS/content.opf', data: opf(withLang, chapters, uid, cover) });

    return VireBook.zip(files, { mimetype: 'application/epub+zip' });
  }

  VireBook.epub = { build: buildEpub, STYLE };
  return VireBook;
});
