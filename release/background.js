(() => {
  const actionApi = (typeof browser !== "undefined" && (browser.browserAction || browser.action)) 
    ? (browser.browserAction || browser.action) 
    : (typeof chrome !== "undefined" ? (chrome.browserAction || chrome.action) : null);
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
