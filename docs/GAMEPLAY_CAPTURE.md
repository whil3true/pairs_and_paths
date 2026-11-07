# Gameplay capture pilot: true screen + original game audio

The experimental workflow records the already deployed GitHub Pages version,
without touching game source code or SDK integration.

- Chromium runs **headed** within an isolated 1080×1920 Xvfb desktop.
- FFmpeg x11grab samples the actual virtual screen at **60 FPS**.
- The system default PulseAudio sink is a dedicated null sink named
  \`cozy_capture\`; FFmpeg records \`cozy_capture.monitor\` simultaneously.
  This includes actual HTMLAudioElement music and Web Audio effects.
- Uses real Playwright touchscreen taps and published deterministic moves.
- Records two levels and reward display.
- Produces H.264/AAC MP4 and \`capture-report.json\`.
- Checks container frame rate, real frame count, dimensions, audio codec,
  and verifies audio has non-silent samples.
- Runner CPU/software WebGL may still produce repeated frames. Encoded 60 FPS
  is not evidence of 60 unique game renders: inspect the video.
- GitHub PR checks upload video and diagnostic PNG/JSON as a ZIP artifact.
- Do not merge without reviewing result. No automatic merge or deployment.

The previous canvas.captureStream/MediaRecorder experiment captured audible
audio but only three WebGL frames over ~34 seconds. That method was abandoned
in favor of native X11 display capture.

**Artifact:** Open PR #138 → Checks → Gameplay video capture pilot →
Artifacts → \`cozy-gallery-gameplay-capture-pilot\`. Kept seven days.
