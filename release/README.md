# Stream Previews (Twitch & Kick)

A lightweight, bloat-free Firefox WebExtension for live video hover previews on Twitch and Kick.

[![Firefox Add-on](https://img.shields.io/badge/Firefox-WebExtension%20MV3-FF7139?logo=firefox-browser&logoColor=white)](https://addons.mozilla.org)
[![Version](https://img.shields.io/badge/version-v0.5.6-38BDF8)](https://github.com/PlasmaDrifter/twitch-kick-previews/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-22C55E)](LICENSE)
[![Twitch](https://img.shields.io/badge/Twitch-Supported-9146FF?logo=twitch&logoColor=white)](https://twitch.tv)
[![Kick](https://img.shields.io/badge/Kick-Supported-22C55E)](https://kick.com)

## Features
- **Live Video Previews**: Hover over stream cards or sidebar channels on Twitch and Kick to preview streams in real time.
- **Audio Controls**: Muted by default with an instant audio unmute/mute button on the preview header and keyboard shortcut (`M`).
- **Detach & Pin Overlay**: Click the Pin button or press `P` to freeze any preview in place as a persistent floating overlay.
- **Multiple Pinned Overlays**: Pin multiple streams simultaneously. Hover previews continue working seamlessly on other channels.
- **Play Together (Fill Screen Multi-View)**: When 2 to 4 streams are pinned, click the Dual+ button or press `T` to tile them into a full-screen multi-stream layout (2-stream split, 3-stream theater, or 4-stream 2x2 grid). Click again to restore your previous floating positions.
- **Drag-and-Drop Tile Swapping**: Click and drag from any stream header in Dual+ mode to swap positions with another stream tile without video reloading or audio interruption.
- **4-Way Move & Quadrant Popover**: In 4-stream Dual+ mode, use the electric-cyan 4-way move button (`✥`) or press `S` to open an instant quadrant picker (`TL`, `TR`, `BL`, `BR`).
- **Direct Number Hotkeys**: Press `1`, `2`, `3`, or `4` while hovering any stream in 4-stream Dual+ mode to assign it directly into that corner.
- **Seamless Zero-Gap Mode**: When borders are turned off in settings, streams touch completely flush edge-to-edge across the screen with zero inter-stream gaps.
- **Configurable Colored Borders**: Choose between multi-color distinct borders per slot, single colors, or a custom color picker in the popup settings.
- **Draggable Anywhere**: Click and drag the preview header to move the floating window anywhere on your screen.
- **Clean Header**: Streamlined borderless controls, turned pin indicator, and subtle colored platform dots.
- **Adjustable Dimensions**: Choose from presets (Small 360p, Medium 480p, Large 640p, XL 800p) or use the fine-tuning slider.
- **Pure & Lightweight**: Under 100KB total package size, zero tracking, zero subscriptions, zero unnecessary scripts.

## Installation in Firefox

### Direct XPI Installation
1. Download `twitch-kick-previews.xpi`.
2. Open Firefox and go to `about:addons`.
3. Click the gear icon in the top-right corner and select **"Install Add-on From File..."**.
4. Select the downloaded `twitch-kick-previews.xpi` file.

### Temporary Add-on (Development Mode)
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on..."**.
3. Select `manifest.json` from this project folder.
4. The extension is now active on `twitch.tv` and `kick.com`.

### Packaging
To build or update the packaged `.zip` and `.xpi` archives, run:
```bash
./build.sh
```

## Keyboard Shortcuts & Controls
- `M`: Toggle audio (mute / unmute).
- `P`: Pin / Detach overlay.
- `T`: Play Together / Dual+ (tile 2-4 pinned streams to fill screen).
- `S`: Swap positions / Promote to main stage / Open quadrant picker in Dual+ mode.
- `1` - `4`: Assign hovered stream to quadrant (TL, TR, BL, BR) in 4-stream Dual+ mode.
- `Esc`: Close the active preview, exit tiled mode, or close the quadrant popover.
- **Drag Header**: Move floating preview window, or drag-and-drop to swap tiles in Dual+ mode.
