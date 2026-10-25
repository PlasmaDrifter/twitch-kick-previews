document.addEventListener("DOMContentLoaded", async () => {
  const storageApi = (typeof browser !== "undefined" && browser.storage) ? browser.storage : (typeof chrome !== "undefined" && chrome.storage ? chrome.storage : null);

  // Refresh toolbar icon in case Firefox cached previous icon in chrome UI
  try {
    const actionApi = (typeof browser !== "undefined" && (browser.browserAction || browser.action))
      ? (browser.browserAction || browser.action)
      : (typeof chrome !== "undefined" ? (chrome.browserAction || chrome.action) : null);
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
  // Populate version badge dynamically from manifest
  try {
    const runtimeApi = (typeof browser !== "undefined" && browser.runtime) ? browser.runtime : (typeof chrome !== "undefined" && chrome.runtime ? chrome.runtime : null);
    if (runtimeApi && runtimeApi.getManifest) {
      const manifest = runtimeApi.getManifest();
      const versionEl = document.querySelector(".version");
      if (versionEl && manifest.version) {
        versionEl.textContent = `v${manifest.version}`;
      }
    }
  } catch (_) {}

  const elements = {
    sizeDisplay: document.getElementById("sizeDisplay"),
    sizeSlider: document.getElementById("sizeSlider"),
    presetBtns: document.querySelectorAll(".preset-btn[data-width]"),
    defaultMuted: document.getElementById("defaultMuted"),
    volumeSlider: document.getElementById("volumeSlider"),
    volumeDisplay: document.getElementById("volumeDisplay"),
    delaySlider: document.getElementById("delaySlider"),
    delayDisplay: document.getElementById("delayDisplay"),
    qualityButtons: document.querySelectorAll(".quality-btn"),
    qualityModeDisplay: document.getElementById("qualityModeDisplay"),
    showStatsBadge: document.getElementById("showStatsBadge"),
    sidebarOnly: document.getElementById("sidebarOnly"),
    enabledTwitch: document.getElementById("enabledTwitch"),
    enabledKick: document.getElementById("enabledKick"),
    hoverBorderEnabled: document.getElementById("hoverBorderEnabled"),
    tiledBorderEnabled: document.getElementById("tiledBorderEnabled"),
    tiledBorderOptions: document.getElementById("tiledBorderOptions"),
    borderModeDisplay: document.getElementById("borderModeDisplay"),
    customColorBtn: document.getElementById("customColorBtn"),
    customColorIndicator: document.getElementById("customColorIndicator"),
    customColorPanel: document.getElementById("customColorPanel"),
    pickerPreviewDot: document.getElementById("pickerPreviewDot"),
    customHexInput: document.getElementById("customHexInput"),
    customShadeSlider: document.getElementById("customShadeSlider"),
    colorChips: document.querySelectorAll(".color-chip"),
    swatchBtns: document.querySelectorAll(".color-options-row .swatch-btn")
  };

  const MODE_LABELS = {
    distinct: "Distinct",
    purple: "Twitch Purple",
    green: "Kick Green",
    cyan: "Electric Cyan",
    orange: "Neon Orange",
    custom: "Custom Color"
  };

  function computeShade(baseHex, val) {
    let hex = (baseHex || "#9146ff").replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const num = parseInt(hex, 16);
    if (isNaN(num)) return "#9146FF";
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;

    let outR, outG, outB;
    if (val <= 50) {
      // 0 = black (#000000), 50 = base color
      const factor = val / 50;
      outR = Math.round(r * factor);
      outG = Math.round(g * factor);
      outB = Math.round(b * factor);
    } else {
      // 50 = base color, 100 = white (#ffffff)
      const factor = (val - 50) / 50;
      outR = Math.round(r + (255 - r) * factor);
      outG = Math.round(g + (255 - g) * factor);
      outB = Math.round(b + (255 - b) * factor);
    }

    const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return `#${toHex(outR)}${toHex(outG)}${toHex(outB)}`.toUpperCase();
  }

  const DEFAULTS = {
    previewWidth: 480,
    defaultMuted: true,
    defaultVolume: 0.8,
    hoverDelayMs: 300,
    previewQualityMode: "fast",
    showStatsBadge: true,
    sidebarOnly: true,
    enabledTwitch: true,
    enabledKick: true,
    hoverBorderEnabled: true,
    tiledBorderEnabled: true,
    tiledBorderMode: "distinct",
    tiledBorderCustomColor: "#9146ff",
    tiledBorderBaseColor: "#9146ff",
    tiledBorderShade: 50,
    lastActiveTab: "general"
  };

  let config = { ...DEFAULTS };

  if (storageApi && storageApi.local) {
    try {
      const stored = await storageApi.local.get(null);
      if (stored) {
        config = { ...config, ...stored };
      }
    } catch (_) {}
  }

  // Segmented Tab Navigation
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  function switchTab(targetTab) {
    if (!targetTab) return;
    const targetPane = document.getElementById(`tab-${targetTab}`);
    if (!targetPane) return;
    tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === targetTab);
    });
    tabPanes.forEach((pane) => {
      pane.classList.toggle("active", pane.id === `tab-${targetTab}`);
    });
    saveConfig({ lastActiveTab: targetTab });
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });

  if (config.lastActiveTab) {
    switchTab(config.lastActiveTab);
  }

  // Validate previewWidth from storage
  const initialWidth = parseInt(config.previewWidth, 10);
  if (isNaN(initialWidth) || initialWidth < 280) {
    config.previewWidth = 480;
    if (storageApi && storageApi.local) {
      storageApi.local.set({ previewWidth: 480 }).catch(() => {});
    }
  } else {
    config.previewWidth = initialWidth;
  }

  function updateSizeUI(width) {
    const clampedW = parseInt(width, 10);
    if (isNaN(clampedW)) return;
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

  function updateBorderUI(enabled, mode, customColor, baseColor, shadeVal) {
    const hoverOn = config.hoverBorderEnabled !== false;
    const tiledOn = config.tiledBorderEnabled !== false;
    const anyEnabled = enabled !== undefined ? enabled : (hoverOn || tiledOn);

    if (elements.hoverBorderEnabled) {
      elements.hoverBorderEnabled.checked = hoverOn;
    }
    if (elements.tiledBorderEnabled) {
      elements.tiledBorderEnabled.checked = tiledOn;
    }
    if (elements.tiledBorderOptions) {
      elements.tiledBorderOptions.classList.toggle("disabled", !anyEnabled);
    }

    const effectiveCustom = customColor || config.tiledBorderCustomColor || "#9146ff";
    const effectiveBase = baseColor || config.tiledBorderBaseColor || effectiveCustom;
    const effectiveShade = shadeVal !== undefined ? shadeVal : (config.tiledBorderShade !== undefined ? config.tiledBorderShade : 50);

    if (elements.customColorIndicator) {
      elements.customColorIndicator.style.setProperty("background-color", effectiveCustom, "important");
    }

    const isCustomMode = mode === "custom";

    if (elements.customColorPanel) {
      elements.customColorPanel.classList.toggle("hidden", !isCustomMode || !anyEnabled);
    }

    if (elements.pickerPreviewDot) {
      elements.pickerPreviewDot.style.backgroundColor = effectiveCustom;
    }
    if (elements.customHexInput && document.activeElement !== elements.customHexInput) {
      elements.customHexInput.value = effectiveCustom.replace(/^#/, "").toUpperCase();
    }
    if (elements.customShadeSlider) {
      if (document.activeElement !== elements.customShadeSlider) {
        elements.customShadeSlider.value = effectiveShade;
      }
      elements.customShadeSlider.style.background = `linear-gradient(to right, #000000 0%, ${effectiveBase} 50%, #ffffff 100%)`;
    }

    if (elements.colorChips) {
      const cleanBase = effectiveBase.toLowerCase();
      elements.colorChips.forEach((chip) => {
        const chipColor = (chip.dataset.color || "").toLowerCase();
        chip.classList.toggle("active", chipColor === cleanBase);
      });
    }

    if (elements.borderModeDisplay) {
      if (isCustomMode) {
        elements.borderModeDisplay.textContent = `Custom (${effectiveCustom.toUpperCase()})`;
      } else {
        elements.borderModeDisplay.textContent = MODE_LABELS[mode] || "Distinct";
      }
    }

    if (elements.swatchBtns) {
      elements.swatchBtns.forEach((btn) => {
        const btnMode = btn.dataset.mode || (btn.id === "customColorBtn" ? "custom" : "");
        btn.classList.toggle("active", btnMode === mode);
      });
    }
  }

  const QUALITY_LABELS = {
    fast: "Lite (480p)",
    dynamic: "Dynamic",
    auto: "Auto"
  };

  function updateQualityUI(mode) {
    const effectiveMode = mode || "fast";
    if (elements.qualityModeDisplay) {
      elements.qualityModeDisplay.textContent = QUALITY_LABELS[effectiveMode] || "Lite (480p)";
    }
    if (elements.qualityButtons) {
      elements.qualityButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === effectiveMode);
      });
    }
  }

  // Initial populate
  updateSizeUI(config.previewWidth);
  updateQualityUI(config.previewQualityMode);
  updateVolumeUI(config.defaultVolume);
  updateDelayUI(config.hoverDelayMs);
  updateBorderUI(undefined, config.tiledBorderMode, config.tiledBorderCustomColor, config.tiledBorderBaseColor, config.tiledBorderShade);
  elements.defaultMuted.checked = config.defaultMuted;
  if (elements.showStatsBadge) {
    elements.showStatsBadge.checked = config.showStatsBadge !== false;
  }
  if (elements.sidebarOnly) {
    elements.sidebarOnly.checked = config.sidebarOnly !== false;
  }
  elements.enabledTwitch.checked = config.enabledTwitch;
  elements.enabledKick.checked = config.enabledKick;

  function saveConfig(updated) {
    if (updated.previewWidth !== undefined) {
      const parsed = parseInt(updated.previewWidth, 10);
      if (isNaN(parsed) || parsed < 280) return;
      updated.previewWidth = parsed;
    }
    config = { ...config, ...updated };
    if (storageApi && storageApi.local) {
      try {
        storageApi.local.set(updated);
      } catch (_) {}
    }
  }

  function applyCustomColor(hex, baseColor, shadeVal) {
    if (!hex) return;
    let cleanHex = hex.trim();
    if (!cleanHex.startsWith("#")) cleanHex = `#${cleanHex}`;
    cleanHex = cleanHex.toUpperCase();
    const effectiveBase = (baseColor || cleanHex).toUpperCase();
    const effectiveShade = shadeVal !== undefined ? shadeVal : 50;

    updateBorderUI(undefined, "custom", cleanHex, effectiveBase, effectiveShade);
    saveConfig({
      tiledBorderMode: "custom",
      tiledBorderCustomColor: cleanHex,
      tiledBorderBaseColor: effectiveBase,
      tiledBorderShade: effectiveShade
    });
  }

  // Border controls
  if (elements.hoverBorderEnabled) {
    elements.hoverBorderEnabled.addEventListener("change", (e) => {
      const hoverOn = e.target.checked;
      saveConfig({ hoverBorderEnabled: hoverOn });
      updateBorderUI(undefined, config.tiledBorderMode, config.tiledBorderCustomColor, config.tiledBorderBaseColor, config.tiledBorderShade);
    });
  }

  if (elements.tiledBorderEnabled) {
    elements.tiledBorderEnabled.addEventListener("change", (e) => {
      const tiledOn = e.target.checked;
      saveConfig({ tiledBorderEnabled: tiledOn });
      updateBorderUI(undefined, config.tiledBorderMode, config.tiledBorderCustomColor, config.tiledBorderBaseColor, config.tiledBorderShade);
    });
  }

  if (elements.swatchBtns) {
    elements.swatchBtns.forEach((btn) => {
      if (btn.id === "customColorBtn") return;
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        updateBorderUI(undefined, mode, config.tiledBorderCustomColor, config.tiledBorderBaseColor, config.tiledBorderShade);
        saveConfig({ tiledBorderMode: mode });
      });
    });
  }

  if (elements.customColorBtn) {
    elements.customColorBtn.addEventListener("click", () => {
      if (config.tiledBorderMode === "custom" && elements.customColorPanel) {
        // Toggle panel open/close if already in custom mode
        elements.customColorPanel.classList.toggle("hidden");
      } else {
        applyCustomColor(
          config.tiledBorderCustomColor || "#9146ff",
          config.tiledBorderBaseColor || config.tiledBorderCustomColor || "#9146ff",
          config.tiledBorderShade !== undefined ? config.tiledBorderShade : 50
        );
      }
      if (elements.customColorPanel && !elements.customColorPanel.classList.contains("hidden")) {
        elements.customColorPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  if (elements.customShadeSlider) {
    elements.customShadeSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      const base = config.tiledBorderBaseColor || config.tiledBorderCustomColor || "#9146ff";
      const shaded = computeShade(base, val);
      applyCustomColor(shaded, base, val);
    });
  }

  if (elements.customHexInput) {
    elements.customHexInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
      e.target.value = val.toUpperCase();
      if (val.length === 6 || val.length === 3) {
        const fullHex = `#${val}`;
        if (elements.customShadeSlider) {
          elements.customShadeSlider.value = 50;
        }
        applyCustomColor(fullHex, fullHex, 50);
      }
    });
  }

  if (elements.colorChips) {
    elements.colorChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const base = chip.dataset.color;
        if (elements.customShadeSlider) {
          elements.customShadeSlider.value = 50;
        }
        applyCustomColor(base, base, 50);
      });
    });
  }

  // Quality buttons
  if (elements.qualityButtons) {
    elements.qualityButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        updateQualityUI(mode);
        saveConfig({ previewQualityMode: mode });
      });
    });
  }

  // Quality & stats badge toggle
  if (elements.showStatsBadge) {
    elements.showStatsBadge.addEventListener("change", (e) => {
      saveConfig({ showStatsBadge: e.target.checked });
    });
  }

  // Sidebar only toggle
  if (elements.sidebarOnly) {
    elements.sidebarOnly.addEventListener("change", (e) => {
      saveConfig({ sidebarOnly: e.target.checked });
    });
  }

  // Preset buttons
  elements.presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const w = parseInt(btn.dataset.width, 10);
      if (isNaN(w) || w < 280) return;
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
