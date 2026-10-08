# Stream Previews v0.6.5 - AMO Release Notes

What's New in Version 0.6.5:

- Stream Quality Modes:
  Added selectable quality options in popup settings (Lite 480p, Dynamic, and Auto) to optimize preview loading, memory, and bandwidth.

- Early Quality Locking:
  Resolved playback stalling and mid-stream resolution transitions by locking target quality upfront before adaptive bitrate changes, preventing buffer flushes and video stutter.

- Header Quality & Latency Badge Toggle:
  Added live stream resolution and load latency stats badge to preview headers with a dedicated toggle in popup settings to show or hide it.

- Autoplay & Startup Reliability:
  Improved media player initialization and audio handling so muted previews start playback immediately without stalling or freezing.
