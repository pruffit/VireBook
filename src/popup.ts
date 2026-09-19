// The toolbar popup: the default format and a manual "show the button here".
import type { Format } from './types.ts';

/** One bundle, because the content script is one bundle. Kept in step with
 *  manifest.json by a test. */
const SCRIPTS = ['dist/content.js'];

const statusEl = document.getElementById('status')!;

function setStatus(text: string, isError = false): void {
  statusEl.textContent = text || '';
  statusEl.classList.toggle('err', isError);
}

chrome.storage.sync.get({ defaultFormat: 'epub' as Format }, (s) => {
  const value = s?.defaultFormat || 'epub';
  const input = document.querySelector<HTMLInputElement>(`input[name="fmt"][value="${value}"]`);
  if (input) input.checked = true;
});

document.querySelectorAll<HTMLInputElement>('input[name="fmt"]').forEach((input) => {
  input.addEventListener('change', () => {
    chrome.storage.sync.set({ defaultFormat: input.value });
    setStatus('Saved');
    setTimeout(() => setStatus(''), 1400);
  });
});

const forceButton = document.getElementById('force') as HTMLButtonElement;
forceButton.addEventListener('click', async () => {
  forceButton.disabled = true;
  setStatus('Loading…');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('no active tab');
    if (!/^https?:/.test(tab.url || '')) throw new Error('not possible on this page');

    // The flag goes in before the scripts: content.ts reads it to draw the
    // button even where the page was not recognised as a book.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        (window as unknown as { __VIREBOOK_FORCED__: boolean }).__VIREBOOK_FORCED__ = true;
      },
    });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: SCRIPTS });
    setStatus('The button is on the page, bottom right');
    setTimeout(() => window.close(), 900);
  } catch (err) {
    const e = err as Error;
    setStatus(e && e.message ? e.message : String(err), true);
    forceButton.disabled = false;
  }
});
