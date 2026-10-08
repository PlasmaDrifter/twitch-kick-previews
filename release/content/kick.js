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
      if (parsed.hostname !== "kick.com" && !parsed.hostname.endsWith(".kick.com")) return null;
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

  // Cache Kick stream titles for 2 minutes
  const kickTitleCache = new Map();

  async function fetchKickStreamTitle(channel) {
    const cached = kickTitleCache.get(channel);
    if (cached && (Date.now() - cached.time < 120000)) {
      return cached.title;
    }

    try {
      const res = await fetch(`https://kick.com/api/v2/channels/${channel}`);
      const data = await res.json();
      const title = data?.livestream?.session_title || "";
      if (title) {
        kickTitleCache.set(channel, { title, time: Date.now() });
      }
      return title;
    } catch (_) {
      return "";
    }
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
    let rect = (inCard || targetLink).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0) || (rect.top === 0 && rect.bottom === 0 && rect.left === 0 && rect.right === 0)) {
      if (targetLink.firstElementChild) {
        const fRect = targetLink.firstElementChild.getBoundingClientRect();
        if (fRect.width > 0 && fRect.height > 0) {
          rect = fRect;
        }
      }
    }
    if (!rect || (rect.width === 0 && rect.height === 0) || (rect.top === 0 && rect.bottom === 0 && rect.left === 0 && rect.right === 0)) {
      rect = {
        left: event.clientX - 16,
        right: event.clientX + 16,
        top: event.clientY - 16,
        bottom: event.clientY + 16,
        width: 32,
        height: 32
      };
    }

    // Extract stream title if available on Kick card or sidebar
    let streamTitle = "";
    if (inCard) {
      // 1. Kick exact livestream title attribute: data-testid="livestream-title"
      const liveTitleEl = inCard.querySelector('[data-testid="livestream-title"]');
      if (liveTitleEl) {
        streamTitle = (liveTitleEl.getAttribute("title") || liveTitleEl.textContent || "").trim();
      }

      // 2. Fallbacks for directory cards
      if (!streamTitle) {
        const titleEl = inCard.querySelector(
          "span[title]:not([class*='viewer']):not([class*='badge']), a[title]:not([href*='/video']):not([href*='/category']):not([href*='/profile']), h3, h4"
        );
        if (titleEl) {
          const candidate = (titleEl.getAttribute("title") || titleEl.textContent || "").trim();
          if (candidate && !/^\d+([,\.]\d+)?[kK]?(\s*viewers?)?$/i.test(candidate)) {
            streamTitle = candidate;
          }
        }
      }
    }

    if (!streamTitle) {
      const linkTitle = (targetLink.getAttribute("title") || targetLink.getAttribute("aria-label") || "").trim();
      if (linkTitle && !/^\d+([,\.]\d+)?[kK]?(\s*viewers?)?$/i.test(linkTitle)) {
        streamTitle = linkTitle;
      }
    }

    // Clean up: filter out numeric viewer counts or channel name duplicates
    if (streamTitle) {
      if (/^\d+([,\.]\d+)?[kK]?(\s*viewers?)?$/i.test(streamTitle)) {
        streamTitle = "";
      } else {
        const normTitle = streamTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normChannel = channel.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normTitle === normChannel) {
          streamTitle = "";
        }
      }
    }

    window.StreamPreviewCore.requestPreview("kick", channel, rect, streamTitle);

    // Fetch real live broadcast title via Kick public channel API
    fetchKickStreamTitle(channel).then((liveTitle) => {
      if (liveTitle && liveTitle !== streamTitle) {
        window.StreamPreviewCore.updateStreamTitle("kick", channel, liveTitle);
      }
    }).catch(() => {});
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
