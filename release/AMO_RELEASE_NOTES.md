# Stream Previews v0.6.6 - AMO Release Notes

What's New in Version 0.6.6:

- Stream Quality & Bandwidth Presets:
  Introduced selectable stream quality presets in the popup settings (Lite 480p, Dynamic, and Auto) to optimize preview loading, reduce bandwidth, and lower memory consumption.

- Security Hardening & Input Sanitization:
  Hardened player frame injection by replacing dynamic script string evaluation with static execution and dataset attributes, adding strict alphanumeric input sanitization to ensure complete CodeQL and Mozilla security compliance.

- Early Quality Locking & Smooth Playback:
  Resolved video stalling and mid-stream resolution switching (e.g. 480p jumping to 720p and back) by locking target quality upfront before adaptive bitrate changes, preventing buffer flushes and video stutter.

- Header Quality & Latency Badge Toggle:
  Added live stream resolution and load latency stats badge to preview headers (e.g. "480p · 0.45s") with a dedicated toggle in popup settings ("Show quality & speed badge in header") to customize header density.

- Autoplay & Startup Reliability:
  Improved media player initialization and audio handling so muted previews start playback immediately without stalling or freezing.
