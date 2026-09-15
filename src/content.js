// Точка входа на странице: решает, показывать ли кнопку, и связывает UI с ядром.
(function () {
  const FK = window.FK;
  if (!FK || !FK.core) return;
  if (document.getElementById('virebook-root')) return;

  const url = location.href;
  const adapter = FK.core.resolveAdapter(url);

  function looksLikeFanfic() {
    if (adapter.id !== 'generic') return adapter.isWorkPage(url);
    // Для незнакомого сайта кнопку рисуем, только если на странице реально
    // много связного текста — иначе она висит поверх каждой поисковой выдачи.
    const main = FK.adapters.base.findMainContent(document);
    return !!main && (main.textContent || '').length > 2500;
  }

  const FORCED = window.__FK_FORCED__ === true;
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

    const result = await FK.core.buildBook({ doc: document, url, format, progress, signal });
    progress('Сохраняю файл…', 99);
    FK.core.saveBlob(result.blob, result.filename);
    return {
      ...result,
      note: result.missing ? `Не разобрались главы: ${result.missing}` : '',
    };
  }

  function mount(defaultFormat) {
    const widget = FK.ui.create({
      siteName: adapter.name,
      defaultFormat: defaultFormat || 'epub',
      onDownload,
    });
    document.documentElement.appendChild(widget.host);
    window.__FK_WIDGET__ = widget;
  }

  try {
    chrome.storage.sync.get({ defaultFormat: 'epub' }, (s) => mount(s && s.defaultFormat));
  } catch {
    mount('epub');
  }
})();
