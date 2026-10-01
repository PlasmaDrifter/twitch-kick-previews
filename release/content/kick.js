(() => {
  const NON_CHANNEL_PATHS = new Set([
    "categories", "following", "browse", "search", "video", "videos",
    "terms-of-service", "privacy-policy", "community-guidelines",
    "dmca", "support", "about", "press", "careers", "login", "signup",
    "help", "dashboard", "settings", "home"
  ]);

  const KICK_CARD_SELECTORS = [
    ".group\\/card a[href^='/']",
    "#sidebar-wrapper a[href^='/']",
    "a[data-testid^='sidebar-']",
    "a[href^='/'][class*='channel']",
    "a[href^='/'][class*='stream']"
  ].join(",");

  function extractChannelFromUrl(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url, window.location.origin);
      if (!parsed.hostname.includes("kick.com")) return null;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length === 1) {
        const channel = parts[0].toLowerCase();
        if (!NON_CHANNEL_PATHS.has(channel) && /^[a-zA-Z0-9_\-\.]{3,30}$/.test(channel)) {
          return channel;
        }
      }
    } catch (_) {}
    return null;
  }

  function isKickSidebarOffline(link) {
    const sidebarItem = link.closest("#sidebar-wrapper a, [data-testid^='sidebar-']");
    if (!sidebarItem) return false;
    const text = sidebarItem.textContent || "";
    if (text.includes("Offline")) return true;
    return false;
  }

  let activeTarget = null;

  document.addEventListener("mouseover", (event) => {
    const targetLink = event.target.closest(KICK_CARD_SELECTORS) || event.target.closest("a[href^='/']");
    if (!targetLink) return;

    if (isKickSidebarOffline(targetLink)) return;

    const channel = extractChannelFromUrl(targetLink.href);
    if (!channel) return;

    // Verify it is inside a stream card or sidebar
    const inCard = targetLink.closest(".group\\/card, #sidebar-wrapper, [class*='stream'], [class*='card']");
    if (!inCard && !targetLink.querySelector("img, video")) {
      // If it's a naked text link in comments or footer, don't trigger unless hover over thumbnail/card
      return;
    }

    activeTarget = targetLink;
    const rect = (inCard || targetLink).getBoundingClientRect();
    window.StreamPreviewCore.requestPreview("kick", channel, rect);
  }, { passive: true });

  document.addEventListener("mouseout", (event) => {
    if (!activeTarget) return;

    const related = event.relatedTarget;
    if (related && activeTarget.contains(related)) return;

    // Check if moving into any preview window
    if (related && related.closest && related.closest(".sp-window")) return;

    activeTarget = null;
    window.StreamPreviewCore.scheduleHide();
  }, { passive: true });
})();
