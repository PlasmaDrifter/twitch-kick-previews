(() => {
  // Only activate if running inside an iframe preview
  const isIframe = window.self !== window.top;
  if (!isIframe) return;

  const urlParams = new URLSearchParams(window.location.search);
  let currentMuted = urlParams.get("muted") !== "false";
  let currentVolume = parseFloat(urlParams.get("volume") || "0.8");
  if (isNaN(currentVolume) || currentVolume < 0 || currentVolume > 1) {
    currentVolume = 0.8;
  }

  // Quality settings from URL query params
  // qualityMode: "fast" (default: 480p hover, source on pin), "dynamic" (480p -> source after 3.5s), "auto" (platform default)
  const rawMode = urlParams.get("qualityMode") || "fast";
  let qualityMode = (rawMode === "dynamic" || rawMode === "auto") ? rawMode : "fast";
  let isPinned = urlParams.get("pinned") === "true";

  function sanitizeQuality(val) {
    if (!val || typeof val !== "string") return "480p";
    const cleaned = val.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleaned === "chunked" || cleaned === "source" || cleaned === "auto") return cleaned;
    const match = cleaned.match(/^(\d{3,4})p?$/);
    if (match) return `${match[1]}p`;
    return "480p";
  }

  let targetQuality = sanitizeQuality(urlParams.get("quality") || (isPinned ? "chunked" : "480p"));

  let videoElement = null;
  let gateDismissed = false;
  let dynamicBumpTimer = null;

  // Inject in-page controller to bypass Firefox Xray content script isolation for React fibers
  function injectPageQualityController() {
    try {
      const script = document.createElement("script");
      script.dataset.quality = targetQuality;
      script.textContent = `
        (() => {
          let lastAppliedQuality = null;
          let pendingQuality = (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.quality) || null;

          function getPlayerInstance() {
            try {
              const candidates = document.querySelectorAll("video, div, section, main");
              for (const el of candidates) {
                for (const key in el) {
                  if (key.startsWith("__reactFiber$") || key.startsWith("__reactProps$") || key.startsWith("__reactInternalInstance$")) {
                    let fiber = el[key];
                    while (fiber) {
                      const props = fiber.pendingProps || fiber.memoizedProps;
                      if (props) {
                        if (props.mediaPlayerInstance && typeof props.mediaPlayerInstance.setQuality === "function") {
                          return props.mediaPlayerInstance;
                        }
                        if (props.player && typeof props.player.setQuality === "function") {
                          return props.player;
                        }
                      }
                      fiber = fiber.return;
                    }
                  }
                }
              }
            } catch (_) {}
            return null;
          }

          function parseResolution(label) {
            if (!label) return 0;
            const s = String(label).toLowerCase();
            if (s === "chunked" || s.includes("source")) return 9999;
            const match = s.match(/(\\d+)p?/);
            return match ? parseInt(match[1], 10) : 0;
          }

          function applyStreamQuality(targetQ) {
            if (!targetQ || targetQ === "auto") return true;
            if (lastAppliedQuality === targetQ) return true;
            try {
              const player = getPlayerInstance();
              if (!player) return false;

              const qualities = player.getQualities ? player.getQualities() : [];
              if (!qualities || !qualities.length) return false;

              let currentQ = null;
              try {
                if (typeof player.getQuality === "function") {
                  currentQ = player.getQuality();
                }
              } catch (_) {}

              const targetRes = parseResolution(targetQ);
              let bestQuality = null;

              if (targetRes >= 9999) {
                bestQuality = qualities.find(q => {
                  const group = (q.group || q.name || "").toLowerCase();
                  return group === "chunked" || group.includes("source");
                }) || qualities[0];
              } else {
                let closest = null;
                let minDiff = Infinity;
                for (const q of qualities) {
                  const res = parseResolution(q.group || q.name);
                  if (res > 0) {
                    const diff = Math.abs(res - targetRes);
                    if (diff < minDiff) {
                      minDiff = diff;
                      closest = q;
                    }
                  }
                }
                bestQuality = closest || qualities[qualities.length - 1];
              }

              if (bestQuality) {
                if (typeof player.setAutoQualityMode === "function") {
                  player.setAutoQualityMode(false);
                }

                const isAuto = typeof player.isAutoQualityMode === "function" ? player.isAutoQualityMode() : false;
                if (!isAuto && currentQ && (currentQ === bestQuality || (currentQ.group && bestQuality.group && currentQ.group === bestQuality.group))) {
                  lastAppliedQuality = targetQ;
                  const qName = bestQuality.group || bestQuality.name || (targetRes >= 9999 ? "Source" : targetQ);
                  window.postMessage({ type: "SP_PAGE_QUALITY_SET", quality: qName }, "*");
                  return true;
                }

                player.setQuality(bestQuality);
                lastAppliedQuality = targetQ;
                const qName = bestQuality.group || bestQuality.name || (targetRes >= 9999 ? "Source" : targetQ);
                window.postMessage({ type: "SP_PAGE_QUALITY_SET", quality: qName }, "*");
                return true;
              }
            } catch (_) {}
            return false;
          }

          let retryTimer = null;
          let retryCount = 0;

          function scheduleQualityRetry(targetQ) {
            if (retryTimer) clearTimeout(retryTimer);
            retryCount = 0;
            const attempt = () => {
              retryCount++;
              if (applyStreamQuality(targetQ) || retryCount >= 5) {
                retryTimer = null;
                return;
              }
              retryTimer = setTimeout(attempt, 400);
            };
            retryTimer = setTimeout(attempt, 400);
          }

          window.addEventListener("message", (e) => {
            if (!e.data || typeof e.data !== "object") return;
            if (e.data.type === "SP_PAGE_SET_QUALITY") {
              const q = typeof e.data.targetQuality === "string" ? e.data.targetQuality : null;
              if (q) {
                pendingQuality = q;
                if (!applyStreamQuality(q)) {
                  scheduleQualityRetry(q);
                }
              }
            }
          });

          // Early lock to target quality before Twitch ABR attempts 720p/1080p upgrade
          let earlyCheckCount = 0;
          const earlyCheckInterval = setInterval(() => {
            earlyCheckCount++;
            const currentTarget = pendingQuality;
            if (currentTarget && currentTarget !== "auto") {
              if (applyStreamQuality(currentTarget)) {
                clearInterval(earlyCheckInterval);
                return;
              }
            }
            if (earlyCheckCount >= 30) {
              clearInterval(earlyCheckInterval);
            }
          }, 100);
        })();
      `;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    } catch (_) {}
  }

  injectPageQualityController();

  function dispatchPageQuality(q) {
    const safeQ = sanitizeQuality(q);
    if (!safeQ || safeQ === "auto") return;
    try {
      window.postMessage({
        type: "SP_PAGE_SET_QUALITY",
        targetQuality: safeQ
      }, "*");
    } catch (_) {}
  }

  let playbackStartTime = performance.now();
  let firstFrameReported = false;

  function reportVideoResolution(video) {
    if (!video || !video.videoHeight) return;
    const h = video.videoHeight;
    const w = video.videoWidth;
    let label = `${h}p`;
    if (h >= 1080) label = "1080p";
    else if (h >= 720) label = "720p";
    else if (h >= 480) label = "480p";
    else if (h >= 360) label = "360p";

    console.log(`[Stream Previews] Decoded video resolution: ${w}x${h} (${label})`);
    try {
      window.parent.postMessage({
        type: "PREVIEW_RESOLUTION_UPDATE",
        videoWidth: w,
        videoHeight: h,
        label: label
      }, "*");
    } catch (_) {}

    if (!firstFrameReported && video.currentTime > 0) {
      firstFrameReported = true;
      const loadTimeMs = Math.round(performance.now() - playbackStartTime);
      const loadTimeSec = (loadTimeMs / 1000).toFixed(2);
      console.log(`[Stream Previews] Time to first frame: ${loadTimeMs}ms (${loadTimeSec}s) at ${label}`);
      try {
        window.parent.postMessage({
          type: "PREVIEW_FIRST_FRAME",
          loadTimeMs: loadTimeMs,
          loadTimeSec: loadTimeSec,
          label: label
        }, "*");
      } catch (_) {}
    }
  }

  let qualityConfigured = false;

  function attachVideoListeners(video) {
    if (!video) return;
    video.addEventListener("resize", () => reportVideoResolution(video));
    video.addEventListener("loadedmetadata", () => reportVideoResolution(video));
    video.addEventListener("timeupdate", () => {
      reportVideoResolution(video);
      if (!qualityConfigured && video.currentTime > 0.05) {
        attemptQualityConfiguration();
      }
    });
    video.addEventListener("playing", () => {
      reportVideoResolution(video);
      if (!qualityConfigured) {
        attemptQualityConfiguration();
      }
      if (qualityMode === "dynamic" && !isPinned && !dynamicBumpTimer) {
        dynamicBumpTimer = setTimeout(() => {
          targetQuality = "chunked";
          dispatchPageQuality("chunked");
        }, 3500);
      }
      setTimeout(() => reportVideoResolution(video), 800);
      setTimeout(() => reportVideoResolution(video), 2000);
      setTimeout(() => reportVideoResolution(video), 4500);
    });
  }

  function attemptQualityConfiguration() {
    if (qualityMode === "auto" || qualityConfigured) return;
    qualityConfigured = true;
    dispatchPageQuality(targetQuality);
  }

  function dismissContentGate() {
    if (gateDismissed) return;
    const gateButton = document.querySelector(".content-overlay-gate__allow-pointers button");
    if (gateButton) {
      gateDismissed = true;
      try { gateButton.click(); } catch (_) {}
    }
  }

  function applyAudioState(video) {
    if (!video) return;

    try {
      video.muted = currentMuted;
      video.volume = currentVolume;
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        }
      }
    } catch (_) {}

    dismissContentGate();
  }

  // Observe DOM for the video element once
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    if (video && video !== videoElement) {
      videoElement = video;
      attachVideoListeners(video);
      applyAudioState(video);
      try {
        window.parent.postMessage({
          type: "PREVIEW_FRAME_READY",
          muted: currentMuted,
          volume: currentVolume
        }, "*");
      } catch (_) {}
    }
    dismissContentGate();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Check immediately if video is already present
  const existingVideo = document.querySelector("video");
  if (existingVideo) {
    videoElement = existingVideo;
    attachVideoListeners(existingVideo);
    applyAudioState(existingVideo);
    if (!existingVideo.paused && existingVideo.currentTime > 0.05) {
      attemptQualityConfiguration();
    }
    try {
      window.parent.postMessage({
        type: "PREVIEW_FRAME_READY",
        muted: currentMuted,
        volume: currentVolume
      }, "*");
    } catch (_) {}
  }

  // Periodic check only for video resolution updates
  let resPollCount = 0;
  const resInterval = setInterval(() => {
    resPollCount++;
    if (videoElement && videoElement.videoHeight) {
      reportVideoResolution(videoElement);
    }
    if (resPollCount >= 10) {
      clearInterval(resInterval);
    }
  }, 1000);

  // Listen for messages from preview-core parent window and injected script
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "SP_PAGE_QUALITY_SET") {
      console.log(`[Stream Previews] Stream quality applied by player: ${data.quality}`);
      try {
        window.parent.postMessage({
          type: "PREVIEW_QUALITY_CONFIRMED",
          quality: data.quality
        }, "*");
      } catch (_) {}
    } else if (data.type === "PREVIEW_AUDIO_TOGGLE") {
      currentMuted = !!data.muted;
      if (typeof data.volume === "number") {
        currentVolume = Math.max(0, Math.min(1, data.volume));
      }

      const video = videoElement || document.querySelector("video");
      if (video) {
        applyAudioState(video);
      }
    } else if (data.type === "PREVIEW_SET_QUALITY") {
      if (data.qualityMode && (data.qualityMode === "dynamic" || data.qualityMode === "auto" || data.qualityMode === "fast")) {
        qualityMode = data.qualityMode;
      }
      if (data.quality) {
        targetQuality = sanitizeQuality(data.quality);
        qualityConfigured = false;
        dispatchPageQuality(targetQuality);
      }
    } else if (data.type === "PREVIEW_TRIGGER_PIP") {
      const video = videoElement || document.querySelector("video");
      if (video) {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture().catch(() => {});
        } else if (document.pictureInPictureEnabled && typeof video.requestPictureInPicture === "function") {
          video.requestPictureInPicture().catch(() => {});
        }
      }
    }
  });
})();
