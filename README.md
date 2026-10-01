<div align="center">

<img src="images/stream-previews-amo-icon-512.png" width="128" height="128" alt="Stream Previews Logo">

# Stream Previews (Twitch & Kick)

**Fast, lightweight live video hover previews, individual volume sliders, multi-stream pinned overlays, and Play Together grid tiling for Firefox.**

</div>

---

## Overview

**Stream Previews** is a modern, bloat-free Firefox WebExtension built specifically for Twitch and Kick. It enables instant live video hover previews across directory pages and followed sidebar channels without interrupting your current page or opening extra browser tabs.

Unlike legacy or commercial preview extensions, Stream Previews contains zero analytics, zero external tracking, zero advertising scripts, and zero subscriptions.

---

## Screenshots

### Multi-Stream Floating Overlays
Pin multiple broadcasts simultaneously and reposition them across your screen while continuing to browse other channels and categories:

![Multi-Stream Floating Overlays](images/Screenshot_20261001_130058.png)

---

### Play Together: 50/50 Split Screen
Press `T` or click the grid icon when two streams are pinned to tile them across your entire viewport:

![Play Together Split Screen](images/Screenshot_20261001_130209.png)

---

### Play Together: 2x2 Multi-View Grid
Tile up to four pinned streams simultaneously into a clean full-screen grid layout:

![Play Together 2x2 Grid](images/Screenshot_20261001_130236.png)

---

### Compact Settings Panel
Access preset resolutions, volume defaults, hover trigger delays, and platform toggles without any vertical scrolling:

![Configuration Panel](images/stream-previews-config-panel.png)

---

## Key Features

- **Live Video Hover Previews**: Hover over any live stream card or sidebar channel on `twitch.tv` and `kick.com` to watch the stream in a floating video preview overlay.
- **Per-Stream Volume Control**: Every preview window includes its own horizontal volume slider and sound toggle directly on the top header bar. Adjust volume from 0% to 100% per stream on the fly.
- **Continuous Playback Protection**: Guarded against host player DOM mutations and automated re-muting, ensuring clean uninterrupted sound playback.
- **Pin Multiple Floating Overlays**: Click the pin icon or press `P` to detach any preview window into a floating overlay. Pin as many simultaneous streams as your hardware allows.
- **Play Together (Full-Screen Viewport Tiling)**:
  - 2 Streams: 50/50 horizontal split.
  - 3 Streams: Theater multi-view layout (main stage left, stacked secondary right).
  - 4 Streams: 2x2 four-way multi-view grid.
  - Press `T` again or `Esc` to restore floating positions and sizes instantly.
- **Quick-Cycle Dimensions**: Switch between 360p, 480p, 640p, and 800p presets with a single header button click, or fine-tune width via the toolbar popup slider.
- **Pointer-Capture Dragging**: Smooth, tear-free window dragging that will not get swallowed or trapped by cross-origin video iframes.
- **Anti-Flicker Hover Delay**: Configurable debounce delay (default 300ms) prevents unwanted popups while scrolling rapidly through channels.
- **Dark Theme Interface**: Native dark UI matching Twitch and Kick aesthetics, featuring colored status dots and clean controls.

---

## Keyboard Shortcuts

| Shortcut | Action | Scope |
| --- | --- | --- |
| `M` | Toggle audio (unmute / mute) | Active hovered preview or pinned window |
| `P` | Pin / Detach stream overlay | Active preview window |
| `T` | Toggle Play Together grid tiling | Active when 2 to 4 streams are pinned |
| `Esc` | Close active preview overlay / Exit tile mode | Active preview window or viewport |
| **Drag Header** | Reposition floating window anywhere | Any pinned preview window |

---

## Project Structure

```text
twitch-kick-previews/
├── images/                  # Screenshots, store banners, and master icons
├── release/                 # Production extension source
│   ├── background.js        # Background service script
│   ├── build.sh             # Packaging script
│   ├── content/             # Core overlay controller and site detectors
│   │   ├── kick.js          # Kick event delegation and channel extraction
│   │   ├── player-frame.js  # Iframe video and audio controller
│   │   ├── preview.css      # Overlay, header, slider, and tile styling
│   │   ├── preview-core.js  # Multi-window DOM and state manager
│   │   └── twitch.js        # Twitch event delegation and card selectors
│   ├── icons/               # 16px to 128px icon assets
│   ├── manifest.json        # Firefox MV3 manifest
│   └── popup/               # Toolbar settings popup (HTML, CSS, JS)
├── .gitignore
└── README.md
```

---

## Installation

### From Firefox Add-ons (AMO)
Install the signed add-on directly from [addons.mozilla.org](https://addons.mozilla.org) once published.

### Manual / Developer Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/PlasmaDrifter/twitch-kick-previews.git
   cd twitch-kick-previews
   ```
2. Open Firefox and enter `about:debugging#/runtime/this-firefox` in the address bar.
3. Click **"Load Temporary Add-on..."**.
4. Select `release/manifest.json`.
5. Navigate to `twitch.tv` or `kick.com` to begin previewing streams.

---

## Building the Package

To build the clean `.zip` and `.xpi` archive for AMO submission or local distribution:

```bash
cd release
./build.sh
```

The script extracts the version number dynamically from `manifest.json`, cleans old build archives, and outputs:
- `stream-previews-v<VERSION>.zip` (clean archive for AMO upload)
- `twitch-kick-previews.xpi` (local Firefox add-on file)

---

## Privacy & Security

- **No Remote Scripts**: All JavaScript executes locally from within the extension package.
- **No Analytics / Telemetry**: No third-party network requests, beacons, or tracking pixels.
- **Minimal Permissions**: Uses only `storage` for saving user preferences locally and host permissions restricted strictly to Twitch and Kick player domains.
- **AMO Compliant**: Fully declared `data_collection_permissions: { required: ["none"] }` in Gecko settings.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
