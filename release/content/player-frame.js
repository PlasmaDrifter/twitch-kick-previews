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
  let gateDismissed = false;

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
      if (!currentMuted && video.paused) {
        video.play().catch(() => {});
      }
    } catch (_) {}

    dismissContentGate();
  }

  // Observe DOM for the video element once
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    if (video && video !== videoElement) {
      videoElement = video;
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
    applyAudioState(existingVideo);
    try {
      window.parent.postMessage({
        type: "PREVIEW_FRAME_READY",
        muted: currentMuted,
        volume: currentVolume
      }, "*");
    } catch (_) {}
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
