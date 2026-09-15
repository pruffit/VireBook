(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  factory(FK);
  if (typeof module !== 'undefined' && module.exports) module.exports = FK;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
  function stripTags(xhtml) {
    return String(xhtml || '')
      .replace(/<(br|\/p|\/div|\/h[1-6]|hr)\s*\/?>/gi, '\n')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/&nbsp;|&#160;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/[ \t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map((l) => l.trim())
      .join('\n')
      .trim();
  }

  function build(book) {
    const rule = '—'.repeat(40);
    const head = [
      book.title,
      book.author ? `Автор: ${book.author}` : '',
      book.fandom ? `Фэндом: ${book.fandom}` : '',
      (book.tags || []).length ? `Метки: ${book.tags.join(', ')}` : '',
      book.sourceUrl ? `Источник: ${book.sourceUrl}` : '',
    ].filter(Boolean).join('\n');

    const summary = book.summaryText ? `\n\n${book.summaryText}` : '';

    const body = (book.chapters || [])
      .map((c) => `\n\n${rule}\n${c.title}\n${rule}\n\n${stripTags(c.xhtml)}`)
      .join('\n');

    // BOM — иначе Windows-блокнот и часть читалок показывают кириллицу кракозябрами.
    return new Blob(['﻿', head, summary, body, '\n'], { type: 'text/plain;charset=utf-8' });
  }

  FK.txt = { build, stripTags };
  return FK;
});
