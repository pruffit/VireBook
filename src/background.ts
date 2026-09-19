// The service worker. Its only job: make sure a default format exists.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ defaultFormat: null as string | null }, (s) => {
    if (!s || !s.defaultFormat) chrome.storage.sync.set({ defaultFormat: 'epub' });
  });
});

export {};
