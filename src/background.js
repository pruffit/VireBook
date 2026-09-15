chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ defaultFormat: null }, (s) => {
    if (!s || !s.defaultFormat) chrome.storage.sync.set({ defaultFormat: 'epub' });
  });
});

// Снимок видимой области для стекла: линза преломляет пиксели, а не DOM, и взять их
// со страницы можно только так. Снимок никуда не уходит — контент-скрипт кладёт его
// в текстуру и отрисовывает у себя.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'fk-capture') return undefined;
  const windowId = sender.tab && sender.tab.windowId;
  if (windowId === undefined) {
    sendResponse({ dataUrl: null });
    return undefined;
  }
  chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
    sendResponse({ dataUrl: chrome.runtime.lastError ? null : dataUrl });
  });
  return true;
});
