(() => {
  const NON_CHANNEL_PATHS = new Set([
    "directory", "videos", "p", "downloads", "search", "settings",
    "subscriptions", "inventory", "drops", "messages", "friends",
    "turbo", "prime", "wallet", "login", "signup", "team", "popout",
    "jobs", "legal", "turbo"
  ]);

  const CARD_SELECTORS = [
    'a[data-a-target="preview-card-image-link"]',
    'a[data-a-target="preview-card-title-link"]',
    'a[data-a-target="preview-card-channel-link"]',
    'a.side-nav-card__link',
    'a[data-a-target="side-nav-card-link"]',
    'a[data-test-selector="followed-channel"]'
  ].join(",");

  function extractChannelFromUrl(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url, window.location.origin);
      if (!parsed.hostname.includes("twitch.tv")) return null;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 1) {
        const channel = parts[0].toLowerCase();
        if (!NON_CHANNEL_PATHS.has(channel) && /^[a-zA-Z0-9_]{3,25}$/.test(channel)) {
          return channel;
        }
      }
    } catch (_) {}
    return null;
  }

  function isSidebarOffline(link) {
    const sideCard = link.closest(".side-nav-card, [data-a-target='side-nav-card']");
    if (!sideCard) return false;
    if (sideCard.querySelector(".side-nav-card__avatar--offline")) return true;
    const text = sideCard.textContent || "";
    if (text.includes("Offline")) return true;
    return false;
  }

  let activeTarget = null;

  document.addEventListener("mouseover", (event) => {
    const targetLink = event.target.closest(CARD_SELECTORS);
    if (!targetLink) return;

    if (isSidebarOffline(targetLink)) return;

    const channel = extractChannelFromUrl(targetLink.href);
    if (!channel) return;

    activeTarget = targetLink;
    const rect = targetLink.getBoundingClientRect();
    window.StreamPreviewCore.requestPreview("twitch", channel, rect);
  }, { passive: true });

  document.addEventListener("mouseout", (event) => {
    if (!activeTarget) return;

    const related = event.relatedTarget;
    // If moving to another element within the same target, ignore
    if (related && activeTarget.contains(related)) return;

    // Check if moving into any preview window
    if (related && related.closest && related.closest(".sp-window")) return;

    activeTarget = null;
    window.StreamPreviewCore.scheduleHide();
  }, { passive: true });
})();
