# Stream Previews (Twitch & Kick)

A lightweight, bloat-free Firefox WebExtension for live video hover previews on Twitch and Kick.

## Features
- **Live Video Previews**: Hover over stream cards or sidebar channels on Twitch and Kick to preview streams in real time.
- **Audio Controls**: Muted by default with an instant audio unmute/mute button on the preview header and keyboard shortcut (`M`).
- **Detach & Pin Overlay**: Click the Pin button or press `P` to freeze any preview in place as a persistent floating overlay.
- **Multiple Pinned Overlays**: Pin multiple streams simultaneously. Hover previews continue working seamlessly on other channels.
- **Play Together (Fill Screen Multi-View)**: When 2 to 4 streams are pinned, click the grid button or press `T` to instantly tile them into a full-screen multi-stream layout (2-stream split, 3-stream theater, or 4-stream 2x2 grid). Click again to restore your previous floating positions.
- **Draggable Anywhere**: Click and drag the preview header to move the floating window anywhere on your screen.
- **Clean Header**: Streamlined header with subtle colored status dot (purple for Twitch, green for Kick) without bulky text badges.
- **Adjustable Dimensions**: Choose from presets (Small 360p, Medium 480p, Large 640p, XL 800p) or use the fine-tuning slider.
- **Pure & Lightweight**: Under 20KB total package size, zero tracking, zero subscriptions, zero unnecessary scripts.

## Installation in Firefox

### Temporary Add-on (Development Mode)
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on..."**.
3. Select `manifest.json` from this project folder.
4. The extension is now active on `twitch.tv` and `kick.com`.

### Packaging
To build or update the packaged `.xpi` file, run:
```bash
zip -r -FS twitch-kick-previews.xpi manifest.json icons/ content/ popup/
```

## Keyboard Shortcuts & Controls
- `M`: Toggle audio (mute / unmute).
- `P`: Pin / Detach overlay.
- `T`: Play Together (tile 2-4 pinned streams to fill screen).
- `Esc`: Close the active preview or exit tiled mode.
- **Drag Header**: Move the floating preview window across the screen.
