# Gameplay capture pilot: full-screen, no cursor, original sound

This optional workflow records **real gameplay** on the deployed GitHub Pages site.
It has no game source changes and does not modify the Yandex SDK, UI, or assets.

## Screen and performance

- 540×960 Xvfb virtual display managed by Openbox.
- A CDP command sets Chromium's **actual window** to fullscreen. There should
  be **no tabs, address bar, borders or OS UI** in the captured screen.
- The pipeline captures real X11 video at 60 FPS with FFmpeg \`-draw_mouse 0\`,
  so the mouse cursor is not rendered into the file.
- A Playwright viewport screenshot is compared with an actual X11 screenshot
  using PSNR. Large mismatches (browser chrome or wrong offset) fail capture.
- CPU/software WebGL struggles to render 1080×1920 at 60 FPS; we capture at
  540×960 to reduce raster load and then upscale offline to 1080×1920.
  The final MP4 is therefore **1080×1920 encoded**, not native 1080p-detail.
  This prioritizes fluidity. Preserve audio and natural source timestamps.
- Chromium rAF interval metrics and video frame counts are emitted to the
  report to help diagnose stalls. FFmpeg frame count cannot prove that every
  image is unique. Manual playback inspection is still required.

## Sound and gameplay

- PulseAudio null sink \`cozy_capture\` collects **original** HTMLAudioElement
  music and Web Audio effects.
- FFmpeg records its monitor stream with the video, producing H.264 + AAC MP4.
  Audio is checked for a non-silent peak.
- Playwright sends real touchscreen taps, using the already-shipped
  deterministic level witness. Two levels and the reward scene are recorded.

## Download

Open [PR #138](https://github.com/whil3true/pairs_and_paths/pull/138)
→ Checks → Gameplay video capture pilot → Artifacts. Each successful run
contains final 1080×1920 MP4, source 540×960 MP4, technical report and
screen-geometry/viewport QA images. Artifacts expire in seven days.

This remains a draft experiment; no automatic merge or production deployment.
