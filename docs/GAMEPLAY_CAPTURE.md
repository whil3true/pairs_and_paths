# Read-only gameplay capture pilot

This optional CI workflow records the **already deployed** Cozy Gallery GitHub Pages
site using Chromium + Playwright, and exports the result as an Actions artifact.

- Source: https://whil3true.github.io/pairs_and_paths/ (deployed `dev`, not the PR build)
- Trigger: PR to `dev` containing capture workflow/scripts/docs; optionally manual dispatch
  when available from the GitHub Actions interface for the workflow ref
- No game/source changes, no debug URL routes, no progress overrides, no Yandex SDK
- Uses the published deterministic level witness to choose legal pairs, then sends
  **real touch taps** to the running Phaser canvas; verifies level completion via
  localStorage in an isolated browser context
- Captures two single-stage levels and the reward flow, trimming initial loading
- Output: `capture-output/cozy-gallery-mobile-1080x1920.mp4`, H.264,
  `capture-report.json`, a last-frame screenshot and original uncut WebM
- Target: 1080×1920, 30 FPS, around 15–20 seconds
- **No sound:** Playwright's built-in video recording does not record game audio.
  FPS encoding is validated by ffprobe but frame smoothness still needs visual QA.
- On failure the job is red; download its artifact for `failure.json` and
  `failure.png`. It must not claim success merely because an MP4 exists.

## Download

Open the pull request → Checks → Gameplay video capture pilot → job run →
Artifacts → `cozy-gallery-gameplay-capture-pilot`. The artifact is a ZIP containing
the captured video, verification report and optional diagnostics. GitHub retains it
for seven days. No changes are merged automatically.

This pilot is not yet a verified release video. Check the playback visually,
including connection lines, tile removal, source resolution and stuttering.
A silent MP4 is not a substitute for a final promotional recording with game audio.
