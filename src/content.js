// Точка входа на странице: решает, показывать ли кнопку, и связывает UI с ядром.
(function () {
  const VireBook = window.VireBook;
  if (!VireBook || !VireBook.core) return;
  if (document.getElementById('virebook-root')) return;

  const url = location.href;
  const adapter = VireBook.core.resolveAdapter(url);

  function looksLikeFanfic() {
    if (adapter.id !== 'generic') return adapter.isWorkPage(url);
    // Для незнакомого сайта кнопку рисуем, только если на странице реально
    // много связного текста — иначе она висит поверх каждой поисковой выдачи.
    const main = VireBook.adapters.base.findMainContent(document);
    return !!main && (main.textContent || '').length > 2500;
  }

  const FORCED = window.__VIREBOOK_FORCED__ === true;
  if (!FORCED && !looksLikeFanfic()) return;

  async function nativeDownload(format) {
    if (!adapter.native) return null;
    let links = [];
    try {
      links = adapter.native(document) || [];
    } catch {
      return null;
    }
    const match = links.find((l) => l.format === format);
    if (!match || !match.url) return null;
    const a = document.createElement('a');
    a.href = match.url;
    a.download = '';
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 15000);
    return { filename: `${format.toUpperCase()} с сайта` };
  }

  async function onDownload({ format, progress, signal }) {
    // Если сайт уже отдаёт готовый файл по прямой ссылке — берём его: это
    // мгновенно и качеством не хуже (AO3 собирает книги тем же kindlegen).
    progress('Проверяю готовый файл на сайте…', 3);
    const native = await nativeDownload(format);
    if (native) return native;

    const result = await VireBook.core.buildBook({ doc: document, url, format, progress, signal });
    progress('Сохраняю файл…', 99);
    VireBook.core.saveBlob(result.blob, result.filename);
    return {
      ...result,
      note: result.missing ? `Не разобрались главы: ${result.missing}` : '',
    };
  }

  function mount(prefs) {
    const widget = VireBook.ui.create({
      siteName: adapter.name,
      defaultFormat: (prefs && prefs.defaultFormat) || 'epub',
      // Угол, в который читатель отбросил плашку в прошлый раз: место, где она не
      // закрывает текст, у каждого сайта своё, и переставлять её каждый раз заново
      // — та же морока, от которой всё расширение.
      corner: prefs && prefs.widgetCorner,
      onCornerChange: (next) => {
        try {
          chrome.storage.sync.set({ widgetCorner: next });
        } catch {
          /* хранилища нет (страница открыта не как расширение) — угол живёт до перезагрузки */
        }
      },
      onDownload,
    });
    document.documentElement.appendChild(widget.host);
    window.__VIREBOOK_WIDGET__ = widget;
  }

  try {
    chrome.storage.sync.get({ defaultFormat: 'epub', widgetCorner: 'br' }, (s) => mount(s));
  } catch {
    mount(null);
  }
})();
