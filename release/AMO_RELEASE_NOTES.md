# Stream Previews v0.5.9 - AMO Release Notes\n\nWhat's New in Version 0.5.9:

- In-Popup Custom Border Color Picker:
  Replaced the external OS color chooser modal with a fully self-contained in-popup color picker. This prevents extension popup focus loss and unwanted closure in Firefox.

- Bidirectional Shade Slider:
  Added a 10-color base palette chip row. Selecting any base chip centers the shade slider at 50%. The slider track dynamically displays a gradient from pure black on the left, the selected base hue in the middle, to pure white on the right. Slide left to darken or slide right to lighten.

- Live Synchronization & Real-Time Border Updates:
  Shades update the preview dot, manual hex code field, header badge, and live stream window borders on Twitch and Kick immediately.

- Independent State Storage:
  Saves both the base color and shade slider offset independently to preserve exact user selection across sessions without lossy color conversions.\n