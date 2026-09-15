// FB2 — стандарт де-факто в СНГ: читают все местные читалки и PocketBook.
(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  factory(FK);
  if (typeof module !== 'undefined' && module.exports) module.exports = FK;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
  const esc = (s) => FK.html.escapeText(String(s == null ? '' : s));

  // FB2 не знает про HTML-теги: всё, что не отображается в его словарь, снимаем.
  function toFb2Body(xhtml) {
    let s = String(xhtml || '');
    s = s
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '<subtitle>$1</subtitle>')
      .replace(/<blockquote[^>]*>/gi, '<cite>')
      .replace(/<\/blockquote>/gi, '</cite>')
      .replace(/<(em|i)\b[^>]*>/gi, '<emphasis>')
      .replace(/<\/(em|i)>/gi, '</emphasis>')
      .replace(/<(strong|b)\b[^>]*>/gi, '<strong>')
      .replace(/<\/(strong|b)>/gi, '</strong>')
      .replace(/<br\s*\/?>/gi, '</p><p>')
      .replace(/<hr\s*\/?>/gi, '<empty-line/>')
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
      .replace(/<img\b[^>]*\/?>/gi, '')
      .replace(/<\/?(div|span|section|article|figure|figcaption|small|sup|sub|u|s|strike|del|ins|mark|code|cite\s|pre|table|thead|tbody|tr|td|th|caption|dl|dt|dd|center|abbr|q)\b[^>]*>/gi, '')
      .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, '')
      .replace(/<li[^>]*>/gi, '<p>• ')
      .replace(/<\/li>/gi, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '');

    if (!/<p[\s>]/.test(s) && s.trim()) s = `<p>${s}</p>`;
    return s.trim();
  }

  function build(book) {
    const chapters = book.chapters || [];
    const author = String(book.author || 'Неизвестный автор').trim();
    const parts = author.split(/\s+/);
    const firstName = parts.length > 1 ? parts[0] : '';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : author;

    const bodySections = chapters
      .map(
        (c) => `<section>
<title><p>${esc(c.title)}</p></title>
${toFb2Body(c.xhtml)}
</section>`
      )
      .join('\n');

    const genres = ['nonf_publicism'];
    const keywords = (book.tags || []).slice(0, 20).join(', ');

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
<description>
<title-info>
${genres.map((g) => `<genre>${g}</genre>`).join('')}
<author>${firstName ? `<first-name>${esc(firstName)}</first-name>` : ''}<last-name>${esc(lastName)}</last-name></author>
<book-title>${esc(book.title)}</book-title>
${book.summaryText ? `<annotation><p>${esc(book.summaryText)}</p></annotation>` : ''}
${keywords ? `<keywords>${esc(keywords)}</keywords>` : ''}
<lang>${esc(book.language || 'ru')}</lang>
</title-info>
<document-info>
<author><nickname>VireBook</nickname></author>
<date value="${new Date().toISOString().slice(0, 10)}">${new Date().toLocaleDateString('ru-RU')}</date>
${book.sourceUrl ? `<src-url>${esc(book.sourceUrl)}</src-url>` : ''}
<id>${esc(book.uuid || FK.util.uuid())}</id>
<version>1.0</version>
</document-info>
</description>
<body>
<title><p>${esc(book.title)}</p></title>
${bodySections}
</body>
</FictionBook>`;

    return new Blob([xml], { type: 'application/x-fictionbook+xml' });
  }

  FK.fb2 = { build, toFb2Body };
  return FK;
});
