(() => {
  if (window.StreamPreviewCore) return;

  const storageApi = typeof browser !== "undefined" ? browser.storage : chrome.storage;

  const SIZE_PRESETS = [
    { label: "S", width: 360 },
    { label: "M", width: 480 },
    { label: "L", width: 640 },
    { label: "XL", width: 800 }
  ];

  const NON_CHANNEL_PATHS = new Set([
    "directory", "videos", "p", "downloads", "search", "settings",
    "subscriptions", "inventory", "drops", "messages", "friends",
    "turbo", "prime", "wallet", "login", "signup", "team", "popout",
    "jobs", "legal", "categories", "following", "browse", "video",
    "terms-of-service", "privacy-policy", "community-guidelines",
    "dmca", "support", "about", "press", "careers", "help", "dashboard",
    "home"
  ]);

  class PreviewWindow {
    constructor(core, isPinnedMode = false) {
      this.core = core;
      this.isPinned = isPinnedMode;
      this.isAutoMainStream = false;
      this.hasUserAdjustedAudio = false;
      this.channel = null;
      this.platform = null;
      this.isMuted = true;
      this.currentVolume = 0.8;
      this.width = core.config.previewWidth;
      this.savedFloatingRect = null;

      this.container = null;
      this.header = null;
      this.iframe = null;
      this.loader = null;
      this.dot = null;
      this.channelNameEl = null;
      this.volumeGroup = null;
      this.audioBtn = null;
      this.volumeSlider = null;
      this.pinBtn = null;
      this.togetherBtn = null;
      this.swapBtn = null;
      this.sizeBtn = null;
      this.closeBtn = null;

      this.createDOM();
    }

    createDOM() {
      const container = document.createElement("div");
      container.className = `sp-window ${this.isPinned ? "sp-pinned-window" : ""}`;
      container.innerHTML = `
        <div class="sp-header">
          <div class="sp-header-left">
            <span class="sp-dot"></span>
            <span class="sp-channel-name"></span>
          </div>
          <div class="sp-header-right">
            <button class="sp-btn sp-btn-together" type="button" title="Play Together (Fill Screen)">
              <svg viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>
            </button>
            <button class="sp-btn sp-btn-pin" type="button" title="Pin / Detach (P)">
              <svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
            </button>
            <button class="sp-btn sp-btn-size" type="button" title="Cycle Size"></button>
            <button class="sp-btn sp-btn-swap" type="button" title="Swap Position (S)">
              <svg class="sp-icon-swap-h" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 8h16M15 4l5 4-5 4M20 16H4M9 12l-5 4 5 4"/>
              </svg>
              <svg class="sp-icon-swap-v" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 20V4M4 9l4-5 4 5M16 4v16M12 15l4 5 4-5"/>
              </svg>
              <svg class="sp-icon-promote" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 12H4M11 19l-7-7 7-7"/>
              </svg>
              <svg class="sp-icon-cycle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5"/>
              </svg>
              <svg class="sp-icon-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 9 2 12 5 15"/>
                <polyline points="9 5 12 2 15 5"/>
                <polyline points="15 19 12 22 9 19"/>
                <polyline points="19 9 22 12 19 15"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="12" y1="2" x2="12" y2="22"/>
              </svg>
            </button>
            <div class="sp-volume-group">
              <button class="sp-btn sp-btn-audio" type="button" title="Unmute (M)"></button>
              <input type="range" class="sp-volume-slider" min="0" max="100" step="2" value="80" title="Volume">
            </div>
            <button class="sp-btn sp-btn-close" type="button" title="Close (Esc)">
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        </div>
        <div class="sp-slot-picker">
          <div class="sp-slot-title">Move to Slot</div>
          <div class="sp-slot-grid">
            <button type="button" class="sp-slot-btn" data-slot="0" title="Top-Left (1)">
              <span class="sp-slot-name">TL</span>
              <span class="sp-slot-num">1</span>
            </button>
            <button type="button" class="sp-slot-btn" data-slot="1" title="Top-Right (2)">
              <span class="sp-slot-name">TR</span>
              <span class="sp-slot-num">2</span>
            </button>
            <button type="button" class="sp-slot-btn" data-slot="2" title="Bottom-Left (3)">
              <span class="sp-slot-name">BL</span>
              <span class="sp-slot-num">3</span>
            </button>
            <button type="button" class="sp-slot-btn" data-slot="3" title="Bottom-Right (4)">
              <span class="sp-slot-name">BR</span>
              <span class="sp-slot-num">4</span>
            </button>
          </div>
        </div>
        <div class="sp-body">
          <div class="sp-loader">
            <div class="sp-spinner"></div>
          </div>
          <iframe class="sp-iframe" allowfullscreen allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"></iframe>
        </div>
      `;

      document.body.appendChild(container);

      this.container = container;
      this.header = container.querySelector(".sp-header");
      this.iframe = container.querySelector(".sp-iframe");
      this.loader = container.querySelector(".sp-loader");
      this.dot = container.querySelector(".sp-dot");
      this.channelNameEl = container.querySelector(".sp-channel-name");
      this.volumeGroup = container.querySelector(".sp-volume-group");
      this.audioBtn = container.querySelector(".sp-btn-audio");
      this.volumeSlider = container.querySelector(".sp-volume-slider");
      this.pinBtn = container.querySelector(".sp-btn-pin");
      this.togetherBtn = container.querySelector(".sp-btn-together");
      this.swapBtn = container.querySelector(".sp-btn-swap");
      this.sizeBtn = container.querySelector(".sp-btn-size");
      this.closeBtn = container.querySelector(".sp-btn-close");
      this.slotPicker = container.querySelector(".sp-slot-picker");

      const slotBtns = this.slotPicker.querySelectorAll(".sp-slot-btn");
      slotBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const slotIdx = parseInt(btn.dataset.slot, 10);
          this.core.moveStreamToSlot(this, slotIdx);
          this.closeSlotPicker();
        });
        btn.addEventListener("pointerdown", (e) => {
          e.stopPropagation();
        });
        btn.addEventListener("mousedown", (e) => {
          e.stopPropagation();
        });
      });

      this.slotPicker.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });
      this.slotPicker.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });

      this.applySize(this.width);
      this.updateAudioButtonUI();
      this.updatePinButtonUI();

      this.audioBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleAudio();
      });

      this.volumeSlider.addEventListener("input", (e) => {
        e.stopPropagation();
        this.hasUserAdjustedAudio = true;
        const val = parseInt(e.target.value, 10);
        if (val === 0) {
          this.isMuted = true;
        } else {
          this.isMuted = false;
          this.currentVolume = val / 100;
        }
        this.updateAudioButtonUI();
        this.sendAudioMessage();
      });

      this.volumeGroup.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });

      this.volumeGroup.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });

      this.volumeSlider.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });

      this.volumeSlider.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });

      this.pinBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handlePinClick();
      });

      this.togetherBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.core.togglePlayTogether();
      });

      this.swapBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.core.isTiled && this.core.pinnedWindows.size >= 4) {
          this.toggleSlotPicker();
          return;
        }
        this.core.handleSwapWindow(this);
      });

      this.sizeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.cycleSize();
      });

      this.closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleClose();
      });

      this.setupHeaderDrag();

      container.addEventListener("mousedown", () => {
        this.core.bringToFront(this);
      });

      container.addEventListener("mouseenter", () => {
        this.core.activeWindow = this;
        if (!this.isPinned) {
          this.core.clearLeaveTimer();
        }
      });

      container.addEventListener("mouseleave", () => {
        if (!this.isPinned) {
          this.core.scheduleHide();
        }
      });

      this.iframe.addEventListener("load", () => {
        this.loader.classList.add("sp-loaded");
        this.sendAudioMessage();
        setTimeout(() => this.sendAudioMessage(), 400);
        setTimeout(() => this.sendAudioMessage(), 1200);
      });
    }

    setupHeaderDrag() {
      let isDragging = false;
      let hasMoved = false;
      let isTiledDrag = false;
      let currentDropTarget = null;
      let startX = 0, startY = 0;
      let initLeft = 0, initTop = 0;

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!hasMoved) {
          if (Math.hypot(dx, dy) < 6) return;
          hasMoved = true;
          this.header.classList.add("sp-dragging");
          document.body.classList.add("sp-dragging-active");

          if (isTiledDrag) {
            this.container.classList.add("sp-drag-source");
            this.core.closeAllSlotPickers();
          } else {
            if (this.core.isTiled) {
              this.core.isTiled = false;
              this.core.updateTiledLayout();
            }

            if (!this.isPinned) {
              this.core.promoteToPinned(this);
            }
          }
        }

        if (isTiledDrag) {
          const x = e.clientX;
          const y = e.clientY;
          let foundTarget = null;
          for (const otherWin of this.core.pinnedWindows) {
            if (otherWin === this) continue;
            const r = otherWin.container.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
              foundTarget = otherWin;
              break;
            }
          }

          if (foundTarget !== currentDropTarget) {
            if (currentDropTarget) {
              currentDropTarget.container.classList.remove("sp-drop-target");
            }
            currentDropTarget = foundTarget;
            if (currentDropTarget) {
              currentDropTarget.container.classList.add("sp-drop-target");
            }
          }
        } else {
          const newW = this.container.offsetWidth;
          const newH = this.container.offsetHeight;
          const clampedX = Math.max(4, Math.min(window.innerWidth - newW - 4, initLeft + dx));
          const clampedY = Math.max(4, Math.min(window.innerHeight - newH - 4, initTop + dy));

          this.container.style.left = `${clampedX}px`;
          this.container.style.top = `${clampedY}px`;
        }
      };

      const onPointerEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;

        try {
          if (this.header.hasPointerCapture(e.pointerId)) {
            this.header.releasePointerCapture(e.pointerId);
          }
        } catch (_) {}

        this.header.classList.remove("sp-dragging");
        this.container.classList.remove("sp-drag-source");
        document.body.classList.remove("sp-dragging-active");

        this.header.removeEventListener("pointermove", onPointerMove);
        this.header.removeEventListener("pointerup", onPointerEnd);
        this.header.removeEventListener("pointercancel", onPointerEnd);

        for (const w of this.core.pinnedWindows) {
          w.container.classList.remove("sp-drop-target");
        }

        if (isTiledDrag && hasMoved && currentDropTarget) {
          const target = currentDropTarget;
          currentDropTarget = null;
          this.core.swapPinnedWindows(this, target);
        }

        currentDropTarget = null;
        hasMoved = false;
        isTiledDrag = false;
      };

      this.header.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".sp-header-right") || e.target.closest("button") || e.target.closest("input") || e.target.closest(".sp-volume-group") || e.target.closest(".sp-slot-picker") || e.button !== 0) return;
        isDragging = true;
        hasMoved = false;
        isTiledDrag = this.core.isTiled && this.core.pinnedWindows.size >= 2;
        currentDropTarget = null;
        startX = e.clientX;
        startY = e.clientY;

        const rect = this.container.getBoundingClientRect();
        initLeft = rect.left;
        initTop = rect.top;

        this.core.bringToFront(this);

        try {
          this.header.setPointerCapture(e.pointerId);
        } catch (_) {}

        this.header.addEventListener("pointermove", onPointerMove);
        this.header.addEventListener("pointerup", onPointerEnd);
        this.header.addEventListener("pointercancel", onPointerEnd);
      });
    }

    openSlotPicker() {
      if (!this.slotPicker) return;
      this.core.closeAllSlotPickers(this);
      const pinned = Array.from(this.core.pinnedWindows);
      const currentSlot = pinned.indexOf(this);
      const buttons = this.slotPicker.querySelectorAll(".sp-slot-btn");
      buttons.forEach((btn) => {
        const slotIdx = parseInt(btn.dataset.slot, 10);
        btn.classList.toggle("sp-slot-current", slotIdx === currentSlot);
      });
      this.slotPicker.classList.add("sp-visible");
      if (this.swapBtn) {
        this.swapBtn.classList.add("sp-swap-active");
      }
    }

    closeSlotPicker() {
      if (this.slotPicker) {
        this.slotPicker.classList.remove("sp-visible");
      }
      if (this.swapBtn) {
        this.swapBtn.classList.remove("sp-swap-active");
      }
    }

    toggleSlotPicker() {
      if (this.isSlotPickerOpen()) {
        this.closeSlotPicker();
      } else {
        this.openSlotPicker();
      }
    }

    isSlotPickerOpen() {
      return !!(this.slotPicker && this.slotPicker.classList.contains("sp-visible"));
    }

    applySize(width) {
      const clampedWidth = Math.max(280, Math.min(1280, width));
      this.width = clampedWidth;
      this.container.style.width = `${clampedWidth}px`;

      let currentPreset = SIZE_PRESETS.find(p => Math.abs(p.width - clampedWidth) < 30);
      const label = currentPreset ? `${currentPreset.label} ${clampedWidth}p` : `${clampedWidth}p`;
      this.sizeBtn.textContent = label;
    }

    cycleSize() {
      let nextPreset = SIZE_PRESETS[0];
      for (let i = 0; i < SIZE_PRESETS.length; i++) {
        if (SIZE_PRESETS[i].width > this.width + 10) {
          nextPreset = SIZE_PRESETS[i];
          break;
        }
      }
      this.applySize(nextPreset.width);
      this.core.config.previewWidth = nextPreset.width;
      try {
        storageApi.local.set({ previewWidth: nextPreset.width });
      } catch (_) {}
    }

    updateAudioButtonUI() {
      if (!this.audioBtn || !this.volumeSlider) return;

      const pct = Math.round(this.currentVolume * 100);

      if (this.isMuted || this.currentVolume <= 0) {
        this.audioBtn.classList.remove("sp-audio-active");
        this.audioBtn.title = "Unmute (M)";
        this.volumeGroup.classList.remove("sp-unmuted");
        this.volumeSlider.value = 0;
        this.volumeSlider.title = `Muted (${pct}%)`;
        this.audioBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        `;
      } else {
        this.audioBtn.classList.add("sp-audio-active");
        this.audioBtn.title = "Mute (M)";
        this.volumeGroup.classList.add("sp-unmuted");
        this.volumeGroup.style.setProperty("--vol-fill", `${pct}%`);
        this.volumeSlider.value = pct;
        this.volumeSlider.title = `Volume: ${pct}%`;
        this.audioBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        `;
      }
    }

    updatePinButtonUI() {
      if (!this.pinBtn) return;
      this.pinBtn.classList.toggle("sp-pinned-active", this.isPinned);
      this.pinBtn.title = this.isPinned ? "Unpin / Close (P)" : "Pin / Detach (P)";
    }

    sendAudioMessage() {
      if (this.iframe && this.iframe.contentWindow) {
        try {
          // Extension internal message for player-frame.js (controls direct video element & Kick)
          this.iframe.contentWindow.postMessage({
            type: "PREVIEW_AUDIO_TOGGLE",
            muted: this.isMuted,
            volume: this.currentVolume
          }, "*");

          // Native Twitch Embed Player Proxy protocol (controls Twitch internal player state)
          this.iframe.contentWindow.postMessage({
            eventName: 10, // SetMuted
            params: this.isMuted,
            namespace: "twitch-embed-player-proxy"
          }, "*");
          this.iframe.contentWindow.postMessage({
            eventName: 11, // SetVolume
            params: this.currentVolume,
            namespace: "twitch-embed-player-proxy"
          }, "*");
          if (!this.isMuted) {
            this.iframe.contentWindow.postMessage({
              eventName: 3, // Play
              params: null,
              namespace: "twitch-embed-player-proxy"
            }, "*");
          }
        } catch (_) {}
      }
    }

    toggleAudio() {
      this.hasUserAdjustedAudio = true;
      if (this.isMuted) {
        this.isMuted = false;
        if (!this.currentVolume || this.currentVolume <= 0) {
          this.currentVolume = this.core.config.defaultVolume || 0.8;
        }
      } else {
        this.isMuted = true;
      }
      this.updateAudioButtonUI();
      this.sendAudioMessage();
    }

    handlePinClick() {
      if (this.isPinned) {
        this.core.removePinnedWindow(this);
      } else {
        this.core.promoteToPinned(this);
      }
    }

    handleClose() {
      if (this.isPinned) {
        this.core.removePinnedWindow(this);
      } else {
        this.core.hideHoverPreview(true);
      }
    }

    buildPlayerUrl(platform, channel) {
      if (platform === "twitch") {
        const host = window.location.hostname || "twitch.tv";
        const parentParam = host !== "twitch.tv"
          ? `parent=${encodeURIComponent(host)}&parent=twitch.tv`
          : "parent=twitch.tv";
        return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&${parentParam}&muted=${this.isMuted}&volume=${this.currentVolume}&controls=false`;
      } else if (platform === "kick") {
        return `https://player.kick.com/${encodeURIComponent(channel)}?autoplay=true&muted=${this.isMuted}&volume=${this.currentVolume}`;
      }
      return "about:blank";
    }

    show(platform, channel, x, y, initialMuted = undefined, initialVolume = undefined) {
      this.channel = channel;
      this.platform = platform;
      if (initialMuted !== undefined) {
        this.isMuted = initialMuted;
        this.hasUserAdjustedAudio = true;
      } else if (!this.hasUserAdjustedAudio) {
        this.isMuted = this.core.config.defaultMuted;
      }

      if (initialVolume !== undefined) {
        this.currentVolume = initialVolume;
        this.hasUserAdjustedAudio = true;
      } else if (!this.hasUserAdjustedAudio) {
        this.currentVolume = this.core.config.defaultVolume;
      }

      this.updateAudioButtonUI();
      this.updatePinButtonUI();

      this.dot.className = `sp-dot ${platform}`;
      this.channelNameEl.textContent = channel;

      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;

      this.loader.classList.remove("sp-loaded");
      this.iframe.src = this.buildPlayerUrl(platform, channel);

      this.container.classList.add("sp-visible");
      this.core.bringToFront(this);
    }

    destroy() {
      if (this.iframe) {
        this.iframe.src = "about:blank";
      }
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
    }
  }

  class StreamPreviewCore {
    constructor() {
      this.config = {
        enabledTwitch: true,
        enabledKick: true,
        previewWidth: 480,
        hoverDelayMs: 300,
        defaultMuted: true,
        defaultVolume: 0.8,
        tiledBorderEnabled: true,
        tiledBorderMode: "distinct",
        tiledBorderCustomColor: "#9146ff"
      };

      this.hoverWindow = null;
      this.pinnedWindows = new Set();
      this.activeWindow = null;
      this.isTiled = false;
      this.topZIndex = 2147483640;
      this.savedHostVideoState = null;

      this.enterTimer = null;
      this.leaveTimer = null;

      this.initStorage();
    }

    async initStorage() {
      try {
        const stored = await storageApi.local.get(null);
        if (stored) {
          this.config = { ...this.config, ...stored };
        }
      } catch (_) {}

      if (storageApi.onChanged) {
        storageApi.onChanged.addListener((changes, area) => {
          if (area !== "local") return;
          for (const [key, change] of Object.entries(changes)) {
            this.config[key] = change.newValue;
          }
          if (changes.previewWidth && !this.isTiled) {
            if (this.hoverWindow) this.hoverWindow.applySize(this.config.previewWidth);
            for (const win of this.pinnedWindows) {
              win.applySize(this.config.previewWidth);
            }
          }
          if ((changes.tiledBorderEnabled || changes.tiledBorderMode || changes.tiledBorderCustomColor) && this.isTiled) {
            this.updateTiledLayout();
          }
        });
      }

      document.addEventListener("pointerdown", (e) => {
        if (!e.target.closest(".sp-slot-picker") && !e.target.closest(".sp-btn-swap")) {
          this.closeAllSlotPickers();
        }
      });

      window.addEventListener("resize", () => {
        if (this.isTiled) {
          this.updateTiledLayout();
        }
      });

      window.addEventListener("message", (e) => {
        const data = e.data;
        if (!data || typeof data !== "object") return;
        if (data.type === "PREVIEW_FRAME_READY") {
          const wins = [];
          if (this.hoverWindow) wins.push(this.hoverWindow);
          for (const w of this.pinnedWindows) wins.push(w);
          for (const win of wins) {
            if (win.iframe && win.iframe.contentWindow === e.source) {
              win.sendAudioMessage();
              break;
            }
          }
        }
      });

      window.addEventListener("keydown", (e) => {
        const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
        if (tag === "input" || tag === "textarea" || (e.target && e.target.isContentEditable)) return;

        const hoverActive = this.hoverWindow && this.hoverWindow.container && this.hoverWindow.container.classList.contains("sp-visible");
        const activeWin = hoverActive ? this.hoverWindow : (this.activeWindow || Array.from(this.pinnedWindows).pop());

        if (!activeWin && !this.isTiled) return;

        if (e.key === "Escape") {
          let pickerClosed = false;
          for (const win of this.pinnedWindows) {
            if (win.isSlotPickerOpen && win.isSlotPickerOpen()) {
              win.closeSlotPicker();
              pickerClosed = true;
            }
          }
          if (pickerClosed) return;

          if (this.isTiled) {
            this.togglePlayTogether();
          } else if (activeWin) {
            activeWin.handleClose();
          }
        } else if (e.key === "m" || e.key === "M") {
          if (activeWin) activeWin.toggleAudio();
        } else if (e.key === "p" || e.key === "P") {
          if (activeWin) activeWin.handlePinClick();
        } else if (e.key === "t" || e.key === "T") {
          if (this.pinnedWindows.size >= 2 || this.canTileWithPageStream() || this.isTiled) {
            this.togglePlayTogether();
          }
        } else if (e.key === "s" || e.key === "S") {
          if (this.isTiled && this.pinnedWindows.size >= 2) {
            const targetWin = (this.activeWindow && this.pinnedWindows.has(this.activeWindow))
              ? this.activeWindow
              : Array.from(this.pinnedWindows)[0];
            if (targetWin) {
              this.handleSwapWindow(targetWin);
            }
          }
        } else if (["1", "2", "3", "4"].includes(e.key)) {
          if (this.isTiled && this.pinnedWindows.size >= 4) {
            const targetWin = (this.activeWindow && this.pinnedWindows.has(this.activeWindow))
              ? this.activeWindow
              : Array.from(this.pinnedWindows)[0];
            if (targetWin) {
              const slotIdx = parseInt(e.key, 10) - 1;
              this.moveStreamToSlot(targetWin, slotIdx);
            }
          }
        }
      });

      let lastNavUrl = window.location.href;
      const checkUrlChange = () => {
        if (window.location.href !== lastNavUrl) {
          lastNavUrl = window.location.href;
          this.updatePlayTogetherButtons();
        }
      };
      window.addEventListener("popstate", checkUrlChange);
      setInterval(checkUrlChange, 1000);
    }

    bringToFront(win) {
      if (!win || !win.container) return;
      this.topZIndex++;
      win.container.style.zIndex = this.topZIndex;
      this.activeWindow = win;
    }

    ensureHoverWindow() {
      if (!this.hoverWindow || !this.hoverWindow.container) {
        this.hoverWindow = new PreviewWindow(this, false);
      }
      return this.hoverWindow;
    }

    promoteToPinned(previewWin) {
      this.clearLeaveTimer();
      previewWin.isPinned = true;
      previewWin.container.classList.add("sp-pinned-window");
      previewWin.updatePinButtonUI();
      this.bringToFront(previewWin);

      this.pinnedWindows.add(previewWin);

      if (this.hoverWindow === previewWin) {
        this.hoverWindow = null;
      }

      this.updatePlayTogetherButtons();

      if (this.isTiled) {
        this.updateTiledLayout();
      }
    }

    removePinnedWindow(previewWin) {
      const wasAuto = previewWin.isAutoMainStream;
      const previewAudio = wasAuto ? { muted: previewWin.isMuted, volume: previewWin.currentVolume } : null;
      this.pinnedWindows.delete(previewWin);
      if (this.activeWindow === previewWin) {
        this.activeWindow = null;
      }
      previewWin.destroy();

      if (wasAuto) {
        this.resumeHostStream(previewAudio);
      }

      if (this.isTiled) {
        let remainingAuto = null;
        for (const win of this.pinnedWindows) {
          if (win.isAutoMainStream) {
            remainingAuto = win;
            break;
          }
        }
        if (this.pinnedWindows.size < 2 || (this.pinnedWindows.size === 1 && remainingAuto)) {
          if (remainingAuto) {
            const autoAudio = {
              muted: remainingAuto.isMuted,
              volume: remainingAuto.currentVolume
            };
            this.pinnedWindows.delete(remainingAuto);
            remainingAuto.destroy();
            this.resumeHostStream(autoAudio);
          }
          this.isTiled = false;
        }
      }

      this.updateTiledLayout();
      this.updatePlayTogetherButtons();
    }

    togglePlayTogether() {
      // If entering Dual+ with 1 pinned stream on an active channel page
      if (!this.isTiled && this.canTileWithPageStream()) {
        const pageStream = this.getPageStreamInfo();
        const existingWin = Array.from(this.pinnedWindows)[0];
        this.pauseHostStream();

        const mainWin = new PreviewWindow(this, true);
        mainWin.isAutoMainStream = true;
        const initMuted = this.savedHostVideoState ? this.savedHostVideoState.muted : false;
        const initVolume = this.savedHostVideoState ? this.savedHostVideoState.volume : (this.config.defaultVolume || 0.8);
        mainWin.show(pageStream.platform, pageStream.channel, 0, 0, initMuted, initVolume);

        // Put main stream in slot 0 (left), pinned window in slot 1 (right)
        const reordered = [mainWin, existingWin];
        this.pinnedWindows.clear();
        for (const w of reordered) this.pinnedWindows.add(w);

        this.isTiled = true;
        this.updateTiledLayout();
        this.updatePlayTogetherButtons();
        return;
      }

      if (!this.isTiled && this.pinnedWindows.size < 2) return;

      if (this.isTiled) {
        let autoWin = null;
        for (const win of this.pinnedWindows) {
          if (win.isAutoMainStream) {
            autoWin = win;
            break;
          }
        }
        if (autoWin) {
          const autoAudio = {
            muted: autoWin.isMuted,
            volume: autoWin.currentVolume
          };
          this.pinnedWindows.delete(autoWin);
          autoWin.destroy();
          this.resumeHostStream(autoAudio);
        }
        this.isTiled = false;
        this.updateTiledLayout();
        this.updatePlayTogetherButtons();
        return;
      }

      this.isTiled = !this.isTiled;
      this.updateTiledLayout();
      this.updatePlayTogetherButtons();
    }

    closeAllSlotPickers(exceptWin = null) {
      for (const win of this.pinnedWindows) {
        if (win !== exceptWin && win.closeSlotPicker) {
          win.closeSlotPicker();
        }
      }
    }

    reorderPinnedWindows(newList) {
      this.closeAllSlotPickers();
      this.pinnedWindows.clear();
      for (const w of newList) {
        this.pinnedWindows.add(w);
      }
      this.updateTiledLayout();
    }

    swapPinnedWindows(winA, winB) {
      if (!this.isTiled || !winA || !winB || winA === winB) return;
      const pinned = Array.from(this.pinnedWindows);
      const idxA = pinned.indexOf(winA);
      const idxB = pinned.indexOf(winB);
      if (idxA === -1 || idxB === -1) return;
      pinned[idxA] = winB;
      pinned[idxB] = winA;
      this.reorderPinnedWindows(pinned);
    }

    moveStreamToSlot(win, targetSlot) {
      if (!this.isTiled || this.pinnedWindows.size < 2) return;
      const pinned = Array.from(this.pinnedWindows);
      const currentIdx = pinned.indexOf(win);
      if (currentIdx === -1 || targetSlot < 0 || targetSlot >= pinned.length) return;
      if (currentIdx === targetSlot) return;
      const otherWin = pinned[targetSlot];
      pinned[currentIdx] = otherWin;
      pinned[targetSlot] = win;
      this.reorderPinnedWindows(pinned);
    }

    handleSwapWindow(win) {
      if (!this.isTiled || this.pinnedWindows.size < 2) return;
      const pinned = Array.from(this.pinnedWindows);
      const idx = pinned.indexOf(win);
      if (idx === -1) return;

      if (pinned.length === 2) {
        this.reorderPinnedWindows([pinned[1], pinned[0]]);
      } else if (pinned.length === 3) {
        if (idx === 0) {
          this.reorderPinnedWindows([pinned[0], pinned[2], pinned[1]]);
        } else {
          const newOrder = [...pinned];
          newOrder[0] = win;
          newOrder[idx] = pinned[0];
          this.reorderPinnedWindows(newOrder);
        }
      } else if (pinned.length >= 4) {
        win.toggleSlotPicker();
      }
    }

    getPageStreamInfo() {
      const host = window.location.hostname;
      let platform = null;
      if (host.includes("twitch.tv")) {
        platform = "twitch";
      } else if (host.includes("kick.com")) {
        platform = "kick";
      }
      if (!platform) return null;

      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) return null;

      const channel = parts[0].toLowerCase();
      if (NON_CHANNEL_PATHS.has(channel)) return null;

      if (platform === "twitch" && !/^[a-zA-Z0-9_]{3,25}$/.test(channel)) return null;
      if (platform === "kick" && !/^[a-zA-Z0-9_\-\.]{3,30}$/.test(channel)) return null;

      return { platform, channel };
    }

    canTileWithPageStream() {
      if (this.isTiled || this.pinnedWindows.size !== 1) return false;
      const pageStream = this.getPageStreamInfo();
      if (!pageStream) return false;
      const onlyPinned = Array.from(this.pinnedWindows)[0];
      return onlyPinned && onlyPinned.channel && onlyPinned.channel.toLowerCase() !== pageStream.channel.toLowerCase();
    }

    getHostVideoElement() {
      return document.querySelector(
        ".video-player__container video, [data-a-target='video-player'] video, .channel-root video, #channel-player video, video"
      );
    }

    getHostAudioState() {
      let isMuted = true;
      let volume = 0.8;

      const video = this.getHostVideoElement();
      if (video) {
        isMuted = video.muted;
        volume = (typeof video.volume === "number" && !isNaN(video.volume)) ? video.volume : 0.8;
      }

      // Check native mute button aria-label as read-only check on Twitch
      const muteBtn = document.querySelector('button[data-a-target="player-mute-unmute-button"]');
      if (muteBtn) {
        const label = (muteBtn.getAttribute("aria-label") || muteBtn.innerText || "").toLowerCase();
        if (label.includes("mute") && !label.includes("unmute")) {
          isMuted = false;
        } else if (label.includes("unmute")) {
          isMuted = true;
        }
      }

      if (video && video.muted === false) {
        isMuted = false;
      }

      if (volume <= 0) {
        isMuted = true;
      }

      return { muted: isMuted, volume: Math.max(0, Math.min(1, volume)) };
    }

    pauseHostStream() {
      const video = this.getHostVideoElement();
      const audioState = this.getHostAudioState();
      this.savedHostVideoState = {
        paused: video ? video.paused : false,
        muted: audioState.muted,
        volume: audioState.volume
      };
      if (video) {
        video.muted = true;
      }
    }

    resumeHostStream(updatedAudioState = null) {
      if (!this.savedHostVideoState && !updatedAudioState) return;
      const targetMuted = updatedAudioState ? updatedAudioState.muted : (this.savedHostVideoState ? this.savedHostVideoState.muted : false);
      const targetVolume = updatedAudioState ? updatedAudioState.volume : (this.savedHostVideoState ? this.savedHostVideoState.volume : 0.8);

      const video = this.getHostVideoElement();
      if (video) {
        video.muted = targetMuted;
        video.volume = targetVolume;
      }

      this.savedHostVideoState = null;
    }

    updatePlayTogetherButtons() {
      const canDualWithPage = this.canTileWithPageStream();
      const showBtn = this.pinnedWindows.size >= 2 || canDualWithPage;
      const pageStream = this.getPageStreamInfo();

      for (const win of this.pinnedWindows) {
        if (!win.togetherBtn) continue;
        win.togetherBtn.classList.toggle("sp-visible-btn", showBtn);
        win.togetherBtn.classList.toggle("sp-together-active", this.isTiled);
        if (this.isTiled) {
          win.togetherBtn.title = "Restore Floating Windows (T)";
        } else if (canDualWithPage && pageStream) {
          win.togetherBtn.title = `Dual+ with Main Stream (${pageStream.channel}) (T)`;
        } else {
          win.togetherBtn.title = "Play Together (Fill Screen) (T)";
        }
      }
    }

    updateTiledLayout() {
      const pinned = Array.from(this.pinnedWindows);

      if (!this.isTiled || pinned.length < 2) {
        this.closeAllSlotPickers();
        for (const win of pinned) {
          win.container.classList.remove("sp-tiled", "sp-no-gap");
          win.container.style.height = "";
          win.container.style.boxShadow = "";
          if (win.savedFloatingRect) {
            win.container.style.left = win.savedFloatingRect.left;
            win.container.style.top = win.savedFloatingRect.top;
            win.container.style.width = win.savedFloatingRect.width;
          } else {
            win.applySize(win.width);
          }
        }
        this.updatePlayTogetherButtons();
        return;
      }

      const count = Math.min(4, pinned.length);
      const W = window.innerWidth;
      const H = window.innerHeight;

      const DISTINCT_COLORS = ["#9146ff", "#22c55e", "#00e5ff", "#ff7538"];
      const borderEnabled = this.config.tiledBorderEnabled !== false;
      const borderMode = this.config.tiledBorderMode || "distinct";
      const customColor = this.config.tiledBorderCustomColor || "#9146ff";

      const gap = borderEnabled ? 4 : 0;
      const halfW = borderEnabled ? Math.floor((W - (gap * 3)) / 2) : Math.floor(W / 2);
      const fullH = borderEnabled ? Math.floor(H - (gap * 2)) : H;
      const halfH = borderEnabled ? Math.floor((H - (gap * 3)) / 2) : Math.floor(H / 2);

      const wCol0 = halfW;
      const wCol1 = borderEnabled ? halfW : (W - halfW);
      const hRow0 = halfH;
      const hRow1 = borderEnabled ? halfH : (H - halfH);

      for (let i = 0; i < pinned.length; i++) {
        const win = pinned[i];

        if (!win.savedFloatingRect) {
          win.savedFloatingRect = {
            left: win.container.style.left,
            top: win.container.style.top,
            width: win.container.style.width,
            height: win.container.style.height
          };
        }

        win.container.classList.add("sp-tiled");
        win.container.classList.toggle("sp-no-gap", !borderEnabled);

        let borderColor = "";
        if (borderEnabled) {
          if (borderMode === "distinct") {
            borderColor = DISTINCT_COLORS[i % DISTINCT_COLORS.length];
          } else if (borderMode === "custom") {
            borderColor = customColor;
          } else if (borderMode === "green") {
            borderColor = "#22c55e";
          } else if (borderMode === "cyan") {
            borderColor = "#00e5ff";
          } else if (borderMode === "orange") {
            borderColor = "#ff7538";
          } else {
            borderColor = "#9146ff";
          }
        }

        if (borderColor) {
          win.container.style.boxShadow = `0 0 0 2px ${borderColor}, 0 8px 30px rgba(0, 0, 0, 0.9)`;
        } else {
          win.container.style.boxShadow = "none";
        }

        if (win.swapBtn) {
          win.swapBtn.classList.remove("sp-swap-h", "sp-swap-v", "sp-swap-promote", "sp-swap-cycle", "sp-swap-grid");
          if (count === 2) {
            win.swapBtn.classList.add("sp-swap-h");
            win.swapBtn.title = "Swap Sides (S or Drag)";
          } else if (count === 3) {
            if (i === 0) {
              win.swapBtn.classList.add("sp-swap-v");
              win.swapBtn.title = "Swap Side Streams (S or Drag)";
            } else {
              win.swapBtn.classList.add("sp-swap-promote");
              win.swapBtn.title = "Promote to Main Stage (S or Drag)";
            }
          } else {
            win.swapBtn.classList.add("sp-swap-grid");
            win.swapBtn.title = "Move to Slot (S, 1-4, or Drag)";
          }
        }

        let left = 0, top = 0, w = halfW, h = halfH;

        if (count === 2) {
          top = gap;
          h = fullH;
          if (i === 0) {
            left = gap;
            w = wCol0;
          } else {
            left = borderEnabled ? (gap + halfW + gap) : wCol0;
            w = wCol1;
          }
        } else if (count === 3) {
          if (i === 0) {
            left = gap;
            top = gap;
            w = wCol0;
            h = fullH;
          } else if (i === 1) {
            left = borderEnabled ? (gap + halfW + gap) : wCol0;
            top = gap;
            w = wCol1;
            h = hRow0;
          } else {
            left = borderEnabled ? (gap + halfW + gap) : wCol0;
            top = borderEnabled ? (gap + halfH + gap) : hRow0;
            w = wCol1;
            h = hRow1;
          }
        } else {
          const col = i % 2;
          const row = Math.floor(i / 2);
          left = col === 0 ? gap : (borderEnabled ? (gap + halfW + gap) : wCol0);
          top = row === 0 ? gap : (borderEnabled ? (gap + halfH + gap) : hRow0);
          w = col === 0 ? wCol0 : wCol1;
          h = row === 0 ? hRow0 : hRow1;
        }

        win.container.style.left = `${left}px`;
        win.container.style.top = `${top}px`;
        win.container.style.width = `${w}px`;
        win.container.style.height = `${h}px`;
      }

      this.updatePlayTogetherButtons();
    }

    calculatePosition(targetRect) {
      const margin = 12;
      const previewWidth = this.config.previewWidth;
      const previewHeight = (previewWidth * 9 / 16) + 34;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      let x, y;

      const spaceRight = winW - targetRect.right;
      const spaceLeft = targetRect.left;

      if (spaceRight >= previewWidth + margin) {
        x = targetRect.right + margin;
      } else if (spaceLeft >= previewWidth + margin) {
        x = targetRect.left - previewWidth - margin;
      } else {
        x = spaceRight > spaceLeft ? targetRect.right - (previewWidth / 2) : targetRect.left - (previewWidth / 2);
      }

      y = targetRect.top + (targetRect.height / 2) - (previewHeight / 2);

      x = Math.max(margin, Math.min(x, winW - previewWidth - margin));
      y = Math.max(margin, Math.min(y, winH - previewHeight - margin));

      return { x, y };
    }

    requestPreview(platform, channel, targetRect) {
      if (!this.config[`enabled${platform === "twitch" ? "Twitch" : "Kick"}`]) return;

      for (const win of this.pinnedWindows) {
        if (win.channel === channel && win.platform === platform) {
          return;
        }
      }

      this.clearLeaveTimer();

      if (this.hoverWindow && this.hoverWindow.channel === channel && this.hoverWindow.platform === platform && this.hoverWindow.container.classList.contains("sp-visible")) {
        return;
      }

      this.clearEnterTimer();
      this.enterTimer = setTimeout(() => {
        this.showHoverPreview(platform, channel, targetRect);
      }, this.config.hoverDelayMs);
    }

    showHoverPreview(platform, channel, targetRect) {
      const win = this.ensureHoverWindow();
      const { x, y } = this.calculatePosition(targetRect);
      win.show(platform, channel, x, y);
    }

    scheduleHide() {
      this.clearEnterTimer();
      this.clearLeaveTimer();
      this.leaveTimer = setTimeout(() => {
        this.hideHoverPreview();
      }, 250);
    }

    hideHoverPreview(immediate = false) {
      this.clearEnterTimer();
      this.clearLeaveTimer();

      if (!this.hoverWindow || !this.hoverWindow.container) return;

      const win = this.hoverWindow;
      win.container.classList.remove("sp-visible");
      win.channel = null;
      win.platform = null;

      const cleanup = () => {
        if (win && win.iframe && (!win.container || !win.container.classList.contains("sp-visible"))) {
          win.iframe.src = "about:blank";
          if (win.loader) win.loader.classList.remove("sp-loaded");
        }
      };

      if (immediate) {
        cleanup();
      } else {
        setTimeout(cleanup, 200);
      }
    }

    clearEnterTimer() {
      if (this.enterTimer) {
        clearTimeout(this.enterTimer);
        this.enterTimer = null;
      }
    }

    clearLeaveTimer() {
      if (this.leaveTimer) {
        clearTimeout(this.leaveTimer);
        this.leaveTimer = null;
      }
    }
  }

  window.StreamPreviewCore = new StreamPreviewCore();
})();
