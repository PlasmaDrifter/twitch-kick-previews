# Stream Previews v0.6.0 - AMO Release Notes

What's New in Version 0.6.0:

- Pinned Stream Popups Border Color Support:
  Floating pinned stream popups now dynamically use the user-selected border color (Distinct, Green, Cyan, Orange, Twitch Purple, or Custom Color) instead of being hardcoded to purple.

- In-Popup Custom Color Picker:
  Replaced the external OS color chooser modal with a fully self-contained in-popup color picker to prevent extension popup focus loss and unwanted closure in Firefox.

- Bidirectional Shade Slider:
  Features a 10-color base palette chip row. Selecting any base chip centers the shade slider at 50% on a dynamic linear gradient track (black on the left, base color in the middle, white on the right). Drag left to shade darker or right to tint lighter.

- Live Synchronization & Real-Time Updates:
  Color adjustments immediately sync across the preview dot, manual hex input field, header badge, active pin buttons, and live stream window borders on Twitch and Kick in real time.

- Independent State Storage:
  Saves both the base color and shade slider offset independently in local storage to preserve exact user selection across sessions without lossy color approximations.
