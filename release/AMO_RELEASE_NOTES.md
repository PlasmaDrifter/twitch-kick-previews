# Stream Previews v0.7.0 - AMO Release Notes

What's New in Version 0.7.0:

- Hover Preview Layering Over Pinned Streams:
  Hover preview overlays now consistently render above existing pinned stream popups. When hovering over another channel in the sidebar or browse page, the hover window always takes top z-index priority above any pinned windows.

- Compact Segmented Settings Interface:
  Redesigned the settings popup into a streamlined 3-tab segmented layout (General, Borders, Audio). Reduces the popup vertical height footprint by approximately 50% (down to ~290px–310px) to completely eliminate scrolling in standard views while preserving all settings, sliders, and controls.

- Distinct Tab Navigation:
  Features an inset navigation track with elevated pill cards and smooth state transitions, making the active section immediately recognizable. Automatically saves and restores the last viewed tab across sessions.

- Hover Preview Border Control:
  Added an independent toggle to configure borders specifically on hover preview windows in addition to the Play Together tiling borders.

- Solid Bottom Window Borders:
  Fixed an issue where downward drop shadows dimmed the bottom edge of hover and pinned popups. All four borders (top, bottom, left, right) now render with 100% solid, crisp color.

- Seamless Fullscreen Tiling:
  Eliminated the bottom seam during Play Together multi-view mode where the underlying webpage could previously be seen. Stream windows now tile flush to the bottom edge with a dedicated black fullscreen backdrop.

- Refined Settings Organization:
  Relocated the "Show quality & speed badge in header" option into the General tab alongside trigger scope and platform controls for intuitive discovery.
