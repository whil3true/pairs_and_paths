# Authentic gameplay capture: 60 FPS + game audio

This independent GitHub Actions pilot opens the **deployed** Cozy Gallery
GitHub Pages game in a headless Chromium and records the rendered game
without modifying the actual game source.

- URL: https://whil3true.github.io/pairs_and_paths/ (deployed dev)
- Trigger: PR to dev changing this capture tool / workflow / docs
- Isolated Playwright script under tools/gameplay-capture; no public debug routes
- Real touchscreen taps guided by the game's published, deterministic witness
- Captures original Phaser canvas frames via \`canvas.captureStream(60)\`
- Captures actual \`HTMLAudioElement\` music and Web Audio SFX through an isolated
  \`addInitScript\` capture-only audio mirror. No replacement/composited soundtrack.
- Records a single synchronised WebM+Opus stream with browser \`MediaRecorder\`,
  then uses FFmpeg to encode 1080×1920 H.264 60 FPS + AAC MP4
- Verifies MP4 frame size, FPS, codecs, length, and **non-silent captured audio**
  through ffprobe and FFmpeg volumedetect
- Saves raw \`gameplay-source.webm\`, final MP4, \`capture-report.json\`,
  and last-frame.png; failure attempts include \`failure.json\` and failure.png
- No automatic merge and no changes to production SDK

## Important quality limitation

60 FPS in the output MP4 does **not** guarantee 60 unique rendered frames.
The report includes source frame count / effective source FPS plus
requestAnimationFrame interval gaps so that frame drops are visible.
Please inspect the file itself for motion quality and sound sync.
Headless software WebGL can be CPU-bound; a lower output FPS may be more honest
if the source rate cannot reach close to 60.

## Download

Open PR #138 → Checks → Gameplay video capture pilot → run → Artifacts →
\`cozy-gallery-gameplay-capture-pilot\`. Download the ZIP.
Artifacts are retained seven days.

If the job fails, check \`failure.json\` and the runner logs. Do not
declare successful audio capture without the non-silence check.
