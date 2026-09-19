// The entry point on the page: decides whether to show the button and wires
// the UI to the core.
import type { DownloadRequest, DownloadResult } from './ui.ts';
import type { Format } from './types.ts';
import type { GlassAnchor } from './glass/vireglass.bundle.js';
import { findMainContent } from './adapters/base.ts';
import { buildBook, resolveAdapter, saveBlob } from './core.ts';
import { create } from './ui.ts';

declare global {
  interface Window {
    __VIREBOOK_FORCED__?: boolean;
    __VIREBOOK_WIDGET__?: ReturnType<typeof create>;
  }
}

function main(): void {
  if (document.getElementById('virebook-root')) return;

  const url = location.href;
  const adapter = resolveAdapter(url);

  function looksLikeBook(): boolean {
    if (adapter.id !== 'generic') return adapter.isWorkPage(url);
    // On an unknown site we draw the button only when the page really does hold
    // a lot of connected text — otherwise it hangs over every search results page.
    const main = findMainContent(document);
    return !!main && (main.textContent || '').length > 2500;
  }

  const forced = window.__VIREBOOK_FORCED__ === true;
  if (!forced && !looksLikeBook()) return;

  async function nativeDownload(format: Format): Promise<DownloadResult | null> {
    if (!adapter.native) return null;
    let links;
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
    return { filename: `${format.toUpperCase()} from the site` };
  }

  async function onDownload({ format, progress, signal }: DownloadRequest): Promise<DownloadResult> {
    // If the site already serves a ready-made file behind a direct link, take
    // it: that is instant and no worse in quality (AO3 builds books with the
    // same kindlegen).
    progress('Checking for a ready-made file on the site…', 3);
    const native = await nativeDownload(format);
    if (native) return native;

    const result = await buildBook({ doc: document, url, format, progress, signal });
    progress('Saving the file…', 99);
    saveBlob(result.blob, result.filename);
    return {
      filename: result.filename,
      note: result.missing ? `Chapters not parsed: ${result.missing}` : '',
    };
  }

  function mount(prefs: { defaultFormat?: Format; widgetCorner?: string } | null): void {
    const widget = create({
      siteName: adapter.name,
      defaultFormat: prefs?.defaultFormat || 'epub',
      // The corner the reader threw the pane into last time: which spot does not
      // cover the text differs per site, and setting it again every time is the
      // same chore the whole extension exists to remove.
      corner: prefs?.widgetCorner,
      onCornerChange: (next: GlassAnchor) => {
        try {
          chrome.storage.sync.set({ widgetCorner: next });
        } catch {
          /* no storage (page not opened as an extension) — the corner lives until reload */
        }
      },
      onDownload,
    });
    document.documentElement.appendChild(widget.host);
    window.__VIREBOOK_WIDGET__ = widget;
  }

  try {
    chrome.storage.sync.get({ defaultFormat: 'epub' as Format, widgetCorner: 'br' }, (s) => mount(s));
  } catch {
    mount(null);
  }
}

main();
