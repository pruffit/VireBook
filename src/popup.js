const SCRIPTS = [
  'src/lib/util.js', 'src/lib/zip.js', 'src/lib/html.js', 'src/lib/epub.js',
  'src/lib/mobi.js', 'src/lib/fb2.js', 'src/lib/txt.js', 'src/lib/glass.js',
  'src/adapters/base.js', 'src/adapters/ficbook.js', 'src/adapters/ao3.js',
  'src/adapters/fanficsme.js', 'src/adapters/ffnet.js', 'src/adapters/wattpad.js',
  'src/adapters/royalroad.js', 'src/adapters/generic.js',
  'src/core.js', 'src/ui.js', 'src/content.js',
];

const statusEl = document.getElementById('status');

function setStatus(text, isError) {
  statusEl.textContent = text || '';
  statusEl.classList.toggle('err', !!isError);
}

chrome.storage.sync.get({ defaultFormat: 'epub' }, (s) => {
  const value = (s && s.defaultFormat) || 'epub';
  const input = document.querySelector(`input[name="fmt"][value="${value}"]`);
  if (input) input.checked = true;
});

document.querySelectorAll('input[name="fmt"]').forEach((input) => {
  input.addEventListener('change', () => {
    chrome.storage.sync.set({ defaultFormat: input.value });
    setStatus('Сохранено');
    setTimeout(() => setStatus(''), 1400);
  });
});

document.getElementById('force').addEventListener('click', async () => {
  const button = document.getElementById('force');
  button.disabled = true;
  setStatus('Загружаю…');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('нет активной вкладки');
    if (!/^https?:/.test(tab.url || '')) throw new Error('на этой странице нельзя');

    // Флаг ставим до скриптов: content.js читает его, чтобы нарисовать кнопку
    // даже там, где страница не опознана как фанфик.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => { window.__VIREBOOK_FORCED__ = true; },
    });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: SCRIPTS });
    setStatus('Кнопка на странице, справа внизу');
    setTimeout(() => window.close(), 900);
  } catch (err) {
    setStatus(err && err.message ? err.message : String(err), true);
    button.disabled = false;
  }
});
