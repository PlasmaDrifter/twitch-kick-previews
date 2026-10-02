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

  let videoElement = null;
  let isApplyingAudio = false;

  function dismissContentGate() {
    const gateButton = document.querySelector(".content-overlay-gate__allow-pointers button");
    if (gateButton) {
      try { gateButton.click(); } catch (_) {}
    }
  }

  function syncNativePlayerControls(muted) {
    // Twitch player mute/unmute button in player controls
    const twitchMuteBtn = document.querySelector('button[data-a-target="player-mute-unmute-button"]');
    if (twitchMuteBtn) {
      const label = (twitchMuteBtn.getAttribute("aria-label") || "").toLowerCase();
      const isCurrentlyTwitchMuted = label.includes("unmute");
      // If Twitch player state doesn't match our desired state, click it to update React store
      if (!muted && isCurrentlyTwitchMuted) {
        try { twitchMuteBtn.click(); } catch (_) {}
      } else if (muted && !isCurrentlyTwitchMuted && label.includes("mute")) {
        try { twitchMuteBtn.click(); } catch (_) {}
      }
    }

    // Kick player mute/unmute button in player controls (if rendered)
    const kickMuteBtn = document.querySelector('button[aria-label*="mute" i], button[title*="mute" i]');
    if (kickMuteBtn) {
      const label = (kickMuteBtn.getAttribute("aria-label") || kickMuteBtn.getAttribute("title") || "").toLowerCase();
      const isCurrentlyMuted = label.includes("unmute");
      if (!muted && isCurrentlyMuted) {
        try { kickMuteBtn.click(); } catch (_) {}
      } else if (muted && !isCurrentlyMuted) {
        try { kickMuteBtn.click(); } catch (_) {}
      }
    }

    // Keep Twitch localStorage in sync
    if (window.location.hostname.includes("twitch.tv")) {
      try {
        localStorage.setItem("video-muted", JSON.stringify({ default: !!muted }));
        localStorage.setItem("volume", String(currentVolume));
      } catch (_) {}
    }
  }

  function applyAudioState(video) {
    if (!video) return;

    isApplyingAudio = true;
    try {
      video.muted = currentMuted;
      video.volume = currentVolume;
      if (!currentMuted) {
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    } catch (_) {}
    setTimeout(() => { isApplyingAudio = false; }, 60);

    dismissContentGate();
    syncNativePlayerControls(currentMuted);
  }

  function attachVideoListeners(video) {
    if (!video || video._spAttached) return;
    video._spAttached = true;

    // Guard against host page / React store resetting video.muted to true
    video.addEventListener("volumechange", () => {
      if (isApplyingAudio) return;
      if (!currentMuted && video.muted) {
        applyAudioState(video);
      }
    });

    // Guard against pause on unmute caused by browser autoplay policies
    video.addEventListener("pause", () => {
      if (isApplyingAudio) return;
      if (!currentMuted && video.paused) {
        video.play().catch(() => {});
      }
    });
  }

  function notifyParentReady() {
    try {
      window.parent.postMessage({
        type: "PREVIEW_FRAME_READY",
        muted: currentMuted,
        volume: currentVolume
      }, "*");
    } catch (_) {}
  }

  // Observe DOM for the video element once without repeatedly resetting on every subtree change
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    if (video && video !== videoElement) {
      videoElement = video;
      attachVideoListeners(video);
      applyAudioState(video);
      notifyParentReady();
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
    notifyParentReady();
  }

  // Listen for audio control messages from preview-core parent window
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "PREVIEW_AUDIO_TOGGLE") {
      currentMuted = !!data.muted;
      if (typeof data.volume === "number") {
        currentVolume = Math.max(0, Math.min(1, data.volume));
      }

      const video = videoElement || document.querySelector("video");
      if (video) {
        applyAudioState(video);
      }

      // Notify parent of updated audio state
      try {
        window.parent.postMessage({
          type: "PREVIEW_AUDIO_STATE",
          muted: currentMuted,
          volume: currentVolume
        }, "*");
      } catch (_) {}
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
