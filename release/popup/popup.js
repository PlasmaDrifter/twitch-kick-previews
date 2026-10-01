document.addEventListener("DOMContentLoaded", async () => {
  const storageApi = typeof browser !== "undefined" ? browser.storage : chrome.storage;

  // Refresh toolbar icon in case Firefox cached previous icon in chrome UI
  try {
    const actionApi = (typeof browser !== "undefined" && browser.action) ? browser.action : (typeof chrome !== "undefined" ? chrome.action : null);
    if (actionApi && actionApi.setIcon) {
      actionApi.setIcon({
        path: {
          "16": "../icons/icon-16.png",
          "32": "../icons/icon-32.png",
          "48": "../icons/icon-48.png"
        }
      }).catch(() => {});
    }
  } catch (_) {}

  const elements = {
    sizeDisplay: document.getElementById("sizeDisplay"),
    sizeSlider: document.getElementById("sizeSlider"),
    presetBtns: document.querySelectorAll(".preset-btn"),
    defaultMuted: document.getElementById("defaultMuted"),
    volumeSlider: document.getElementById("volumeSlider"),
    volumeDisplay: document.getElementById("volumeDisplay"),
    delaySlider: document.getElementById("delaySlider"),
    delayDisplay: document.getElementById("delayDisplay"),
    enabledTwitch: document.getElementById("enabledTwitch"),
    enabledKick: document.getElementById("enabledKick"),
    tiledBorderEnabled: document.getElementById("tiledBorderEnabled"),
    tiledBorderOptions: document.getElementById("tiledBorderOptions"),
    tiledBorderCustomColor: document.getElementById("tiledBorderCustomColor"),
    customColorIndicator: document.getElementById("customColorIndicator"),
    swatchBtns: document.querySelectorAll(".color-options-row .swatch-btn")
  };

  const DEFAULTS = {
    previewWidth: 480,
    defaultMuted: true,
    defaultVolume: 0.8,
    hoverDelayMs: 300,
    enabledTwitch: true,
    enabledKick: true,
    tiledBorderEnabled: true,
    tiledBorderMode: "distinct",
    tiledBorderCustomColor: "#9146ff"
  };

  let config = { ...DEFAULTS };

  try {
    const stored = await storageApi.local.get(null);
    if (stored) {
      config = { ...config, ...stored };
    }
  } catch (_) {}

  function updateSizeUI(width) {
    const clampedW = parseInt(width, 10);
    const height = Math.round(clampedW * 9 / 16);
    elements.sizeDisplay.textContent = `${clampedW} × ${height} px`;
    elements.sizeSlider.value = clampedW;

    elements.presetBtns.forEach((btn) => {
      const btnW = parseInt(btn.dataset.width, 10);
      btn.classList.toggle("active", Math.abs(btnW - clampedW) < 20);
    });
  }

  function updateVolumeUI(volume) {
    const pct = Math.round(volume * 100);
    elements.volumeDisplay.textContent = `${pct}%`;
    elements.volumeSlider.value = pct;
  }

  function updateDelayUI(delay) {
    elements.delayDisplay.textContent = `${delay} ms`;
    elements.delaySlider.value = delay;
  }

  function updateBorderUI(enabled, mode, customColor) {
    if (elements.tiledBorderEnabled) {
      elements.tiledBorderEnabled.checked = enabled !== false;
    }
    if (elements.tiledBorderOptions) {
      elements.tiledBorderOptions.classList.toggle("disabled", enabled === false);
    }

    if (customColor && elements.tiledBorderCustomColor) {
      elements.tiledBorderCustomColor.value = customColor;
      if (elements.customColorIndicator) {
        elements.customColorIndicator.style.backgroundColor = customColor;
      }
    }

    if (elements.swatchBtns) {
      elements.swatchBtns.forEach((btn) => {
        const btnMode = btn.dataset.mode || (btn.classList.contains("swatch-custom-wrapper") ? "custom" : "");
        btn.classList.toggle("active", btnMode === mode);
      });
    }
  }

  // Initial populate
  updateSizeUI(config.previewWidth);
  updateVolumeUI(config.defaultVolume);
  updateDelayUI(config.hoverDelayMs);
  updateBorderUI(config.tiledBorderEnabled, config.tiledBorderMode, config.tiledBorderCustomColor);
  elements.defaultMuted.checked = config.defaultMuted;
  elements.enabledTwitch.checked = config.enabledTwitch;
  elements.enabledKick.checked = config.enabledKick;

  function saveConfig(updated) {
    config = { ...config, ...updated };
    try {
      storageApi.local.set(updated);
    } catch (_) {}
  }

  // Dual+ Border controls
  if (elements.tiledBorderEnabled) {
    elements.tiledBorderEnabled.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      updateBorderUI(enabled, config.tiledBorderMode, config.tiledBorderCustomColor);
      saveConfig({ tiledBorderEnabled: enabled });
    });
  }

  if (elements.swatchBtns) {
    elements.swatchBtns.forEach((btn) => {
      if (btn.classList.contains("swatch-custom-wrapper")) return;
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        updateBorderUI(config.tiledBorderEnabled, mode, config.tiledBorderCustomColor);
        saveConfig({ tiledBorderMode: mode });
      });
    });
  }

  if (elements.tiledBorderCustomColor) {
    elements.tiledBorderCustomColor.addEventListener("input", (e) => {
      const color = e.target.value;
      updateBorderUI(config.tiledBorderEnabled, "custom", color);
      saveConfig({ tiledBorderMode: "custom", tiledBorderCustomColor: color });
    });
  }

  // Preset buttons
  elements.presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const w = parseInt(btn.dataset.width, 10);
      updateSizeUI(w);
      saveConfig({ previewWidth: w });
    });
  });

  // Size slider
  elements.sizeSlider.addEventListener("input", (e) => {
    const w = parseInt(e.target.value, 10);
    updateSizeUI(w);
    saveConfig({ previewWidth: w });
  });

  // Muted toggle
  elements.defaultMuted.addEventListener("change", (e) => {
    saveConfig({ defaultMuted: e.target.checked });
  });

  // Volume slider
  elements.volumeSlider.addEventListener("input", (e) => {
    const vol = parseInt(e.target.value, 10) / 100;
    elements.volumeDisplay.textContent = `${Math.round(vol * 100)}%`;
    saveConfig({ defaultVolume: vol });
  });

  // Delay slider
  elements.delaySlider.addEventListener("input", (e) => {
    const delay = parseInt(e.target.value, 10);
    elements.delayDisplay.textContent = `${delay} ms`;
    saveConfig({ hoverDelayMs: delay });
  });

  // Platforms
  elements.enabledTwitch.addEventListener("change", (e) => {
    saveConfig({ enabledTwitch: e.target.checked });
  });

  elements.enabledKick.addEventListener("change", (e) => {
    saveConfig({ enabledKick: e.target.checked });
  });
});
