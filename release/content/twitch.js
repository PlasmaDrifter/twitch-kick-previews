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
      if (parsed.hostname !== "twitch.tv" && !parsed.hostname.endsWith(".twitch.tv")) return null;
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

  // Cache stream titles for 2 minutes to minimize requests
  const titleCache = new Map();

  async function fetchTwitchStreamTitle(channel) {
    const cached = titleCache.get(channel);
    if (cached && (Date.now() - cached.time < 120000)) {
      return cached.title;
    }

    try {
      const res = await fetch("https://gql.twitch.tv/gql", {
        method: "POST",
        headers: { "Client-Id": "kimne78kx3ncx6brgo4mv6wki5h1ko" },
        body: JSON.stringify({
          query: `query { user(login: "${channel}") { stream { title } } }`
        })
      });
      const data = await res.json();
      const title = data?.data?.user?.stream?.title || "";
      if (title) {
        titleCache.set(channel, { title, time: Date.now() });
      }
      return title;
    } catch (_) {
      return "";
    }
  }

  let activeTarget = null;

  document.addEventListener("mouseover", (event) => {
    const targetLink = event.target.closest(CARD_SELECTORS);
    if (!targetLink) return;

    if (isSidebarOffline(targetLink)) return;

    const channel = extractChannelFromUrl(targetLink.href);
    if (!channel) return;

    activeTarget = targetLink;

    // Resolve card or sidebar container
    const sideCard = targetLink.closest('[data-test-selector="followed-channel"], .side-nav-card, [data-a-target="side-nav-card"]');
    let cardContainer = null;
    if (!sideCard) {
      cardContainer = targetLink.closest('article, [data-target="directory-card"], [data-a-target="preview-card"], .tw-tower > div, [data-target="directory-page__card-container"]');
      if (!cardContainer) {
        let cur = targetLink.parentElement;
        for (let i = 0; i < 10 && cur; i++) {
          if (cur.querySelector('[data-a-target="stream-title"], [data-a-target="preview-card-title-link"], h3')) {
            cardContainer = cur;
            break;
          }
          cur = cur.parentElement;
        }
      }
    }

    // Measure non-zero bounding rect
    let rect = null;
    const containerEl = sideCard || cardContainer;
    if (containerEl) {
      const cRect = containerEl.getBoundingClientRect();
      if (cRect.width > 0 && cRect.height > 0) {
        rect = cRect;
      }
    }

    if (!rect) {
      const lRect = targetLink.getBoundingClientRect();
      if (lRect.width > 0 && lRect.height > 0) {
        rect = lRect;
      } else if (targetLink.firstElementChild) {
        const fRect = targetLink.firstElementChild.getBoundingClientRect();
        if (fRect.width > 0 && fRect.height > 0) {
          rect = fRect;
        }
      }
    }

    // Ultimate fallback if DOM element has zero dimensions (e.g. display: contents)
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

    // Extract stream title or category
    let streamTitle = "";

    // 1. Sidebar followed channels
    if (sideCard) {
      const lines = (sideCard.innerText || sideCard.textContent || "")
        .split("\n")
        .map(s => s.trim())
        .filter(s => s && !/^(live|\d+(\.\d+)?[kK]?(\s*viewers)?|hype\s+train.*|use\s+the\s+right\s+arrow.*)$/i.test(s));

      const foundLine = lines.find(s => s.toLowerCase() !== channel.toLowerCase());
      if (foundLine) {
        streamTitle = foundLine;
      }
    }

    // 2. Main browse cards / directory cards
    if (!streamTitle) {
      const targetTitle = (targetLink.getAttribute("title") || targetLink.getAttribute("aria-label") || "").trim();
      if (targetTitle && targetTitle.toLowerCase() !== channel.toLowerCase()) {
        streamTitle = targetTitle;
      }
    }

    if (!streamTitle && cardContainer) {
      const titleElem = cardContainer.querySelector('[data-a-target="stream-title"]');
      if (titleElem) {
        streamTitle = (titleElem.getAttribute("title") || titleElem.textContent || "").trim();
      }

      if (!streamTitle) {
        const titleLink = cardContainer.querySelector('a[data-a-target="preview-card-title-link"], h3');
        if (titleLink) {
          streamTitle = (titleLink.getAttribute("title") || titleLink.textContent || "").trim();
        }
      }
    }

    // Clean up: If streamTitle is identical to channel name, discard it
    if (streamTitle) {
      const normTitle = streamTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normChannel = channel.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normTitle === normChannel) {
        streamTitle = "";
      }
    }

    window.StreamPreviewCore.requestPreview("twitch", channel, rect, streamTitle);

    // Fetch real live broadcast title via Twitch public GQL
    fetchTwitchStreamTitle(channel).then((liveTitle) => {
      if (liveTitle && liveTitle !== streamTitle) {
        window.StreamPreviewCore.updateStreamTitle("twitch", channel, liveTitle);
      }
    }).catch(() => {});
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
