"use strict";
(() => {
  // src/popup.ts
  var SCRIPTS = ["dist/content.js"];
  var statusEl = document.getElementById("status");
  function setStatus(text, isError = false) {
    statusEl.textContent = text || "";
    statusEl.classList.toggle("err", isError);
  }
  chrome.storage.sync.get({ defaultFormat: "epub" }, (s) => {
    const value = s?.defaultFormat || "epub";
    const input = document.querySelector(`input[name="fmt"][value="${value}"]`);
    if (input) input.checked = true;
  });
  document.querySelectorAll('input[name="fmt"]').forEach((input) => {
    input.addEventListener("change", () => {
      chrome.storage.sync.set({ defaultFormat: input.value });
      setStatus("Saved");
      setTimeout(() => setStatus(""), 1400);
    });
  });
  var forceButton = document.getElementById("force");
  forceButton.addEventListener("click", async () => {
    forceButton.disabled = true;
    setStatus("Loading…");
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) throw new Error("no active tab");
      if (!/^https?:/.test(tab.url || "")) throw new Error("not possible on this page");
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          window.__VIREBOOK_FORCED__ = true;
        }
      });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: SCRIPTS });
      setStatus("The button is on the page, bottom right");
      setTimeout(() => window.close(), 900);
    } catch (err) {
      const e = err;
      setStatus(e && e.message ? e.message : String(err), true);
      forceButton.disabled = false;
    }
  });
})();
