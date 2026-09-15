chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ defaultFormat: null }, (s) => {
    if (!s || !s.defaultFormat) chrome.storage.sync.set({ defaultFormat: 'epub' });
  });
});
