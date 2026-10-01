// Background service script for Stream Previews
(() => {
  const actionApi = (typeof browser !== "undefined" && browser.action) ? browser.action : (typeof chrome !== "undefined" ? chrome.action : null);
  if (actionApi && actionApi.setIcon) {
    actionApi.setIcon({
      path: {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
        "48": "icons/icon-48.png"
      }
    }).catch(() => {});
  }
})();
